// ZENIT MVP — main application

window.app = {
  state: {
    screen: "onboarding",  // onboarding | session
    profile: null,
    provider: null,
    currentStepIndex: 0,
    steps: [],
    location: { lat: 50.05, lon: 14.47 }  // Praga (domyślna)
  },

  init() {
    this.render();
    this.setupEventListeners();
  },

  render() {
    const app = document.getElementById("app");

    if (this.state.screen === "onboarding") {
      app.innerHTML = window.Components.renderOnboarding(this.state);
    } else if (this.state.screen === "session") {
      // Przygotuj kroki jeśli jeszcze nie są
      if (this.state.steps.length === 0) {
        this.prepareSteps();
      }
      app.innerHTML = window.Components.renderSession(this.state);
    }
  },

  setupEventListeners() {
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

  selectProfile(profileId) {
    this.state.profile = profileId;
    this.render();
  },

  selectProvider(providerId) {
    this.state.provider = providerId;
    this.render();
  },

  async startSession() {
    const apiKeyInput = document.getElementById("apiKey");
    const apiKey = apiKeyInput?.value;

    if (!apiKey) {
      alert("Podaj API key");
      return;
    }

    // Inicjalizuj LLM
    try {
      window.LLM.init(this.state.provider, apiKey);
    } catch (error) {
      alert("Błąd inicjalizacji LLM: " + error.message);
      return;
    }

    // Pomiń kalibrację — przejdź bezpośrednio do sesji
    this.state.screen = "session";
    this.state.currentStepIndex = 0;
    this.render();
    await this.playFirstStep();
  },

  prepareSteps() {
    // Przygotuj kroki sesji — na razie fallback
    this.state.steps = window.FALLBACK_STEPS.map((step, idx) => ({
      ...step,
      index: idx
    }));
  },

  async playFirstStep() {
    const step = this.state.steps[0];
    if (!step) return;

    // Odtwórz TTS
    try {
      await window.TTS.speak(step.narration, {
        onend: () => {
          // Kiedy skończy się mowa, czekaj na użytkownika
        }
      });
    } catch (error) {
      console.error("TTS Error:", error);
    }
  },

  async nextStep() {
    // Wygeneruj następny krok za pomocą LLM
    if (this.state.currentStepIndex >= this.state.steps.length - 1) {
      // Koniec
      this.state.currentStepIndex = this.state.steps.length;
      this.render();
      return;
    }

    this.state.currentStepIndex++;

    // Pobierz lub wygeneruj krok
    try {
      const context = {
        profile: this.state.profile,
        currentStep: this.state.currentStepIndex + 1,
        totalSteps: this.state.steps.length,
        object: this.state.steps[this.state.currentStepIndex],
        previousObjects: this.state.steps.slice(0, this.state.currentStepIndex)
      };

      // Próbuj wygenerować z LLM
      let step;
      try {
        const llmResponse = await window.LLM.generateStep(context);
        step = {
          ...this.state.steps[this.state.currentStepIndex],
          narration: llmResponse.narration,
          fact: llmResponse.fact
        };
      } catch (llmError) {
        console.warn("LLM failed, using fallback:", llmError);
        // Fallback — użyj pre-napisanego kroku
        step = this.state.steps[this.state.currentStepIndex];
      }

      // Zaktualizuj krok
      this.state.steps[this.state.currentStepIndex] = step;
      this.render();

      // Odtwórz TTS
      await window.TTS.speak(step.narration);
    } catch (error) {
      console.error("Error generating step:", error);
      this.render();
    }
  }
};

// Inicjalizuj aplikację na załadowaniu strony
window.addEventListener("DOMContentLoaded", () => {
  window.app.init();
});
