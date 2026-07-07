import { GROUND_CENTER } from './groundLevel'

export default function Ground() {
  return (
    <mesh position={GROUND_CENTER} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[42, 32]} />
      <meshStandardMaterial color="#3d5a2c" roughness={1} />
    </mesh>
  )
}
