import { useGardenStore } from '../lib/store'
import './PlantTransition.css'

// The screen-covering cut between "plant this idea" and arriving in
// the Garden — see plantWithTransition in store.js for the full
// sequence this drives. Rendered unconditionally at the top level (not
// scoped to either scene) since it has to persist across the moment
// the scene underneath actually swaps.
export default function PlantTransition() {
  const planting = useGardenStore((s) => s.planting)

  return (
    <div className={`plant-transition ${planting ? 'active' : ''}`}>
      {planting && <div className="plant-transition-seed" />}
    </div>
  )
}
