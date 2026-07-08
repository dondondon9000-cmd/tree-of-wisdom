import { useMemo } from 'react'
import { useGardenStore } from '../lib/store'
import BonsaiTree from './BonsaiTree'

// Planted ideas arranged in a ring around the center, evenly spaced —
// simplest layout that scales reasonably as more get planted, and
// keeps every bonsai visible and walkable-around rather than stacked
// in a grid.
const RADIUS = 5.5

export default function BonsaiField() {
  const plantedIdeas = useGardenStore((s) => s.plantedIdeas)
  const justPlantedId = useGardenStore((s) => s.justPlantedId)

  const positions = useMemo(
    () =>
      plantedIdeas.map((_, i) => {
        const angle = (i / plantedIdeas.length) * Math.PI * 2
        return [Math.cos(angle) * RADIUS, 0, Math.sin(angle) * RADIUS]
      }),
    [plantedIdeas.length]
  )

  return (
    <>
      {plantedIdeas.map((idea, i) => (
        <BonsaiTree
          key={idea.id}
          position={positions[i]}
          title={idea.title}
          justPlanted={idea.id === justPlantedId}
        />
      ))}
    </>
  )
}
