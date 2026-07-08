// Breaks a planted idea into a short list of concrete next steps via
// Claude Haiku — generated once per idea (the caller persists the
// result so this never re-runs for the same idea), triggered the
// first time its bonsai is opened in the Garden.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: 'Planning is not configured yet (missing ANTHROPIC_API_KEY).' })
    return
  }

  const { transcript, title, summary } = req.body || {}
  if (!transcript) {
    res.status(400).json({ error: 'No transcript provided' })
    return
  }

  const prompt = `You are sketching a short, concrete starting plan for a personal idea someone just decided to act on. Given the idea below, respond with ONLY a JSON object (no markdown, no explanation) with this exact key:
- "steps": an array of 4 to 6 short, concrete, actionable next steps (each a single sentence, starting with a verb), ordered from first to last, that would actually move this specific idea forward

Idea title: "${title || 'Untitled idea'}"
Summary: "${summary || ''}"
Full transcript: "${transcript}"`

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
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      res.status(502).json({ error: `Planning request failed: ${errText}` })
      return
    }

    const data = await anthropicRes.json()
    const text = data.content?.[0]?.text || '{}'
    const parsed = JSON.parse(extractJson(text))
    const steps = Array.isArray(parsed.steps) ? parsed.steps.filter((s) => typeof s === 'string') : []

    res.status(200).json({
      steps: steps.map((text) => ({ text, done: false })),
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
