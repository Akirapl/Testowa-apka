// Vercel Serverless: zapisz personalizację do Supabase
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { profile, personalization } = req.body;

  if (!personalization) {
    return res.status(400).json({ error: "Personalization is required" });
  }

  // Supabase credentials — ustawione jako zmienne środowiskowe w Vercel dashboard
  // (Project → Settings → Environment Variables), nie trzymane w repo.
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing SUPABASE_URL/SUPABASE_KEY environment variables");
    return res.status(500).json({ error: "Server misconfigured: missing Supabase credentials" });
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/personalization`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        profile,
        personalization_text: personalization
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Supabase error:", data);
      return res.status(response.status).json({ error: data });
    }

    console.log("✅ Personalization saved:", { profile, personalization });
    return res.status(200).json({
      success: true,
      message: "Personalization saved successfully"
    });

  } catch (error) {
    console.error("❌ Error saving personalization:", error);
    return res.status(500).json({
      error: "Failed to save personalization",
      details: error.message
    });
  }
}
