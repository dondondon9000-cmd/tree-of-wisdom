import * as THREE from 'three'
import { bakeVertexGradient, stopsGradient } from './vertexGradient'

// A soft 7-sided disc standing in for a petal shape, with a baked
// radial vertex-color gradient — deeper rose near the base/center,
// paling toward the rim — the way real petals flush with color.
// Per-instance tint (set on the InstancedMesh's instanceColor) layers
// on top for variety across the whole flock.
export const petalGeometry = new THREE.CircleGeometry(0.5, 7)

const gradientColorAt = stopsGradient([
  { t: 0, color: new THREE.Color('#e0668f') },
  { t: 1, color: new THREE.Color('#fff1f6') },
])

bakeVertexGradient(
  petalGeometry,
  (attr, i) => {
    const x = attr.getX(i)
    const y = attr.getY(i)
    return THREE.MathUtils.clamp(Math.sqrt(x * x + y * y) / 0.5, 0, 1)
  },
  (t) => gradientColorAt(t)
)
