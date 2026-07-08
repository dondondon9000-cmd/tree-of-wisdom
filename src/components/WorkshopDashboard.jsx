import { useEffect, useState } from 'react'
import { useGardenStore } from '../lib/store'
import { beginNoteCapture, endNoteCapture, isNoteCapturing } from '../lib/noteCapture'
import './WorkshopDashboard.css'

// The 2D overlay that appears on the desk once Room.jsx's camera
// finishes "sitting down" (visible prop, driven by Room's onSettled
// callback) — this is where the actual work happens: the brief as
// reference, a living task list, an ongoing journal (voice or typed,
// same mechanic as the old pre-bloom brainstorm notes), and a
// recurring AI check-in that reads all of it and suggests what's next.
export default function WorkshopDashboard({ idea, visible }) {
  const exitWorkshop = useGardenStore((s) => s.exitWorkshop)
  const addTask = useGardenStore((s) => s.addTask)
  const toggleTask = useGardenStore((s) => s.toggleTask)
  const addNote = useGardenStore((s) => s.addNote)
  const generateBrief = useGardenStore((s) => s.generateBrief)
  const generatingBrief = useGardenStore((s) => s.generatingBrief)
  const briefError = useGardenStore((s) => s.briefError)
  const checkIn = useGardenStore((s) => s.checkIn)
  const generatingCheckin = useGardenStore((s) => s.generatingCheckin)
  const checkinError = useGardenStore((s) => s.checkinError)
  const lastCheckin = useGardenStore((s) => s.lastCheckin)

  const [taskDraft, setTaskDraft] = useState('')
  const [noteDraft, setNoteDraft] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [interimNote, setInterimNote] = useState('')
  const [noteMicError, setNoteMicError] = useState(null)

  // Switching rooms (or leaving) while a voice note is mid-capture
  // would otherwise leave it silently listening into nothing.
  useEffect(() => {
    return () => {
      if (isNoteCapturing()) endNoteCapture(() => {})
    }
  }, [idea?.id])

  if (!idea) return null

  const tasks = idea.tasks || []
  const notes = idea.notes || []

  function finishNoteCapture(transcript) {
    setIsListening(false)
    setInterimNote('')
    if (transcript?.trim()) addNote(idea.id, transcript.trim())
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

  function submitTask(e) {
    e.preventDefault()
    if (!taskDraft.trim()) return
    addTask(idea.id, taskDraft.trim())
    setTaskDraft('')
  }

  function submitNote(e) {
    e.preventDefault()
    if (!noteDraft.trim()) return
    addNote(idea.id, noteDraft.trim())
    setNoteDraft('')
  }

  return (
    <div className={`workshop-dashboard ${visible ? 'visible' : ''}`}>
      <button className="workshop-leave" onClick={exitWorkshop}>
        ← leave the room
      </button>

      <div className="workshop-dashboard-inner">
        <h2 className="workshop-dashboard-title">{idea.title}</h2>
        <p className="workshop-hint">
          Your desk. The brief is the blueprint, the task list is the real work, and the journal is where
          you log progress — speak or type as you go. Check in with the AI any time for an honest read on
          where things stand.
        </p>

        <section className="workshop-section">
          <p className="workshop-section-label">Brief</p>
          {idea.brief ? (
            <div className="workshop-brief">
              {idea.brief
                .split('\n\n')
                .filter((p) => p.trim())
                .map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
            </div>
          ) : (
            <p className="workshop-empty">No brief generated yet.</p>
          )}
          <button
            type="button"
            className="workshop-generate-brief"
            onClick={() => generateBrief(idea)}
            disabled={generatingBrief}
          >
            {generatingBrief ? 'Reviewing everything…' : idea.brief ? 'Regenerate the brief' : 'Generate a brief'}
          </button>
          {briefError && <p className="workshop-error">{briefError}</p>}
        </section>

        <section className="workshop-section">
          <p className="workshop-section-label">Task list</p>
          {tasks.length > 0 ? (
            <ul className="workshop-task-list">
              {tasks.map((task, i) => (
                <li key={i} className={`workshop-task ${task.done ? 'done' : ''}`}>
                  <label>
                    <input type="checkbox" checked={task.done} onChange={() => toggleTask(idea.id, i)} />
                    <span>{task.text}</span>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="workshop-empty">No tasks yet — add one below, or check in with the AI for ideas.</p>
          )}
          <form className="workshop-task-form" onSubmit={submitTask}>
            <input
              type="text"
              value={taskDraft}
              onChange={(e) => setTaskDraft(e.target.value)}
              placeholder="Add a task…"
            />
            <button type="submit" disabled={!taskDraft.trim()}>
              Add
            </button>
          </form>
        </section>

        <section className="workshop-section">
          <p className="workshop-section-label">Journal</p>
          {notes.length > 0 && (
            <ul className="workshop-notes-list">
              {notes.map((note, i) => (
                <li key={i} className="workshop-note">
                  {note.text}
                </li>
              ))}
            </ul>
          )}
          <form className="workshop-note-form" onSubmit={submitNote}>
            <input
              type="text"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Log a progress note…"
            />
            <button type="submit" disabled={!noteDraft.trim()}>
              Add
            </button>
          </form>
          <button
            type="button"
            className={`workshop-mic-button ${isListening ? 'active' : ''}`}
            onClick={isListening ? stopVoiceNote : startVoiceNote}
          >
            {isListening ? '● listening…' : '🎤 speak a note'}
          </button>
          {isListening && interimNote && <p className="workshop-note-interim">"{interimNote}"</p>}
          {noteMicError && <p className="workshop-error">{noteMicError}</p>}
        </section>

        <section className="workshop-section">
          <button
            type="button"
            className="workshop-checkin-button"
            onClick={() => checkIn(idea)}
            disabled={generatingCheckin}
          >
            {generatingCheckin ? 'Checking in…' : 'Check in with the AI'}
          </button>
          {checkinError && <p className="workshop-error">{checkinError}</p>}
          {lastCheckin && (
            <div className="workshop-checkin">
              <p className="workshop-checkin-message">{lastCheckin.message}</p>
              {lastCheckin.suggestedTasks?.length > 0 && (
                <ul className="workshop-suggested-list">
                  {lastCheckin.suggestedTasks.map((text, i) => (
                    <li key={i} className="workshop-suggested-task">
                      <span>{text}</span>
                      <button type="button" onClick={() => addTask(idea.id, text)}>
                        + add
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
