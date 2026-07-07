import { useMemo } from 'react'
import Sprout from './Sprout'
import { GROUND_CENTER } from './groundLevel'

// Scattered spots on the lawn that already look planted and sprouting
// — a preview of what "planting an idea" will eventually look like,
// purely decorative for now. Bigger and further along than the tiny
// nubs on the floating seeds, since these read as ideas that already
// took root.
const COUNT = 26
const RADIUS = 12

export default function GroundSprouts() {
  const sprouts = useMemo(
    () =>
      Array.from({ length: COUNT }).map(() => {
        const r = Math.sqrt(Math.random()) * RADIUS
        const angle = Math.random() * Math.PI * 2
        return {
          position: [
            GROUND_CENTER[0] + Math.cos(angle) * r,
            GROUND_CENTER[1],
            GROUND_CENTER[2] + Math.sin(angle) * r,
          ],
          stage: 0.55 + Math.random() * 0.45,
          scale: 1.6 + Math.random() * 1.3,
          yaw: Math.random() * Math.PI * 2,
        }
      }),
    []
  )

  return (
    <>
      {sprouts.map((s, i) => (
        <group key={i} position={s.position} rotation={[0, s.yaw, 0]} scale={s.scale}>
          <Sprout stage={s.stage} />
        </group>
      ))}
    </>
  )
}
