import World from './world/World'
import { useGardenStore } from './lib/store'
import './App.css'

export default function App() {
  const isRecording = useGardenStore((s) => s.isRecording)

  return (
    <div className="app-root">
      <World />
      <div className={`listening-veil ${isRecording ? 'active' : ''}`} />
      <div className="hint-text">{isRecording ? 'listening…' : 'touch the seed to grow an idea'}</div>
    </div>
  )
}
