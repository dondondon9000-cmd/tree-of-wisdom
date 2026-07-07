import * as THREE from 'three'
import { bakeVertexGradient, stopsGradient } from './vertexGradient'

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
const gradientColorAt = stopsGradient([
  { t: 0, color: new THREE.Color('#2e4a22') },
  { t: 1, color: new THREE.Color('#7ea34a') },
])

bakeVertexGradient(
  grassGeometry,
  (attr, i) => THREE.MathUtils.clamp(attr.getY(i) / 0.55, 0, 1),
  (t) => gradientColorAt(t)
)
