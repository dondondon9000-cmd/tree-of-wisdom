import { useEffect, useState } from 'react'
import World from './world/World'
import Garden from './garden/Garden'
import Room from './room/Room'
import { useGardenStore } from './lib/store'
import TranscriptBubble from './components/TranscriptBubble'
import SearchPanel from './components/SearchPanel'
import PlantTransition from './components/PlantTransition'
import WorkshopTransition from './components/WorkshopTransition'
import IdeaWorkspace from './components/IdeaWorkspace'
import WorkshopDashboard from './components/WorkshopDashboard'
import PlanReveal from './components/PlanReveal'
import './App.css'

export default function App() {
  const isRecording = useGardenStore((s) => s.isRecording)
  const draft = useGardenStore((s) => s.draft)
  const view = useGardenStore((s) => s.view)
  const setView = useGardenStore((s) => s.setView)
  const plantedIdeas = useGardenStore((s) => s.plantedIdeas)
  const planting = useGardenStore((s) => s.planting)
  const roomIdea = useGardenStore((s) => s.roomIdea)
  const workshopTransition = useGardenStore((s) => s.workshopTransition)

  // Room's camera plays a short "sit down at the desk" animation
  // before WorkshopDashboard fades in over it — reset each time a
  // different room opens, so re-entering a room replays the beat
  // instead of the dashboard just snapping into view.
  const [dashboardVisible, setDashboardVisible] = useState(false)
  useEffect(() => {
    setDashboardVisible(false)
  }, [roomIdea?.id])

  useEffect(() => {
    useGardenStore.getState().loadIdeas()
    useGardenStore.getState().loadPlantedIdeas()
  }, [])

  return (
    <div className="app-root">
      {view === 'world' && <World />}
      {view === 'garden' && <Garden />}
      {view === 'workshop' && <Room onSettled={() => setDashboardVisible(true)} />}

      {view === 'world' && (
        <>
          <div className={`listening-veil ${isRecording ? 'active' : ''}`} />
          {!draft && (
            <div className="hint-text">{isRecording ? 'listening…' : 'touch the seed to grow an idea'}</div>
          )}
          <TranscriptBubble />
          <SearchPanel />
        </>
      )}

      {view === 'garden' && (
        <>
          {plantedIdeas.length === 0 ? (
            <div className="hint-text">plant an idea to grow it here</div>
          ) : (
            <div className="garden-hint-side">
              complete the next steps to bloom your tree.
              <br />
              once bloomed, a door will appear — walk through it to build your idea further.
            </div>
          )}
          <IdeaWorkspace />
        </>
      )}

      {view === 'workshop' &&
        (roomIdea?.planRevealed ? (
          <WorkshopDashboard idea={roomIdea} visible={dashboardVisible} />
        ) : (
          <PlanReveal idea={roomIdea} visible={dashboardVisible} />
        ))}

      {/* Hidden mid-transition, and mid-workshop-transition — switching
          views manually while a scripted sequence is already swapping
          them would race it. Also hidden in the Workshop itself, which
          has its own "leave the room" door back to the Garden. */}
      {!planting && !workshopTransition && view !== 'workshop' && (
        <button className="view-toggle" onClick={() => setView(view === 'world' ? 'garden' : 'world')}>
          {view === 'world' ? '🌳 garden' : '← back'}
        </button>
      )}

      <PlantTransition />
      <WorkshopTransition />
    </div>
  )
}
