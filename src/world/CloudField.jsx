import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { glowTexture } from './glowTexture'

// Cloud clusters scattered all through the sky — each one a few
// overlapping soft blobs (reusing the same radial-glow sprite as
// everything else's glow) rather than a single flat circle, so they
// read as puffy. Drift very slowly and wrap around, matching "nothing
// in this world is ever fully still" without feeling like they're
// racing across the sky.
//
// Positioned with proper spherical coordinates (radius, elevation,
// bearing) so every cloud's true distance from the origin is exactly
// `radius`, capped well under the sky dome's radius (90) — a previous
// version computed x/z from the full radius without reducing it by
// the elevation angle, then stacked extra offsets on top, which could
// push clouds past the dome and hide them completely behind it.
//
// Drift is applied by slowly rotating the bearing angle over time
// (not translating x/z directly) so the radius — and therefore the
// "always inside the dome" guarantee — never changes, no matter how
// long a session runs. Translating x/z directly and wrapping at a
// fixed bound would have let the same hidden-behind-the-dome bug
// resurface after enough drift, since y/z would stay fixed while only
// x wrapped, breaking the distance-from-origin guarantee.
const CLOUD_COUNT = 26
const PUFFS_PER_CLOUD = 5
const RADIUS_MIN = 45
const RADIUS_MAX = 75

export default function CloudField() {
  const groupRefs = useRef([])
  const clouds = useMemo(
    () =>
      Array.from({ length: CLOUD_COUNT }).map(() => {
        const bearing = Math.random() * Math.PI * 2
        const elevation = 0.06 + Math.random() * 1.05 // just above the horizon up to nearly overhead
        const radius = RADIUS_MIN + Math.random() * (RADIUS_MAX - RADIUS_MIN)
        const horizontal = radius * Math.cos(elevation)
        const y = radius * Math.sin(elevation)

        const puffs = Array.from({ length: PUFFS_PER_CLOUD }).map(() => ({
          offset: [(Math.random() - 0.5) * 7, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2],
          scale: 11 + Math.random() * 8,
        }))

        return { bearing, horizontal, y, driftSpeed: 0.0015 + Math.random() * 0.0035, puffs }
      }),
    []
  )

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    clouds.forEach((c, i) => {
      const group = groupRefs.current[i]
      if (!group) return
      const angle = c.bearing + t * c.driftSpeed
      group.position.set(c.horizontal * Math.cos(angle), c.y, c.horizontal * Math.sin(angle))
    })
  })

  return (
    <>
      {clouds.map((c, i) => (
        <group key={i} ref={(el) => (groupRefs.current[i] = el)}>
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
