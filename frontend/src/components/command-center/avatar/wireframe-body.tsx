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

  // Clone and apply materials
  const { wireScene, glowScene, scale, center } = useMemo(() => {
    const wClone = scene.clone(true);
    wClone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = wireframeMaterial;
      }
    });

    const gClone = scene.clone(true);
    gClone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = glowMaterial;
      }
    });

    // Calculate bounding box to auto-fit
    const box = new THREE.Box3().setFromObject(wClone);
    const size = box.getSize(new THREE.Vector3());
    const c = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    // Target: fit the model in ~3.5 units tall
    const s = 3.5 / maxDim;

    return { wireScene: wClone, glowScene: gClone, scale: s, center: c };
  }, [scene, wireframeMaterial, glowMaterial]);

  return (
    <group ref={groupRef}>
      <group
        scale={[scale, scale, scale]}
        position={[-center.x * scale, -center.y * scale, -center.z * scale]}
      >
        <primitive object={wireScene} />
        <primitive object={glowScene} />
      </group>

      {/* Base ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.75, 0]}>
        <ringGeometry args={[0.6, 0.63, 64]} />
        <meshBasicMaterial
          color="#00E5FF"
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

useGLTF.preload('/models/human-body.glb');
