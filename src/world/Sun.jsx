import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { glowTexture } from './glowTexture'
import { sunDiscGeometry, sunRayGeometry } from './sunGeometry'
import SeedOutline from './SeedOutline'

// A fixed reference point in the sky — without one, orbiting the
// world feels like drifting in a featureless gradient with no sense
// of direction or place. Fixed in world space (not tied to the
// camera), so as you orbit it shifts relative to you the way a real
// sun would, giving genuine spatial orientation.
//
// The disc (gradient + black outline, matching the seeds' style) and
// ray-burst give it real shape; the soft glow sprite behind it is now
// just a subtle accent rather than the whole visual — a plain bright
// glow sprite with no defined edge read as an undefined "faded" blob.
const POSITION = [26, 34, -55]

export default function Sun() {
  const rays = useRef()

  useFrame(({ camera }) => {
    if (rays.current) rays.current.quaternion.copy(camera.quaternion)
  })

  return (
    <group position={POSITION}>
      <sprite scale={11}>
        <spriteMaterial
          map={glowTexture}
          color="#ffdf9e"
          transparent
          opacity={0.3}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </sprite>

      <mesh ref={rays} geometry={sunRayGeometry}>
        <meshBasicMaterial vertexColors side={THREE.DoubleSide} fog={false} toneMapped={false} />
      </mesh>

      <mesh geometry={sunDiscGeometry}>
        <meshBasicMaterial vertexColors fog={false} toneMapped={false} />
        <SeedOutline geometry={sunDiscGeometry} scale={1.05} />
      </mesh>
    </group>
  )
}
