import { useEffect, useState } from 'react'
import { useGardenStore } from '../../lib/store'
import '../DeskTools.css'

// The idea's foundation — what "done" actually means, before diving
// into the rest of the desk. Just three plain fields, saved together
// rather than per-keystroke, so this doesn't hammer Supabase on every
// character typed.
export default function NotebookTool({ idea }) {
  const updateNotebook = useGardenStore((s) => s.updateNotebook)

  const [goal, setGoal] = useState(idea.notebook?.goal || '')
  const [constraints, setConstraints] = useState(idea.notebook?.constraints || '')
  const [success, setSuccess] = useState(idea.notebook?.success || '')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setGoal(idea.notebook?.goal || '')
    setConstraints(idea.notebook?.constraints || '')
    setSuccess(idea.notebook?.success || '')
  }, [idea.id])

  function handleSave() {
    updateNotebook(idea.id, { goal, constraints, success })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="desk-tool">
      <p className="desk-tool-intro">What "done" actually means, before you dive into the rest of it.</p>

      <div className="desk-tool-section">
        <p className="desk-tool-label">Goal</p>
        <textarea
          className="desk-tool-textarea"
          rows={2}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="What does finished actually look like?"
        />
      </div>

      <div className="desk-tool-section">
        <p className="desk-tool-label">Constraints</p>
        <textarea
          className="desk-tool-textarea"
          rows={2}
          value={constraints}
          onChange={(e) => setConstraints(e.target.value)}
          placeholder="Budget, time you actually have, skills you have vs. need…"
        />
      </div>

      <div className="desk-tool-section">
        <p className="desk-tool-label">Success criteria</p>
        <textarea
          className="desk-tool-textarea"
          rows={2}
          value={success}
          onChange={(e) => setSuccess(e.target.value)}
          placeholder="How would you know this actually worked?"
        />
      </div>

      <button type="button" className="desk-tool-primary-button" onClick={handleSave}>
        {saved ? 'Saved ✓' : 'Save'}
      </button>
    </div>
  )
}
