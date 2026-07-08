import { useGardenStore } from '../lib/store'
import './WorkshopTransition.css'

// A plain fade-to-black cut for walking through a bonsai's door into
// its Workshop (and back out again) — no falling-seed animation like
// PlantTransition, just a clean cut, since there's no object to
// animate here the way a seed drops into the Garden. Renders
// unconditionally (same as PlantTransition) so it can react to
// workshopTransition changing without needing to be mounted/unmounted
// itself.
export default function WorkshopTransition() {
  const workshopTransition = useGardenStore((s) => s.workshopTransition)
  return <div className={`workshop-transition ${workshopTransition ? 'active' : ''}`} />
}
