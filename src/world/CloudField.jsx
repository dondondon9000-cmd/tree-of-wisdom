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
// instead of clumping into an overlapping jumble. The required gap is
// based on each cloud's own on-screen angular size (footprint * scale
// / distance) rather than a flat constant — a fixed gap was nowhere
// near enough for the biggest, closest clouds, which can span a wide
// angle on their own and still "overlap" a neighbor a fixed distance away.
const CLOUD_COUNT = 10
const RADIUS_MIN = 95
const RADIUS_MAX = 140
const MAX_CLOUD_SPAN = 13 // conservative estimate: max puff spread + puff diameter
const SEPARATION_MARGIN = 1.5
const MAX_PLACEMENT_TRIES = 120

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
      let candidate = null
      let bestCandidate = null
      let bestSlack = -Infinity

      for (let attempt = 0; attempt < MAX_PLACEMENT_TRIES; attempt++) {
        const scale = 1.6 + Math.random() * 1.2
        const radius = RADIUS_MIN + Math.random() * (RADIUS_MAX - RADIUS_MIN)
        const angularHalfSpan = (MAX_CLOUD_SPAN * scale) / 2 / radius
        const attemptCandidate = {
          bearing: Math.random() * Math.PI * 2,
          elevation: 0.06 + Math.random() * 1.05,
          scale,
          radius,
          angularHalfSpan,
        }

        // How much clearance this attempt has past the required gap to
        // its closest already-placed neighbor (negative = still overlapping).
        let minSlack = Infinity
        for (const p of placed) {
          const required = (attemptCandidate.angularHalfSpan + p.angularHalfSpan) * SEPARATION_MARGIN
          const slack = angularSeparation(attemptCandidate, p) - required
          if (slack < minSlack) minSlack = slack
        }

        if (minSlack > bestSlack) {
          bestSlack = minSlack
          bestCandidate = attemptCandidate
        }
        if (minSlack > 0) {
          candidate = attemptCandidate
          break
        }
      }

      // Fall back to the least-bad attempt tried rather than blindly
      // using whatever the last random roll happened to be — this is
      // what previously let clouds slip through still overlapping when
      // the sky got crowded.
      candidate = candidate || bestCandidate

      placed.push({
        bearing: candidate.bearing,
        elevation: candidate.elevation,
        angularHalfSpan: candidate.angularHalfSpan,
        horizontal: candidate.radius * Math.cos(candidate.elevation),
        y: candidate.radius * Math.sin(candidate.elevation),
        scale: candidate.scale,
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
