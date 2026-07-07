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
      <ambientLight intensity={0.15} />

      <Stars radius={60} depth={30} count={2500} factor={2} saturation={0} fade speed={0.4} />

      <SeedField />
      <TalkSeed position={[0, 0, -1.5]} />

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={10}
        enableDamping
        dampingFactor={0.05}
        autoRotate
        autoRotateSpeed={0.15}
      />

      <EffectComposer>
        <Bloom intensity={0.9} luminanceThreshold={0.15} luminanceSmoothing={0.9} mipmapBlur />
      </EffectComposer>
    </Canvas>
  )
}
