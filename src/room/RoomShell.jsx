// The room's floor and walls — plain flat-colored planes, same
// "simple surface" approach as GardenGround.jsx. Only a back wall and
// two short side-wall stubs exist, since the fixed camera (see
// Room.jsx) never turns far enough to see behind itself; a full
// enclosed box would be wasted geometry.
const ROOM_WIDTH = 6
const ROOM_DEPTH = 6
const WALL_HEIGHT = 3.2

export default function RoomShell() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial color="#5a4632" roughness={1} />
      </mesh>

      <mesh position={[0, WALL_HEIGHT / 2, -ROOM_DEPTH / 2]}>
        <planeGeometry args={[ROOM_WIDTH, WALL_HEIGHT]} />
        <meshStandardMaterial color="#3a2f22" roughness={1} />
      </mesh>

      <mesh position={[-ROOM_WIDTH / 2, WALL_HEIGHT / 2, -ROOM_DEPTH / 4]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[ROOM_DEPTH / 2, WALL_HEIGHT]} />
        <meshStandardMaterial color="#332a1f" roughness={1} />
      </mesh>

      <mesh position={[ROOM_WIDTH / 2, WALL_HEIGHT / 2, -ROOM_DEPTH / 4]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[ROOM_DEPTH / 2, WALL_HEIGHT]} />
        <meshStandardMaterial color="#332a1f" roughness={1} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0.4]}>
        <circleGeometry args={[1.3, 32]} />
        <meshStandardMaterial color="#7a3f3a" roughness={1} />
      </mesh>
    </>
  )
}
