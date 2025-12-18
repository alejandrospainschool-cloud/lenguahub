// src/lib/ai.js

// If VITE_API_BASE is set (dev in Codespaces), use it.
// Otherwise (on Vercel), call same-origin /api/generate
const API_BASE = import.meta.env.VITE_API_BASE || ''

export async function generateContent(prompt) {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data?.text || 'AI request failed')
  }

  return (data?.text || '').trim() || 'No response'
}
