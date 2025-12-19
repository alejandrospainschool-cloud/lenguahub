import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { prompt } = req.body ?? {}
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" })
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
    })

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text().trim()

    return res.status(200).json({ text })
  } catch (err) {
    console.error("Gemini error:", err)
    return res.status(500).json({
      error: err?.message || "Gemini request failed",
    })
  }
}
