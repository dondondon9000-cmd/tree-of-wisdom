import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { buildBonsai, potGeometry } from './bonsaiGeometry'
import { pedestalGeometry, PEDESTAL_HEIGHT } from './pedestalGeometry'
import { doorGeometry, DOOR_HEIGHT } from './doorGeometry'
import SeedOutline from '../world/SeedOutline'

const POT_HEIGHT = 0.2
const GROW_DURATION = 1.4
const STEP_GROW_SPEED = 2.5 // how fast the tree eases toward its target size, per second
const BLOOM_FLASH_DURATION = 1.6 // one-time pink flash when a plan's last step is checked off
const LABEL_MARGIN = 0.25 // clearance kept above the canopy's actual current top

// A freshly planted idea starts life as a tiny sapling, not a
// full-grown tree. It only gets bigger by actually being worked on —
// each plan step checked off in IdeaWorkspace nudges it a bit closer
// to FULL_SCALE, read straight off idea.plan.steps below.
const BABY_SCALE = 0.38
const FULL_SCALE = 1.0

// One planted idea: a pedestal, a pot, and a unique bonsai (trunk +
// foliage) built fresh per instance via buildBonsai() — same "unique
// geometry per instance, cheap because there aren't many" approach
// used for clouds. The pedestal and pot are shared/static since they
// don't need per-instance variety.
//
// justPlanted (set for the one bonsai that just arrived via
// plantWithTransition) scales only the tree itself up from nothing to
// BABY_SCALE, ease-out — the pedestal and pot are the Garden's
// furniture and were already there; it's specifically your idea that's
// growing into it. Every other bonsai just renders at BABY_SCALE
// directly, no animation.
//
// The title label lives outside the scaling group so its own size
// stays constant regardless of how big the tree currently is, but its
// Y position is still updated every frame to track currentScale *
// bonsai.topHeight (the canopy's actual tallest point in unscaled
// coordinates) — a fixed label height only ever cleared the canopy at
// BABY_SCALE; a fully grown tree's foliage reaches well past a fixed
// point and would grow up through the text.
//
// onSelect fires from the pedestal and pot specifically, not the tree
// itself — the tree is tiny at BABY_SCALE and would be a frustratingly
// small tap target on its own, but the furniture under it is always a
// consistent, easy-to-hit size regardless of how big the idea's tree
// currently is.
export default function BonsaiTree({
  position,
  idea,
  justPlanted = false,
  justBloomed = false,
  onSelect,
  onEnterWorkshop,
}) {
  const bonsai = useMemo(() => buildBonsai(), [])
  const treeRef = useRef()
  const labelRef = useRef()
  const flashLightRef = useRef()
  const growProgress = useRef(justPlanted ? 0 : 1)
  const currentScale = useRef(justPlanted ? 0 : BABY_SCALE)
  const flashProgress = useRef(justBloomed ? 0 : 1)

  // Unlike justPlanted (only ever true at a tree's very first mount,
  // since a new plantedIdeas entry mounts a brand new BonsaiTree),
  // justBloomed goes false -> true on a tree that's already been
  // sitting there for a while — the useRef initial value above only
  // covers the (rare) case of loading a page with a bloom already in
  // flight, so the real trigger is this effect on the actual
  // false -> true transition.
  useEffect(() => {
    if (justBloomed) flashProgress.current = 0
  }, [justBloomed])

  useFrame((_, delta) => {
    if (growProgress.current < 1) {
      growProgress.current = Math.min(1, growProgress.current + delta / GROW_DURATION)
      const eased = 1 - Math.pow(1 - growProgress.current, 3)
      currentScale.current = eased * BABY_SCALE
      treeRef.current?.scale.setScalar(currentScale.current)
    } else {
      // Bloom is a one-way milestone (see togglePlanStep in store.js) —
      // the tree's size should honor that too, so it doesn't shrink
      // back down if a step ever gets unchecked after blooming.
      const steps = idea?.plan?.steps
      const completionRatio = idea?.bloomed
        ? 1
        : steps?.length
          ? steps.filter((s) => s.done).length / steps.length
          : 0
      const target = BABY_SCALE + (FULL_SCALE - BABY_SCALE) * completionRatio
      currentScale.current += (target - currentScale.current) * Math.min(1, delta * STEP_GROW_SPEED)
      treeRef.current?.scale.setScalar(currentScale.current)
    }

    if (flashProgress.current < 1) {
      flashProgress.current = Math.min(1, flashProgress.current + delta / BLOOM_FLASH_DURATION)
      if (flashLightRef.current) {
        flashLightRef.current.intensity = Math.sin(flashProgress.current * Math.PI) * 3.5
      }
    }

    if (labelRef.current) {
      labelRef.current.position.y =
        PEDESTAL_HEIGHT + POT_HEIGHT + currentScale.current * bonsai.topHeight + LABEL_MARGIN
    }
  })

  function handleClick(e) {
    e.stopPropagation()
    onSelect?.()
  }

  function handleDoorClick(e) {
    e.stopPropagation()
    onEnterWorkshop?.()
  }

  return (
    <group position={position}>
      {idea?.bloomed && (
        <group position={[1.15, 0, 0.3]} rotation={[0, -0.4, 0]} onClick={handleDoorClick}>
          <mesh geometry={doorGeometry.geometry}>
            <meshStandardMaterial vertexColors roughness={0.75} />
          </mesh>
          <mesh geometry={doorGeometry.outline}>
            <meshBasicMaterial color="#120a05" side={THREE.BackSide} toneMapped={false} />
          </mesh>
          <pointLight position={[0, DOOR_HEIGHT * 0.6, 0.3]} color="#ffcf8a" intensity={0.6} distance={2} decay={2} />
        </group>
      )}

      <mesh geometry={pedestalGeometry} position={[0, PEDESTAL_HEIGHT / 2, 0]} onClick={handleClick}>
        <meshStandardMaterial vertexColors roughness={0.95} />
        <SeedOutline geometry={pedestalGeometry} scale={1.025} />
      </mesh>

      <mesh geometry={potGeometry} position={[0, PEDESTAL_HEIGHT + POT_HEIGHT / 2, 0]} onClick={handleClick}>
        <meshStandardMaterial vertexColors roughness={0.7} />
        <SeedOutline geometry={potGeometry} scale={1.05} />
      </mesh>

      <group
        ref={treeRef}
        scale={justPlanted ? 0 : BABY_SCALE}
        position={[0, PEDESTAL_HEIGHT + POT_HEIGHT, 0]}
      >
        <mesh geometry={bonsai.trunk}>
          <meshStandardMaterial vertexColors roughness={0.85} />
        </mesh>
        <mesh geometry={bonsai.trunkOutline}>
          <meshBasicMaterial color="#120a05" side={THREE.BackSide} toneMapped={false} />
        </mesh>

        {bonsai.foliage.map((clump, i) => (
          <group key={i}>
            <mesh geometry={clump.geometry}>
              <meshStandardMaterial vertexColors roughness={0.6} />
            </mesh>
            <mesh geometry={clump.outline}>
              <meshBasicMaterial color="#120a05" side={THREE.BackSide} toneMapped={false} />
            </mesh>
          </group>
        ))}

        {idea?.bloomed && bonsai.blossoms && (
          <mesh geometry={bonsai.blossoms}>
            <meshStandardMaterial vertexColors roughness={0.5} emissive="#ff9ec4" emissiveIntensity={0.2} />
          </mesh>
        )}

        <pointLight ref={flashLightRef} color="#ff9ec4" intensity={0} distance={4} decay={2} />
      </group>

      {idea?.title && (
        <Text
          ref={labelRef}
          font="/fonts/manrope-400.woff"
          position={[0, PEDESTAL_HEIGHT + POT_HEIGHT + currentScale.current * bonsai.topHeight + LABEL_MARGIN, 0]}
          fontSize={0.24}
          color="#fff6e6"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.012}
          outlineColor="#39ff14"
        >
          {idea.title}
        </Text>
      )}
    </group>
  )
}
