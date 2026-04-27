// api/generate.js

import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_CONFIGS = [
  ['gemini-2.0-flash', 'v1beta'],
  ['gemini-2.0-flash', 'v1'],
  ['gemini-2.0-flash-lite', 'v1beta'],
  ['gemini-2.0-flash-lite', 'v1'],
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
      return res.status(500).json({ 
        text: "Missing GEMINI_API_KEY in Vercel env vars",
        error: "MISSING_API_KEY"
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    let lastError = '';
    let lastStatus = 500;

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
        
        // Log detailed error info for debugging 429 errors
        console.error(`[generate] ${modelName}/${apiVersion} failed:`, {
          error: lastError,
          status: modelErr.status,
          code: modelErr.code,
          fullError: modelErr
        });

        // Check if it's a 429 (quota/rate limit)
        if (modelErr.status === 429 || lastError.includes('429')) {
          lastStatus = 429;
          // Continue trying other models
        }
      }
    }

    // Return appropriate error status
    const statusCode = lastStatus === 429 ? 429 : 500;
    return res.status(statusCode).json({ 
      text: `Gemini error: ${lastError}`,
      error: "GEMINI_API_ERROR"
    });
  } catch (err) {
    console.error('[generate] Server error:', {
      error: err?.message || err,
      code: err?.code,
      status: err?.status
    });
    return res.status(500).json({ 
      text: `Server error: ${String(err?.message || err)}`,
      error: "SERVER_ERROR"
    });
  }
}
