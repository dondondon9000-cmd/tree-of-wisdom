// Writes the "well reviewed plan" for a fully-bloomed idea — reads
// the original transcript, the completed step plan, and whatever
// brainstorm notes got added in the post-bloom dashboard, and asks
// Claude Haiku to turn all of it into one cohesive project brief. This
// is explicitly user-triggered (a button in IdeaWorkspace) rather than
// generated automatically like api/plan.js — it's meant to run once
// you feel the brainstorming is actually done, and can be re-run any
// time more notes get added.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: 'Planning is not configured yet (missing ANTHROPIC_API_KEY).' })
    return
  }

  const { transcript, title, summary, steps, notes } = req.body || {}
  if (!transcript) {
    res.status(400).json({ error: 'No transcript provided' })
    return
  }

  const stepsText =
    Array.isArray(steps) && steps.length ? steps.map((s) => `- ${s.text}`).join('\n') : '(none yet)'
  const notesText =
    Array.isArray(notes) && notes.length ? notes.map((n) => `- ${n.text}`).join('\n') : '(none yet)'

  const prompt = `You are writing a well-reviewed, ready-to-execute project brief for a personal idea. The person has already worked through an initial list of steps and brainstormed further on it — your job is to read everything below and turn it into one cohesive, actionable plan, not just restate it.

Respond with ONLY a JSON object (no markdown, no explanation) with this exact key:
- "brief": a single string, plain text, organized into short paragraphs separated by a blank line (no markdown headers, no bullet characters), covering in order: the goal in one or two sentences, the overall approach, what's needed to pull it off (resources, skills, tools), and a clear numbered-in-prose list of first concrete actions to actually start

Idea title: "${title || 'Untitled idea'}"
Summary: "${summary || ''}"
Full original transcript: "${transcript}"

Steps already completed:
${stepsText}

Additional brainstorming notes:
${notesText}`

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
        max_tokens: 900,
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
    const brief = typeof parsed.brief === 'string' ? parsed.brief : ''

    res.status(200).json({ brief })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/)
  return match ? match[0] : text
}
