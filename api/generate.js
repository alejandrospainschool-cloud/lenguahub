// api/generate.js
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export default async function handler(req, res) {
  // Basic CORS (optional, but helpful if you ever call this cross-origin)
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") return res.status(204).end()
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  try {
    const { prompt } = req.body ?? {}
    if (!prompt) return res.status(400).json({ error: "Missing prompt" })

    // Model name MUST match what your /v1beta/models endpoint returns
    const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" })

    // Extra guardrail to keep responses clean for translation
    const strictPrompt =
      `You are a translation engine. Return ONLY the translated text, nothing else.\n\n${prompt}`

    const result = await model.generateContent(strictPrompt)
    const response = await result.response
    const text = (response.text() || "").trim()

    return res.status(200).json({ text })
  } catch (err) {
    console.error("Gemini error:", err)
    return res.status(500).json({
      error: err?.message || "Gemini request failed",
    })
  }
}
