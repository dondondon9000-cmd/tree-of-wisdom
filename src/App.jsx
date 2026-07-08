import { useEffect } from 'react'
import World from './world/World'
import Garden from './garden/Garden'
import { useGardenStore } from './lib/store'
import TranscriptBubble from './components/TranscriptBubble'
import SearchPanel from './components/SearchPanel'
import './App.css'

export default function App() {
  const isRecording = useGardenStore((s) => s.isRecording)
  const draft = useGardenStore((s) => s.draft)
  const view = useGardenStore((s) => s.view)
  const setView = useGardenStore((s) => s.setView)
  const plantedIdeas = useGardenStore((s) => s.plantedIdeas)

  useEffect(() => {
    useGardenStore.getState().loadIdeas()
    useGardenStore.getState().loadPlantedIdeas()
  }, [])

  return (
    <div className="app-root">
      {view === 'world' ? <World /> : <Garden />}

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

      {view === 'garden' && plantedIdeas.length === 0 && (
        <div className="hint-text">plant an idea to grow it here</div>
      )}

      <button className="view-toggle" onClick={() => setView(view === 'world' ? 'garden' : 'world')}>
        {view === 'world' ? '🌳 garden' : '← back'}
      </button>
    </div>
  )
}
