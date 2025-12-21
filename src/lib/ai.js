// src/lib/ai.js
const API_BASE = import.meta.env.VITE_API_BASE || ''

export async function generateContent(prompt) {
  const url = `${API_BASE}/api/generate`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })

  const text = await res.text()
  let data = {}
  try {
    data = JSON.parse(text)
  } catch {
    // allow non-json
  }

  if (!res.ok) {
    throw new Error(data?.text || `Request failed (${res.status}): ${text}`)
  }

  return (data?.text || '').trim() || 'No response'
}
