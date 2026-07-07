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

export const seedGeometry = new THREE.LatheGeometry(profile, 14)
seedGeometry.computeVertexNormals()

// Real seed coats aren't a flat color — they're darkest at the tips
// and lighten through the fuller body, like an apple pip or watermelon
// seed. Bake that as vertex colors so every instance shares one gradient
// (the per-seed `color` tint in Seed/TalkSeed multiplies on top of this),
// no texture required.
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

const posAttr = seedGeometry.attributes.position
const yMin = -0.55
const yMax = 0.52
const colors = new Float32Array(posAttr.count * 3)
for (let i = 0; i < posAttr.count; i++) {
  const t = (posAttr.getY(i) - yMin) / (yMax - yMin)
  const [r, g, b] = gradientColorAt(t)
  colors[i * 3] = r
  colors[i * 3 + 1] = g
  colors[i * 3 + 2] = b
}
seedGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
