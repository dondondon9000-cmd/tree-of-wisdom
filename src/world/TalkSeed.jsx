import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGardenStore } from '../lib/store'
import { seedGeometry } from './seedGeometry'
import { glowTexture } from './glowTexture'

// The talk button. Not a microphone icon — a seed that breathes faster
// and brighter than the rest to draw the eye, and flares when pressed.
// Voice capture itself isn't wired up yet (step 2); this just gives the
// press/hover/recording states something real to react to.
const BASE_SIZE = 0.55

export default function TalkSeed({ position = [0, 0, -2] }) {
  const mesh = useRef()
  const material = useRef()
  const glow = useRef()
  const [hovered, setHovered] = useState(false)
  const isRecording = useGardenStore((s) => s.isRecording)
  const startRecording = useGardenStore((s) => s.startRecording)
  const stopRecording = useGardenStore((s) => s.stopRecording)

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime()
    const breathSpeed = isRecording ? 2.2 : 0.9
    const breath = Math.sin(t * breathSpeed)

    mesh.current.rotation.y += 0.05 * delta
    mesh.current.rotation.x += 0.015 * delta

    const baseScale = hovered ? 1.15 : 1
    const recordScale = isRecording ? 1.25 : 1
    mesh.current.scale.setScalar(BASE_SIZE * baseScale * recordScale * (1 + breath * 0.08))

    if (material.current) {
      const baseIntensity = isRecording ? 0.9 : 0.32
      material.current.emissiveIntensity = baseIntensity + breath * 0.12
    }

    if (glow.current) {
      glow.current.scale.setScalar(3.2 + breath * 0.3)
      glow.current.material.opacity = (isRecording ? 0.85 : 0.55) + breath * 0.1
    }
  })

  return (
    <mesh
      ref={mesh}
      position={position}
      geometry={seedGeometry}
      onClick={() => (isRecording ? stopRecording() : startRecording())}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <meshStandardMaterial
        ref={material}
        color="#fff4e6"
        vertexColors
        emissive="#ffcf6b"
        emissiveIntensity={0.32}
        roughness={0.35}
        metalness={0.08}
        toneMapped={false}
      />
      <mesh geometry={seedGeometry} scale={1.06}>
        <meshBasicMaterial color="#120a05" side={THREE.BackSide} toneMapped={false} />
      </mesh>
      <sprite ref={glow} renderOrder={-1}>
        <spriteMaterial
          map={glowTexture}
          color="#1fb058"
          transparent
          opacity={0.35}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
    </mesh>
  )
}
