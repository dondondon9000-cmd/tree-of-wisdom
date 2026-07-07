import * as THREE from 'three'

// Bakes a vertex-color gradient onto a geometry's 'color' attribute.
// `sampleT(posAttr, i)` returns each vertex's 0..1 position along
// whatever axis matters (height, radius, angle...); `colorAt(t, i)`
// returns the THREE.Color for that point. Shared so every
// gradient-tinted geometry (seeds, grass, petals, sky) uses one tested
// implementation instead of each hand-rolling the same loop.
export function bakeVertexGradient(geometry, sampleT, colorAt) {
  const posAttr = geometry.attributes.position
  const colors = new Float32Array(posAttr.count * 3)
  for (let i = 0; i < posAttr.count; i++) {
    const c = colorAt(sampleT(posAttr, i), i)
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
}

// Multi-stop lerp along a list of { t, color } stops, sorted by t.
export function stopsGradient(stops) {
  return (t) => {
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i]
      const b = stops[i + 1]
      if (t >= a.t && t <= b.t) {
        const f = (t - a.t) / (b.t - a.t || 1)
        return a.color.clone().lerp(b.color, f)
      }
    }
    return stops[stops.length - 1].color.clone()
  }
}
