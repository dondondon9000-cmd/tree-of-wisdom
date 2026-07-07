import * as THREE from 'three'
import { bakeVertexGradient, stopsGradient } from './vertexGradient'

// A single shared geometry, reused by every seed instance instead of
// each one allocating its own buffer. Profile traces an asymmetric
// teardrop (fuller near the base, tapering to a point) like a real
// seed, revolved into 3D with LatheGeometry.
const profile = [
  [0.0, -0.55],
  [0.16, -0.45],
  [0.3, -0.28],
  [0.35, -0.08],
  [0.32, 0.1],
  [0.24, 0.28],
  [0.1, 0.42],
  [0.0, 0.52],
].map(([r, y]) => new THREE.Vector2(r, y))

const RADIAL_SEGMENTS = 28
export const seedGeometry = new THREE.LatheGeometry(profile, RADIAL_SEGMENTS)

// Real seeds (coffee beans, apple pips, beans) usually have a seam or
// crease running their length, not a perfectly round cross-section.
// Carve a shallow groove into one longitude line by pulling vertices
// near a fixed angle inward, then re-derive normals so the crease
// actually catches light and shadow as the seed tumbles.
const SEAM_ANGLE = 0
const SEAM_WIDTH = 0.3
const SEAM_DEPTH = 0.48

function seamFactor(theta) {
  let d = theta - SEAM_ANGLE
  d = Math.atan2(Math.sin(d), Math.cos(d)) // wrap to [-PI, PI]
  return Math.exp(-(d * d) / (2 * SEAM_WIDTH * SEAM_WIDTH))
}

const posAttr = seedGeometry.attributes.position
const vertexAngle = new Float32Array(posAttr.count)

for (let i = 0; i < posAttr.count; i++) {
  const x = posAttr.getX(i)
  const z = posAttr.getZ(i)
  const r = Math.sqrt(x * x + z * z)
  const theta = Math.atan2(z, x)
  vertexAngle[i] = theta
  if (r > 0.0001) {
    const newR = r * (1 - SEAM_DEPTH * seamFactor(theta))
    posAttr.setX(i, Math.cos(theta) * newR)
    posAttr.setZ(i, Math.sin(theta) * newR)
  }
}
posAttr.needsUpdate = true
seedGeometry.computeVertexNormals()

// Real seed coats aren't a flat color — they're darkest at the tips
// and lighten through the fuller body, like an apple pip or watermelon
// seed, and darker again along the seam crease. Bake that as vertex
// colors so every instance shares one gradient (the per-seed `color`
// tint in Seed/TalkSeed multiplies on top of this), no texture needed.
const gradientColorAt = stopsGradient([
  { t: 0.0, color: new THREE.Color('#1c0f06') },
  { t: 0.2, color: new THREE.Color('#593318') },
  { t: 0.42, color: new THREE.Color('#9c6b3a') },
  { t: 0.58, color: new THREE.Color('#9c6b3a') },
  { t: 0.8, color: new THREE.Color('#593318') },
  { t: 1.0, color: new THREE.Color('#1c0f06') },
])

const Y_MIN = -0.55
const Y_MAX = 0.52

bakeVertexGradient(
  seedGeometry,
  (attr, i) => (attr.getY(i) - Y_MIN) / (Y_MAX - Y_MIN),
  (t, i) => {
    const seamShade = 1 - 0.5 * seamFactor(vertexAngle[i])
    return gradientColorAt(t).multiplyScalar(seamShade)
  }
)
