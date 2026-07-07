import { useMemo } from 'react'
import * as THREE from 'three'

// A soft hand-rolled gradient sky dome (pale dusk lavender at the
// zenith, warm peach at the horizon) instead of a physically-based sky
// sim — cheaper, and gives direct control over the serene/warm mood.
const TOP_COLOR = new THREE.Color('#aebfd8')
const HORIZON_COLOR = new THREE.Color('#f4d9bd')
const RADIUS = 90

export default function GardenSky() {
  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(RADIUS, 24, 16)
    const pos = geo.attributes.position
    const colors = new Float32Array(pos.count * 3)
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i)
      const t = THREE.MathUtils.clamp((y + RADIUS * 0.35) / (RADIUS * 0.9), 0, 1)
      const c = HORIZON_COLOR.clone().lerp(TOP_COLOR, t)
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [])

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} toneMapped={false} />
    </mesh>
  )
}
