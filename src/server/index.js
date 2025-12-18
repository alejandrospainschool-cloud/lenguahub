import express from 'express'
import { generateContent } from '../lib/ai.js'

const app = express()

app.use(express.json())

// Basic CORS headers (allow dev frontend to call this server)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

app.get('/api/health', (req, res) => {
  res.send('OK')
})

// POST /api/generate - accepts { prompt } and returns JSON { text }
app.post('/api/generate', async (req, res) => {
  const { prompt } = req.body || {}
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Missing prompt' })
  }

  try {
    const text = await generateContent(prompt)
    // Return a JSON object as text so client can parse safely
    return res.status(200).json({ text: (text || '').toString() })
  } catch (err) {
    console.error('Generation error:', err)
    return res.status(500).json({ error: 'Generation failed' })
  }
})

// 🔑 FORCE listen on ALL interfaces
app.listen(5174, '0.0.0.0', () => {
  console.log('SERVER LISTENING ON 0.0.0.0:5174')
})
