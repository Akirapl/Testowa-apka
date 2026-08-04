// TTS abstraction layer — głos przeglądarki (domyślnie) lub zewnętrzny dostawca
// (OpenAI, ElevenLabs, Google Cloud). Ta sama architektura co window.LLM: init(provider, apiKey),
// testKey(), wywołania przez serverless proxy (/api/tts-proxy) żeby uniknąć CORS.
window.TTS = {
  provider: "browser",
  apiKey: null,
  voice: null,
  model: null,
  languageCode: null,

  synthesis: window.speechSynthesis || null,
  isPlaying: false,
  currentUtterance: null,
  currentAudio: null,
  lastError: null,

  // Inicjalizuj dostawcę. "browser" nie wymaga klucza — to domyślny, darmowy fallback.
  init(provider, apiKey, options = {}) {
    this.provider = provider || "browser";
    this.apiKey = apiKey || null;

    switch (this.provider) {
      case "browser":
        break;
      case "openai":
        this.model = options.model || "tts-1";
        this.voice = options.voice || "alloy";
        break;
      case "elevenlabs":
        this.voice = options.voice || "21m00Tcm4TlvDq8ikWAM"; // "Rachel" — domyślny głos wielojęzyczny
        break;
      case "google":
        this.languageCode = options.languageCode || "pl-PL";
        this.voice = options.voice || "pl-PL-Wavenet-A";
        break;
      default:
        throw new Error("Unsupported TTS provider: " + provider);
    }
  },

  // Odblokuj odtwarzanie audio na iOS Safari/WebKit — tam <audio>.play() działa
  // tylko gdy jest wywołane synchronicznie wewnątrz gestu użytkownika (tap/click).
  // Nasza narracja startuje dopiero po kilkusekundowym oczekiwaniu na LLM, więc bez
  // tego odblokowania iOS po cichu odrzuca play() i sesja jest niema. Wystarczy raz
  // odtworzyć cokolwiek (nawet ciszę) w reakcji na pierwszy tap — na resztę sesji
  // WebKit traktuje odtwarzanie jako już odblokowane.
  _unlocked: false,

  unlock() {
    if (this._unlocked) return;
    this._unlocked = true;

    try {
      const silence = new Audio(
        "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="
      );
      silence.play().catch(() => {});
    } catch (error) {
      console.warn("TTS unlock: audio unlock failed (non-fatal):", error);
    }

    if (this.synthesis) {
      try {
        this.synthesis.speak(new SpeechSynthesisUtterance(""));
      } catch (error) {
        console.warn("TTS unlock: speechSynthesis unlock failed (non-fatal):", error);
      }
    }
  },

  // Testuj czy klucz API jest prawidłowy (bez odtwarzania dźwięku)
  async testKey() {
    this.lastError = null;

    if (this.provider === "browser") {
      return true;
    }

    if (!this.apiKey) {
      this.lastError = "Brak klucza API";
      console.warn("TTS testKey: no apiKey set for provider", this.provider);
      return false;
    }

    try {
      await this._synthesizeViaProxy("Test.");
      console.log(`TTS testKey: ${this.provider} key is ✅ VALID`);
      return true;
    } catch (error) {
      this.lastError = error.message;
      console.warn(`TTS testKey: ${this.provider} key is ❌ INVALID —`, error.message);
      return false;
    }
  },

  // Wspólny wywoływacz proxy — zwraca audio jako data URL (base64)
  async _synthesizeViaProxy(text) {
    const response = await fetch("/api/tts-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: this.provider,
        apiKey: this.apiKey,
        model: this.model,
        voice: this.voice,
        languageCode: this.languageCode,
        text
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const detail = typeof data.error === "string" ? data.error : JSON.stringify(data.error);
      throw new Error(`${this.provider} TTS API error: ${response.status} ${detail}`);
    }

    return data.audio;
  },

  // Główne wejście — syntetyzuj i odtwórz. Przy błędzie dostawcy zewnętrznego,
  // spadamy na głos przeglądarki żeby sesja nie ucichła w środku.
  async speak(text, options = {}) {
    if (this.provider === "browser" || !this.provider) {
      return this._speakBrowser(text, options);
    }

    try {
      const audioDataUrl = await this._synthesizeViaProxy(text);
      return await this._playAudio(audioDataUrl, options);
    } catch (error) {
      console.error(`TTS provider (${this.provider}) error, fallback na głos przeglądarki:`, error);
      return this._speakBrowser(text, options);
    }
  },

  // Odtwarzanie audio zwróconego przez zewnętrznego dostawcę (data URL base64)
  _playAudio(dataUrl, options = {}) {
    return new Promise((resolve) => {
      this.cancel();

      const audio = new Audio(dataUrl);

      audio.onplay = () => {
        this.isPlaying = true;
        if (options.onstart) options.onstart();
      };

      audio.onended = () => {
        this.isPlaying = false;
        if (options.onend) options.onend();
        resolve();
      };

      audio.onerror = () => {
        this.isPlaying = false;
        console.error("TTS audio playback error");
        if (options.onerror) options.onerror("playback_error");
        resolve();
      };

      this.currentAudio = audio;
      audio.play().catch((error) => {
        this.isPlaying = false;
        console.error("TTS audio play() rejected:", error);
        if (options.onerror) options.onerror(error.message);
        resolve();
      });
    });
  },

  // Web Speech API — domyślny, darmowy fallback (dotychczasowe zachowanie)
  _speakBrowser(text, options = {}) {
    if (!this.synthesis) {
      console.warn("Speech Synthesis nie jest dostępna");
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      utterance.lang = options.lang || "pl-PL";
      utterance.rate = options.rate || 0.95;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;

      utterance.onstart = () => {
        this.isPlaying = true;
        if (options.onstart) options.onstart();
      };

      utterance.onend = () => {
        this.isPlaying = false;
        if (options.onend) options.onend();
        resolve();
      };

      utterance.onerror = (event) => {
        this.isPlaying = false;
        console.error("TTS Error:", event.error);
        if (options.onerror) options.onerror(event.error);
        resolve();
      };

      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);
    });
  },

  pause() {
    if (this.provider === "browser") {
      if (this.synthesis) this.synthesis.pause();
    } else if (this.currentAudio) {
      this.currentAudio.pause();
    }
  },

  resume() {
    if (this.provider === "browser") {
      if (this.synthesis) this.synthesis.resume();
    } else if (this.currentAudio) {
      this.currentAudio.play().catch(() => {});
    }
  },

  cancel() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.isPlaying = false;
  }
};
