import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { bakeVertexGradient, stopsGradient } from '../world/vertexGradient'
import { inflateAlongNormals } from '../world/outlineGeometry'

// A simple desk — a flat top slab plus four legs, merged into one
// static geometry the same way the pot/pedestal are (no per-instance
// variety needed, there's exactly one desk per Room). The desktop's
// gradient is what the 2D WorkshopDashboard overlay effectively sits
// "on" once the camera settles looking down at it.
const TOP_WIDTH = 1.8
const TOP_DEPTH = 0.9
const TOP_THICKNESS = 0.06
export const DESK_HEIGHT = 0.75

const woodGradient = stopsGradient([
  { t: 0, color: new THREE.Color('#6b4326') },
  { t: 1, color: new THREE.Color('#a8703f') },
])

function buildDesk() {
  const parts = []

  const top = new THREE.BoxGeometry(TOP_WIDTH, TOP_THICKNESS, TOP_DEPTH)
  top.translate(0, DESK_HEIGHT - TOP_THICKNESS / 2, 0)
  parts.push(top)

  const legInset = 0.08
  const legPositions = [
    [TOP_WIDTH / 2 - legInset, TOP_DEPTH / 2 - legInset],
    [-(TOP_WIDTH / 2 - legInset), TOP_DEPTH / 2 - legInset],
    [TOP_WIDTH / 2 - legInset, -(TOP_DEPTH / 2 - legInset)],
    [-(TOP_WIDTH / 2 - legInset), -(TOP_DEPTH / 2 - legInset)],
  ]
  for (const [x, z] of legPositions) {
    const leg = new THREE.BoxGeometry(0.06, DESK_HEIGHT - TOP_THICKNESS, 0.06)
    leg.translate(x, (DESK_HEIGHT - TOP_THICKNESS) / 2, z)
    parts.push(leg)
  }

  const merged = mergeGeometries(parts, false)
  merged.computeVertexNormals()
  merged.computeBoundingBox()
  const { min, max } = merged.boundingBox

  bakeVertexGradient(
    merged,
    (attr, i) => THREE.MathUtils.clamp((attr.getY(i) - min.y) / (max.y - min.y || 1), 0, 1),
    (t) => woodGradient(t)
  )

  const outline = inflateAlongNormals(merged, 0.012)
  return { geometry: merged, outline }
}

export const deskGeometry = buildDesk()
