import { useEffect, useRef, useState } from 'react'
import { useGardenStore } from '../lib/store'
import NotebookTool from './deskTools/NotebookTool'
import ResearchTool from './deskTools/ResearchTool'
import BoardTool from './deskTools/BoardTool'
import LedgerTool from './deskTools/LedgerTool'
import DecisionsTool from './deskTools/DecisionsTool'
import LogbookTool from './deskTools/LogbookTool'
import OutTrayTool from './deskTools/OutTrayTool'
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

const TOOLS = [
  { id: 'notebook', label: '📓 Notebook' },
  { id: 'research', label: '📁 Research' },
  { id: 'board', label: '📌 Board' },
  { id: 'ledger', label: '💰 Ledger' },
  { id: 'decisions', label: '⚖️ Decisions' },
  { id: 'logbook', label: '📖 Logbook' },
  { id: 'outtray', label: '📤 Out Tray' },
]

// The 2D overlay that appears on the desk once Room.jsx's camera
// finishes "sitting down" (visible prop, driven by Room's onSettled
// callback). Rather than one long scrolling form, the desk is a set
// of distinct tools (see TOOLS above and src/components/deskTools/) —
// pick one, work in it, set it down and pick up another, the way a
// real desk works.
//
// Focus mode lives here rather than inside BoardTool, since focusing
// on a task narrows the *whole desk* down to just that task — not
// just the Board — the same way it did before this tab split existed.
export default function WorkshopDashboard({ idea, visible }) {
  const exitWorkshop = useGardenStore((s) => s.exitWorkshop)
  const addNote = useGardenStore((s) => s.addNote)
  const toggleMilestoneTask = useGardenStore((s) => s.toggleMilestoneTask)

  const [activeTool, setActiveTool] = useState('board')

  const [focusRef, setFocusRef] = useState(null) // { milestoneIndex, taskIndex } | null
  const [focusSeconds, setFocusSeconds] = useState(0)
  const [sessionNotes, setSessionNotes] = useState('')

  const milestones = idea?.milestones || []

  // Ticks the focus timer once a second while a session is active.
  useEffect(() => {
    if (!focusRef) return
    const id = setInterval(() => setFocusSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [focusRef])

  // Mirrors the latest focus state into a ref so the unmount cleanup
  // below (leaving the room mid-session) can log the real elapsed time
  // without needing focusRef/focusSeconds/etc in its dependency array
  // — that would tear down and rebuild the "did we unmount" effect on
  // every tick, which isn't what an unmount-only effect should do.
  const focusStateRef = useRef({})
  useEffect(() => {
    focusStateRef.current = { focusRef, focusSeconds, sessionNotes, milestones, ideaId: idea?.id }
  })

  useEffect(() => {
    return () => {
      const { focusRef, focusSeconds, sessionNotes, milestones, ideaId } = focusStateRef.current
      if (!focusRef || !ideaId || focusSeconds < MIN_LOGGED_SESSION_SECONDS) return
      const task = milestones?.[focusRef.milestoneIndex]?.tasks?.[focusRef.taskIndex]
      if (!task) return
      const noteText = (sessionNotes || '').trim()
      const text = `Worked on "${task.text}" for ${formatDurationWords(focusSeconds)}.${noteText ? ' ' + noteText : ''}`
      useGardenStore.getState().addNote(ideaId, text)
    }
  }, [])

  if (!idea) return null

  function startFocus(milestoneIndex, taskIndex) {
    setFocusRef({ milestoneIndex, taskIndex })
    setFocusSeconds(0)
    setSessionNotes('')
  }

  function endFocus() {
    const task = milestones[focusRef.milestoneIndex]?.tasks?.[focusRef.taskIndex]
    if (task && focusSeconds >= MIN_LOGGED_SESSION_SECONDS) {
      const noteText = sessionNotes.trim()
      const text = `Worked on "${task.text}" for ${formatDurationWords(focusSeconds)}.${noteText ? ' ' + noteText : ''}`
      addNote(idea.id, text)
    }
    setFocusRef(null)
    setFocusSeconds(0)
    setSessionNotes('')
  }

  const focusedTask = focusRef ? milestones[focusRef.milestoneIndex]?.tasks?.[focusRef.taskIndex] : null

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
                onChange={() => toggleMilestoneTask(idea.id, focusRef.milestoneIndex, focusRef.taskIndex)}
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
            <div className="workshop-tool-tabs">
              {TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  className={`workshop-tool-tab ${activeTool === tool.id ? 'active' : ''}`}
                  onClick={() => setActiveTool(tool.id)}
                >
                  {tool.label}
                </button>
              ))}
            </div>

            <div className="workshop-tool-content">
              {activeTool === 'notebook' && <NotebookTool idea={idea} />}
              {activeTool === 'research' && <ResearchTool idea={idea} />}
              {activeTool === 'board' && <BoardTool idea={idea} onFocusTask={startFocus} />}
              {activeTool === 'ledger' && <LedgerTool idea={idea} />}
              {activeTool === 'decisions' && <DecisionsTool idea={idea} />}
              {activeTool === 'logbook' && <LogbookTool idea={idea} />}
              {activeTool === 'outtray' && <OutTrayTool idea={idea} />}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
