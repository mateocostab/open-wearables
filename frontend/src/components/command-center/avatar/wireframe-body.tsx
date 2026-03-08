import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const ROTATION_SPEED = 0.004;

export function WireframeBody() {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.MeshBasicMaterial>(null);
  const { scene } = useGLTF('/models/human-body.glb');

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += ROTATION_SPEED;
    }
    if (glowRef.current) {
      const t = clock.getElapsedTime();
      glowRef.current.opacity = 0.04 + Math.sin(t * 1.5) * 0.03;
    }
  });

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
    const wClone = scene.clone(true);
    wClone.traverse((child) => {
      if (child instanceof THREE.Mesh) child.material = wireframeMaterial;
    });
    const gClone = scene.clone(true);
    gClone.traverse((child) => {
      if (child instanceof THREE.Mesh) child.material = glowMaterial;
    });
    return { wireScene: wClone, glowScene: gClone };
  }, [scene, wireframeMaterial, glowMaterial]);

  // Model bounding box (from analysis):
  // Y: -1.47 to 2.21 (height ~3.68), X: -3.29 to 3.35 (width ~6.64)
  // Z: -17.86 to -0.12 (depth ~17.74)
  // Center: (0.03, 0.37, -8.99)
  // The body faces +Z direction, feet near Z=0, head near Z=-18

  return (
    <group ref={groupRef}>
      <primitive object={wireScene} />
      <primitive object={glowScene} />

      {/* Base ring at feet - positioned at Y=-1.5, at the Z center of model */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, -9]}>
        <ringGeometry args={[3.0, 3.2, 64]} />
        <meshBasicMaterial
          ref={glowRef}
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
