// The base lawn — grass-colored now rather than plain sand/stone, with
// GardenGrass laid on top for texture and GardenPath cutting a stone
// walkway ring through it around the bonsai.
export default function GardenGround() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[16, 48]} />
      <meshStandardMaterial color="#3d5a2c" roughness={1} />
    </mesh>
  )
}
