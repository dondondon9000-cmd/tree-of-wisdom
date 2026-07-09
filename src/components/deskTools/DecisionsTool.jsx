import { useState } from 'react'
import { useGardenStore } from '../../lib/store'
import '../DeskTools.css'

const KINDS = [
  { value: 'pro', label: 'Pro' },
  { value: 'con', label: 'Con' },
  { value: 'risk', label: 'Risk' },
  { value: 'alternative', label: 'Alternative considered' },
]

const KIND_LABELS = {
  pro: 'Pros',
  con: 'Cons',
  risk: 'Risks',
  alternative: 'Alternatives considered',
}

// Pros/cons, risks, and paths considered and rejected — the record
// that keeps you from re-arguing the same decision with yourself a
// few weeks from now. One list tagged by kind rather than four
// separate columns; the UI just groups by kind for display.
export default function DecisionsTool({ idea }) {
  const addDecision = useGardenStore((s) => s.addDecision)
  const [kind, setKind] = useState('pro')
  const [draft, setDraft] = useState('')

  const decisions = idea.decisions || []

  function submit(e) {
    e.preventDefault()
    if (!draft.trim()) return
    addDecision(idea.id, kind, draft.trim())
    setDraft('')
  }

  return (
    <div className="desk-tool">
      <p className="desk-tool-intro">Pros, cons, risks, and paths you considered and didn't take.</p>

      {KINDS.map(({ value }) => {
        const entries = decisions.filter((d) => d.kind === value)
        if (entries.length === 0) return null
        return (
          <div className="desk-tool-section" key={value}>
            <p className="desk-tool-label">{KIND_LABELS[value]}</p>
            <ul className="desk-tool-list">
              {entries.map((entry, i) => (
                <li key={i} className="desk-tool-item">
                  {entry.text}
                </li>
              ))}
            </ul>
          </div>
        )
      })}

      {decisions.length === 0 && <p className="desk-tool-empty">Nothing recorded yet.</p>}

      <form className="desk-tool-form" onSubmit={submit}>
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          {KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
        <input type="text" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a note…" />
        <button type="submit" disabled={!draft.trim()}>
          Add
        </button>
      </form>
    </div>
  )
}
