// api/generate.js

import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_CONFIGS = [
  ['gemini-2.0-flash', 'v1beta'],
  ['gemini-2.0-flash', 'v1'],
  ['gemini-1.5-flash', 'v1beta'],
  ['gemini-1.5-flash', 'v1'],
  ['gemini-1.5-flash-latest', 'v1beta'],
  ['gemini-1.5-flash-latest', 'v1'],
  ['gemini-pro', 'v1beta'],
  ['gemini-pro', 'v1'],
  ['gemini-1.0-pro', 'v1beta'],
  ['gemini-1.0-pro', 'v1'],
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

    const genAI = new GoogleGenerativeAI(apiKey);
    let lastError = '';

    for (const [modelName, apiVersion] of MODEL_CONFIGS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion });
        const result = await model.generateContent(prompt);
        const text = result.response.text() || '';
        if (text.trim()) {
          return res.status(200).json({ text: text.trim() });
        }
        lastError = 'Empty response';
      } catch (modelErr) {
        lastError = modelErr.message || String(modelErr);
        console.error(`[generate] ${modelName}/${apiVersion} failed:`, lastError);
      }
    }

    return res.status(500).json({ text: `Gemini error: ${lastError}` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ text: `Server error: ${String(err?.message || err)}` });
  }
}
