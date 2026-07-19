// ZENIT MVP — main application

window.app = {
  state: {
    screen: "interest-selector",  // interest-selector | version-selector | onboarding | session
    interest: null,  // "history" | "nature" | "art" itp
    version: null,  // "astronomy" | "museum"
    profile: null,
    provider: null,
    currentStepIndex: 0,
    steps: [],
    location: { lat: 50.05, lon: 14.47 },  // Praga (domyślna)
    curatorPrompt: null,  // dla wersji muzeum
    selectedExhibit: null  // nazwa wybranej wystawy
  },

  init() {
    this.render();
    this.setupEventListeners();
  },

  render() {
    const app = document.getElementById("app");

    if (this.state.screen === "interest-selector") {
      app.innerHTML = window.Components.renderInterestSelector(this.state);
    } else if (this.state.screen === "version-selector") {
      app.innerHTML = window.Components.renderVersionSelector(this.state);
    } else if (this.state.screen === "onboarding") {
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

  selectInterest(interestId) {
    this.state.interest = interestId;
    this.state.screen = "version-selector";
    this.render();
  },

  selectVersion(versionId) {
    this.state.version = versionId;
    this.state.screen = "onboarding";
    this.render();
  },

  async loadExhibit(exhibitName) {
    // Załaduj gotową wystawę z JSON
    try {
      const response = await fetch(`/docs/${exhibitName}.json`);
      if (!response.ok) throw new Error("Exhibit not found");

      const data = await response.json();
      this.state.curatorPrompt = data.systemPrompt || "";
      this.state.steps = (data.objects || []).map((obj, idx) => ({
        target: obj.title,
        narration: obj.description || "",
        fact: obj.fact || "",
        author: obj.author || "",
        year: obj.year || "",
        index: idx
      }));
      this.state.selectedExhibit = exhibitName;

      console.log("✅ Exhibit loaded:", {
        name: exhibitName,
        objects: this.state.steps.length
      });

      this.state.screen = "session";
      this.state.currentStepIndex = 0;
      this.render();
      await this.playFirstStep();
    } catch (error) {
      alert("Błąd wczytywania wystawy: " + error.message);
      console.error("Exhibit load error:", error);
    }
  },

  async loadMuseumQR() {
    // Spróbuj załadować QR kod
    const qrInput = document.getElementById("curatorQR");
    const qrText = qrInput?.value?.trim();

    if (!qrText) {
      alert("Wklej tekst z QR kodu kuratora");
      return;
    }

    // Parsuj QR data (format: JSON z systemPrompt, objects array)
    try {
      const data = JSON.parse(qrText);
      this.state.curatorPrompt = data.systemPrompt || "";
      this.state.steps = (data.objects || []).map((obj, idx) => ({
        target: obj.title,
        narration: obj.description || "",
        fact: obj.fact || "",
        author: obj.author || "",
        year: obj.year || "",
        index: idx
      }));

      console.log("✅ Museum data loaded from QR:", {
        prompt: this.state.curatorPrompt ? "loaded" : "none",
        objects: this.state.steps.length
      });

      this.state.screen = "session";
      this.state.currentStepIndex = 0;
      this.render();
      await this.playFirstStep();
    } catch (error) {
      alert("Błąd w danych QR: " + error.message);
      console.error("QR parse error:", error);
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
    if (this.state.version === "museum") {
      // Museum mode — czekaj na wczytanie QR
      this.state.steps = [];
    } else {
      // Astronomy mode — fallback steps
      this.state.steps = window.FALLBACK_STEPS.map((step, idx) => ({
        ...step,
        index: idx
      }));
    }
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
      let step;

      if (this.state.version === "museum") {
        // Museum mode — użyj pre-loaded descriptions z QR
        step = this.state.steps[this.state.currentStepIndex];
      } else {
        // Astronomy mode — generuj z LLM
        const context = {
          profile: this.state.profile,
          currentStep: this.state.currentStepIndex + 1,
          totalSteps: this.state.steps.length,
          object: this.state.steps[this.state.currentStepIndex],
          previousObjects: this.state.steps.slice(0, this.state.currentStepIndex)
        };

        try {
          const llmResponse = await window.LLM.generateStep(context);
          step = {
            ...this.state.steps[this.state.currentStepIndex],
            narration: llmResponse.narration,
            fact: llmResponse.fact
          };
        } catch (llmError) {
          console.warn("LLM failed, using fallback:", llmError);
          step = this.state.steps[this.state.currentStepIndex];
        }
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
