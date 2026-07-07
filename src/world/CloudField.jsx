import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { buildCloudGeometry } from './cloudGeometry'

// Cloud clusters scattered all through the sky. Each is a real bumpy
// 3D shape (buildCloudGeometry) with a baked top-lit gradient and a
// black outline, matching the seeds' illustrated style — not a soft
// glow sprite, which has no real form or edge and just reads as a
// fuzzy blob.
//
// Positioned with proper spherical coordinates (radius, elevation,
// bearing) so every cloud's true distance from the origin is exactly
// `radius`, capped well under the sky dome's radius (see GardenSky.jsx,
// bumped to 160 to give room to push clouds further out) — a previous
// version's math could push clouds past the dome and hide them
// completely behind it. Drift rotates the bearing angle rather than
// translating position directly, so that distance-from-origin
// guarantee holds forever regardless of session length.
//
// Placement rejects candidates that land too close (angularly) to an
// already-placed cloud, so they read as scattered across the sky
// instead of clumping into an overlapping jumble.
const CLOUD_COUNT = 15
const RADIUS_MIN = 95
const RADIUS_MAX = 140
const MIN_ANGULAR_SEP = 0.34
const MAX_PLACEMENT_TRIES = 40

function angularSeparation(a, b) {
  const dot =
    Math.cos(a.elevation) * Math.cos(a.bearing) * Math.cos(b.elevation) * Math.cos(b.bearing) +
    Math.sin(a.elevation) * Math.sin(b.elevation) +
    Math.cos(a.elevation) * Math.sin(a.bearing) * Math.cos(b.elevation) * Math.sin(b.bearing)
  return Math.acos(Math.min(1, Math.max(-1, dot)))
}

export default function CloudField() {
  const groupRefs = useRef([])
  const clouds = useMemo(() => {
    const placed = []
    for (let i = 0; i < CLOUD_COUNT; i++) {
      let candidate
      for (let attempt = 0; attempt < MAX_PLACEMENT_TRIES; attempt++) {
        candidate = {
          bearing: Math.random() * Math.PI * 2,
          elevation: 0.06 + Math.random() * 1.05,
        }
        if (placed.every((p) => angularSeparation(candidate, p) > MIN_ANGULAR_SEP)) break
      }

      const radius = RADIUS_MIN + Math.random() * (RADIUS_MAX - RADIUS_MIN)
      placed.push({
        bearing: candidate.bearing,
        elevation: candidate.elevation,
        horizontal: radius * Math.cos(candidate.elevation),
        y: radius * Math.sin(candidate.elevation),
        scale: 1.8 + Math.random() * 1.6,
        yaw: Math.random() * Math.PI * 2,
        driftSpeed: 0.0015 + Math.random() * 0.0035,
        ...buildCloudGeometry(),
      })
    }
    return placed
  }, [])

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
          </mesh>
          <mesh geometry={c.outline}>
            <meshBasicMaterial color="#120a05" side={THREE.BackSide} fog={false} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </>
  )
}
