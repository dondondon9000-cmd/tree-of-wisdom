import { useGardenStore } from '../lib/store'
import './IdeaWorkspace.css'

// Opened by tapping a bonsai in the Garden. Just a detail view for now
// — what got said, the title, the summary. This is the entry point
// for "work on this idea," not the mechanic itself; there's no
// task/progress tracking yet, and nothing here currently makes the
// bonsai grow bigger.
export default function IdeaWorkspace() {
  const workspaceIdea = useGardenStore((s) => s.workspaceIdea)
  const closeWorkspace = useGardenStore((s) => s.closeWorkspace)

  if (!workspaceIdea) return null

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

        <p className="workspace-coming-soon">
          This is where you'll be able to work on this idea. Not built yet — for now, this is just
          where it lives.
        </p>
      </div>
    </div>
  )
}
