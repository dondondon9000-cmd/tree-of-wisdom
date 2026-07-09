import { useState } from 'react'
import '../DeskTools.css'
import './OutTrayTool.css'

// The last stop: a clean, distilled document pulled together from
// every other tool — not the raw brainstorm, the finished plan.
// Composed client-side from whatever's already on the idea rather
// than another AI call; this is a formatting job, not a generation
// job, so there's nothing to ask Haiku for here.
function buildExportDocument(idea) {
  const lines = [`# ${idea.title}`]

  if (idea.brief) {
    lines.push('', '## Brief', idea.brief)
  }

  const notebook = idea.notebook || {}
  if (notebook.goal || notebook.constraints || notebook.success) {
    lines.push('', '## Foundation')
    if (notebook.goal) lines.push('', '**Goal:** ' + notebook.goal)
    if (notebook.constraints) lines.push('', '**Constraints:** ' + notebook.constraints)
    if (notebook.success) lines.push('', '**Success looks like:** ' + notebook.success)
  }

  const milestones = idea.milestones || []
  if (milestones.length > 0) {
    lines.push('', '## Plan')
    for (const m of milestones) {
      lines.push('', `### ${m.title}`)
      for (const t of m.tasks) {
        lines.push(`- [${t.done ? 'x' : ' '}] ${t.text}`)
      }
    }
  }

  const research = idea.research || []
  if (research.length > 0) {
    lines.push('', '## Research & notes')
    for (const r of research) lines.push(`- ${r.text}`)
  }

  const ledger = idea.ledger || {}
  const resources = ledger.resources || []
  const people = ledger.people || []
  if (resources.length > 0 || people.length > 0 || ledger.budgetEstimate != null || ledger.budgetSpent != null) {
    lines.push('', '## Resources')
    for (const r of resources) lines.push(`- [${r.have ? 'x' : ' '}] ${r.text}`)
    if (people.length > 0) {
      lines.push('', '**People:**')
      for (const p of people) lines.push(`- ${p.text}`)
    }
    if (ledger.budgetEstimate != null || ledger.budgetSpent != null) {
      lines.push('', `**Budget:** estimated $${ledger.budgetEstimate ?? '?'}, spent $${ledger.budgetSpent ?? '0'}`)
    }
  }

  const decisions = idea.decisions || []
  if (decisions.length > 0) {
    lines.push('', '## Decisions')
    const kinds = [
      { value: 'pro', label: 'Pros' },
      { value: 'con', label: 'Cons' },
      { value: 'risk', label: 'Risks' },
      { value: 'alternative', label: 'Alternatives considered' },
    ]
    for (const { value, label } of kinds) {
      const entries = decisions.filter((d) => d.kind === value)
      if (entries.length === 0) continue
      lines.push('', `**${label}:**`)
      for (const e of entries) lines.push(`- ${e.text}`)
    }
  }

  const notes = idea.notes || []
  if (notes.length > 0) {
    lines.push('', '## Journal')
    for (const n of notes) lines.push(`- ${n.text}`)
  }

  return lines.join('\n')
}

export default function OutTrayTool({ idea }) {
  const [copied, setCopied] = useState(false)
  const document_ = buildExportDocument(idea)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(document_)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err.message)
    }
  }

  function handleDownload() {
    const blob = new Blob([document_], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${idea.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'plan'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="desk-tool">
      <p className="desk-tool-intro">
        Everything above, pulled into one clean document you can take out of here — copy it, download it,
        or paste it wherever you actually need it next.
      </p>

      <div className="out-tray-actions">
        <button type="button" className="desk-tool-primary-button" onClick={handleCopy}>
          {copied ? 'Copied ✓' : 'Copy to clipboard'}
        </button>
        <button type="button" className="desk-tool-primary-button" onClick={handleDownload}>
          Download as .md
        </button>
      </div>

      <pre className="out-tray-preview">{document_}</pre>
    </div>
  )
}
