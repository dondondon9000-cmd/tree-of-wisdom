import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { driftOffset } from '../lib/noise'
import { seedGeometry } from './seedGeometry'
import SeedOutline from './SeedOutline'
import Sprout from './Sprout'

// A single floating idea. Drifts on a noise-based flow field (never a
// straight line or constant speed), tumbles slowly so its tapered seed
// shape actually reads as it moves, and softly "breathes" — a slow
// pulse in scale and glow, even at rest. The title only resolves into
// readable text once the camera is close, so the field reads as calm
// glowing shapes from a distance and reveals itself as you approach.
export default function Seed({ position, title, color = '#fff1e0', radius = 0.45, driftRadius = 0.9 }) {
  const group = useRef()
  const mesh = useRef()
  const material = useRef()
  const label = useRef()

  const noiseSeed = useMemo(() => Math.random() * 1000, [])
  const breathPhase = useMemo(() => Math.random() * Math.PI * 2, [])
  const breathSpeed = useMemo(() => 0.5 + Math.random() * 0.3, [])
  const driftSpeed = useMemo(() => 0.03 + Math.random() * 0.02, [])
  const sproutStage = useMemo(() => Math.random(), [])
  const spin = useMemo(
    () => [
      (Math.random() - 0.5) * 0.15,
      (Math.random() - 0.5) * 0.15,
      (Math.random() - 0.5) * 0.1,
    ],
    []
  )

  useFrame(({ clock, camera }, delta) => {
    const t = clock.getElapsedTime()

    const [dx, dy, dz] = driftOffset(noiseSeed, t, driftSpeed)
    group.current.position.set(
      position[0] + dx * driftRadius,
      position[1] + dy * driftRadius,
      position[2] + dz * driftRadius
    )

    mesh.current.rotation.x += spin[0] * delta
    mesh.current.rotation.y += spin[1] * delta
    mesh.current.rotation.z += spin[2] * delta

    const breath = Math.sin(t * breathSpeed + breathPhase)
    const scale = radius * (1 + breath * 0.12)
    mesh.current.scale.setScalar(scale)
    if (material.current) {
      material.current.emissiveIntensity = 0.25 + breath * 0.12
    }

    if (label.current) {
      const dist = camera.position.distanceTo(group.current.position)
      const opacity = 1 - Math.min(Math.max((dist - 3) / 5, 0), 1)
      label.current.fillOpacity = opacity
      label.current.material.transparent = true
    }
  })

  return (
    <group ref={group}>
      <mesh ref={mesh} geometry={seedGeometry}>
        <meshStandardMaterial
          ref={material}
          color={color}
          vertexColors
          emissive="#ffb347"
          emissiveIntensity={0.25}
          roughness={0.38}
          metalness={0.08}
          toneMapped={false}
        />
        <SeedOutline geometry={seedGeometry} />
        <group position={[0, 0.46, 0]}>
          <Sprout stage={sproutStage} />
        </group>
      </mesh>
      {title && (
        <Text
          ref={label}
          font="/fonts/manrope-400.woff"
          position={[0, radius * 0.7 + 0.35, 0]}
          fontSize={0.22}
          color="#fff6e6"
          anchorX="center"
          anchorY="bottom"
          fillOpacity={0}
        >
          {title}
        </Text>
      )}
    </group>
  )
}
