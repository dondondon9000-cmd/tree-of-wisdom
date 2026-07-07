import { createNoise3D } from 'simplex-noise'

// Shared flow-field noise so every drifting object samples the same
// underlying "current" but each gets a unique offset, keeping motion
// organic instead of synchronized.
export const noise3D = createNoise3D()

export function driftOffset(noiseSeed, t, speed = 0.05) {
  const nx = noise3D(noiseSeed, t * speed, 0)
  const ny = noise3D(0, noiseSeed, t * speed)
  const nz = noise3D(t * speed, 0, noiseSeed)
  return [nx, ny, nz]
}
