import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { grassPatchTypes } from '../world/grassPatchGeometry'
import { BONSAI_RING_RADIUS } from './BonsaiField'

// Same swaying-clump technique as the floating world's grass (see
// world/GrassField.jsx) — reused directly rather than duplicated,
// just scattered around the Garden's own ground (centered at the
// origin, not world/groundLevel's GROUND_CENTER) and thinned out right
// at the stone path ring so blades don't poke up through the stones.
const COUNT_PER_TYPE = 90
const FIELD_RADIUS = 15
const PATH_RING_HALF_WIDTH = 1.1

function PatchGroup({ geometry, count, seedOffset }) {
  const mesh = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const patches = useMemo(() => {
    const list = []
    while (list.length < count) {
      const r = Math.sqrt(Math.random()) * FIELD_RADIUS
      if (Math.abs(r - BONSAI_RING_RADIUS) < PATH_RING_HALF_WIDTH) continue // leave the path clear
      const angle = Math.random() * Math.PI * 2
      list.push({
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        yaw: Math.random() * Math.PI * 2,
        scale: 1.2 + Math.random() * 1.3,
        phase: Math.random() * Math.PI * 2,
        restLean: (Math.random() - 0.5) * 0.12,
      })
    }
    return list
  }, [count])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + seedOffset
    patches.forEach((p, i) => {
      const ripple = Math.sin(t * 1.1 + p.x * 0.35 + p.z * 0.25 + p.phase)
      const sway = p.restLean + ripple * 0.18

      dummy.position.set(p.x, 0, p.z)
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

export default function GardenGrass() {
  return (
    <>
      {grassPatchTypes.map((geometry, i) => (
        <PatchGroup key={i} geometry={geometry} count={COUNT_PER_TYPE} seedOffset={i * 12.4} />
      ))}
    </>
  )
}
