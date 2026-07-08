import { useEffect, useRef, useState } from 'react'
import { useGardenStore } from '../lib/store'
import { beginNoteCapture, endNoteCapture, isNoteCapturing } from '../lib/noteCapture'
import './WorkshopDashboard.css'

// Below this, a focus session is treated as an accidental tap rather
// than real work, and isn't worth a journal entry.
const MIN_LOGGED_SESSION_SECONDS = 5

function formatTimer(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatDurationWords(totalSeconds) {
  const totalMinutes = Math.round(totalSeconds / 60)
  if (totalMinutes < 1) return 'under a minute'
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  return `${m}m`
}

// The 2D overlay that appears on the desk once Room.jsx's camera
// finishes "sitting down" (visible prop, driven by Room's onSettled
// callback) — this is where the actual work happens: the brief as
// reference, a living task list, an ongoing journal (voice or typed,
// same mechanic as the old pre-bloom brainstorm notes), and a
// recurring AI check-in that reads all of it and suggests what's next.
//
// Picking a task to "focus" on narrows the whole dashboard down to
// just that task plus a timer and a place to jot what you're doing —
// the difference between glancing at a status list and actually
// sitting down to work. Ending a session (explicitly, or just leaving
// the room mid-session) logs it to the journal automatically, so the
// journal ends up being a real record of time spent, not just
// whatever you remembered to type.
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

  const [focusIndex, setFocusIndex] = useState(null)
  const [focusSeconds, setFocusSeconds] = useState(0)
  const [sessionNotes, setSessionNotes] = useState('')

  const tasks = idea?.tasks || []
  const notes = idea?.notes || []

  // Switching rooms (or leaving) while a voice note is mid-capture
  // would otherwise leave it silently listening into nothing.
  useEffect(() => {
    return () => {
      if (isNoteCapturing()) endNoteCapture(() => {})
    }
  }, [idea?.id])

  // Ticks the focus timer once a second while a session is active.
  useEffect(() => {
    if (focusIndex === null) return
    const id = setInterval(() => setFocusSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [focusIndex])

  // Mirrors the latest focus state into a ref so the unmount cleanup
  // below (leaving the room mid-session) can log the real elapsed time
  // without needing focusIndex/focusSeconds/etc in its dependency
  // array — that would tear down and rebuild the "did we unmount"
  // effect on every tick, which isn't what an unmount-only effect
  // should do.
  const focusStateRef = useRef({})
  useEffect(() => {
    focusStateRef.current = { focusIndex, focusSeconds, sessionNotes, tasks, ideaId: idea?.id }
  })

  useEffect(() => {
    return () => {
      const { focusIndex, focusSeconds, sessionNotes, tasks, ideaId } = focusStateRef.current
      if (focusIndex === null || !ideaId || focusSeconds < MIN_LOGGED_SESSION_SECONDS) return
      const task = tasks?.[focusIndex]
      if (!task) return
      const noteText = (sessionNotes || '').trim()
      const text = `Worked on "${task.text}" for ${formatDurationWords(focusSeconds)}.${noteText ? ' ' + noteText : ''}`
      useGardenStore.getState().addNote(ideaId, text)
    }
  }, [])

  if (!idea) return null

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

  function startFocus(i) {
    setFocusIndex(i)
    setFocusSeconds(0)
    setSessionNotes('')
  }

  function endFocus() {
    const task = tasks[focusIndex]
    if (task && focusSeconds >= MIN_LOGGED_SESSION_SECONDS) {
      const noteText = sessionNotes.trim()
      const text = `Worked on "${task.text}" for ${formatDurationWords(focusSeconds)}.${noteText ? ' ' + noteText : ''}`
      addNote(idea.id, text)
    }
    setFocusIndex(null)
    setFocusSeconds(0)
    setSessionNotes('')
  }

  const focusedTask = focusIndex !== null ? tasks[focusIndex] : null

  return (
    <div className={`workshop-dashboard ${visible ? 'visible' : ''}`}>
      <button className="workshop-leave" onClick={exitWorkshop}>
        ← leave the room
      </button>

      <div className="workshop-dashboard-inner">
        <h2 className="workshop-dashboard-title">{idea.title}</h2>

        {focusedTask ? (
          <div className="workshop-focus">
            <p className="workshop-focus-label">Focused on</p>
            <h3 className="workshop-focus-task">{focusedTask.text}</h3>
            <p className="workshop-focus-timer">{formatTimer(focusSeconds)}</p>

            <label className="workshop-focus-done">
              <input
                type="checkbox"
                checked={!!focusedTask.done}
                onChange={() => toggleTask(idea.id, focusIndex)}
              />
              <span>Mark this task done</span>
            </label>

            <textarea
              className="workshop-focus-notes"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Jot what you're doing as you go…"
              rows={4}
            />

            <button type="button" className="workshop-focus-end" onClick={endFocus}>
              I'm done for now
            </button>
          </div>
        ) : (
          <>
            <p className="workshop-hint">
              Your desk. The brief is the blueprint, the task list is the real work — pick one to focus on
              — and the journal is where progress gets logged, automatically from focus sessions or by
              hand. Check in with the AI any time for an honest read on where things stand.
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
                {generatingBrief
                  ? 'Reviewing everything…'
                  : idea.brief
                    ? 'Regenerate the brief'
                    : 'Generate a brief'}
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
                      {!task.done && (
                        <button type="button" className="workshop-task-focus-btn" onClick={() => startFocus(i)}>
                          ▶ focus
                        </button>
                      )}
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
          </>
        )}
      </div>
    </div>
  )
}
