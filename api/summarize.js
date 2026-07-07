// Turns a transcript into a lightweight idea record via Claude Haiku
// — just enough organizing to file the idea away (title, one-line
// summary, keywords, category guess, confidence), not a full project
// plan. That only happens later, if the idea gets planted.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: 'Summarization is not configured yet (missing ANTHROPIC_API_KEY).' })
    return
  }

  const { transcript } = req.body || {}
  if (!transcript) {
    res.status(400).json({ error: 'No transcript provided' })
    return
  }

  const prompt = `You are organizing a quick voice memo into a lightweight idea record. Given the transcript below, respond with ONLY a JSON object (no markdown, no explanation) with these exact keys:
- "title": a short 2-4 word name for this idea
- "summary": one short sentence summarizing the idea
- "keywords": an array of 2-4 lowercase keyword strings
- "category": your best guess at a category (e.g. "song", "business", "invention", "story", "trip", "video", "other")
- "confidence": a number 0-1 for how confident you are that you understood the idea clearly

Transcript: "${transcript}"`

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      res.status(502).json({ error: `Summarization request failed: ${errText}` })
      return
    }

    const data = await anthropicRes.json()
    const text = data.content?.[0]?.text || '{}'
    const parsed = JSON.parse(extractJson(text))

    res.status(200).json({
      title: parsed.title || 'Untitled idea',
      summary: parsed.summary || '',
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      category: parsed.category || 'other',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Claude sometimes wraps JSON in markdown fences despite instructions
// to the contrary; strip them defensively rather than trust the model.
function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/)
  return match ? match[0] : text
}
