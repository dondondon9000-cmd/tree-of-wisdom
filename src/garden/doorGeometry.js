import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { bakeVertexGradient, stopsGradient } from '../world/vertexGradient'
import { inflateAlongNormals } from '../world/outlineGeometry'

// The door that appears beside a bonsai's pedestal once its idea has
// bloomed — walking through it (BonsaiTree's onEnterWorkshop) is the
// separate path from tapping the pedestal/pot, which still just opens
// the quick-reference popup. One shared static geometry; a door
// doesn't need per-instance variety the way the trunk/foliage do.
export const DOOR_HEIGHT = 1.3
const DOOR_WIDTH = 0.6
const DOOR_THICKNESS = 0.06

const doorGradient = stopsGradient([
  { t: 0, color: new THREE.Color('#4a2f1c') },
  { t: 1, color: new THREE.Color('#8a5a34') },
])

function buildDoor() {
  const parts = []

  const slab = new THREE.BoxGeometry(DOOR_WIDTH, DOOR_HEIGHT, DOOR_THICKNESS)
  slab.translate(0, DOOR_HEIGHT / 2, 0)
  parts.push(slab)

  const knob = new THREE.SphereGeometry(0.035, 8, 6)
  knob.translate(DOOR_WIDTH / 2 - 0.1, DOOR_HEIGHT / 2, DOOR_THICKNESS / 2 + 0.03)
  parts.push(knob)

  const merged = mergeGeometries(parts, false)
  merged.computeVertexNormals()
  merged.computeBoundingBox()
  const { min, max } = merged.boundingBox

  bakeVertexGradient(
    merged,
    (attr, i) => THREE.MathUtils.clamp((attr.getY(i) - min.y) / (max.y - min.y || 1), 0, 1),
    (t) => doorGradient(t)
  )

  const outline = inflateAlongNormals(merged, 0.012)
  return { geometry: merged, outline }
}

export const doorGeometry = buildDoor()
