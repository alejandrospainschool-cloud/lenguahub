// api/generate.js

const MODEL = "gemini-1.5-flash"; // reliable + fast

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ text: "Method not allowed" });
  }

  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ text: "Missing prompt" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ text: "Missing GEMINI_API_KEY in Vercel env vars" });
    }

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await r.json();

    if (!r.ok) {
      const msg = data?.error?.message || JSON.stringify(data);
      return res.status(r.status).json({ text: `Gemini error: ${msg}` });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return res.status(200).json({ text: text.trim() || "No response" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ text: `Server error: ${String(err?.message || err)}` });
  }
}
