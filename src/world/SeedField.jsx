import { useMemo } from 'react'
import Seed from './Seed'

// Placeholder ideas so the field isn't empty while the capture
// pipeline (step 2) isn't wired up yet. Real seeds will replace this
// once voice capture -> Whisper -> Haiku is in place.
const PLACEHOLDER_IDEAS = [
  'Country Song',
  'Koi Pond',
  'Woodworking Biz',
  'YouTube Bit',
  'Garden Trellis',
  'App Idea',
  'Short Story',
  'Weekend Trip',
]

const PALETTE = ['#8b5a2b', '#7c4a24', '#9c6b3e', '#6e4423', '#8f6a3f']

export default function SeedField({ count = PLACEHOLDER_IDEAS.length }) {
  const seeds = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const radius = 4 + Math.random() * 3.5
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const position = [
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi) * 0.5,
        radius * Math.sin(phi) * Math.sin(theta) - 2,
      ]
      return {
        id: i,
        position,
        title: PLACEHOLDER_IDEAS[i % PLACEHOLDER_IDEAS.length],
        color: PALETTE[i % PALETTE.length],
      }
    })
  }, [count])

  return (
    <>
      {seeds.map((seed) => (
        <Seed key={seed.id} position={seed.position} title={seed.title} color={seed.color} />
      ))}
    </>
  )
}
