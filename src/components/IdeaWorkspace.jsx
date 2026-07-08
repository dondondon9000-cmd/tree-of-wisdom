import { useEffect } from 'react'
import { useGardenStore } from '../lib/store'
import './IdeaWorkspace.css'

// Opened by tapping a bonsai's pedestal/pot in the Garden — a quick
// reference view: the transcript, the summary, and the frozen
// pre-bloom checklist (see generatePlan/togglePlanStep in store.js).
// Once every step is checked off, the idea blooms and a door appears
// beside the bonsai (see BonsaiTree.jsx) — that door, not this popup,
// is where the actual ongoing work happens now (Room.jsx +
// WorkshopDashboard.jsx). This panel just points you at it.
export default function IdeaWorkspace() {
  const workspaceIdea = useGardenStore((s) => s.workspaceIdea)
  const closeWorkspace = useGardenStore((s) => s.closeWorkspace)
  const generatePlan = useGardenStore((s) => s.generatePlan)
  const togglePlanStep = useGardenStore((s) => s.togglePlanStep)
  const generatingPlan = useGardenStore((s) => s.generatingPlan)
  const planError = useGardenStore((s) => s.planError)
  const enterWorkshop = useGardenStore((s) => s.enterWorkshop)

  useEffect(() => {
    if (workspaceIdea && !workspaceIdea.plan) {
      generatePlan(workspaceIdea)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceIdea?.id])

  if (!workspaceIdea) return null

  const steps = workspaceIdea.plan?.steps

  function handleEnterWorkshop() {
    closeWorkspace()
    enterWorkshop(workspaceIdea)
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
                        disabled={workspaceIdea.bloomed}
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
          <div className="workspace-bloom-message">
            <p>In full bloom — a door has appeared beside it to help you build the idea further.</p>
            <button type="button" className="workspace-enter-door" onClick={handleEnterWorkshop}>
              Walk through the door →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
