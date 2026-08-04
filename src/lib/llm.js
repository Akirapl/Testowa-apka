// LLM abstraction layer — Claude, OpenAI, Mistral
window.LLM = {
  provider: null,
  apiKey: null,
  model: null,

  // Inicjalizuj dostawcę
  init(provider, apiKey, options = {}) {
    this.provider = provider;
    this.apiKey = apiKey;

    switch (provider) {
      case "claude":
        this.model = options.model || "claude-3-5-sonnet-20241022";
        break;
      case "openai":
        this.model = options.model || "gpt-4o-mini";
        break;
      case "mistral":
        this.model = options.model || "mistral-large-latest";
        break;
      default:
        throw new Error("Unsupported provider: " + provider);
    }
  },

  // Wspólny wywoływacz — woła własny /api/llm-proxy zamiast providera bezpośrednio.
  // Server-to-server wywołanie proxy do providera nie podlega CORS (w przeciwieństwie
  // do fetch() wprost z przeglądarki do api.anthropic.com/api.openai.com/api.mistral.ai,
  // które w większości providerów jest przez nich samych blokowane).
  //
  // Apka jest do użytku pod gołym niebem, gdzie zasięg bywa słaby — "Load failed"
  // (błąd sieciowy fetch(), nie odpowiedź serwera) bywa przejściowym zonkiem
  // połączenia, więc próbujemy ponownie zamiast od razu poddawać się.
  async _callProxy(systemPrompt, userMessage, attempt = 1) {
    const maxAttempts = 3;

    try {
      const response = await fetch("/api/llm-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: this.provider,
          apiKey: this.apiKey,
          model: this.model,
          systemPrompt,
          userMessage
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const detail = typeof data.error === "string" ? data.error : JSON.stringify(data.error);
        throw new Error(`${this.provider} API error: ${response.status} ${detail}`);
      }

      return data.text;
    } catch (error) {
      if (attempt < maxAttempts) {
        console.warn(`_callProxy: próba ${attempt}/${maxAttempts} nieudana (${error.message}), ponawiam...`);
        await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
        return this._callProxy(systemPrompt, userMessage, attempt + 1);
      }
      throw error;
    }
  },

  // Testuj czy klucz API jest prawidłowy
  lastError: null,

  async testKey() {
    this.lastError = null;

    if (!this.apiKey || !this.provider) {
      this.lastError = "Brak klucza API lub providera";
      console.warn("testKey: no apiKey or provider set");
      return false;
    }

    try {
      await this._callProxy("Jesteś asystentem testowym.", "Test");
      console.log(`testKey: ${this.provider} key is ✅ VALID`);
      return true;
    } catch (error) {
      this.lastError = error.message;
      console.warn(`testKey: ${this.provider} key is ❌ INVALID —`, error.message);
      return false;
    }
  },

  // Wygeneruj następny krok narracji
  async generateStep(context) {
    if (!this.apiKey) {
      throw new Error("API key not configured");
    }

    const systemPrompt = window.SYSTEM_PROMPT;
    const userMessage = this.buildPrompt(context);

    try {
      let response;

      switch (this.provider) {
        case "claude":
          response = await this.callClaude(systemPrompt, userMessage);
          break;
        case "openai":
          response = await this.callOpenAI(systemPrompt, userMessage);
          break;
        case "mistral":
          response = await this.callMistral(systemPrompt, userMessage);
          break;
      }

      return this.parseResponse(response);
    } catch (error) {
      console.error("LLM Error:", error);
      throw error;
    }
  },

  // Claude API — przez /api/llm-proxy (patrz _callProxy)
  async callClaude(systemPrompt, userMessage) {
    return this._callProxy(systemPrompt, userMessage);
  },

  // OpenAI API — przez /api/llm-proxy (patrz _callProxy)
  async callOpenAI(systemPrompt, userMessage) {
    return this._callProxy(systemPrompt, userMessage);
  },

  // Mistral API — przez /api/llm-proxy (patrz _callProxy)
  async callMistral(systemPrompt, userMessage) {
    return this._callProxy(systemPrompt, userMessage);
  },

  // Buduj prompt dla LLM
  buildPrompt(context) {
    const { profile, currentStep, totalSteps, object, previousObjects, personalization } = context;

    let prompt = `Jesteś w kroku ${currentStep}/${totalSteps}.\n`;
    prompt += `Profil użytkownika: ${profile}\n`;

    if (personalization && personalization.trim()) {
      prompt += `O użytkowniku: ${personalization}\n\n`;
    }

    prompt += `Bieżący cel: ${object.name}\n`;
    prompt += `Azymut: ${object.azimuth.toFixed(1)}°, Wysokość: ${object.altitude.toFixed(1)}°\n`;

    if (previousObjects.length > 0) {
      prompt += `Poprzednio znalezione: ${previousObjects.map(o => o.name).join(", ")}\n`;
    }

    prompt += `\nWygeneruj naturalną, drażliwą narrację w polskim dla tego kroku. JEŚLI ma opis użytkownika - dostosuj narrację do jego zainteresowań, profesji, doświadczenia. Odpowiedź musi być poprawnym JSON z polami: narration (tekst do TTS), fact (ciekawostka), continue (boolean).`;

    return prompt;
  },

  // Buduj prompt dla LLM — wersja muzealna (opis kuratora jako materiał źródłowy)
  buildMuseumPrompt(context) {
    const { profile, currentStep, totalSteps, object, previousObjects, personalization } = context;

    let prompt = `Jesteś w kroku ${currentStep}/${totalSteps} oprowadzania po wystawie.\n`;
    prompt += `Profil zwiedzającego: ${profile}\n`;

    if (personalization && personalization.trim()) {
      prompt += `O zwiedzającym: ${personalization}\n\n`;
    }

    prompt += `Bieżące dzieło: ${object.title}\n`;
    if (object.author) prompt += `Autor: ${object.author}\n`;
    if (object.year) prompt += `Rok: ${object.year}\n`;
    prompt += `Materiały od kuratora (surowe notatki — przekształć je w żywą narrację, nie czytaj wprost):\n`;
    prompt += `Opis: ${object.description}\n`;
    if (object.fact) prompt += `Ciekawostka: ${object.fact}\n`;

    if (previousObjects.length > 0) {
      prompt += `Poprzednio zwiedzone: ${previousObjects.map(o => o.name).join(", ")}\n`;
    }

    prompt += `\nWygeneruj naturalną, żywą narrację w polskim dla tego dzieła, na bazie materiałów od kuratora. JEŚLI jest opis zwiedzającego — dostosuj narrację do jego zainteresowań, profesji, doświadczenia. Odpowiedź musi być poprawnym JSON z polami: narration (tekst do TTS), fact (ciekawostka), continue (boolean).`;

    return prompt;
  },

  // Wygeneruj krok narracji muzealnej — system prompt to instrukcja kuratora z pliku wystawy
  async generateMuseumStep(context, systemPromptOverride) {
    if (!this.apiKey) {
      throw new Error("API key not configured");
    }

    const systemPrompt = systemPromptOverride || window.SYSTEM_PROMPT;
    const userMessage = this.buildMuseumPrompt(context);

    try {
      let response;

      switch (this.provider) {
        case "claude":
          response = await this.callClaude(systemPrompt, userMessage);
          break;
        case "openai":
          response = await this.callOpenAI(systemPrompt, userMessage);
          break;
        case "mistral":
          response = await this.callMistral(systemPrompt, userMessage);
          break;
      }

      return this.parseResponse(response);
    } catch (error) {
      console.error("LLM Error (museum):", error);
      throw error;
    }
  },

  // Parsuj JSON response z LLM
  parseResponse(text) {
    try {
      // Szukaj JSON w odpowiedzi
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        narration: parsed.narration || "",
        fact: parsed.fact || "",
        continue: parsed.continue !== false
      };
    } catch (error) {
      console.error("Failed to parse LLM response:", error, text);
      throw error;
    }
  }
};
