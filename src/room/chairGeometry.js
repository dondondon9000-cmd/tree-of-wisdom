import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { bakeVertexGradient, stopsGradient } from '../world/vertexGradient'
import { inflateAlongNormals } from '../world/outlineGeometry'

// A simple stylized chair — seat, backrest, four legs — merged into
// one static geometry, same approach as deskGeometry.js. Purely set
// dressing (the camera settles behind/above it, it's never actually
// sat in from a first-person seat), so it's kept deliberately plain.
const SEAT_SIZE = 0.5
const SEAT_HEIGHT = 0.45
const SEAT_THICKNESS = 0.05

const woodGradient = stopsGradient([
  { t: 0, color: new THREE.Color('#5a3a22') },
  { t: 1, color: new THREE.Color('#8a5c38') },
])

function buildChair() {
  const parts = []

  const seat = new THREE.BoxGeometry(SEAT_SIZE, SEAT_THICKNESS, SEAT_SIZE)
  seat.translate(0, SEAT_HEIGHT, 0)
  parts.push(seat)

  const backrest = new THREE.BoxGeometry(SEAT_SIZE, 0.5, 0.05)
  backrest.translate(0, SEAT_HEIGHT + 0.25, -(SEAT_SIZE / 2 - 0.025))
  parts.push(backrest)

  const legInset = 0.05
  const legPositions = [
    [SEAT_SIZE / 2 - legInset, SEAT_SIZE / 2 - legInset],
    [-(SEAT_SIZE / 2 - legInset), SEAT_SIZE / 2 - legInset],
    [SEAT_SIZE / 2 - legInset, -(SEAT_SIZE / 2 - legInset)],
    [-(SEAT_SIZE / 2 - legInset), -(SEAT_SIZE / 2 - legInset)],
  ]
  for (const [x, z] of legPositions) {
    const leg = new THREE.BoxGeometry(0.05, SEAT_HEIGHT, 0.05)
    leg.translate(x, SEAT_HEIGHT / 2, z)
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

  const outline = inflateAlongNormals(merged, 0.01)
  return { geometry: merged, outline }
}

export const chairGeometry = buildChair()
