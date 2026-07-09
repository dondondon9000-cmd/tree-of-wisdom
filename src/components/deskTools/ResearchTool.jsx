import { useState } from 'react'
import { useGardenStore } from '../../lib/store'
import '../DeskTools.css'

// Reference notes, links, and open questions — the stuff you'd
// normally scatter across browser tabs and sticky notes while looking
// into whether an idea is actually workable.
export default function ResearchTool({ idea }) {
  const addResearchNote = useGardenStore((s) => s.addResearchNote)
  const [draft, setDraft] = useState('')

  const research = idea.research || []

  function submit(e) {
    e.preventDefault()
    if (!draft.trim()) return
    addResearchNote(idea.id, draft.trim())
    setDraft('')
  }

  return (
    <div className="desk-tool">
      <p className="desk-tool-intro">
        Links, inspiration, things you found out, questions you still need answered.
      </p>

      <div className="desk-tool-section">
        {research.length > 0 ? (
          <ul className="desk-tool-list">
            {research.map((entry, i) => (
              <li key={i} className="desk-tool-item">
                {entry.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="desk-tool-empty">Nothing here yet.</p>
        )}
        <form className="desk-tool-form" onSubmit={submit}>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a link, note, or open question…"
          />
          <button type="submit" disabled={!draft.trim()}>
            Add
          </button>
        </form>
      </div>
    </div>
  )
}
