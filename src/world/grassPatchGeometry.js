import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { grassGeometry } from './grassGeometry'

// A small clump of blades (already-colored copies of the single blade
// shape, scattered and rotated within a tight footprint) merged into
// one static geometry. Instancing whole clumps instead of single
// blades means far fewer per-frame updates for the same — or denser —
// coverage, and each clump sways as one patch rather than every blade
// moving independently, which reads more like real turf.
//
// Only three distinct clump "types" exist (built once, below) — the
// field scatters many instances of each, but never has to track more
// than these three geometries.
function buildPatch({ bladeCount, radius, scaleMin, scaleMax }) {
  const parts = []
  for (let i = 0; i < bladeCount; i++) {
    const blade = grassGeometry.clone()
    const r = Math.sqrt(Math.random()) * radius
    const a = Math.random() * Math.PI * 2
    const yaw = Math.random() * Math.PI * 2
    const scale = scaleMin + Math.random() * (scaleMax - scaleMin)

    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)),
      new THREE.Vector3(scale, scale, scale)
    )
    blade.applyMatrix4(m)
    parts.push(blade)
  }

  const merged = mergeGeometries(parts, false)
  merged.computeVertexNormals()
  return merged
}

// Sparse, tall tuft
export const grassPatchTall = buildPatch({ bladeCount: 5, radius: 0.35, scaleMin: 0.95, scaleMax: 1.35 })
// Dense, short clump
export const grassPatchDense = buildPatch({ bladeCount: 9, radius: 0.45, scaleMin: 0.5, scaleMax: 0.8 })
// Medium in-between clump
export const grassPatchMedium = buildPatch({ bladeCount: 7, radius: 0.4, scaleMin: 0.7, scaleMax: 1.0 })

export const grassPatchTypes = [grassPatchTall, grassPatchDense, grassPatchMedium]
