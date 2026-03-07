import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export function WireframeBody() {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/human-body.glb');

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
    }
  });

  const wireframeMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#B0E8F0',
        wireframe: true,
        transparent: true,
        opacity: 0.6,
      }),
    []
  );

  const glowMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#00E5FF',
        transparent: true,
        opacity: 0.08,
        side: THREE.FrontSide,
      }),
    []
  );

  // Clone scene and apply wireframe material
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = wireframeMaterial;
      }
    });
    return clone;
  }, [scene, wireframeMaterial]);

  // Create a subtle solid fill for glow effect
  const glowScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = glowMaterial;
      }
    });
    return clone;
  }, [scene, glowMaterial]);

  // Calculate bounds to center and scale the model
  const { scale, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetHeight = 3.2;
    const s = targetHeight / maxDim;
    return {
      scale: s,
      offset: new THREE.Vector3(-center.x * s, -center.y * s + 0.2, -center.z * s),
    };
  }, [clonedScene]);

  return (
    <group ref={groupRef}>
      <group scale={[scale, scale, scale]} position={[offset.x, offset.y, offset.z]}>
        <primitive object={clonedScene} />
        <primitive object={glowScene} />
      </group>

      {/* Base ring / halo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, 0]}>
        <ringGeometry args={[0.55, 0.58, 64]} />
        <meshBasicMaterial color="#00E5FF" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Preload the model
useGLTF.preload('/models/human-body.glb');
