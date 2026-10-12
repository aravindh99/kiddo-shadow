import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import {
  CAMERA,
  CAMERA_TARGET,
  ROBOT_GLTF_PATH,
  ROBOT_POSITION,
  ROBOT_ROTATION,
  ROBOT_SCALE,
} from "./robot.constants";
import { useRobot } from "./useRobot";

function RobotModel({ speaking }) {
  const { scene } = useGLTF(ROBOT_GLTF_PATH);
  const { blink } = useRobot({ speaking });

  // 🔴 PLACEHOLDER animation flags
  // Later: morphTargets for eyes / mouth
  scene.traverse((obj) => {
    if (obj.isMesh) {
      obj.material.emissiveIntensity = speaking ? 0.3: 0.1;
    }
  });

  return (
    <primitive
      object={scene}
      position={ROBOT_POSITION}
      scale={ROBOT_SCALE}
      rotation={ROBOT_ROTATION}
    />
  );
}

export default function RobotScene({ speaking }) {
  return (
    <Canvas
      camera={{
        position: CAMERA.position,
        fov: CAMERA.fov,
      }}
      dpr={[1, 1.5]}
      style={{ height: "clamp(180px, 32vh, 250px)", width: "100%", display: "block" }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 3, 3]} intensity={1} />

      <RobotModel speaking={speaking} />

      {/* lock controls for now */}
      <OrbitControls
        enableZoom={false}
        enableRotate={false}
        enablePan={false}
        target={CAMERA_TARGET}
      />
    </Canvas>
  );
}
