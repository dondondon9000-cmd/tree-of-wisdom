import * as THREE from 'three'

// A single shared geometry, reused by every seed instance instead of
// each one allocating its own buffer. Profile traces an asymmetric
// teardrop (fuller near the base, tapering to a point) like a real
// seed, revolved into 3D with LatheGeometry.
const profile = [
  [0.0, -0.55],
  [0.16, -0.45],
  [0.3, -0.28],
  [0.35, -0.08],
  [0.32, 0.1],
  [0.24, 0.28],
  [0.1, 0.42],
  [0.0, 0.52],
].map(([r, y]) => new THREE.Vector2(r, y))

export const seedGeometry = new THREE.LatheGeometry(profile, 14)
seedGeometry.computeVertexNormals()
