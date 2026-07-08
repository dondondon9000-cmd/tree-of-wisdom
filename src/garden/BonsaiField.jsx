import { useMemo } from 'react'
import { useGardenStore } from '../lib/store'
import BonsaiTree from './BonsaiTree'

// Planted ideas arranged in a ring around the center, evenly spaced —
// simplest layout that scales reasonably as more get planted, and
// keeps every bonsai visible and walkable-around rather than stacked
// in a grid. Exported so the stone path (GardenPath.jsx) can line up
// with exactly where the bonsai actually sit.
export const BONSAI_RING_RADIUS = 5.5

export default function BonsaiField() {
  const plantedIdeas = useGardenStore((s) => s.plantedIdeas)
  const justPlantedId = useGardenStore((s) => s.justPlantedId)
  const justBloomedId = useGardenStore((s) => s.justBloomedId)
  const openWorkspace = useGardenStore((s) => s.openWorkspace)
  const enterWorkshop = useGardenStore((s) => s.enterWorkshop)

  const positions = useMemo(
    () =>
      plantedIdeas.map((_, i) => {
        const angle = (i / plantedIdeas.length) * Math.PI * 2
        return [Math.cos(angle) * BONSAI_RING_RADIUS, 0, Math.sin(angle) * BONSAI_RING_RADIUS]
      }),
    [plantedIdeas.length]
  )

  return (
    <>
      {plantedIdeas.map((idea, i) => (
        <BonsaiTree
          key={idea.id}
          position={positions[i]}
          idea={idea}
          justPlanted={idea.id === justPlantedId}
          justBloomed={idea.id === justBloomedId}
          onSelect={() => openWorkspace(idea)}
          onEnterWorkshop={() => enterWorkshop(idea)}
        />
      ))}
    </>
  )
}
