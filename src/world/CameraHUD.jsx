import { useEffect } from 'react'
import { createPortal, useThree } from '@react-three/fiber'

// Renders children as children of the camera itself instead of the
// scene, so they stay at a fixed position/size on screen no matter how
// the camera orbits or zooms — used to lock the talk seed to a fixed
// spot instead of it drifting around as the user orbits the world.
export default function CameraHUD({ children }) {
  const { camera, scene } = useThree()

  useEffect(() => {
    scene.add(camera)
    return () => scene.remove(camera)
  }, [camera, scene])

  return createPortal(children, camera)
}
