import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

const ROTATION_SPEED = 0.004;

function WireframeMesh() {
  const { scene } = useGLTF('/models/human-body.glb');

  const wireframeMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#C0F0F8',
        wireframe: true,
        transparent: true,
        opacity: 0.55,
      }),
    []
  );

  const glowMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#00E5FF',
        transparent: true,
        opacity: 0.06,
        side: THREE.FrontSide,
      }),
    []
  );

  const { wireScene, glowScene } = useMemo(() => {
    const wClone = SkeletonUtils.clone(scene);
    wClone.traverse((child) => {
      if (child instanceof THREE.Mesh) child.material = wireframeMaterial;
    });
    const gClone = SkeletonUtils.clone(scene);
    gClone.traverse((child) => {
      if (child instanceof THREE.Mesh) child.material = glowMaterial;
    });
    return { wireScene: wClone, glowScene: gClone };
  }, [scene, wireframeMaterial, glowMaterial]);

  return (
    <group>
      <primitive object={wireScene} />
      <primitive object={glowScene} />
    </group>
  );
}

export function WireframeBody() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += ROTATION_SPEED;
    }
  });

  return (
    <group ref={groupRef}>
      <group rotation={[0, 0, Math.PI / 2]} scale={0.2} position={[0, -1.8, 0]}>
        <WireframeMesh />
      </group>

      {/* Base ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.8, 0]}>
        <ringGeometry args={[0.8, 0.85, 64]} />
        <meshBasicMaterial
          color="#00E5FF"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

useGLTF.preload('/models/human-body.glb');
