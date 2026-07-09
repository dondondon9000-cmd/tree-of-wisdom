import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { bakeVertexGradient, stopsGradient } from '../world/vertexGradient'
import { inflateAlongNormals } from '../world/outlineGeometry'

// A stylized bonsai: a curved trunk (tube along a bent curve) with 2-3
// rounded foliage clumps near the top, built the same way clouds are —
// merged primitives with a baked gradient and a normal-inflated
// outline, so it matches the rest of the world's illustrated look
// instead of needing its own bespoke rendering technique.
const trunkGradient = stopsGradient([
  { t: 0, color: new THREE.Color('#4a2f1c') }, // root, in shadow
  { t: 1, color: new THREE.Color('#8a5a34') }, // upper bark, lit
])

const foliageGradient = stopsGradient([
  { t: 0, color: new THREE.Color('#3f6b2e') }, // shaded underside
  { t: 1, color: new THREE.Color('#93c25c') }, // sunlit top
])

const potGradient = stopsGradient([
  { t: 0, color: new THREE.Color('#7a3f2a') },
  { t: 1, color: new THREE.Color('#b8654a') },
])

// Only shown once an idea has bloomed (every plan step checked off) —
// see BonsaiTree.jsx. A little variety of pink/white so the canopy
// reads as flowering rather than just having a few identical dots
// stuck on it.
const blossomGradient = stopsGradient([
  { t: 0, color: new THREE.Color('#ffd9e8') },
  { t: 0.5, color: new THREE.Color('#ff9ec4') },
  { t: 1, color: new THREE.Color('#fff6f0') },
])

// Shared across every bonsai — the pot doesn't need per-instance
// randomization the way the trunk/foliage do.
export const potGeometry = new THREE.CylinderGeometry(0.3, 0.22, 0.2, 12)
potGeometry.computeBoundingBox()
bakeVertexGradient(
  potGeometry,
  (attr, i) => {
    const { min, max } = potGeometry.boundingBox
    return THREE.MathUtils.clamp((attr.getY(i) - min.y) / (max.y - min.y || 1), 0, 1)
  },
  (t) => potGradient(t)
)

function buildTrunk() {
  const lean = (Math.random() - 0.5) * 0.7
  const height = 1.3 + Math.random() * 0.4
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(lean * 0.25, height * 0.35, lean * 0.1),
    new THREE.Vector3(lean * 0.65, height * 0.7, lean * 0.2),
    new THREE.Vector3(lean, height, lean * 0.3),
  ])
  const geometry = new THREE.TubeGeometry(curve, 24, 0.08, 8, false)
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  const { min, max } = geometry.boundingBox

  bakeVertexGradient(
    geometry,
    (attr, i) => THREE.MathUtils.clamp((attr.getY(i) - min.y) / (max.y - min.y || 1), 0, 1),
    (t) => trunkGradient(t)
  )

  const outline = inflateAlongNormals(geometry, 0.014)
  return { geometry, outline, topPoint: curve.getPoint(1) }
}

function buildFoliageClump(center) {
  const puffCount = 4 + Math.floor(Math.random() * 3)
  const parts = []
  for (let i = 0; i < puffCount; i++) {
    const radius = 0.2 + Math.random() * 0.15
    const angle = Math.random() * Math.PI * 2
    const r2 = Math.random() * 0.2
    const sphere = new THREE.SphereGeometry(radius, 8, 6)
    sphere.translate(Math.cos(angle) * r2, (Math.random() - 0.3) * 0.16, Math.sin(angle) * r2)
    parts.push(sphere)
  }

  const merged = mergeGeometries(parts, false)
  merged.translate(center.x, center.y, center.z)
  merged.computeVertexNormals()
  merged.computeBoundingBox()
  const { min, max } = merged.boundingBox

  bakeVertexGradient(
    merged,
    (attr, i) => THREE.MathUtils.clamp((attr.getY(i) - min.y) / (max.y - min.y || 1), 0, 1),
    (t) => foliageGradient(t)
  )

  const outline = inflateAlongNormals(merged, 0.018)
  return { geometry: merged, outline }
}

// Small blossom dots scattered near the outer surface of each foliage
// clump. Each sphere gets its own fixed random t along blossomGradient
// (not a per-vertex gradient — the whole tiny sphere is one color) so
// the merged result reads as a scatter of individually-colored
// blossoms rather than one smooth-shaded blob.
function buildBlossoms(foliageClumps) {
  const parts = []
  for (const clump of foliageClumps) {
    clump.geometry.computeBoundingSphere()
    const { center, radius } = clump.geometry.boundingSphere
    const blossomCount = 9 + Math.floor(Math.random() * 5)
    for (let i = 0; i < blossomCount; i++) {
      // Full sphere, not just the upper hemisphere — a y range that
      // stayed positive here once meant every blossom landed on the
      // top of the clump only, leaving the whole underside bare.
      const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize()
      const pos = center.clone().addScaledVector(dir, radius * 0.85)
      const sphere = new THREE.SphereGeometry(0.035 + Math.random() * 0.02, 6, 5)
      sphere.translate(pos.x, pos.y, pos.z)
      const t = Math.random()
      bakeVertexGradient(sphere, () => t, (tt) => blossomGradient(tt))
      parts.push(sphere)
    }
  }
  return mergeGeometries(parts, false)
}

export function buildBonsai() {
  const { geometry: trunk, outline: trunkOutline, topPoint } = buildTrunk()

  // Clumps placed roughly along the trunk's lean direction, near its
  // upper portion, so the canopy reads as growing out of the branches
  // rather than floating independently above the trunk.
  const clumpCount = 2 + Math.floor(Math.random() * 2)
  const foliage = []
  for (let i = 0; i < clumpCount; i++) {
    const t = 0.55 + (i / Math.max(1, clumpCount - 1)) * 0.4
    const jitter = new THREE.Vector3(
      (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 0.12,
      (Math.random() - 0.5) * 0.3
    )
    const center = topPoint.clone().multiplyScalar(t).add(jitter)
    foliage.push(buildFoliageClump(center))
  }

  const blossoms = buildBlossoms(foliage)

  // The tallest point across the whole canopy, in the same unscaled
  // local coordinates the treeRef group's scale is later applied to —
  // lets BonsaiTree position the title label just above however tall
  // *this* randomized tree actually gets, instead of a fixed height
  // tuned only for the baby-scale case (which the canopy grows well
  // past by the time a tree is fully grown).
  let topHeight = 0
  for (const clump of foliage) {
    clump.geometry.computeBoundingBox()
    topHeight = Math.max(topHeight, clump.geometry.boundingBox.max.y)
  }
  blossoms.computeBoundingBox()
  topHeight = Math.max(topHeight, blossoms.boundingBox.max.y)

  return { trunk, trunkOutline, foliage, blossoms, topHeight }
}
