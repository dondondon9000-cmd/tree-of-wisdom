import * as THREE from 'three'
import { bakeVertexGradient, stopsGradient } from '../world/vertexGradient'

// The round stone pedestal each bonsai sits on — one shared geometry,
// unlike the trunk/foliage which are unique per bonsai, since there's
// no need for per-instance variety here.
export const PEDESTAL_HEIGHT = 1.1

export const pedestalGeometry = new THREE.CylinderGeometry(0.85, 0.65, PEDESTAL_HEIGHT, 16)
pedestalGeometry.computeBoundingBox()

const gradient = stopsGradient([
  { t: 0, color: new THREE.Color('#6b5a48') },
  { t: 1, color: new THREE.Color('#a8927a') },
])

bakeVertexGradient(
  pedestalGeometry,
  (attr, i) => {
    const { min, max } = pedestalGeometry.boundingBox
    return THREE.MathUtils.clamp((attr.getY(i) - min.y) / (max.y - min.y || 1), 0, 1)
  },
  (t) => gradient(t)
)
