// UI Components

window.Components = {
  // Ekran 1 — "Poznajmy się": personalizacja + profil + LLM + klucz (+ lokalizacja gdy trzeba)
  renderPersonalization(state) {
    const profiles = [
      { id: "layperson", label: "Laik", hint: "przystępnie, bez żargonu" },
      { id: "enthusiast", label: "Zainteresowany", hint: "więcej historii i kontekstu" },
      { id: "expert", label: "Ekspert", hint: "dane techniczne, szczegóły" },
      { id: "professional", label: "Profesjonalista", hint: "maksymalna precyzja, jak do fachowca" }
    ];

    const providers = [
      { id: "claude", label: "Claude (Anthropic)" },
      { id: "openai", label: "OpenAI (ChatGPT)" },
      { id: "mistral", label: "Mistral" }
    ];

    return `
      <div class="screen">
        <div class="screen-header">ZENIT</div>
        <div class="screen-title">POZNAJMY SIĘ</div>
        <p class="screen-subtitle" style="margin-bottom: 1.5rem;">
          Opowiedz mi o sobie. Kim jesteś? Co lubisz? Jaka jest twoja profesja, pasje, zainteresowania?<br>
          <br>
          <em>Możesz być emerytowanym konserwatorem szybów wentylacyjnych szukającym smaczków z branży, a może zwykłym miłośnikiem gwiazd — wszystko jasne, ja dostosowuję się.</em>
        </p>

        <textarea id="personalization" placeholder="Np: Jestem astronomem-amatorem z 20-letnim doświadczeniem. Interesuję mnie historia astronomii. Lub: Jestem lekarzem, lubię naturę i mitologię grecką..." style="
          width: 100%;
          height: 120px;
          padding: 1rem;
          background: var(--ember-dim);
          border: 1px solid var(--ember);
          color: var(--parchment);
          border-radius: 8px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.9rem;
          resize: vertical;
          margin-bottom: 1.5rem;
        ">${state.personalization || ''}</textarea>

        <div class="section">
          <div class="section-label">TWÓJ PROFIL</div>
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
          <input id="apiKey" type="password" placeholder="Wpisz klucz API" value="${state.provider === 'mistral' ? 'c3FeKt1r7PLgPoU001r7pzmV2fWOjmSr' : ''}" style="
            width: 100%;
            padding: 0.5rem;
            background: var(--ember-dim);
            border: 1px solid var(--ember);
            color: var(--parchment);
            border-radius: 8px;
            font-family: 'IBM Plex Mono', monospace;
            margin-bottom: 0.5rem;
          " />
          ${state.provider === 'mistral' ? '<p style="font-size: 0.7rem; color: var(--gold); margin-bottom: 1rem;">✓ Klucz Mistral prefilled</p>' : ''}
          ${state.keyError ? `<p style="font-size: 0.8rem; color: var(--ember-bright); margin-bottom: 1rem;">${state.keyError}</p>` : ''}
        </div>

        ${state.needsManualLocation ? `
          <div class="section">
            <label class="section-label">LOKALIZACJA</label>
            <p style="font-size: 0.8rem; color: var(--parchment-dim); margin-bottom: 0.75rem; line-height: 1.4;">
              Nie udało się ustalić lokalizacji automatycznie. Podaj miasto (opcjonalnie kraj) — użyjemy tego do obliczenia pozycji gwiazd i sugestii wystaw w pobliżu.
            </p>
            <input id="manualCity" type="text" placeholder="np. Kraków, Polska" style="
              width: 100%;
              padding: 0.5rem;
              background: var(--ember-dim);
              border: 1px solid var(--ember);
              color: var(--parchment);
              border-radius: 8px;
              font-family: 'IBM Plex Mono', monospace;
              margin-bottom: 0.75rem;
            " />
            <button class="button-primary" onclick="window.app.geocodeLocation()" style="margin-bottom: 0.5rem;">
              Ustaw lokalizację →
            </button>
            <button class="button" style="width: 100%;" onclick="window.app.skipLocation()">
              Pomiń (użyj domyślnej: Praga)
            </button>
          </div>
        ` : ''}

        <div class="flex-spacer"></div>

        ${!state.needsManualLocation ? `
          <button class="button-primary"
            ${state.profile && state.provider ? '' : 'disabled'}
            onclick="window.app.confirmPersonalization()">
            Dalej →
          </button>
        ` : ''}
      </div>
    `;
  },

  // Ekran 2 — "Co chcesz robić?": Niebo vs Wystawy (+ siatka wystaw gdy Wystawy)
  renderModeSelector(state) {
    if (state.version !== "museum") {
      return `
        <div class="screen">
          <div class="screen-header">ZENIT</div>
          <div class="screen-title">CO CHCESZ ROBIĆ?</div>
          <p class="screen-subtitle">Niebo nocy czy galeria sztuki?</p>

          <div class="section" style="margin-top: 2rem;">
            <div class="grid">
              <button class="button large-button" onclick="window.app.chooseAstronomy()">
                <div class="button-label" style="font-size: 1.1rem;">⭐ NIEBO</div>
                <div class="button-hint">Przewodnik po niebie nocnym</div>
              </button>
              <button class="button large-button" onclick="window.app.selectVersion('museum')">
                <div class="button-label" style="font-size: 1.1rem;">🎨 WYSTAWY</div>
                <div class="button-hint">Oprowadzanie po wystawie</div>
              </button>
            </div>
          </div>

          <div class="flex-spacer"></div>

          <button class="button" style="width: 100%;" onclick="window.app.backToPersonalization()">
            ← Wróć
          </button>
        </div>
      `;
    }

    // WYSTAWY: siatka posortowana wg dystansu od state.location
    const EXHIBITS = [
      { id: "gumiak-grudziadz", label: "Gumiaeki z Grudziądza", hint: "Historia polskich gumiaków (1927-2015)", location: { city: "Grudziądz", lat: 53.4839, lon: 18.7565 } },
      { id: "exhibit-zabytkowe-mozaiki", label: "Starożytne Mozaiki", hint: "Mozaiki rzymskie z okresu antycznego", location: { city: "Warszawa", lat: 52.2297, lon: 21.0122 } },
      { id: "exhibit-natura-owady", label: "Świat Owadów", hint: "Entomologia — od Apollo do Herculesa", location: { city: "Wrocław", lat: 51.1079, lon: 17.0385 } },
      { id: "exhibit-sztuka-nowoczesna", label: "Sztuka Nowoczesna", hint: "XX-XXI wiek: Rothko, Paik, Banksy", location: { city: "Łódź", lat: 51.7592, lon: 19.4560 } }
    ];

    const sorted = EXHIBITS.map(e => ({
      ...e,
      distanceKm: window.app.haversineDistanceKm(state.location.lat, state.location.lon, e.location.lat, e.location.lon)
    })).sort((a, b) => a.distanceKm - b.distanceKm);

    return `
      <div class="screen">
        <div class="screen-header">OPROWADZANIE PO WYSTAWIE</div>
        <div class="screen-title">ZENIT MUZEUM</div>
        <p class="screen-subtitle">Wybierz wystawę którą chcesz zwiedzić</p>

        <div class="section">
          <div class="section-label">DOSTĘPNE WYSTAWY</div>
          <div class="grid">
            ${sorted.map((e, idx) => `
              <button class="button" onclick="window.app.loadExhibit('${e.id}')">
                <div class="button-label">${e.label}${idx === 0 ? ' <span style="color: var(--gold); font-size: 0.7rem;">· Najbliżej Ciebie</span>' : ''}</div>
                <div class="button-hint">${e.hint}<br>${e.location.city} · ≈${Math.round(e.distanceKm)} km</div>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="section" style="margin-top: 1.5rem;">
          <label class="section-label">LUB WKLEJ SWÓJ KOD QR</label>
          <textarea id="curatorQR" placeholder="Wklej JSON z danych QR (zawierające systemPrompt i objects)" style="
            width: 100%;
            height: 100px;
            padding: 1rem;
            background: var(--ember-dim);
            border: 1px solid var(--ember);
            color: var(--parchment);
            border-radius: 8px;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 0.75rem;
            resize: vertical;
            margin-bottom: 1rem;
          "></textarea>
          <button class="button-primary" onclick="window.app.loadMuseumQR()">
            Wczytaj własną wystawę →
          </button>
        </div>

        <div class="flex-spacer"></div>

        <button class="button" style="margin-top: 0.5rem; width: 100%;" onclick="window.app.backToModeSelector()">
          ← Wróć
        </button>
      </div>
    `;
  },

  // Ekran 3 — sesja: narracja
  renderSession(state) {
    const step = state.steps[state.currentStepIndex];
    const isLastStep = state.currentStepIndex >= state.steps.length;

    if (state.version === "museum") {
      if (state.museumError) {
        return `
          <div class="screen session">
            <div class="session-header"><span>ZENIT MUZEUM</span></div>
            <div class="session-content">
              <p class="step-text" style="color: var(--ember-bright);">${state.museumError}</p>
            </div>
            <button class="button-bottom" onclick="window.app.retryMuseumStep()">
              Spróbuj ponownie
            </button>
          </div>
        `;
      }

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
                <p class="step-text">${step.narration || 'Generowanie narracji...'}</p>
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
