// The Workshop's recurring AI check-in — unlike api/brief.js (a
// one-time synthesis you explicitly ask for once), this is meant to
// be called again and again as you actually work an idea: it reads
// the brief, the current living task list, and the journal entries
// logged since, and comes back with a short, honest read on progress
// plus a few concrete tasks it thinks are missing. Nothing here is
// cached — every check-in is a fresh look at wherever things stand.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: 'Check-ins are not configured yet (missing ANTHROPIC_API_KEY).' })
    return
  }

  const { title, brief, tasks, notes } = req.body || {}

  const tasksText =
    Array.isArray(tasks) && tasks.length
      ? tasks.map((t) => `- [${t.done ? 'x' : ' '}] ${t.text}`).join('\n')
      : '(no tasks yet)'
  const notesText =
    Array.isArray(notes) && notes.length ? notes.map((n) => `- ${n.text}`).join('\n') : '(no journal entries yet)'

  const prompt = `You are a helpful, honest collaborator checking in on someone's in-progress personal project. Given the project brief, its current task list, and the journal entries logged while working on it, respond with ONLY a JSON object (no markdown, no explanation) with these exact keys:
- "message": 2-4 sentences, plain and direct — what looks like it's actually moving, what looks stalled or blocked, said like a supportive collaborator rather than a status report
- "suggestedTasks": an array of 2-4 short, concrete, actionable task strings (each starting with a verb) that aren't already on the task list and would meaningfully move this forward next

Idea title: "${title || 'Untitled idea'}"

Project brief:
${brief || '(no brief generated yet)'}

Current task list:
${tasksText}

Journal entries:
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
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      res.status(502).json({ error: `Check-in request failed: ${errText}` })
      return
    }

    const data = await anthropicRes.json()
    const text = data.content?.[0]?.text || '{}'
    const parsed = JSON.parse(extractJson(text))
    const suggestedTasks = Array.isArray(parsed.suggestedTasks)
      ? parsed.suggestedTasks.filter((s) => typeof s === 'string')
      : []

    res.status(200).json({
      message: typeof parsed.message === 'string' ? parsed.message : '',
      suggestedTasks,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/)
  return match ? match[0] : text
}
