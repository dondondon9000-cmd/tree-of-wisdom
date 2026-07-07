import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { bakeVertexGradient, stopsGradient } from './vertexGradient'
import { inflateAlongNormals } from './outlineGeometry'

// A real 3D cloud shape — several overlapping spheres merged into one
// bumpy cumulus-like geometry, instead of a flat glow sprite (which
// has no real form and reads as a fuzzy blob, not a cloud). Each cloud
// gets its own unique geometry (only ~20 of these exist at once, cheap
// enough not to need instancing).
//
// Top color is kept just short of pure white — fully blown-out white
// triggers such a strong bloom halo that it swallows the thin black
// outline entirely.
const gradient = stopsGradient([
  { t: 0, color: new THREE.Color('#c7d0da') }, // shaded underside
  { t: 1, color: new THREE.Color('#f2ecd9') }, // sunlit top
])

export function buildCloudGeometry() {
  // Puffs are laid out along a line (like real cumulus lobes) rather
  // than scattered randomly in 3D — random 3D scatter can coincidentally
  // collapse into one round clump that just reads as a circle. Bigger
  // puffs in the middle, tapering at the ends, all sitting on a shared
  // baseline, gives a flat-ish bottom and a bumpy, unmistakably-cloud top.
  const puffCount = 6 + Math.floor(Math.random() * 4)
  const spread = 7 + Math.random() * 2.5
  const parts = []
  for (let i = 0; i < puffCount; i++) {
    const t = puffCount === 1 ? 0.5 : i / (puffCount - 1)
    const edgeFalloff = Math.max(0.4, 1 - Math.abs(t - 0.5) * 1.15)
    const radius = (0.85 + Math.random() * 0.9) * edgeFalloff
    const x = (t - 0.5) * spread + (Math.random() - 0.5) * 0.7
    const y = radius * 0.5 + edgeFalloff * 0.7 + (Math.random() - 0.5) * 0.25
    const z = (Math.random() - 0.5) * 1.8

    const sphere = new THREE.SphereGeometry(radius, 10, 8)
    sphere.scale(1, 0.8, 1)
    sphere.translate(x, y, z)
    parts.push(sphere)
  }

  const merged = mergeGeometries(parts, false)
  merged.computeVertexNormals()
  merged.computeBoundingBox()

  const yMin = merged.boundingBox.min.y
  const yMax = merged.boundingBox.max.y

  bakeVertexGradient(
    merged,
    (attr, i) => THREE.MathUtils.clamp((attr.getY(i) - yMin) / (yMax - yMin || 1), 0, 1),
    (t) => gradient(t)
  )

  // Outline built by pushing every vertex out along its own normal
  // (not a uniform scale from the local origin) — this shape's mass is
  // spread wide along x rather than centered, so a uniform scale would
  // barely offset the puffs near the middle and the line would vanish.
  const outline = inflateAlongNormals(merged, 0.16)

  return { geometry: merged, outline }
}
