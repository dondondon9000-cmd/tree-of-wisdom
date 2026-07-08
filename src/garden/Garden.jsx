import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import GardenSkyDome from './GardenSkyDome'
import GardenGround from './GardenGround'
import BonsaiField from './BonsaiField'

// The Garden — a separate environment from the floating idea world,
// where planted ideas live on as bonsai trees. No talk seed, no
// recording flow here; this is purely a place to look at what you've
// already grown. The scripted fly-into-soil transition connecting the
// two scenes is a separate, later piece of work — for now, App.jsx
// just swaps between them.
export default function Garden() {
  return (
    <Canvas camera={{ position: [0, 3.5, 10], fov: 55 }} gl={{ antialias: true }}>
      <fog attach="fog" args={['#e8d5c0', 20, 55]} />
      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#8ea3c9', '#8a6f4a', 0.45]} />
      <pointLight position={[4, 6, 4]} intensity={1.3} color="#ffe3b0" distance={30} decay={2} />
      <pointLight position={[-4, 5, -4]} intensity={1.0} color="#eaf0c8" distance={30} decay={2} />

      <GardenSkyDome />
      <GardenGround />
      <BonsaiField />

      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={4}
        maxDistance={20}
        minPolarAngle={0.3}
        maxPolarAngle={1.5}
        enableDamping
        dampingFactor={0.05}
        autoRotate
        autoRotateSpeed={0.1}
      />

      <EffectComposer>
        <Bloom intensity={0.5} luminanceThreshold={0.4} luminanceSmoothing={0.6} mipmapBlur />
      </EffectComposer>
    </Canvas>
  )
}
