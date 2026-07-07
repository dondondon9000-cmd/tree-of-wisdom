import { glowTexture } from './glowTexture'

// A fixed reference point in the sky — without one, orbiting the
// world feels like drifting in a featureless gradient with no sense
// of direction or place. Sits high and roughly "ahead" of the default
// view. Exempted from scene fog (like the sky dome) so it stays
// bright and doesn't wash out at this distance.
const POSITION = [26, 34, -55]

export default function Sun() {
  return (
    <group position={POSITION}>
      <sprite scale={16}>
        <spriteMaterial
          map={glowTexture}
          color="#ffdf9e"
          transparent
          opacity={0.55}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </sprite>
      <mesh>
        <sphereGeometry args={[2.4, 24, 24]} />
        <meshBasicMaterial color="#fff6df" fog={false} toneMapped={false} />
      </mesh>
    </group>
  )
}
