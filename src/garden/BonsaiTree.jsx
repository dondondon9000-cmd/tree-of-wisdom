import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { buildBonsai, potGeometry } from './bonsaiGeometry'
import { pedestalGeometry, PEDESTAL_HEIGHT } from './pedestalGeometry'
import SeedOutline from '../world/SeedOutline'

const POT_HEIGHT = 0.2
const GROW_DURATION = 1.4

// One planted idea: a pedestal, a pot, and a unique bonsai (trunk +
// foliage) built fresh per instance via buildBonsai() — same "unique
// geometry per instance, cheap because there aren't many" approach
// used for clouds. The pedestal and pot are shared/static since they
// don't need per-instance variety.
//
// justPlanted (set for the one bonsai that just arrived via
// plantWithTransition) scales only the tree itself up from nothing,
// ease-out — the pedestal and pot are the Garden's furniture and were
// already there; it's specifically your idea that's growing into it.
export default function BonsaiTree({ position, title, justPlanted = false }) {
  const bonsai = useMemo(() => buildBonsai(), [])
  const treeRef = useRef()
  const growProgress = useRef(justPlanted ? 0 : 1)

  useFrame((_, delta) => {
    if (growProgress.current < 1) {
      growProgress.current = Math.min(1, growProgress.current + delta / GROW_DURATION)
      const eased = 1 - Math.pow(1 - growProgress.current, 3)
      treeRef.current?.scale.setScalar(eased)
    }
  })

  return (
    <group position={position}>
      <mesh geometry={pedestalGeometry} position={[0, PEDESTAL_HEIGHT / 2, 0]}>
        <meshStandardMaterial vertexColors roughness={0.95} />
        <SeedOutline geometry={pedestalGeometry} scale={1.025} />
      </mesh>

      <mesh geometry={potGeometry} position={[0, PEDESTAL_HEIGHT + POT_HEIGHT / 2, 0]}>
        <meshStandardMaterial vertexColors roughness={0.7} />
        <SeedOutline geometry={potGeometry} scale={1.05} />
      </mesh>

      <group ref={treeRef} scale={justPlanted ? 0 : 1} position={[0, PEDESTAL_HEIGHT + POT_HEIGHT, 0]}>
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

        {title && (
          <Text
            font="/fonts/manrope-400.woff"
            position={[0, 2.1, 0]}
            fontSize={0.24}
            color="#fff6e6"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.012}
            outlineColor="#39ff14"
          >
            {title}
          </Text>
        )}
      </group>
    </group>
  )
}
