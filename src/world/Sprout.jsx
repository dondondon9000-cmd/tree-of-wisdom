import { useMemo } from 'react'
import * as THREE from 'three'
import { grassGeometry } from './grassGeometry'

// A tiny germinating sprout poking out of a seed's tip — reuses the
// grass blade shape/gradient at a small scale. `stage` (0..1) is each
// seed's random "how far along" value: low stages are a barely-there
// nub, higher stages get a second unfurling leaf, so the floating
// field reads as ideas at different points of quietly taking root.
export default function Sprout({ stage = 0.5 }) {
  const leafScale = 0.3 + stage * 0.7
  const hasSecondLeaf = stage > 0.3

  const tilt1 = useMemo(() => (Math.random() - 0.5) * 0.4, [])
  const roll1 = useMemo(() => (Math.random() - 0.5) * 0.3, [])
  const tilt2 = useMemo(() => (Math.random() - 0.5) * 0.4 + 0.55, [])
  const yaw2 = useMemo(() => Math.PI * 0.55 + (Math.random() - 0.5) * 0.5, [])

  return (
    <group scale={leafScale}>
      <mesh geometry={grassGeometry} scale={[0.5, 0.65, 0.5]} rotation={[tilt1, 0, roll1]}>
        <meshStandardMaterial vertexColors roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      {hasSecondLeaf && (
        <mesh geometry={grassGeometry} scale={[0.42, 0.55, 0.42]} rotation={[tilt2, yaw2, -0.15]}>
          <meshStandardMaterial vertexColors roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}
