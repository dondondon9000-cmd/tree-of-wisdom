import { useState } from 'react'
import { useGardenStore } from '../../lib/store'
import '../DeskTools.css'
import './BoardTool.css'

// The actual work breakdown — phases (milestones) of grouped tasks,
// instead of one flat checklist. onFocusTask bubbles up to
// WorkshopDashboard, which owns focus-mode state since focusing
// narrows the whole desk, not just this tool.
export default function BoardTool({ idea, onFocusTask }) {
  const addMilestone = useGardenStore((s) => s.addMilestone)
  const addMilestoneTask = useGardenStore((s) => s.addMilestoneTask)
  const toggleMilestoneTask = useGardenStore((s) => s.toggleMilestoneTask)

  const [milestoneDraft, setMilestoneDraft] = useState('')
  const [taskDrafts, setTaskDrafts] = useState({})

  const milestones = idea.milestones || []

  function submitMilestone(e) {
    e.preventDefault()
    if (!milestoneDraft.trim()) return
    addMilestone(idea.id, milestoneDraft.trim())
    setMilestoneDraft('')
  }

  function submitTask(e, milestoneIndex) {
    e.preventDefault()
    const text = (taskDrafts[milestoneIndex] || '').trim()
    if (!text) return
    addMilestoneTask(idea.id, milestoneIndex, text)
    setTaskDrafts((d) => ({ ...d, [milestoneIndex]: '' }))
  }

  return (
    <div className="desk-tool">
      <p className="desk-tool-intro">
        Break the work into phases, then the concrete tasks under each one. Pick a task to focus on when
        you're ready to actually work it.
      </p>

      {milestones.length === 0 && <p className="desk-tool-empty">No phases yet — start one below.</p>}

      {milestones.map((milestone, mIndex) => (
        <div key={milestone.id} className="board-milestone">
          <p className="board-milestone-title">{milestone.title}</p>

          {milestone.tasks.length > 0 ? (
            <ul className="desk-tool-list">
              {milestone.tasks.map((task, tIndex) => (
                <li key={tIndex} className={`board-task ${task.done ? 'done' : ''}`}>
                  <label>
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleMilestoneTask(idea.id, mIndex, tIndex)}
                    />
                    <span>{task.text}</span>
                  </label>
                  {!task.done && (
                    <button
                      type="button"
                      className="board-task-focus-btn"
                      onClick={() => onFocusTask(mIndex, tIndex)}
                    >
                      ▶ focus
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="desk-tool-empty">No tasks in this phase yet.</p>
          )}

          <form className="desk-tool-form" onSubmit={(e) => submitTask(e, mIndex)}>
            <input
              type="text"
              value={taskDrafts[mIndex] || ''}
              onChange={(e) => setTaskDrafts((d) => ({ ...d, [mIndex]: e.target.value }))}
              placeholder="Add a task to this phase…"
            />
            <button type="submit" disabled={!(taskDrafts[mIndex] || '').trim()}>
              Add
            </button>
          </form>
        </div>
      ))}

      <form className="desk-tool-form board-milestone-form" onSubmit={submitMilestone}>
        <input
          type="text"
          value={milestoneDraft}
          onChange={(e) => setMilestoneDraft(e.target.value)}
          placeholder="Add a new phase (e.g. Research, Build, Launch)…"
        />
        <button type="submit" disabled={!milestoneDraft.trim()}>
          Add phase
        </button>
      </form>
    </div>
  )
}
