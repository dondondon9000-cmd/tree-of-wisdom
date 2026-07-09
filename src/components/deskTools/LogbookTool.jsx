import { useEffect, useState } from 'react'
import { useGardenStore } from '../../lib/store'
import { beginNoteCapture, endNoteCapture, isNoteCapturing } from '../../lib/noteCapture'
import '../DeskTools.css'
import './LogbookTool.css'

// The record of what actually happened — journal entries (voice or
// typed, same mechanic as before, plus whatever focus sessions
// auto-log) and a recurring AI check-in that reads the brief, the
// Board's tasks, and this journal together and suggests what's next.
// "Add" on a suggestion drops it into the Board's first phase via
// addTaskToFirstMilestone, since this tool has no "current milestone"
// of its own to target.
export default function LogbookTool({ idea }) {
  const addNote = useGardenStore((s) => s.addNote)
  const checkIn = useGardenStore((s) => s.checkIn)
  const generatingCheckin = useGardenStore((s) => s.generatingCheckin)
  const checkinError = useGardenStore((s) => s.checkinError)
  const lastCheckin = useGardenStore((s) => s.lastCheckin)
  const addTaskToFirstMilestone = useGardenStore((s) => s.addTaskToFirstMilestone)

  const [noteDraft, setNoteDraft] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [interimNote, setInterimNote] = useState('')
  const [noteMicError, setNoteMicError] = useState(null)

  const notes = idea.notes || []

  useEffect(() => {
    return () => {
      if (isNoteCapturing()) endNoteCapture(() => {})
    }
  }, [idea?.id])

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

  function submitNote(e) {
    e.preventDefault()
    if (!noteDraft.trim()) return
    addNote(idea.id, noteDraft.trim())
    setNoteDraft('')
  }

  return (
    <div className="desk-tool">
      <p className="desk-tool-intro">
        What happened, logged as you go — by hand, by voice, or automatically from focus sessions.
      </p>

      <div className="desk-tool-section">
        {notes.length > 0 ? (
          <ul className="desk-tool-list logbook-notes">
            {notes.map((note, i) => (
              <li key={i} className="desk-tool-item">
                {note.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="desk-tool-empty">Nothing logged yet.</p>
        )}
        <form className="desk-tool-form" onSubmit={submitNote}>
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
          className={`logbook-mic-button ${isListening ? 'active' : ''}`}
          onClick={isListening ? stopVoiceNote : startVoiceNote}
        >
          {isListening ? '● listening…' : '🎤 speak a note'}
        </button>
        {isListening && interimNote && <p className="logbook-note-interim">"{interimNote}"</p>}
        {noteMicError && <p className="desk-tool-error">{noteMicError}</p>}
      </div>

      <div className="desk-tool-section">
        <button
          type="button"
          className="desk-tool-primary-button"
          onClick={() => checkIn(idea)}
          disabled={generatingCheckin}
        >
          {generatingCheckin ? 'Checking in…' : 'Check in with the AI'}
        </button>
        {checkinError && <p className="desk-tool-error">{checkinError}</p>}
        {lastCheckin && (
          <div className="logbook-checkin">
            <p className="logbook-checkin-message">{lastCheckin.message}</p>
            {lastCheckin.suggestedTasks?.length > 0 && (
              <ul className="logbook-suggested-list">
                {lastCheckin.suggestedTasks.map((text, i) => (
                  <li key={i} className="logbook-suggested-task">
                    <span>{text}</span>
                    <button type="button" onClick={() => addTaskToFirstMilestone(idea.id, text)}>
                      + add to Board
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
