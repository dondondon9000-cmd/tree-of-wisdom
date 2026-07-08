import { useEffect, useState } from 'react'
import { useGardenStore } from '../lib/store'
import { beginNoteCapture, endNoteCapture, isNoteCapturing } from '../lib/noteCapture'
import './IdeaWorkspace.css'

// Opened by tapping a bonsai in the Garden. Before bloom, this is just
// the step checklist (see generatePlan/togglePlanStep in store.js).
// Once every step is checked off, the idea blooms (see togglePlanStep)
// and this panel grows a second section: a brainstorm-notes dashboard
// (voice or typed) feeding into generateBrief, which asks Haiku to
// review everything said and planned so far and write one real,
// ready-to-execute project brief.
export default function IdeaWorkspace() {
  const workspaceIdea = useGardenStore((s) => s.workspaceIdea)
  const closeWorkspace = useGardenStore((s) => s.closeWorkspace)
  const generatePlan = useGardenStore((s) => s.generatePlan)
  const togglePlanStep = useGardenStore((s) => s.togglePlanStep)
  const generatingPlan = useGardenStore((s) => s.generatingPlan)
  const planError = useGardenStore((s) => s.planError)
  const addNote = useGardenStore((s) => s.addNote)
  const generateBrief = useGardenStore((s) => s.generateBrief)
  const generatingBrief = useGardenStore((s) => s.generatingBrief)
  const briefError = useGardenStore((s) => s.briefError)

  const [noteDraft, setNoteDraft] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [interimNote, setInterimNote] = useState('')
  const [noteMicError, setNoteMicError] = useState(null)

  useEffect(() => {
    if (workspaceIdea && !workspaceIdea.plan) {
      generatePlan(workspaceIdea)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceIdea?.id])

  // Switching ideas (or closing) while a voice note is mid-capture
  // would otherwise leave it silently listening into nothing.
  useEffect(() => {
    return () => {
      if (isNoteCapturing()) endNoteCapture(() => {})
    }
  }, [workspaceIdea?.id])

  if (!workspaceIdea) return null

  const steps = workspaceIdea.plan?.steps
  const notes = workspaceIdea.notes || []

  function finishNoteCapture(transcript) {
    setIsListening(false)
    setInterimNote('')
    if (transcript?.trim()) addNote(workspaceIdea.id, transcript.trim())
  }

  function startVoiceNote() {
    setNoteMicError(null)
    setInterimNote('')
    setIsListening(true)
    beginNoteCapture({
      onInterim: (text) => setInterimNote(text),
      onDone: finishNoteCapture,
      onError: (message) => {
        setIsListening(false)
        setInterimNote('')
        setNoteMicError(message)
      },
    })
  }

  function stopVoiceNote() {
    endNoteCapture(finishNoteCapture)
  }

  function submitTypedNote(e) {
    e.preventDefault()
    if (!noteDraft.trim()) return
    addNote(workspaceIdea.id, noteDraft.trim())
    setNoteDraft('')
  }

  return (
    <div className="workspace-backdrop" onClick={closeWorkspace}>
      <div className="workspace-panel" onClick={(e) => e.stopPropagation()}>
        <button className="workspace-close" onClick={closeWorkspace} aria-label="Close">
          ✕
        </button>

        <div className="workspace-seed" />
        <h3 className="workspace-title">
          {workspaceIdea.bloomed && <span className="workspace-bloom-badge">🌸</span>}
          {workspaceIdea.title}
        </h3>
        <p className="workspace-transcript">"{workspaceIdea.transcript}"</p>
        {workspaceIdea.summary && <p className="workspace-summary">{workspaceIdea.summary}</p>}

        <div className="workspace-plan">
          {steps ? (
            <>
              <p className="workspace-plan-label">Next steps</p>
              <ul className="workspace-plan-list">
                {steps.map((step, i) => (
                  <li key={i} className={`workspace-plan-step ${step.done ? 'done' : ''}`}>
                    <label>
                      <input
                        type="checkbox"
                        checked={step.done}
                        onChange={() => togglePlanStep(workspaceIdea.id, i)}
                      />
                      <span>{step.text}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </>
          ) : generatingPlan ? (
            <p className="workspace-plan-loading">Sketching out a plan for this idea…</p>
          ) : planError ? (
            <p className="workspace-plan-error">{planError}</p>
          ) : null}
        </div>

        {workspaceIdea.bloomed && (
          <div className="workspace-dashboard">
            <p className="workspace-dashboard-label">In full bloom — brainstorm and lock in a real plan</p>

            {notes.length > 0 && (
              <ul className="workspace-notes-list">
                {notes.map((note, i) => (
                  <li key={i} className="workspace-note">
                    {note.text}
                  </li>
                ))}
              </ul>
            )}

            <form className="workspace-note-form" onSubmit={submitTypedNote}>
              <input
                type="text"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Type a brainstorm note…"
              />
              <button type="submit" disabled={!noteDraft.trim()}>
                Add
              </button>
            </form>

            <button
              type="button"
              className={`workspace-mic-button ${isListening ? 'active' : ''}`}
              onClick={isListening ? stopVoiceNote : startVoiceNote}
            >
              {isListening ? '● listening…' : '🎤 speak a note'}
            </button>
            {isListening && interimNote && <p className="workspace-note-interim">"{interimNote}"</p>}
            {noteMicError && <p className="workspace-plan-error">{noteMicError}</p>}

            <button
              type="button"
              className="workspace-generate-brief"
              onClick={() => generateBrief(workspaceIdea)}
              disabled={generatingBrief}
            >
              {generatingBrief
                ? 'Reviewing everything…'
                : workspaceIdea.brief
                  ? 'Regenerate the plan'
                  : 'Generate a well-reviewed plan'}
            </button>
            {briefError && <p className="workspace-plan-error">{briefError}</p>}

            {workspaceIdea.brief && (
              <div className="workspace-brief">
                {workspaceIdea.brief
                  .split('\n\n')
                  .filter((p) => p.trim())
                  .map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
