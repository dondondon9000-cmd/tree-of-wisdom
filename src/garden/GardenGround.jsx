// A sandy stone courtyard, distinct from the floating world's lush
// grass — the Garden is meant to feel like a calmer, more curated
// place you visit, not the same wild meadow.
export default function GardenGround() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[16, 48]} />
      <meshStandardMaterial color="#c9b896" roughness={1} />
    </mesh>
  )
}
