import { useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import RoomShell from './RoomShell'
import { deskGeometry, DESK_HEIGHT } from './deskGeometry'
import { chairGeometry } from './chairGeometry'

const DESK_POSITION = [0, 0, -1.1]
const CHAIR_POSITION = [0, 0, 0.15]

// The "walk in and sit down" beat: the camera opens standing further
// back and a little high, then eases down and in to a seated,
// looking-down-at-the-desk framing over SIT_DURATION. onSettled fires
// once, when it arrives — that's the cue (see App.jsx) to fade in the
// 2D WorkshopDashboard overlay, so the dashboard doesn't pop in before
// you've actually "sat down."
const CAMERA_START = new THREE.Vector3(0, 2.4, 2.6)
const CAMERA_END = new THREE.Vector3(0, 1.35, 0.55)
const LOOK_START = new THREE.Vector3(0, 1, -1.1)
const LOOK_END = new THREE.Vector3(0, DESK_HEIGHT - 0.05, -1.1)
const SIT_DURATION = 1.6

function CameraRig({ onSettled }) {
  const { camera } = useThree()
  const progress = useRef(0)
  const settledFired = useRef(false)

  useFrame((_, delta) => {
    if (progress.current >= 1) return
    progress.current = Math.min(1, progress.current + delta / SIT_DURATION)
    const eased = 1 - Math.pow(1 - progress.current, 3)
    camera.position.lerpVectors(CAMERA_START, CAMERA_END, eased)
    camera.lookAt(LOOK_START.clone().lerp(LOOK_END, eased))

    if (progress.current >= 1 && !settledFired.current) {
      settledFired.current = true
      onSettled?.()
    }
  })

  return null
}

// One idea's Workshop room — reached by walking through the door that
// appears on its bloomed bonsai. The 3D scene here is purely
// atmosphere (desk, chair, four walls); the actual working surface —
// brief, task list, journal, AI check-in — is the 2D WorkshopDashboard
// overlay rendered on top once the camera settles, the same
// 3D-backdrop-plus-2D-overlay split the Garden uses for IdeaWorkspace.
export default function Room({ onSettled }) {
  return (
    <Canvas camera={{ position: CAMERA_START.toArray(), fov: 50 }} gl={{ antialias: true }}>
      <fog attach="fog" args={['#221a12', 3, 10]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 2.6, 0.5]} intensity={1.6} color="#ffcf8a" distance={8} decay={2} />
      <pointLight position={[-1.5, 1.8, 1.5]} intensity={0.5} color="#8ea3c9" distance={8} decay={2} />

      <RoomShell />

      <group position={DESK_POSITION}>
        <mesh geometry={deskGeometry.geometry}>
          <meshStandardMaterial vertexColors roughness={0.7} />
        </mesh>
        <mesh geometry={deskGeometry.outline}>
          <meshBasicMaterial color="#120a05" side={THREE.BackSide} toneMapped={false} />
        </mesh>
      </group>

      <group position={CHAIR_POSITION}>
        <mesh geometry={chairGeometry.geometry}>
          <meshStandardMaterial vertexColors roughness={0.8} />
        </mesh>
        <mesh geometry={chairGeometry.outline}>
          <meshBasicMaterial color="#120a05" side={THREE.BackSide} toneMapped={false} />
        </mesh>
      </group>

      <CameraRig onSettled={onSettled} />

      <EffectComposer>
        <Bloom intensity={0.4} luminanceThreshold={0.5} luminanceSmoothing={0.6} mipmapBlur />
      </EffectComposer>
    </Canvas>
  )
}
