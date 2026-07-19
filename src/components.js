// UI Components

window.Components = {
  // Ekran wyboru wersji — astronomia lub muzeum
  renderVersionSelector(state) {
    return `
      <div class="screen">
        <div class="screen-header">ZENIT</div>
        <div class="screen-title">WYBIERZ WERSJĘ</div>
        <p class="screen-subtitle">Czy chcesz zwiedzać niebo nocy, czy galerię sztuki?</p>

        <div class="section" style="margin-top: 2rem;">
          <div class="grid">
            <button class="button large-button" onclick="window.app.selectVersion('astronomy')">
              <div class="button-label" style="font-size: 1.1rem;">⭐ ASTRONOMIA</div>
              <div class="button-hint">Przewodnik po niebie nocnym</div>
            </button>
            <button class="button large-button" onclick="window.app.selectVersion('museum')">
              <div class="button-label" style="font-size: 1.1rem;">🎨 MUZEUM</div>
              <div class="button-hint">Oprowadzanie po wystawie</div>
            </button>
          </div>
        </div>

        <div class="flex-spacer"></div>
      </div>
    `;
  },

  // Ekran onboardingu — wybór profilu
  renderOnboarding(state, onProfileSelect, onApiSelect, onStart) {
    if (state.version === "museum") {
      return `
        <div class="screen">
          <div class="screen-header">OPROWADZANIE PO WYSTAWIE</div>
          <div class="screen-title">ZENIT MUZEUM</div>
          <p class="screen-subtitle">Wklej kod QR z promptem kuratora muzeum</p>

          <div class="section">
            <label class="section-label">KOD QR KURATORA</label>
            <textarea id="curatorQR" placeholder="Wklej JSON z danych QR (zawierające systemPrompt i objects)" style="
              width: 100%;
              height: 150px;
              padding: 1rem;
              background: var(--ember-dim);
              border: 1px solid var(--ember);
              color: var(--parchment);
              border-radius: 8px;
              font-family: 'IBM Plex Mono', monospace;
              font-size: 0.85rem;
              resize: vertical;
              margin-bottom: 1rem;
            "></textarea>
          </div>

          <div class="flex-spacer"></div>

          <button class="button-primary" onclick="window.app.loadMuseumQR()">
            Wczytaj wystawę →
          </button>

          <button class="button" style="margin-top: 0.5rem; width: 100%;" onclick="window.app.selectVersion(null); window.app.state.screen = 'version-selector'; window.app.render();">
            ← Wróć
          </button>
        </div>
      `;
    }

    // ASTRONOMY MODE
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
          Rozpocznij obserwację →
        </button>

        <button class="button" style="margin-top: 0.5rem; width: 100%;" onclick="window.app.selectVersion(null); window.app.state.screen = 'version-selector'; window.app.render();">
          ← Wróć
        </button>
      </div>
    `;
  },

// Ekran sesji — narracja
  renderSession(state) {
    const step = state.steps[state.currentStepIndex];
    const isLastStep = state.currentStepIndex >= state.steps.length;

    if (state.version === "museum") {
      return `
        <div class="screen session">
          <div class="session-header">
            <span>ZENIT MUZEUM</span>
            ${!isLastStep ? `<span>${step.target}</span>` : ''}
          </div>

          <div class="session-content">
            ${!isLastStep ? `
              <div class="art-indicator">
                <div style="font-size: 2rem;">🎨</div>
              </div>

              <div>
                <div class="step-label">DZIEŁO ${state.currentStepIndex + 1}/${state.steps.length}</div>
                <h2 style="color: var(--gold); margin: 1rem 0 0.5rem 0;">${step.target}</h2>
                ${step.author ? `<p style="color: var(--parchment-dim); font-size: 0.9rem; margin-bottom: 1rem;">${step.author}${step.year ? ' (' + step.year + ')' : ''}</p>` : ''}
                <p class="step-text">${step.narration || 'Opis dzieła...'}</p>
                ${step.fact ? `<p class="step-fact">${step.fact}</p>` : ''}
              </div>
            ` : `
              <p class="step-text" style="font-size: 1.1rem;">
                To już koniec oprowadzania. Dziękujemy za wizytę.
              </p>
            `}
          </div>

          <button class="button-bottom"
            ${isLastStep ? 'disabled' : ''}
            onclick="window.app.nextStep()">
            ${isLastStep ? 'Koniec wystawy' : (state.currentStepIndex === 0 ? 'Zaczynam → dalej' : 'Dalej')}
          </button>
        </div>
      `;
    }

    // ASTRONOMY MODE
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
