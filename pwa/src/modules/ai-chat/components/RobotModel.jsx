import { useRef, useEffect } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { ROBOT_GLTF_PATH, ROBOT_SCALE, ROBOT_POSITION } from "../../../Three/robot.constants";

export default function RobotModel({ speaking, position, scale, rotation }) {
    const group = useRef();
    const { scene, animations } = useGLTF(ROBOT_GLTF_PATH);
    const { actions } = useAnimations(animations, group);

    useEffect(() => {
        // Play Idle animation by default
        // Safety check: if no actions, simple return
        if (!actions || Object.keys(actions).length === 0) return;

        const idleAction = actions["Idle"] || actions[Object.keys(actions)[0]];
        if (idleAction) {
            idleAction.reset().fadeIn(0.5).play();
        }

        // If speaking, blend to Talk animation if available
        if (speaking && actions["Talk"]) {
            actions["Talk"].reset().fadeIn(0.2).play();
        } else if (actions["Talk"]) {
            actions["Talk"].fadeOut(0.2);
        }

    }, [actions, speaking]);

    const finalScale = scale || ROBOT_SCALE;
    const finalPosition = position || ROBOT_POSITION;
    const finalRotation = rotation || [0, Math.PI, 0];

    return (
        <group ref={group} dispose={null} scale={finalScale} position={finalPosition} rotation={finalRotation}>
            <primitive object={scene} />
        </group>
    );
}

useGLTF.preload(ROBOT_GLTF_PATH);
