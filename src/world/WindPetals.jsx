import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { petalGeometry } from './petalGeometry'

// Cherry-blossom-like petals drifting on a steady cross-wind, with a
// gentle fall, sway, and roll — the "wind blowing things around" that
// sells an outdoor garden instead of a static void. One instanced draw
// call for all of them, no textures.
//
// Billboarded to face the camera (only rolling, not tumbling on every
// axis) — a fully random 3-axis tumble spends most of its time edge-on
// to the camera, which reads as colorless grey slivers instead of
// petals.
const COUNT = 46
const BOUNDS_X = 14
const RESET_Y = 9
const FLOOR_Y = -6

const TINT_PALETTE = ['#ffc7dc', '#ff9dbf', '#ffe1ec', '#f7b8d8', '#ffd0e6', '#e89bc4']

export default function WindPetals() {
  const mesh = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const petals = useMemo(
    () =>
      Array.from({ length: COUNT }).map(() => ({
        x: (Math.random() - 0.5) * BOUNDS_X * 2,
        y: Math.random() * 15 - 6,
        z: (Math.random() - 0.5) * 20 - 3,
        speed: 0.35 + Math.random() * 0.45,
        fall: 0.12 + Math.random() * 0.14,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.5 + Math.random() * 0.4,
        roll: Math.random() * Math.PI * 2,
        rollSpeed: (Math.random() - 0.5) * 2,
        scale: 0.16 + Math.random() * 0.1,
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
      p.x += p.speed * delta
      p.y -= p.fall * delta
      p.roll += p.rollSpeed * delta

      if (p.x > BOUNDS_X) p.x = -BOUNDS_X
      if (p.y < FLOOR_Y) p.y = RESET_Y

      const sway = Math.sin(t * p.swaySpeed + p.swayPhase) * 0.5

      dummy.position.set(p.x + sway * 0.3, p.y, p.z)
      dummy.quaternion.copy(camera.quaternion)
      dummy.rotateZ(p.roll)
      dummy.scale.set(p.scale * 0.75, p.scale * 1.25, p.scale)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[petalGeometry, null, COUNT]}>
      <meshStandardMaterial
        vertexColors
        emissive="#ff9dbf"
        emissiveIntensity={0.12}
        side={THREE.DoubleSide}
        roughness={0.55}
        transparent
        opacity={0.92}
      />
    </instancedMesh>
  )
}
