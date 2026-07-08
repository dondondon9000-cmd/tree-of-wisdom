import { useEffect } from 'react'
import { useGardenStore } from '../lib/store'
import './IdeaWorkspace.css'

// Opened by tapping a bonsai in the Garden. The first time an idea's
// workspace opens with no plan yet, generatePlan (store.js) asks Haiku
// to sketch a short list of concrete next steps; those render as a
// checklist here. Checking a step off is "working on the idea" — the
// bonsai itself grows a bit with every step completed (see
// BonsaiTree.jsx), so there's no separate progress UI to build.
export default function IdeaWorkspace() {
  const workspaceIdea = useGardenStore((s) => s.workspaceIdea)
  const closeWorkspace = useGardenStore((s) => s.closeWorkspace)
  const generatePlan = useGardenStore((s) => s.generatePlan)
  const togglePlanStep = useGardenStore((s) => s.togglePlanStep)
  const generatingPlan = useGardenStore((s) => s.generatingPlan)
  const planError = useGardenStore((s) => s.planError)

  useEffect(() => {
    if (workspaceIdea && !workspaceIdea.plan) {
      generatePlan(workspaceIdea)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceIdea?.id])

  if (!workspaceIdea) return null

  const steps = workspaceIdea.plan?.steps

  return (
    <div className="workspace-backdrop" onClick={closeWorkspace}>
      <div className="workspace-panel" onClick={(e) => e.stopPropagation()}>
        <button className="workspace-close" onClick={closeWorkspace} aria-label="Close">
          ✕
        </button>

        <div className="workspace-seed" />
        <h3 className="workspace-title">{workspaceIdea.title}</h3>
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
      </div>
    </div>
  )
}
