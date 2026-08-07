// Vercel Serverless: proxy do TTS (OpenAI/ElevenLabs/Google Cloud) — wywołania server-to-server
// nie podlegają CORS, w przeciwieństwie do fetch() wprost z przeglądarki do tych API.
// Ujednolicona odpowiedź: { audio: "data:<mime>;base64,<...>" } — front-end nie musi znać
// per-providerowego kształtu odpowiedzi (binarny stream vs JSON z base64).

// Granica akapitu w tekście z buildSpokenText() (src/app.js) to "\n\n" — dla Google TTS
// zamieniamy to na prawdziwą pauzę SSML zamiast liczyć na to, że silnik sam wyczuje
// przerwę z kropki na końcu zdania. Tylko Google — OpenAI/ElevenLabs w tym kształcie
// proxy nie obsługują SSML, dostają zwykły tekst z "\n\n" w środku bez zmian.
const NARRATION_PAUSE_MS = 900;

function escapeSsmlText(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildGoogleSsml(text, breakMs = NARRATION_PAUSE_MS) {
  const paragraphs = String(text).split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  if (paragraphs.length <= 1) return null; // jeden akapit — zwykły tekst, bez ryzyka
  return `<speak>${paragraphs.map(escapeSsmlText).join(`<break time="${breakMs}ms"/>`)}</speak>`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { provider, apiKey, text, voice, model, languageCode } = req.body;

  if (!provider || !text) {
    return res.status(400).json({ error: "provider i text są wymagane" });
  }

  if (provider !== "browser" && !apiKey) {
    return res.status(400).json({ error: "apiKey jest wymagany dla tego dostawcy TTS" });
  }

  try {
    let audioBase64;
    const mimeType = "audio/mpeg";

    switch (provider) {
      case "openai": {
        const response = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model || "tts-1",
            voice: voice || "alloy",
            input: text
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({ message: response.statusText }));
          console.error(`TTS proxy: openai error (status ${response.status}):`, errData);
          return res.status(response.status).json({ error: errData });
        }

        const buffer = await response.arrayBuffer();
        audioBase64 = Buffer.from(buffer).toString("base64");
        break;
      }

      case "elevenlabs": {
        const voiceId = voice || "21m00Tcm4TlvDq8ikWAM";
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": apiKey,
            "Accept": "audio/mpeg"
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_multilingual_v2"
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({ message: response.statusText }));
          console.error(`TTS proxy: elevenlabs error (status ${response.status}):`, errData);
          return res.status(response.status).json({ error: errData });
        }

        const buffer = await response.arrayBuffer();
        audioBase64 = Buffer.from(buffer).toString("base64");
        break;
      }

      case "google": {
        const ssml = buildGoogleSsml(text);
        const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: ssml ? { ssml } : { text },
            voice: { languageCode: languageCode || "pl-PL", name: voice || "pl-PL-Wavenet-A" },
            audioConfig: { audioEncoding: "MP3", speakingRate: 0.9 }
          })
        });

        const data = await response.json();

        if (!response.ok) {
          console.error(`TTS proxy: google error (status ${response.status}):`, data);
          return res.status(response.status).json({ error: data });
        }

        audioBase64 = data.audioContent; // Google zwraca już base64
        break;
      }

      default:
        return res.status(400).json({ error: `Unsupported provider: ${provider}` });
    }

    return res.status(200).json({ audio: `data:${mimeType};base64,${audioBase64}` });
  } catch (error) {
    console.error("TTS proxy error:", error);
    return res.status(500).json({ error: "TTS proxy request failed", details: error.message });
  }
}
