import * as THREE from 'three'
import { bakeVertexGradient, stopsGradient } from '../world/vertexGradient'

// Same baked-gradient dome technique as the floating world's sky (see
// world/GardenSky.jsx — confusingly named for that scene, not this
// one), with cooler dusk tones so the Garden reads as its own place
// rather than a reskin of the same sky.
//
// Radius has to comfortably clear the sun's distance from the origin
// (~76.5, reusing world/Sun.jsx's fixed position) — anything past the
// dome radius renders behind its opaque backface and is invisible, the
// same bug fixed once already for the floating world's clouds.
const RADIUS = 90

const skyGeometry = new THREE.SphereGeometry(RADIUS, 24, 16)

const gradientColorAt = stopsGradient([
  { t: 0, color: new THREE.Color('#e8d5c0') },
  { t: 1, color: new THREE.Color('#8ea3c9') },
])

bakeVertexGradient(
  skyGeometry,
  (attr, i) => THREE.MathUtils.clamp((attr.getY(i) + RADIUS * 0.35) / (RADIUS * 0.9), 0, 1),
  (t) => gradientColorAt(t)
)

export default function GardenSkyDome() {
  return (
    <mesh geometry={skyGeometry}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} toneMapped={false} />
    </mesh>
  )
}
