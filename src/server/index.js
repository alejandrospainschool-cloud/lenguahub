import express from 'express'

const app = express()

app.get('/api/health', (req, res) => {
  res.send('OK')
})

// 🔑 FORCE listen on ALL interfaces
app.listen(5174, '0.0.0.0', () => {
  console.log('SERVER LISTENING ON 0.0.0.0:5174')
})
