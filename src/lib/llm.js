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

  // Claude API
  async callClaude(systemPrompt, userMessage) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 500,
        system: systemPrompt,
        messages: [
          { role: "user", content: userMessage }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  },

  // OpenAI API
  async callOpenAI(systemPrompt, userMessage) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 500,
        temperature: 0.8,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  },

  // Mistral API
  async callMistral(systemPrompt, userMessage) {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 500,
        temperature: 0.8,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  },

  // Buduj prompt dla LLM
  buildPrompt(context) {
    const { profile, currentStep, totalSteps, object, previousObjects } = context;

    let prompt = `Jesteś w kroku ${currentStep}/${totalSteps}.\n`;
    prompt += `Profil użytkownika: ${profile}\n\n`;
    prompt += `Bieżący cel: ${object.name}\n`;
    prompt += `Azymut: ${object.azimuth.toFixed(1)}°, Wysokość: ${object.altitude.toFixed(1)}°\n`;

    if (previousObjects.length > 0) {
      prompt += `Poprzednio znalezione: ${previousObjects.map(o => o.name).join(", ")}\n`;
    }

    prompt += `\nWygeneruj naturalną, drażliwą narrację w polskim dla tego kroku. Odpowiedź musi być poprawnym JSON z polami: narration (tekst do TTS), fact (ciekawostka), continue (boolean).`;

    return prompt;
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
