import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { grassGeometry } from './grassGeometry'

// A field of individually-swaying grass blades on the garden ground.
// Each blade leans in the same cross-wind direction as the petals, but
// with a spatial phase offset so the sway ripples across the lawn like
// a real gust passing through, rather than every blade moving in lockstep.
const COUNT = 900
const GROUND_CENTER = [0, -4.5, -6]
const FIELD_RADIUS = 15

export default function GrassField() {
  const mesh = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const blades = useMemo(
    () =>
      Array.from({ length: COUNT }).map(() => {
        const r = Math.sqrt(Math.random()) * FIELD_RADIUS
        const angle = Math.random() * Math.PI * 2
        return {
          x: GROUND_CENTER[0] + Math.cos(angle) * r,
          z: GROUND_CENTER[2] + Math.sin(angle) * r,
          yaw: Math.random() * Math.PI * 2,
          height: 0.7 + Math.random() * 0.8,
          width: 0.8 + Math.random() * 0.5,
          phase: Math.random() * Math.PI * 2,
          restLean: (Math.random() - 0.5) * 0.15,
        }
      }),
    []
  )

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    blades.forEach((b, i) => {
      const ripple = Math.sin(t * 1.1 + b.x * 0.35 + b.z * 0.25 + b.phase)
      const sway = b.restLean + ripple * 0.22

      dummy.position.set(b.x, GROUND_CENTER[1], b.z)
      dummy.rotation.set(0, b.yaw, sway)
      dummy.scale.set(b.width, b.height, 1)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[grassGeometry, null, COUNT]}>
      <meshStandardMaterial vertexColors roughness={0.9} side={THREE.DoubleSide} />
    </instancedMesh>
  )
}
