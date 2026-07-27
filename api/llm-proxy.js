// Vercel Serverless: proxy do LLM (Claude/OpenAI/Mistral) — wywołania server-to-server
// nie podlegają CORS, w przeciwieństwie do fetch() wprost z przeglądarki.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { provider, apiKey, model, systemPrompt, userMessage } = req.body;

  if (!provider || !apiKey || !model) {
    return res.status(400).json({ error: "provider, apiKey i model są wymagane" });
  }

  try {
    let response;

    switch (provider) {
      case "claude":
        response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model,
            max_tokens: 500,
            system: systemPrompt || "",
            messages: [{ role: "user", content: userMessage || "Test" }]
          })
        });
        break;

      case "openai":
        response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            max_tokens: 500,
            temperature: 0.8,
            messages: [
              { role: "system", content: systemPrompt || "" },
              { role: "user", content: userMessage || "Test" }
            ]
          })
        });
        break;

      case "mistral":
        response = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            max_tokens: 500,
            temperature: 0.8,
            messages: [
              { role: "system", content: systemPrompt || "" },
              { role: "user", content: userMessage || "Test" }
            ]
          })
        });
        break;

      default:
        return res.status(400).json({ error: `Unsupported provider: ${provider}` });
    }

    const data = await response.json();

    if (!response.ok) {
      console.error(`LLM proxy: ${provider} error (status ${response.status}):`, data);
      return res.status(response.status).json({ error: data });
    }

    // Ujednolicony kształt odpowiedzi — front-end nie musi znać per-providerowego JSON-a
    let text;
    if (provider === "claude") {
      text = data.content?.[0]?.text || "";
    } else {
      text = data.choices?.[0]?.message?.content || "";
    }

    return res.status(200).json({ text });
  } catch (error) {
    console.error("LLM proxy error:", error);
    return res.status(500).json({ error: "LLM proxy request failed", details: error.message });
  }
}
