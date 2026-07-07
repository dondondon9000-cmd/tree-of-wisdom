import * as THREE from 'three'
import { bakeVertexGradient, stopsGradient } from './vertexGradient'

// Real definition instead of a flat, unlit "bright thing": a sphere
// with a baked top-lit gradient (warm gold base, bright cream top),
// plus a flat ray-burst silhouette (a classic sun shape) with its own
// gradient, so it unmistakably reads as a sun rather than an
// undefined glowing circle.
export const sunDiscGeometry = new THREE.SphereGeometry(2.6, 24, 24)

const discGradient = stopsGradient([
  { t: 0, color: new THREE.Color('#ffb057') },
  { t: 1, color: new THREE.Color('#fff8e0') },
])

bakeVertexGradient(
  sunDiscGeometry,
  (attr, i) => THREE.MathUtils.clamp((attr.getY(i) + 2.6) / 5.2, 0, 1),
  (t) => discGradient(t)
)

function buildRayGeometry() {
  const shape = new THREE.Shape()
  const points = 10
  const outer = 5.4
  const inner = 3.2
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = (i / (points * 2)) * Math.PI * 2
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  return new THREE.ShapeGeometry(shape)
}

export const sunRayGeometry = buildRayGeometry()

const rayGradient = stopsGradient([
  { t: 0, color: new THREE.Color('#ffe6a8') },
  { t: 1, color: new THREE.Color('#ffb057') },
])

bakeVertexGradient(
  sunRayGeometry,
  (attr, i) => THREE.MathUtils.clamp(Math.sqrt(attr.getX(i) ** 2 + attr.getY(i) ** 2) / 5.4, 0, 1),
  (t) => rayGradient(t)
)
