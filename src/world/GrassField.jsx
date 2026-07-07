import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { grassPatchTypes } from './grassPatchGeometry'
import { GROUND_CENTER } from './groundLevel'

// A field of swaying grass patches on the garden ground. Each instance
// is a whole pre-merged clump of blades, not a single blade — far
// fewer per-frame updates for denser coverage. Only three clump
// geometries exist (grassPatchTypes); this scatters many instances of
// each across the field, so the scene only ever tracks three shapes
// no matter how much ground is covered. Each clump sways as one patch,
// with a spatial phase offset so the sway ripples across the lawn
// like a real gust, rather than every blade moving independently.
const COUNT_PER_TYPE = 110
const FIELD_RADIUS = 18

function PatchGroup({ geometry, count, seedOffset }) {
  const mesh = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const patches = useMemo(
    () =>
      Array.from({ length: count }).map(() => {
        const r = Math.sqrt(Math.random()) * FIELD_RADIUS
        const angle = Math.random() * Math.PI * 2
        return {
          x: GROUND_CENTER[0] + Math.cos(angle) * r,
          z: GROUND_CENTER[2] + Math.sin(angle) * r,
          yaw: Math.random() * Math.PI * 2,
          scale: 1.3 + Math.random() * 1.4,
          phase: Math.random() * Math.PI * 2,
          restLean: (Math.random() - 0.5) * 0.12,
        }
      }),
    [count]
  )

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + seedOffset
    patches.forEach((p, i) => {
      const ripple = Math.sin(t * 1.1 + p.x * 0.35 + p.z * 0.25 + p.phase)
      const sway = p.restLean + ripple * 0.18

      dummy.position.set(p.x, GROUND_CENTER[1], p.z)
      dummy.rotation.set(0, p.yaw, sway)
      dummy.scale.setScalar(p.scale)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[geometry, null, count]}>
      <meshStandardMaterial vertexColors roughness={0.9} side={THREE.DoubleSide} />
    </instancedMesh>
  )
}

export default function GrassField() {
  return (
    <>
      {grassPatchTypes.map((geometry, i) => (
        <PatchGroup key={i} geometry={geometry} count={COUNT_PER_TYPE} seedOffset={i * 12.4} />
      ))}
    </>
  )
}
