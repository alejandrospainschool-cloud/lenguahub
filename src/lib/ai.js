// src/lib/ai.js

// In Codespaces/dev, set VITE_API_BASE to your Vercel site URL.
// In production on Vercel, leave it blank and it will call same-origin /api/generate.
const API_BASE = import.meta.env.VITE_API_BASE || ''

export async function generateContent(prompt) {
  const url = `${API_BASE}/api/generate`

  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
  } catch (e) {
    throw new Error(`Failed to fetch: ${url}`)
  }

  const text = await res.text()

  let data = {}
  try {
    data = JSON.parse(text)
  } catch {
    // ignore
  }

  if (!res.ok) {
    throw new Error(data?.text || `Request failed (${res.status}): ${text}`)
  }

  return (data?.text || '').trim() || 'No response'
}
