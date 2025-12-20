export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ text: 'Method not allowed' })
  }

  try {
    const { prompt } = req.body || {}
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ text: 'Missing prompt' })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return res.status(500).json({ text: 'Missing GEMINI_API_KEY (set it in Vercel env vars)' })
    }

    // Pick a model dynamically so you don’t get “model not found”
    const listRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    )
    const listJson = await listRes.json()

    const models = Array.isArray(listJson.models) ? listJson.models : []
    const supported = models.filter(
      (m) =>
        Array.isArray(m.supportedGenerationMethods) &&
        m.supportedGenerationMethods.includes('generateContent') &&
        typeof m.name === 'string'
    )

    if (supported.length === 0) {
      return res.status(500).json({ text: 'No Gemini models available for this key.' })
    }

    const picked =
      supported.find((m) => m.name.toLowerCase().includes('flash')) ||
      supported.find((m) => m.name.toLowerCase().includes('pro')) ||
      supported[0]

    const genRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${picked.name}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        }),
      }
    )

    const genJson = await genRes.json()

    if (!genRes.ok) {
      return res.status(500).json({ text: `Gemini error: ${JSON.stringify(genJson)}` })
    }

    const text = genJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    return res.status(200).json({ text: (text || '').trim() })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ text: `Server error: ${String(err?.message || err)}` })
  }
}
