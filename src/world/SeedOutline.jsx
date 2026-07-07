import * as THREE from 'three'

// The black inverted-hull outline shared by every seed-shaped object
// (ambient seeds, the talk seed) — a slightly enlarged, back-face-only
// copy of the same geometry, nested inside the seed mesh so it
// inherits its live breathing scale/rotation automatically.
export default function SeedOutline({ geometry, scale = 1.06 }) {
  return (
    <mesh geometry={geometry} scale={scale}>
      <meshBasicMaterial color="#120a05" side={THREE.BackSide} toneMapped={false} />
    </mesh>
  )
}
