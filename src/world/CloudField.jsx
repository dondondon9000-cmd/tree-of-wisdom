import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { buildCloudGeometry } from './cloudGeometry'
import SeedOutline from './SeedOutline'

// Cloud clusters scattered all through the sky. Each is a real bumpy
// 3D shape (buildCloudGeometry) with a baked top-lit gradient and a
// black outline, matching the seeds' illustrated style — not a soft
// glow sprite, which has no real form or edge and just reads as a
// fuzzy blob.
//
// Positioned with proper spherical coordinates (radius, elevation,
// bearing) so every cloud's true distance from the origin is exactly
// `radius`, capped well under the sky dome's radius — a previous
// version's math could push clouds past the dome and hide them
// completely behind it. Drift rotates the bearing angle rather than
// translating position directly, so that distance-from-origin
// guarantee holds forever regardless of session length.
const CLOUD_COUNT = 22
const RADIUS_MIN = 45
const RADIUS_MAX = 75

export default function CloudField() {
  const groupRefs = useRef([])
  const clouds = useMemo(
    () =>
      Array.from({ length: CLOUD_COUNT }).map(() => {
        const bearing = Math.random() * Math.PI * 2
        const elevation = 0.06 + Math.random() * 1.05
        const radius = RADIUS_MIN + Math.random() * (RADIUS_MAX - RADIUS_MIN)
        const horizontal = radius * Math.cos(elevation)
        const y = radius * Math.sin(elevation)

        return {
          bearing,
          horizontal,
          y,
          scale: 1.3 + Math.random() * 1.5,
          yaw: Math.random() * Math.PI * 2,
          driftSpeed: 0.0015 + Math.random() * 0.0035,
          geometry: buildCloudGeometry(),
        }
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
        <group key={i} ref={(el) => (groupRefs.current[i] = el)} rotation={[0, c.yaw, 0]} scale={c.scale}>
          <mesh geometry={c.geometry}>
            <meshBasicMaterial vertexColors fog={false} toneMapped={false} />
            <SeedOutline geometry={c.geometry} scale={1.04} />
          </mesh>
        </group>
      ))}
    </>
  )
}
