export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  try {
    const { prompt } = req.body ?? {}
    if (!prompt) return res.status(400).json({ error: "Missing prompt" })

    // TODO: call your AI provider here (OpenAI, etc.)
    // For now, just echo so you can verify wiring works:
    return res.status(200).json({ text: `STUB_RESPONSE: ${prompt}` })
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" })
  }
}
