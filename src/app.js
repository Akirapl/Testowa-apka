// ZENIT MVP — main application

// Podbijaj przy każdej zmianie dotyczącej TTS/debugowania — loguje się jako
// pierwszy wpis w panelu diagnostyki, żeby od razu było widać czy telefon
// faktycznie załadował najnowszy deployment (bez zgadywania po Vercel dashboardzie).
const APP_VERSION = "v11 — klucze API i profil przez parametry URL, auto-start sesji";

// Bardzo lekkie "zaciemnienie" klucza w linku URL — NIE jest to prawdziwe szyfrowanie,
// tylko prosty przesunięty szyfr Cezara na kodach znaków, żeby klucz API nie leżał
// w linku/screenshocie jako czytelny, oczywisty ciąg znaków. Realne bezpieczeństwo
// nadal opiera się na tym, że link jest prywatny.
const KEY_CIPHER_SHIFT = 5;

function obfuscateKey(str) {
  return Array.from(str).map(ch => String.fromCodePoint(ch.codePointAt(0) + KEY_CIPHER_SHIFT)).join("");
}

function deobfuscateKey(str) {
  return Array.from(str).map(ch => String.fromCodePoint(ch.codePointAt(0) - KEY_CIPHER_SHIFT)).join("");
}

window.app = {
  state: {
    screen: "personalization",  // personalization | mode-selector | session
    personalization: "",
    profile: null,      // "layperson" | "enthusiast" | "expert" | "professional"
    provider: null,
    version: null,      // "astronomy" | "museum" — ustawiane w kroku 2
    selectedExhibit: null,
    curatorPrompt: null,
    currentStepIndex: 0,
    steps: [],
    location: { lat: 50.05, lon: 14.47 },  // Praga — ostateczny fallback
    needsManualLocation: false,
    keyError: null,
    museumError: null,
    debugLog: [],
    isGenerating: false,
    apiKey: "",
    ttsProvider: "browser",
    ttsApiKey: "",
    ttsKeyError: null,
    audioPaused: false,
    audioBlocked: false,
    _locationFromUrl: false,
    autoStart: false
  },

  init() {
    this.loadSavedKeys();
    this.applyUrlParams();   // URL nadpisuje to, co wczytane z localStorage
    this.render();
    this.setupEventListeners();
    this.log(`Wersja apki: ${APP_VERSION}`);
    if (this.state.autoStart) {
      this.log("Auto-start: autostart=1 w URL — pomijam ekrany 1-2");
      this.autoStartSession();
    }
  },

  // Klucze API, profil, personalizacja i lokalizacja przez parametry URL — pozwala
  // udostępnić gotowy link testowy (patrz generateShareLink/copyShareLink niżej)
  // zamiast każdorazowego ręcznego wpisywania kluczy. URL ma pierwszeństwo nad
  // localStorage. `autostart=1` to jedyny wyznacznik automatycznego startu sesji —
  // nie zgadujemy tego po komplecie innych parametrów.
  applyUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const llmProvider = params.get("llmProvider");
    const llmKey = params.get("llmKey");
    const ttsProvider = params.get("ttsProvider");
    const ttsKey = params.get("ttsKey");
    const lvl = params.get("lvl");
    const personalizacja = params.get("personalizacja");
    const lat = parseFloat(params.get("lat"));
    const lon = parseFloat(params.get("lon"));

    if (llmProvider) this.state.provider = llmProvider;
    if (llmKey) this.state.apiKey = deobfuscateKey(llmKey);
    if (ttsProvider) this.state.ttsProvider = ttsProvider;
    if (ttsKey) this.state.ttsApiKey = deobfuscateKey(ttsKey);
    if (personalizacja) this.state.personalization = personalizacja;

    const LVL_TO_PROFILE = { "1": "layperson", "2": "enthusiast", "3": "expert", "4": "professional" };
    if (lvl && LVL_TO_PROFILE[lvl]) this.state.profile = LVL_TO_PROFILE[lvl];

    this.state._locationFromUrl = !isNaN(lat) && !isNaN(lon);
    if (this.state._locationFromUrl) {
      this.state.location = { lat, lon };
      this.state.needsManualLocation = false;
    }

    this.state.autoStart = params.get("autostart") === "1";
  },

  // Wersja confirmPersonalization() bez ekranu — dla linków z autostart=1. Jeśli
  // walidacja klucza zawiedzie na dowolnym etapie, NIE blokujemy apki: zostaje
  // normalny ekran "Poznajmy się" z widocznym błędem, do ręcznej poprawki.
  async autoStartSession() {
    try {
      window.LLM.init(this.state.provider, this.state.apiKey);
    } catch (error) {
      this.log(`Auto-start: LLM.init FAILED — ${error.message}`);
      return;
    }

    const isLlmValid = await window.LLM.testKey();
    if (!isLlmValid) {
      this.state.keyError = "Auto-start: klucz LLM z URL nie działa — sprawdź/popraw ręcznie.";
      this.log(`Auto-start: LLM testKey NIEUDANY — ${window.LLM.lastError || "?"}`);
      this.render();
      return;
    }

    try {
      window.TTS.init(this.state.ttsProvider, this.state.ttsApiKey);
    } catch (error) {
      this.log(`Auto-start: TTS.init FAILED — ${error.message}`);
      return;
    }

    if (this.state.ttsProvider !== "browser") {
      const isTtsValid = await window.TTS.testKey();
      if (!isTtsValid) {
        this.state.ttsKeyError = "Auto-start: klucz TTS z URL nie działa — sprawdź/popraw ręcznie.";
        this.log(`Auto-start: TTS testKey NIEUDANY — ${window.TTS.lastError || "?"}`);
        this.render();
        return;
      }
    }

    this.saveKeys();

    // Lokalizacja z URL ma pierwszeństwo — próbujemy geolokalizacji przeglądarki
    // tylko jeśli URL jej nie podał (dokładnie jak w ręcznym confirmPersonalization()).
    if (!this.state._locationFromUrl) {
      await this.tryUpdateLocation();
    }

    if (this.state.needsManualLocation) {
      this.log("Auto-start: brak lokalizacji z URL i geolokalizacja niedostępna — zostaję na ekranie ręcznego miasta");
      this.render();
      return;
    }

    this.log("Auto-start: klucze i lokalizacja zweryfikowane, startuję sesję NIEBO");
    this.chooseAstronomy();
  },

  // Buduje gotowy do wysłania link testowy z bieżącymi (zweryfikowanymi) kluczami —
  // odbiorca po otwarciu linku od razu wystartuje sesję NIEBO.
  generateShareLink() {
    const params = new URLSearchParams();
    if (this.state.provider) params.set("llmProvider", this.state.provider);
    if (this.state.apiKey) params.set("llmKey", obfuscateKey(this.state.apiKey));
    if (this.state.ttsProvider) params.set("ttsProvider", this.state.ttsProvider);
    if (this.state.ttsApiKey) params.set("ttsKey", obfuscateKey(this.state.ttsApiKey));

    const PROFILE_TO_LVL = { layperson: "1", enthusiast: "2", expert: "3", professional: "4" };
    if (this.state.profile && PROFILE_TO_LVL[this.state.profile]) {
      params.set("lvl", PROFILE_TO_LVL[this.state.profile]);
    }
    if (this.state.personalization) params.set("personalizacja", this.state.personalization);
    if (this.state._locationFromUrl && this.state.location) {
      params.set("lat", this.state.location.lat);
      params.set("lon", this.state.location.lon);
    }
    params.set("autostart", "1"); // sens linku do udostępnienia — od razu startuje u odbiorcy

    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  },

  async copyShareLink() {
    const url = this.generateShareLink();
    try {
      await navigator.clipboard.writeText(url);
      this.log("Link testowy skopiowany do schowka");
    } catch (error) {
      this.log(`Nie udało się skopiować linku automatycznie — oto on: ${url}`);
    }
    this.render();
  },

  // Klucze API zapamiętane lokalnie na tym urządzeniu (localStorage) — nigdy
  // nie trafiają do kodu/gita, tylko zostają w przeglądarce użytkownika, żeby
  // nie trzeba było wpisywać ich ponownie przy każdym odświeżeniu.
  loadSavedKeys() {
    try {
      const provider = localStorage.getItem("zenit_llm_provider");
      const apiKey = localStorage.getItem("zenit_llm_apiKey");
      const ttsProvider = localStorage.getItem("zenit_tts_provider");
      const ttsApiKey = localStorage.getItem("zenit_tts_apiKey");

      if (provider) this.state.provider = provider;
      if (apiKey) this.state.apiKey = apiKey;
      if (ttsProvider) this.state.ttsProvider = ttsProvider;
      if (ttsApiKey) this.state.ttsApiKey = ttsApiKey;
    } catch (error) {
      console.warn("loadSavedKeys: localStorage niedostępny:", error);
    }
  },

  saveKeys() {
    try {
      localStorage.setItem("zenit_llm_provider", this.state.provider || "");
      localStorage.setItem("zenit_llm_apiKey", this.state.apiKey || "");
      localStorage.setItem("zenit_tts_provider", this.state.ttsProvider || "browser");
      localStorage.setItem("zenit_tts_apiKey", this.state.ttsApiKey || "");
    } catch (error) {
      console.warn("saveKeys: localStorage niedostępny (klucze nie zostaną zapamiętane):", error);
    }
  },

  // Diagnostyka widoczna na ekranie (bez potrzeby DevTools) — patrz renderDebugPanel w components.js
  log(message) {
    console.log(message);
    this.state.debugLog.push(`[${new Date().toLocaleTimeString()}] ${message}`);
    if (this.state.debugLog.length > 40) {
      this.state.debugLog = this.state.debugLog.slice(-40);
    }
    this.render();
  },

  render() {
    const app = document.getElementById("app");

    if (this.state.screen === "personalization") {
      app.innerHTML = window.Components.renderPersonalization(this.state);
    } else if (this.state.screen === "mode-selector") {
      app.innerHTML = window.Components.renderModeSelector(this.state);
    } else if (this.state.screen === "session") {
      app.innerHTML = window.Components.renderSession(this.state);
    }
  },

  setupEventListeners() {
    // Odblokowanie audio na iOS/WebKit — próbujemy przy KAŻDYM dotknięciu ekranu,
    // nie tylko raz. TTS.unlock() jest no-opem po potwierdzonym sukcesie (patrz
    // komentarz w tts.js), więc to tylko zwiększa liczbę szans, nic nie kosztuje.
    document.addEventListener("touchend", () => window.TTS.unlock(), { passive: true });
    document.addEventListener("click", () => window.TTS.unlock());

    // Media Session API — obsługa przycisków słuchawek
    if (navigator.mediaSession) {
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        if (this.state.screen === "session") {
          this.nextStep();
        }
      });

      navigator.mediaSession.setActionHandler("previoustrack", () => {
        if (this.state.screen === "session" && this.state.currentStepIndex > 0) {
          this.state.currentStepIndex--;
          this.render();
        }
      });
    }
  },

  // ==================== EKRAN 1: POZNAJMY SIĘ ====================

  // Zapisuje bieżącą (jeszcze niezatwierdzoną) zawartość pól tekstowych do state —
  // wywoływane przed każdym render() na tym ekranie, żeby świeży innerHTML nie
  // zamazywał tego co użytkownik właśnie wpisał (pełny re-render nadpisuje DOM).
  syncPersonalizationInputs() {
    const personalizationInput = document.getElementById("personalization");
    const apiKeyInput = document.getElementById("apiKey");
    const ttsApiKeyInput = document.getElementById("ttsApiKey");
    if (personalizationInput) this.state.personalization = personalizationInput.value;
    if (apiKeyInput) this.state.apiKey = apiKeyInput.value;
    if (ttsApiKeyInput) this.state.ttsApiKey = ttsApiKeyInput.value;
  },

  selectProfile(profileId) {
    this.syncPersonalizationInputs();
    this.state.profile = profileId;
    this.render();
  },

  selectProvider(providerId) {
    this.syncPersonalizationInputs();
    this.state.provider = providerId;
    this.render();
  },

  selectTtsProvider(providerId) {
    this.syncPersonalizationInputs();
    this.state.ttsProvider = providerId;
    this.state.ttsKeyError = null;
    this.render();
  },

  async confirmPersonalization() {
    // Musi być pierwsza, synchroniczna instrukcja w tej funkcji — odblokowuje
    // odtwarzanie audio na iOS, które wymaga wywołania play() w tym samym tick'u
    // co dotknięcie ekranu (patrz komentarz w TTS.unlock()).
    window.TTS.unlock();

    this.syncPersonalizationInputs();
    this.state.personalization = this.state.personalization.trim();
    const apiKey = this.state.apiKey;

    if (!this.state.profile || !this.state.provider) {
      this.state.keyError = "Wybierz profil i dostawcę LLM.";
      this.render();
      return;
    }

    if (!apiKey) {
      this.state.keyError = "Podaj klucz API.";
      this.render();
      return;
    }

    try {
      window.LLM.init(this.state.provider, apiKey);
      this.log(`LLM.init: provider=${this.state.provider} model=${window.LLM.model}`);
    } catch (error) {
      this.state.keyError = "Błąd inicjalizacji LLM: " + error.message;
      this.log(`LLM.init FAILED: ${error.message}`);
      this.render();
      return;
    }

    this.state.keyError = "Sprawdzam klucz API...";
    this.render();

    this.log("testKey: wysyłam zapytanie do /api/llm-proxy...");
    const isKeyValid = await window.LLM.testKey();
    if (!isKeyValid) {
      this.state.keyError = "⚠️ Klucz API nieprawidłowy lub sieć niedostępna. Popraw klucz/providera i spróbuj ponownie.";
      this.log(`testKey: NIEUDANY — ${window.LLM.lastError || "brak szczegółów błędu"}`);
      this.render();
      return;
    }
    this.log("testKey: ✅ sukces, klucz działa");
    this.state.keyError = null;

    // Inicjalizacja TTS — "browser" (domyślny) nie wymaga klucza ani testu
    const ttsProvider = this.state.ttsProvider || "browser";
    try {
      window.TTS.init(ttsProvider, this.state.ttsApiKey);
      this.log(`TTS.init: provider=${ttsProvider}`);
    } catch (error) {
      this.state.ttsKeyError = "Błąd inicjalizacji TTS: " + error.message;
      this.log(`TTS.init FAILED: ${error.message}`);
      this.render();
      return;
    }

    if (ttsProvider !== "browser") {
      if (!this.state.ttsApiKey) {
        this.state.ttsKeyError = "Podaj klucz API dla wybranego dostawcy głosu (TTS).";
        this.render();
        return;
      }

      this.state.ttsKeyError = "Sprawdzam klucz API TTS...";
      this.render();

      this.log("TTS testKey: wysyłam zapytanie do /api/tts-proxy...");
      const isTtsKeyValid = await window.TTS.testKey();
      if (!isTtsKeyValid) {
        this.state.ttsKeyError = "⚠️ Klucz API TTS nieprawidłowy lub sieć niedostępna. Popraw klucz/dostawcę głosu i spróbuj ponownie.";
        this.log(`TTS testKey: NIEUDANY — ${window.TTS.lastError || "brak szczegółów błędu"}`);
        this.render();
        return;
      }
      this.log("TTS testKey: ✅ sukces, klucz działa");
    }
    this.state.ttsKeyError = null;

    // Oba klucze zweryfikowane — zapamiętaj je lokalnie na tym urządzeniu (localStorage),
    // żeby nie trzeba było wpisywać ich ponownie po odświeżeniu strony.
    this.saveKeys();

    // Nieblokujący zapis personalizacji — błąd (np. brak backendu na GH Pages) nie przerywa flow
    if (this.state.personalization) {
      fetch("/api/personalization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: this.state.profile,
          personalization: this.state.personalization
        })
      }).then((response) => {
        if (!response.ok) console.warn("Zapis personalizacji nieudany:", response.status);
      }).catch((error) => {
        console.warn("Błąd zapisu personalizacji (nieblokujący):", error);
      });
    }

    await this.tryUpdateLocation();

    if (this.state.needsManualLocation) {
      this.render();  // pokaż pole ręcznego miasta, zostań na ekranie 1
      return;
    }

    this.state.screen = "mode-selector";
    this.render();
  },

  // ---------- Lokalizacja: auto → ręczne miasto → geokodowanie → Praga ----------

  tryUpdateLocation() {
    if (!navigator.geolocation) {
      this.state.needsManualLocation = true;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        this.log("Geolokalizacja: timeout (8s)");
        this.state.needsManualLocation = true;
        resolve();
      }, 8000);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timeoutId);
          this.state.location = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          this.state.needsManualLocation = false;
          this.log(`Lokalizacja (auto): lat=${this.state.location.lat.toFixed(3)} lon=${this.state.location.lon.toFixed(3)}`);
          resolve();
        },
        (err) => {
          clearTimeout(timeoutId);
          this.log(`Geolokalizacja niedostępna: ${err.message}`);
          this.state.needsManualLocation = true;
          resolve();
        },
        { timeout: 8000, maximumAge: 600000 }
      );
    });
  },

  async geocodeLocation() {
    const cityInput = document.getElementById("manualCity");
    const cityText = cityInput?.value?.trim();

    if (!cityText) {
      alert("Podaj nazwę miasta");
      return;
    }

    try {
      const response = await fetch(
        "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(cityText)
      );
      const data = await response.json();

      if (data && data[0]) {
        this.state.location = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        this.log(`Lokalizacja (geokodowanie "${cityText}"): lat=${this.state.location.lat.toFixed(3)} lon=${this.state.location.lon.toFixed(3)}`);
      } else {
        this.log(`Geokodowanie: brak wyników dla "${cityText}" — używam Pragi jako domyślnej.`);
      }
    } catch (error) {
      this.log(`Błąd geokodowania: ${error.message} — używam Pragi jako domyślnej.`);
    }

    this.state.needsManualLocation = false;
    this.state.screen = "mode-selector";
    this.render();
  },

  skipLocation() {
    this.state.needsManualLocation = false;
    this.state.screen = "mode-selector";
    this.render();
  },

  haversineDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = (deg) => deg * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },

  // ==================== EKRAN 2: CO CHCESZ ROBIĆ? ====================

  selectVersion(versionId) {
    this.state.version = versionId;
    this.render();
  },

  backToModeSelector() {
    this.state.version = null;
    this.state.screen = "mode-selector";
    this.render();
  },

  backToPersonalization() {
    this.state.screen = "personalization";
    this.state.keyError = null;
    this.state.ttsKeyError = null;
    this.render();
  },

  chooseAstronomy() {
    this.state.version = "astronomy";
    this.prepareSteps();
    this.state.currentStepIndex = 0;
    this.state.screen = "session";
    this.log("Wybrano NIEBO — start sesji astronomii");
    this.render();
    this.startAstronomySession();
  },

  async startAstronomySession() {
    await this.generateAstronomyNarration(0);
    this.render();
    await this.playFirstStep();
  },

  // ==================== ASTRONOMIA ====================

  prepareSteps() {
    // Surowe statyczne kroki — baza dla LLM (materiał źródłowy = target) oraz
    // sieć bezpieczeństwa przy przejściowym błędzie LLM/sieci.
    this.state.steps = window.FALLBACK_STEPS.map((step, idx) => ({
      ...step,
      index: idx
    }));
  },

  computeAstronomyPosition(target, date, location) {
    const reference = window.CATALOG.references.find(r => r.name === target);
    if (!reference || !reference.stars.length) {
      throw new Error(`Brak wpisu w CATALOG.references dla celu: ${target}`);
    }

    const starName = reference.stars[0];
    const star = window.CATALOG.stars.find(s => s.name === starName);
    if (!star) {
      throw new Error(`Gwiazda nie znaleziona w katalogu: ${starName}`);
    }

    const altAz = window.ZenitAstronomy.getAltAz(star.ra, star.dec, location.lat, location.lon, date);
    return { azimuth: altAz.azimuth, altitude: altAz.altitude };
  },

  async generateAstronomyNarration(stepIndex) {
    const rawStep = this.state.steps[stepIndex];
    try {
      const pos = this.computeAstronomyPosition(rawStep.target, new Date(), this.state.location);
      this.log(`Astro krok ${stepIndex} (${rawStep.target}): pozycja OK — az=${pos.azimuth.toFixed(1)} alt=${pos.altitude.toFixed(1)}`);

      const context = {
        profile: this.state.profile,
        currentStep: stepIndex + 1,
        totalSteps: this.state.steps.length,
        object: { name: rawStep.target, azimuth: pos.azimuth, altitude: pos.altitude },
        previousObjects: this.state.steps.slice(0, stepIndex).map(s => ({ name: s.target })),
        personalization: this.state.personalization
      };

      const llmResponse = await window.LLM.generateStep(context);
      this.state.steps[stepIndex] = { ...rawStep, narration: llmResponse.narration, fact: llmResponse.fact };
      this.log(`Astro krok ${stepIndex}: LLM ✅ sukces (${llmResponse.narration.length} znaków)`);
    } catch (error) {
      this.log(`Astro krok ${stepIndex}: ❌ FALLBACK — ${error.message || error}`);
      // rawStep (FALLBACK_STEPS) zostaje bez zmian — to jest sieć bezpieczeństwa
    }
  },

  // To apka głosowa — TTS ma czytać wszystko co jest na ekranie, nie tylko
  // narrację, ale i ciekawostkę (step.fact), bo obie części niosą treść.
  buildSpokenText(step) {
    return [step.narration, step.fact].filter(Boolean).join(" ");
  },

  async speakStep(step) {
    if (!step) return;
    const text = this.buildSpokenText(step);
    if (!text) return;

    this.state.audioPaused = false;
    this.state.audioBlocked = false;
    try {
      await window.TTS.speak(text, {
        onerror: (err) => {
          if (err === "autoplay_blocked") {
            // Nie prawdziwy błąd — audio jest gotowe, przeglądarka tylko wymaga
            // świeżego tapu użytkownika. Pokaż duży przycisk ▶ zamiast cichej porażki.
            this.state.audioBlocked = true;
            this.log(`TTS (${window.TTS.provider}): przeglądarka zablokowała autoplay — dotknij ▶ żeby odtworzyć`);
          } else {
            this.log(`TTS (${window.TTS.provider}): ❌ odtwarzanie nieudane — ${err}`);
          }
          this.render();
        }
      });
    } catch (error) {
      this.log(`TTS Error: ${error.message || error}`);
    }
  },

  async playFirstStep() {
    await this.speakStep(this.state.steps[0]);
  },

  // ---------- Sterowanie playerem (powtórz / pauza-wznów / stop / ręczne odtwórz) ----------

  repeatStep() {
    this.speakStep(this.state.steps[this.state.currentStepIndex]);
  },

  togglePause() {
    if (this.state.audioPaused) {
      window.TTS.resume();
      this.state.audioPaused = false;
    } else {
      window.TTS.pause();
      this.state.audioPaused = true;
    }
    this.render();
  },

  stopAudio() {
    window.TTS.cancel();
    this.state.audioPaused = false;
    this.state.audioBlocked = false;
    this.render();
  },

  // Wywoływane bezpośrednio z onclick przycisku ▶ — MUSI zostać w tym samym,
  // synchronicznym wywołaniu co tap, żeby przeglądarka zaakceptowała play().
  manualPlayBlocked() {
    this.state.audioBlocked = false;
    window.TTS.retryBlockedPlayback({
      onerror: (err) => {
        this.state.audioBlocked = true;
        this.log(`TTS (${window.TTS.provider}): ręczne odtworzenie też nieudane — ${err}`);
        this.render();
      }
    });
    this.render();
  },

  async nextStep() {
    // Blokada reentrancji — bez tego szybkie podwójne kliknięcie "Dalej" (np. gdy
    // LLM odpowiada wolno) uruchamia dwa równoległe wywołania naraz, myląc stan.
    if (this.state.isGenerating) {
      this.log("nextStep: zignorowano — poprzednie generowanie jeszcze trwa");
      return;
    }

    if (this.state.currentStepIndex >= this.state.steps.length - 1) {
      this.state.currentStepIndex = this.state.steps.length;
      this.render();
      return;
    }

    const nextIndex = this.state.currentStepIndex + 1;
    this.state.currentStepIndex = nextIndex;
    this.state.isGenerating = true;
    this.log(`nextStep: tryb=${this.state.version} krok=${nextIndex}`);

    try {
      if (this.state.version === "museum") {
        this.state.museumError = null;
        this.render();

        try {
          await this.generateMuseumNarration(nextIndex);
          this.render();
          await this.speakStep(this.state.steps[nextIndex]);
        } catch (error) {
          this.log(`Muzeum krok ${nextIndex}: ❌ błąd — ${error.message || error}`);
          this.state.museumError = "Nie udało się wygenerować opisu — sprawdź klucz API i spróbuj ponownie.";
          this.render();
        }
      } else {
        await this.generateAstronomyNarration(nextIndex);
        this.render();
        await this.speakStep(this.state.steps[nextIndex]);
      }
    } finally {
      this.state.isGenerating = false;
      this.render();
    }
  },

  // ==================== MUZEUM ====================

  async loadExhibit(exhibitName) {
    try {
      const response = await fetch(`docs/${exhibitName}.json`);
      if (!response.ok) throw new Error("Exhibit not found");

      const data = await response.json();
      this._loadExhibitData(data, exhibitName);
    } catch (error) {
      alert("Błąd wczytywania wystawy: " + error.message);
      console.error("Exhibit load error:", error);
    }
  },

  async loadMuseumQR() {
    const qrInput = document.getElementById("curatorQR");
    const qrText = qrInput?.value?.trim();

    if (!qrText) {
      alert("Wklej tekst z QR kodu kuratora");
      return;
    }

    try {
      const data = JSON.parse(qrText);
      this._loadExhibitData(data, null);
    } catch (error) {
      alert("Błąd w danych QR: " + error.message);
      console.error("QR parse error:", error);
    }
  },

  async _loadExhibitData(data, exhibitName) {
    this.state.curatorPrompt = data.systemPrompt || "";
    // narration/fact zaczynają jako null — to LLM je wypełni z curatorDescription/curatorFact,
    // dzięki czemu nigdy nie pokazujemy surowego tekstu kuratora wprost na ekranie.
    this.state.steps = (data.objects || []).map((obj, idx) => ({
      target: obj.title,
      author: obj.author || "",
      year: obj.year || "",
      curatorDescription: obj.description || "",
      curatorFact: obj.fact || "",
      narration: null,
      fact: null,
      index: idx
    }));
    this.state.selectedExhibit = exhibitName;
    this.state.museumError = null;

    this.state.screen = "session";
    this.state.currentStepIndex = 0;
    this.log(`Wystawa wczytana: ${exhibitName || "(wklejony QR)"} — ${this.state.steps.length} eksponatów`);
    this.render();

    try {
      await this.generateMuseumNarration(0);
      this.render();
      await this.playFirstStep();
    } catch (error) {
      this.log(`Muzeum krok 0: ❌ błąd — ${error.message || error}`);
      this.state.museumError = "Nie udało się wygenerować opisu — sprawdź klucz API i spróbuj ponownie.";
      this.render();
    }
  },

  async generateMuseumNarration(stepIndex) {
    const raw = this.state.steps[stepIndex];
    const context = {
      profile: this.state.profile,
      personalization: this.state.personalization,
      currentStep: stepIndex + 1,
      totalSteps: this.state.steps.length,
      object: {
        title: raw.target,
        author: raw.author,
        year: raw.year,
        description: raw.curatorDescription,
        fact: raw.curatorFact
      },
      previousObjects: this.state.steps.slice(0, stepIndex).map(s => ({ name: s.target }))
    };

    // Brak fallbacku — jeśli LLM zawiedzie, wywołujący musi obsłużyć błąd (patrz nextStep/_loadExhibitData/retryMuseumStep)
    const result = await window.LLM.generateMuseumStep(context, this.state.curatorPrompt);
    this.state.steps[stepIndex] = { ...raw, narration: result.narration, fact: result.fact };
    this.log(`Muzeum krok ${stepIndex} (${raw.target}): LLM ✅ sukces (${result.narration.length} znaków)`);
  },

  async retryMuseumStep() {
    this.state.museumError = null;
    this.render();

    try {
      await this.generateMuseumNarration(this.state.currentStepIndex);
      this.render();
      await this.speakStep(this.state.steps[this.state.currentStepIndex]);
    } catch (error) {
      this.log(`Muzeum retry krok ${this.state.currentStepIndex}: ❌ nadal błąd — ${error.message || error}`);
      this.state.museumError = "Nadal nie udało się wygenerować opisu — spróbuj ponownie.";
      this.render();
    }
  }
};

// Inicjalizuj aplikację na załadowaniu strony
window.addEventListener("DOMContentLoaded", () => {
  window.app.init();
});
