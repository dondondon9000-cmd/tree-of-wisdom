import * as THREE from 'three'

// A soft 7-sided disc standing in for a petal shape, with a baked
// radial vertex-color gradient — deeper rose near the base/center,
// paling toward the rim — the way real petals flush with color.
// Per-instance tint (set on the InstancedMesh's instanceColor) layers
// on top for variety across the whole flock.
export const petalGeometry = new THREE.CircleGeometry(0.5, 7)

const CENTER = new THREE.Color('#e0668f')
const RIM = new THREE.Color('#fff1f6')

const posAttr = petalGeometry.attributes.position
const colors = new Float32Array(posAttr.count * 3)
for (let i = 0; i < posAttr.count; i++) {
  const x = posAttr.getX(i)
  const y = posAttr.getY(i)
  const t = THREE.MathUtils.clamp(Math.sqrt(x * x + y * y) / 0.5, 0, 1)
  const c = CENTER.clone().lerp(RIM, t)
  colors[i * 3] = c.r
  colors[i * 3 + 1] = c.g
  colors[i * 3 + 2] = c.b
}
petalGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
