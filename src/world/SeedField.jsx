import { useMemo } from 'react'
import Seed from './Seed'
import { useGardenStore } from '../lib/store'
import { randomFieldPosition } from '../lib/randomFieldPosition'

// Placeholder ideas so the field isn't empty on a fresh visit — real
// captured ideas (from useGardenStore) render alongside these.
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

const PALETTE = ['#fff1e0', '#ffe9d2', '#fff6ea', '#f5e2c8', '#fff0dc']

export default function SeedField() {
  const ideas = useGardenStore((s) => s.ideas)

  // Positions are generated once (useMemo, no deps) so existing
  // placeholder seeds never jump around as real ideas are added.
  const placeholderSeeds = useMemo(
    () =>
      PLACEHOLDER_IDEAS.map((title, i) => ({
        id: `placeholder-${i}`,
        position: randomFieldPosition(),
        title,
        color: PALETTE[i % PALETTE.length],
      })),
    []
  )

  return (
    <>
      {placeholderSeeds.map((seed) => (
        <Seed key={seed.id} position={seed.position} title={seed.title} color={seed.color} />
      ))}
      {ideas.map((idea, i) => (
        <Seed
          key={idea.id}
          position={idea.position}
          title={idea.title}
          color={PALETTE[i % PALETTE.length]}
        />
      ))}
    </>
  )
}
