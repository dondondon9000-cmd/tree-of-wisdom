import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { petalGeometry } from './petalGeometry'

// Cherry-blossom-like petals drifting on a steady cross-wind, with a
// gentle fall, sway, and roll — the "wind blowing things around" that
// sells an outdoor garden instead of a static void. One instanced draw
// call for all of them, no textures.
//
// Billboarded to face the camera, with a per-petal wobble layered on
// top of a plain camera-facing copy so they don't all present the
// exact same face at once (which reads as a synchronized flock rather
// than independent petals) — a fully random 3-axis tumble spends most
// of its time edge-on to the camera though, which reads as colorless
// grey slivers instead of petals, so the wobble is kept modest.
//
// Bounds are large relative to the seed/grass field on purpose — the
// camera can orbit and zoom out much further than the old, much
// smaller box covered, and petals confined to a small box near the
// origin read as "stuck" rather than actually filling the environment.
// Z drifts and wraps the same way X does, instead of staying fixed —
// otherwise every petal sits at one unmoving depth forever.
//
// Unlit material (not meshStandardMaterial): petals drift up to 30
// units from the origin, well past the point lights' falloff distance
// (24-26), so real-time lighting left most of them rendering as
// near-black flecks instead of their baked pink/rose gradient — the
// same lesson learned fixing the sun and clouds earlier. Since only
// the handful still inside the lit zone near the seeds ever showed
// real color, the rest were invisible against the sky, making it look
// like everything was clustered in that one spot.
const COUNT = 90
const BOUNDS_X = 30
const BOUNDS_Z = 30
const FLOOR_Y = -6
const RESET_Y = 18

const TINT_PALETTE = ['#ffc7dc', '#ff9dbf', '#ffe1ec', '#f7b8d8', '#ffd0e6', '#e89bc4']

export default function WindPetals() {
  const mesh = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const wobbleQuat = useMemo(() => new THREE.Quaternion(), [])
  const petals = useMemo(
    () =>
      Array.from({ length: COUNT }).map(() => ({
        x: (Math.random() - 0.5) * BOUNDS_X * 2,
        y: FLOOR_Y + Math.random() * (RESET_Y - FLOOR_Y),
        z: (Math.random() - 0.5) * BOUNDS_Z * 2,
        speedX: 0.35 + Math.random() * 0.45,
        speedZ: (Math.random() - 0.5) * 0.35,
        fall: 0.12 + Math.random() * 0.14,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.5 + Math.random() * 0.4,
        roll: Math.random() * Math.PI * 2,
        rollSpeed: (Math.random() - 0.5) * 2,
        scale: 0.16 + Math.random() * 0.1,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.3 + Math.random() * 0.5,
        wobbleAxis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
      })),
    []
  )

  useEffect(() => {
    const color = new THREE.Color()
    for (let i = 0; i < COUNT; i++) {
      color.set(TINT_PALETTE[i % TINT_PALETTE.length])
      mesh.current.setColorAt(i, color)
    }
    mesh.current.instanceColor.needsUpdate = true
  }, [])

  useFrame(({ clock, camera }, delta) => {
    const t = clock.getElapsedTime()
    petals.forEach((p, i) => {
      p.x += p.speedX * delta
      p.z += p.speedZ * delta
      p.y -= p.fall * delta
      p.roll += p.rollSpeed * delta

      if (p.x > BOUNDS_X) p.x = -BOUNDS_X
      if (p.x < -BOUNDS_X) p.x = BOUNDS_X
      if (p.z > BOUNDS_Z) p.z = -BOUNDS_Z
      if (p.z < -BOUNDS_Z) p.z = BOUNDS_Z
      if (p.y < FLOOR_Y) p.y = RESET_Y

      const sway = Math.sin(t * p.swaySpeed + p.swayPhase) * 0.5
      const wobble = Math.sin(t * p.wobbleSpeed + p.wobblePhase) * 0.5

      dummy.position.set(p.x + sway * 0.3, p.y, p.z)
      dummy.quaternion.copy(camera.quaternion)
      wobbleQuat.setFromAxisAngle(p.wobbleAxis, wobble)
      dummy.quaternion.multiply(wobbleQuat)
      dummy.rotateZ(p.roll)
      dummy.scale.set(p.scale * 0.75, p.scale * 1.25, p.scale)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[petalGeometry, null, COUNT]}>
      <meshBasicMaterial
        vertexColors
        side={THREE.DoubleSide}
        transparent
        opacity={0.92}
        fog={false}
        toneMapped={false}
      />
    </instancedMesh>
  )
}
