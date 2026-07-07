import * as THREE from 'three'
import { bakeVertexGradient, stopsGradient } from './vertexGradient'

// A soft hand-rolled gradient sky dome (pale dusk lavender at the
// zenith, warm peach at the horizon) instead of a physically-based sky
// sim — cheaper, and gives direct control over the serene/warm mood.
const RADIUS = 160

const skyGeometry = new THREE.SphereGeometry(RADIUS, 24, 16)

const gradientColorAt = stopsGradient([
  { t: 0, color: new THREE.Color('#f4d9bd') },
  { t: 1, color: new THREE.Color('#aebfd8') },
])

bakeVertexGradient(
  skyGeometry,
  (attr, i) => THREE.MathUtils.clamp((attr.getY(i) + RADIUS * 0.35) / (RADIUS * 0.9), 0, 1),
  (t) => gradientColorAt(t)
)

export default function GardenSky() {
  return (
    <mesh geometry={skyGeometry}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} toneMapped={false} />
    </mesh>
  )
}
