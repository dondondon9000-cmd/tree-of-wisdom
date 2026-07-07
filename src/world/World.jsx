import { Canvas } from '@react-three/fiber'
import { Stars, OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import SeedField from './SeedField'
import TalkSeed from './TalkSeed'

export default function World() {
  return (
    <Canvas
      camera={{ position: [0, 0.5, 6], fov: 55 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#05040c']} />
      <fog attach="fog" args={['#05040c', 8, 22]} />
      <ambientLight intensity={0.12} />
      <hemisphereLight args={['#fff1e0', '#150c05', 0.22]} />
      <pointLight position={[3, 3, 5]} intensity={1.5} color="#ffe3b0" distance={22} decay={2} />

      <Stars radius={60} depth={30} count={2500} factor={2} saturation={0} fade speed={0.4} />

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
        <Bloom intensity={0.7} luminanceThreshold={0.4} luminanceSmoothing={0.6} mipmapBlur />
      </EffectComposer>
    </Canvas>
  )
}
