import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import GardenSky from './GardenSky'
import Sun from './Sun'
import CloudField from './CloudField'
import Ground from './Ground'
import WindPetals from './WindPetals'
import GrassField from './GrassField'
import GroundSprouts from './GroundSprouts'
import SeedField from './SeedField'
import TalkSeed from './TalkSeed'
import CameraHUD from './CameraHUD'
import { GROUND_CENTER } from './groundLevel'

const BASE_MAX_DISTANCE = 15
// A flat maxPolarAngle can only ever pick one trade-off: either the
// camera can look up, or it's guaranteed to never dip below the
// ground — it can't give both across the whole zoom range, because
// how far below "level" the camera sits depends on both the angle
// AND how far zoomed out it is. So the angle limit itself is opened
// way up (you can now tilt close to straight up) and SkyLookGuard
// instead shrinks the allowed zoom-out distance in real time whenever
// you tilt above level, which is the actual thing that has to shrink
// to keep the camera above the ground at a steep upward angle.
const SAFE_FLOOR_Y = GROUND_CENTER[1] + 0.5

function SkyLookGuard({ controlsRef }) {
  useFrame(() => {
    const controls = controlsRef.current
    if (!controls) return
    const cos = Math.cos(controls.getPolarAngle())
    controls.maxDistance = cos < 0 ? Math.min(BASE_MAX_DISTANCE, SAFE_FLOOR_Y / cos) : BASE_MAX_DISTANCE
  })
  return null
}

export default function World() {
  const controlsRef = useRef()
  return (
    <Canvas
      camera={{ position: [0, 0.5, 6], fov: 55 }}
      gl={{ antialias: true }}
    >
      <fog attach="fog" args={['#e9cba9', 22, 85]} />
      <ambientLight intensity={0.45} />
      <hemisphereLight args={['#aebfd8', '#3d5a2c', 0.45]} />
      <pointLight position={[3, 3, 5]} intensity={1.4} color="#ffe3b0" distance={26} decay={2} />
      <pointLight position={[0, -1.5, -8]} intensity={1.8} color="#eaf0c8" distance={24} decay={2} />

      <GardenSky />
      <Sun />
      <CloudField />
      <Ground />
      <GrassField />
      <GroundSprouts />
      <WindPetals />

      <SeedField />
      <CameraHUD>
        <TalkSeed position={[0, -1.5, -4]} />
      </CameraHUD>

      <SkyLookGuard controlsRef={controlsRef} />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={BASE_MAX_DISTANCE}
        minPolarAngle={0.35}
        maxPolarAngle={3.05}
        enableDamping
        dampingFactor={0.05}
        autoRotate
        autoRotateSpeed={0.15}
      />

      <EffectComposer>
        <Bloom intensity={0.6} luminanceThreshold={0.4} luminanceSmoothing={0.6} mipmapBlur />
      </EffectComposer>
    </Canvas>
  )
}
