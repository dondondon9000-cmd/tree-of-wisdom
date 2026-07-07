import * as THREE from 'three'

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
const GRADIENT_STOPS = [
  { t: 0.0, c: [0x1c, 0x0f, 0x06] },
  { t: 0.2, c: [0x59, 0x33, 0x18] },
  { t: 0.42, c: [0x9c, 0x6b, 0x3a] },
  { t: 0.58, c: [0x9c, 0x6b, 0x3a] },
  { t: 0.8, c: [0x59, 0x33, 0x18] },
  { t: 1.0, c: [0x1c, 0x0f, 0x06] },
]

function gradientColorAt(t) {
  for (let i = 0; i < GRADIENT_STOPS.length - 1; i++) {
    const a = GRADIENT_STOPS[i]
    const b = GRADIENT_STOPS[i + 1]
    if (t >= a.t && t <= b.t) {
      const f = (t - a.t) / (b.t - a.t || 1)
      return [
        THREE.MathUtils.lerp(a.c[0], b.c[0], f) / 255,
        THREE.MathUtils.lerp(a.c[1], b.c[1], f) / 255,
        THREE.MathUtils.lerp(a.c[2], b.c[2], f) / 255,
      ]
    }
  }
  const last = GRADIENT_STOPS[GRADIENT_STOPS.length - 1].c
  return [last[0] / 255, last[1] / 255, last[2] / 255]
}

const yMin = -0.55
const yMax = 0.52
const colors = new Float32Array(posAttr.count * 3)
for (let i = 0; i < posAttr.count; i++) {
  const t = (posAttr.getY(i) - yMin) / (yMax - yMin)
  const [r, g, b] = gradientColorAt(t)
  const seamShade = 1 - 0.5 * seamFactor(vertexAngle[i])
  colors[i * 3] = r * seamShade
  colors[i * 3 + 1] = g * seamShade
  colors[i * 3 + 2] = b * seamShade
}
seedGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
