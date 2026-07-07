import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGardenStore } from '../lib/store'

// The talk button. Not a microphone icon — a seed that breathes faster
// and brighter than the rest to draw the eye, and flares when pressed.
// Voice capture itself isn't wired up yet (step 2); this just gives the
// press/hover/recording states something real to react to.
export default function TalkSeed({ position = [0, 0, -2] }) {
  const mesh = useRef()
  const material = useRef()
  const [hovered, setHovered] = useState(false)
  const isRecording = useGardenStore((s) => s.isRecording)
  const startRecording = useGardenStore((s) => s.startRecording)
  const stopRecording = useGardenStore((s) => s.stopRecording)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const breathSpeed = isRecording ? 2.2 : 0.9
    const breath = Math.sin(t * breathSpeed)

    const baseScale = hovered ? 1.15 : 1
    const recordScale = isRecording ? 1.25 : 1
    mesh.current.scale.setScalar(baseScale * recordScale * (1 + breath * 0.08))

    if (material.current) {
      const baseIntensity = isRecording ? 3.2 : 2
      material.current.emissiveIntensity = baseIntensity + breath * 0.5
    }
  })

  return (
    <mesh
      ref={mesh}
      position={position}
      onClick={() => (isRecording ? stopRecording() : startRecording())}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[0.4, 32, 32]} />
      <meshStandardMaterial
        ref={material}
        color="#ffe9b8"
        emissive="#ffcf6b"
        emissiveIntensity={2}
        roughness={0.25}
        toneMapped={false}
      />
    </mesh>
  )
}
