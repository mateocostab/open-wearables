import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function WireframeBody() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
    }
  });

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#00E5FF',
        wireframe: true,
        transparent: true,
        opacity: 0.7,
      }),
    [],
  );

  const jointMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#00E5FF',
        transparent: true,
        opacity: 0.9,
      }),
    [],
  );

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh position={[0, 1.7, 0]} material={material}>
        <sphereGeometry args={[0.25, 12, 8]} />
      </mesh>

      {/* Neck joint */}
      <mesh position={[0, 1.4, 0]} material={jointMaterial}>
        <sphereGeometry args={[0.05, 8, 6]} />
      </mesh>

      {/* Torso */}
      <mesh position={[0, 0.9, 0]} material={material}>
        <cylinderGeometry args={[0.3, 0.25, 1, 8]} />
      </mesh>

      {/* Hip joint */}
      <mesh position={[0, 0.4, 0]} material={jointMaterial}>
        <sphereGeometry args={[0.06, 8, 6]} />
      </mesh>

      {/* Left shoulder joint */}
      <mesh position={[-0.35, 1.3, 0]} material={jointMaterial}>
        <sphereGeometry args={[0.05, 8, 6]} />
      </mesh>

      {/* Right shoulder joint */}
      <mesh position={[0.35, 1.3, 0]} material={jointMaterial}>
        <sphereGeometry args={[0.05, 8, 6]} />
      </mesh>

      {/* Left upper arm */}
      <mesh
        position={[-0.5, 1.05, 0]}
        rotation={[0, 0, 0.3]}
        material={material}
      >
        <cylinderGeometry args={[0.06, 0.05, 0.5, 6]} />
      </mesh>

      {/* Left elbow joint */}
      <mesh position={[-0.6, 0.8, 0]} material={jointMaterial}>
        <sphereGeometry args={[0.04, 8, 6]} />
      </mesh>

      {/* Left forearm */}
      <mesh
        position={[-0.65, 0.55, 0]}
        rotation={[0, 0, 0.1]}
        material={material}
      >
        <cylinderGeometry args={[0.05, 0.04, 0.5, 6]} />
      </mesh>

      {/* Right upper arm */}
      <mesh
        position={[0.5, 1.05, 0]}
        rotation={[0, 0, -0.3]}
        material={material}
      >
        <cylinderGeometry args={[0.06, 0.05, 0.5, 6]} />
      </mesh>

      {/* Right elbow joint */}
      <mesh position={[0.6, 0.8, 0]} material={jointMaterial}>
        <sphereGeometry args={[0.04, 8, 6]} />
      </mesh>

      {/* Right forearm */}
      <mesh
        position={[0.65, 0.55, 0]}
        rotation={[0, 0, -0.1]}
        material={material}
      >
        <cylinderGeometry args={[0.05, 0.04, 0.5, 6]} />
      </mesh>

      {/* Left upper leg */}
      <mesh position={[-0.15, 0.05, 0]} material={material}>
        <cylinderGeometry args={[0.08, 0.07, 0.7, 6]} />
      </mesh>

      {/* Left knee joint */}
      <mesh position={[-0.15, -0.3, 0]} material={jointMaterial}>
        <sphereGeometry args={[0.05, 8, 6]} />
      </mesh>

      {/* Left lower leg */}
      <mesh position={[-0.15, -0.65, 0]} material={material}>
        <cylinderGeometry args={[0.07, 0.05, 0.7, 6]} />
      </mesh>

      {/* Right upper leg */}
      <mesh position={[0.15, 0.05, 0]} material={material}>
        <cylinderGeometry args={[0.08, 0.07, 0.7, 6]} />
      </mesh>

      {/* Right knee joint */}
      <mesh position={[0.15, -0.3, 0]} material={jointMaterial}>
        <sphereGeometry args={[0.05, 8, 6]} />
      </mesh>

      {/* Right lower leg */}
      <mesh position={[0.15, -0.65, 0]} material={material}>
        <cylinderGeometry args={[0.07, 0.05, 0.7, 6]} />
      </mesh>
    </group>
  );
}
