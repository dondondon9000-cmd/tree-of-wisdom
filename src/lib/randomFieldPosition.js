// Scatters a point within the floating field's usual volume — shared
// so a newly-committed idea's position is generated once, at creation
// time, the same way the placeholder seeds are, rather than every
// idea needing its own copy of this formula.
export function randomFieldPosition() {
  const radius = 4 + Math.random() * 3.5
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)
  return [
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi) * 0.5,
    radius * Math.sin(phi) * Math.sin(theta) - 2,
  ]
}
