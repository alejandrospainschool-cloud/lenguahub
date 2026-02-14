// api/generate.js

const MODELS = [
  { version: 'v1beta', model: 'gemini-2.0-flash' },
  { version: 'v1', model: 'gemini-2.0-flash' },
  { version: 'v1beta', model: 'gemini-1.5-flash' },
  { version: 'v1', model: 'gemini-1.5-flash' },
  { version: 'v1beta', model: 'gemini-pro' },
  { version: 'v1', model: 'gemini-pro' },
];

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

    let lastError = '';
    for (const { version, model } of MODELS) {
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`,
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
          lastError = data?.error?.message || JSON.stringify(data);
          console.error(`[generate] ${version}/${model} error:`, lastError);
          continue;
        }

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        if (text.trim()) {
          return res.status(200).json({ text: text.trim() });
        }
        lastError = 'Empty response';
      } catch (modelErr) {
        lastError = modelErr.message || 'Unknown error';
        console.error(`[generate] ${version}/${model} exception:`, lastError);
      }
    }

    return res.status(500).json({ text: `Gemini error: ${lastError}` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ text: `Server error: ${String(err?.message || err)}` });
  }
}
