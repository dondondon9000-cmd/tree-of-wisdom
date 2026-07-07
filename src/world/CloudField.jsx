import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { glowTexture } from './glowTexture'

// A handful of soft cloud clusters scattered across the upper sky —
// each one a few overlapping soft blobs (reusing the same radial-glow
// sprite as everything else's glow) rather than a single perfect
// circle, so they read as puffy rather than as flat discs. Drift very
// slowly and wrap around, matching "nothing in this world is ever
// fully still" without ever feeling like they're racing across the sky.
const CLOUD_COUNT = 7
const PUFFS_PER_CLOUD = 5
const WRAP_BOUND = 90

export default function CloudField() {
  const groupRefs = useRef([])
  const clouds = useMemo(
    () =>
      Array.from({ length: CLOUD_COUNT }).map(() => {
        const angle = Math.random() * Math.PI * 2
        const heightAngle = 0.18 + Math.random() * 0.32
        const distance = 55 + Math.random() * 20
        const x = Math.cos(angle) * distance
        const z = Math.sin(angle) * distance - 20
        const y = Math.sin(heightAngle) * distance + 14

        const puffs = Array.from({ length: PUFFS_PER_CLOUD }).map(() => ({
          offset: [(Math.random() - 0.5) * 7, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2],
          scale: 11 + Math.random() * 8,
        }))

        return { baseX: x, baseY: y, baseZ: z, driftSpeed: 0.12 + Math.random() * 0.15, puffs }
      }),
    []
  )

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    clouds.forEach((c, i) => {
      const group = groupRefs.current[i]
      if (!group) return
      let x = c.baseX + t * c.driftSpeed
      x = ((((x + WRAP_BOUND) % (WRAP_BOUND * 2)) + WRAP_BOUND * 2) % (WRAP_BOUND * 2)) - WRAP_BOUND
      group.position.set(x, c.baseY, c.baseZ)
    })
  })

  return (
    <>
      {clouds.map((c, i) => (
        <group key={i} ref={(el) => (groupRefs.current[i] = el)} position={[c.baseX, c.baseY, c.baseZ]}>
          {c.puffs.map((p, j) => (
            <sprite key={j} position={p.offset} scale={p.scale}>
              <spriteMaterial
                map={glowTexture}
                color="#fff8ec"
                transparent
                opacity={0.4}
                depthWrite={false}
                fog={false}
                toneMapped={false}
              />
            </sprite>
          ))}
        </group>
      ))}
    </>
  )
}
