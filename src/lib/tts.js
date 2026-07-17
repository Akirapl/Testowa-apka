// Web Speech API wrapper
window.TTS = {
  synthesis: window.speechSynthesis || null,
  isPlaying: false,
  currentUtterance: null,

  speak(text, options = {}) {
    if (!this.synthesis) {
      console.warn("Speech Synthesis nie jest dostępna");
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      // Anuluj poprzednią mowę jeśli trwa
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Polskie ustawienia
      utterance.lang = options.lang || "pl-PL";
      utterance.rate = options.rate || 0.95;  // Wyraźnie, nie za szybko
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
    if (this.synthesis) {
      this.synthesis.pause();
    }
  },

  resume() {
    if (this.synthesis) {
      this.synthesis.resume();
    }
  },

  cancel() {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.isPlaying = false;
    }
  }
};
