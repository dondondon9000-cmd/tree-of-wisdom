// Inflates every vertex outward along its own normal, rather than
// uniformly scaling from the local origin (see SeedOutline.jsx). The
// scale trick only works for roughly-centered shapes like a seed or a
// sphere; an asymmetric merged shape like a multi-puff cloud has most
// of its mass far from the local origin, so a uniform scale barely
// offsets the vertices near the center and the black line disappears.
export function inflateAlongNormals(geometry, thickness) {
  const inflated = geometry.clone()
  inflated.computeVertexNormals()
  const pos = inflated.attributes.position
  const norm = inflated.attributes.normal
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(
      i,
      pos.getX(i) + norm.getX(i) * thickness,
      pos.getY(i) + norm.getY(i) * thickness,
      pos.getZ(i) + norm.getZ(i) * thickness
    )
  }
  pos.needsUpdate = true
  return inflated
}
