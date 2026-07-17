// UI Components

window.Components = {
  // Ekran onboardingu — wybór profilu
  renderOnboarding(state, onProfileSelect, onApiSelect, onStart) {
    const profiles = [
      { id: "child", label: "Dziecko", hint: "proste porównania, ton zabawowy" },
      { id: "layperson", label: "Dorosły-laik", hint: "przystępnie, bez żargonu" },
      { id: "enthusiast", label: "Pasjonat pop-science", hint: "więcej historii i kontekstu" },
      { id: "amateur", label: "Astronom-amator", hint: "dane katalogowe, szybkie tempo" }
    ];

    const providers = [
      { id: "claude", label: "Claude (Anthropic)" },
      { id: "openai", label: "OpenAI (ChatGPT)" },
      { id: "mistral", label: "Mistral" }
    ];

    return `
      <div class="screen">
        <div class="screen-header">PRZEWODNIK GŁOSOWY PO NIEBIE</div>
        <div class="screen-title">ZENIT</div>
        <p class="screen-subtitle">Nie patrz na ekran. Patrz w niebo. Ekran odkłada się raz — na starcie.</p>

        <div class="section">
          <div class="section-label">KIM JESTEŚ DZIŚ WIECZOREM?</div>
          <div class="grid">
            ${profiles.map(p => `
              <button class="button ${state.profile === p.id ? 'active' : ''}" onclick="window.app.selectProfile('${p.id}')">
                <div class="button-label">${p.label}</div>
                <div class="button-hint">${p.hint}</div>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="section">
          <div class="section-label">KTÓRE API LLM?</div>
          <div class="grid">
            ${providers.map(p => `
              <button class="button ${state.provider === p.id ? 'active' : ''}" onclick="window.app.selectProvider('${p.id}')">
                <div class="button-label">${p.label}</div>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="section">
          <label class="section-label">API KEY</label>
          <input id="apiKey" type="password" placeholder="Wpisz klucz API" style="
            width: 100%;
            padding: 0.5rem;
            background: var(--ember-dim);
            border: 1px solid var(--ember);
            color: var(--parchment);
            border-radius: 8px;
            font-family: 'IBM Plex Mono', monospace;
            margin-bottom: 1rem;
          " />
        </div>

        <div class="flex-spacer"></div>

        <button class="button-primary"
          ${state.profile && state.provider ? '' : 'disabled'}
          onclick="window.app.startSession()">
          Przejdź do kalibracji →
        </button>
      </div>
    `;
  },

  // Ekran kalibracji — instrukcja
  renderCalibration(state) {
    return `
      <div class="screen calibration">
        <div class="screen-header">KALIBRACJA · JEDNORAZOWO</div>
        <p class="screen-subtitle" style="font-size: 1.1rem; margin-bottom: 2rem;">
          Połóż telefon na klatce piersiowej, ekranem w górę. Wyprostuj się i spójrz prosto w niebo (północ).
        </p>

        <div class="calibration-visual">
          <div class="pulse-ring ${state.calibrated ? 'calibrated' : ''}">
            <div class="pulse-inner"></div>
            <div class="pulse-center">
              ${state.calibrated ? '✓' : (state.calibrating ? '...' : '')}
            </div>
          </div>
        </div>

        <p class="calibration-text">
          ${state.calibrated
            ? "Punkt odniesienia zapisany. Telefon możesz odłożyć."
            : "Po tym kroku ekran nie będzie już potrzebny."}
        </p>

        <div class="flex-spacer"></div>

        <button class="button-primary"
          ${state.calibrating || state.calibrated ? 'disabled' : ''}
          onclick="window.app.startCalibration()">
          ${state.calibrated ? 'Skalibrowano' : (state.calibrating ? 'Kalibruję...' : 'Rozpocznij kalibrację (3s)')}
        </button>
      </div>
    `;
  },

  // Ekran sesji — narracja
  renderSession(state) {
    const step = state.steps[state.currentStepIndex];
    const isLastStep = state.currentStepIndex >= state.steps.length;

    return `
      <div class="screen session">
        <div class="session-header">
          <span>ZENIT · ${state.profile} · Solo</span>
          ${!isLastStep ? `<span>${step.target}</span>` : ''}
        </div>

        <div class="session-content">
          ${!isLastStep ? `
            <div class="star-indicator">
              <div class="star-glow"></div>
              <div class="star-dot"></div>
            </div>

            <div>
              <div class="step-label">CEL ${state.currentStepIndex + 1}/${state.steps.length} · ${step.target.toUpperCase()}</div>
              <p class="step-text">${step.narration || 'Generowanie narracji...'}</p>
              ${step.fact ? `<p class="step-fact">${step.fact}</p>` : ''}
            </div>
          ` : `
            <p class="step-text" style="font-size: 1.1rem;">
              To już koniec dzisiejszej trasy. Odpoczywaj pod niebem — reszta należy do Ciebie.
            </p>
          `}
        </div>

        <button class="button-bottom"
          ${isLastStep ? 'disabled' : ''}
          onclick="window.app.nextStep()">
          ${isLastStep ? 'Sesja zakończona' : (state.currentStepIndex === 0 ? 'Znalazłem → dalej' : 'Dalej')}
        </button>
      </div>
    `;
  }
};
