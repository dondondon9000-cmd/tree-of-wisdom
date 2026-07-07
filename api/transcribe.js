// Turns a recorded voice memo into text via OpenAI's Whisper API.
// Audio arrives as base64 JSON (not multipart) so this needs no extra
// parsing dependency — just decode and re-package for OpenAI, which
// does want multipart/form-data.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!process.env.OPENAI_API_KEY) {
    res.status(500).json({ error: 'Transcription is not configured yet (missing OPENAI_API_KEY).' })
    return
  }

  const { audio, mimeType } = req.body || {}
  if (!audio) {
    res.status(400).json({ error: 'No audio provided' })
    return
  }

  try {
    const buffer = Buffer.from(audio, 'base64')
    const form = new FormData()
    form.append('file', new Blob([buffer], { type: mimeType || 'audio/webm' }), 'capture.webm')
    form.append('model', 'whisper-1')

    const openaiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form,
    })

    if (!openaiRes.ok) {
      const errText = await openaiRes.text()
      res.status(502).json({ error: `Whisper request failed: ${errText}` })
      return
    }

    const data = await openaiRes.json()
    res.status(200).json({ transcript: data.text })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
