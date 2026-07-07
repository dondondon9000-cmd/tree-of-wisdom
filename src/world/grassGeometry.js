import * as THREE from 'three'

// A single flat tapered blade, base at local y=0 so rotating the
// instance bends it at the root like a real blade, not like a rigid
// post pivoting at its middle.
const shape = new THREE.Shape()
shape.moveTo(-0.045, 0)
shape.lineTo(0.045, 0)
shape.lineTo(0.014, 0.55)
shape.lineTo(-0.014, 0.55)
shape.closePath()

export const grassGeometry = new THREE.ShapeGeometry(shape)

// Darker at the root, lighter/warmer at the tip, like real grass catching light.
const posAttr = grassGeometry.attributes.position
const colors = new Float32Array(posAttr.count * 3)
const ROOT = new THREE.Color('#2e4a22')
const TIP = new THREE.Color('#7ea34a')
for (let i = 0; i < posAttr.count; i++) {
  const t = THREE.MathUtils.clamp(posAttr.getY(i) / 0.55, 0, 1)
  const c = ROOT.clone().lerp(TIP, t)
  colors[i * 3] = c.r
  colors[i * 3 + 1] = c.g
  colors[i * 3 + 2] = c.b
}
grassGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
