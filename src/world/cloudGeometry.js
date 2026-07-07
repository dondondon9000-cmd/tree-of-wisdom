import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { bakeVertexGradient, stopsGradient } from './vertexGradient'

// A real 3D cloud shape — several overlapping spheres merged into one
// bumpy cumulus-like geometry, instead of a flat glow sprite (which
// has no real form and reads as a fuzzy blob, not a cloud). Each cloud
// gets its own unique geometry (only ~20 of these exist at once, cheap
// enough not to need instancing).
const gradient = stopsGradient([
  { t: 0, color: new THREE.Color('#c7d0da') }, // shaded underside
  { t: 1, color: new THREE.Color('#fffaf2') }, // sunlit top
])

export function buildCloudGeometry() {
  const puffCount = 5 + Math.floor(Math.random() * 3)
  const parts = []
  for (let i = 0; i < puffCount; i++) {
    const radius = 1.1 + Math.random() * 1.3
    const sphere = new THREE.SphereGeometry(radius, 10, 8)
    sphere.translate(
      (Math.random() - 0.5) * 6.5,
      (Math.random() - 0.5) * 1.6,
      (Math.random() - 0.5) * 2.2
    )
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

  return merged
}
