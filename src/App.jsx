import { useEffect } from 'react'
import World from './world/World'
import { useGardenStore } from './lib/store'
import TranscriptBubble from './components/TranscriptBubble'
import SearchPanel from './components/SearchPanel'
import './App.css'

export default function App() {
  const isRecording = useGardenStore((s) => s.isRecording)
  const draft = useGardenStore((s) => s.draft)

  useEffect(() => {
    useGardenStore.getState().loadIdeas()
  }, [])

  return (
    <div className="app-root">
      <World />
      <div className={`listening-veil ${isRecording ? 'active' : ''}`} />
      {!draft && (
        <div className="hint-text">{isRecording ? 'listening…' : 'touch the seed to grow an idea'}</div>
      )}
      <TranscriptBubble />
      <SearchPanel />
    </div>
  )
}
