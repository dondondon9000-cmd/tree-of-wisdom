import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import GardenSky from './GardenSky'
import WindPetals from './WindPetals'
import SeedField from './SeedField'
import TalkSeed from './TalkSeed'

export default function World() {
  return (
    <Canvas
      camera={{ position: [0, 0.5, 6], fov: 55 }}
      gl={{ antialias: true }}
    >
      <fog attach="fog" args={['#e9cba9', 10, 42]} />
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#aebfd8', '#4a5a3a', 0.45]} />
      <pointLight position={[3, 3, 5]} intensity={1.4} color="#ffe3b0" distance={26} decay={2} />

      <GardenSky />
      <mesh position={[0, -6, -6]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[42, 32]} />
        <meshStandardMaterial color="#4a5a3a" roughness={1} />
      </mesh>
      <WindPetals />

      <SeedField />
      <TalkSeed position={[0, 0, -1.5]} />

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={10}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI - 0.35}
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
