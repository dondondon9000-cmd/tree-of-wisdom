import * as THREE from 'three'
import { bakeVertexGradient, stopsGradient } from '../world/vertexGradient'
import { BONSAI_RING_RADIUS } from './BonsaiField'

// A flat stone walkway ring running right through where the bonsai
// sit, instead of leaving the ground a plain solid color there — a
// slight lift above the grass (0.01) avoids z-fighting with it.
const HALF_WIDTH = 1.1
const geometry = new THREE.RingGeometry(BONSAI_RING_RADIUS - HALF_WIDTH, BONSAI_RING_RADIUS + HALF_WIDTH, 64)

const gradient = stopsGradient([
  { t: 0, color: new THREE.Color('#8f8577') },
  { t: 1, color: new THREE.Color('#c4bcae') },
])

// Ring geometry has no natural "radius" attribute to sample, so this
// bakes the gradient from each vertex's own distance from the center
// instead of height (which is ~0 for every vertex here anyway).
bakeVertexGradient(
  geometry,
  (attr, i) => {
    const x = attr.getX(i)
    const y = attr.getY(i)
    const r = Math.sqrt(x * x + y * y)
    return THREE.MathUtils.clamp((r - (BONSAI_RING_RADIUS - HALF_WIDTH)) / (HALF_WIDTH * 2), 0, 1)
  },
  (t) => gradient(t)
)

export default function GardenPath() {
  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <meshStandardMaterial vertexColors roughness={1} side={THREE.DoubleSide} />
    </mesh>
  )
}
