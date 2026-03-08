import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const ROTATION_SPEED = 0.004;

export function WireframeBody() {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.MeshBasicMaterial>(null);
  const { scene } = useGLTF('/models/human-body.glb');
  const { camera } = useThree();

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

  // After mount, compute the world-space bounding box and fit the camera
  useEffect(() => {
    if (!groupRef.current) return;

    // Force a matrix update so skinned mesh transforms are applied
    groupRef.current.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(groupRef.current);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Move the camera to see the whole model with generous padding
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
    const dist = maxDim / (2 * Math.tan(fov / 2)) * 1.9;

    // Position camera slightly right and at body center height, looking at center
    camera.position.set(center.x + dist * 0.15, center.y + maxDim * 0.05, center.z + dist);
    camera.lookAt(center.x, center.y + maxDim * 0.05, center.z);
    camera.updateProjectionMatrix();
  }, [wireScene, camera]);

  // Compute base ring position from the bounding box
  const ringY = useMemo(() => {
    const tempGroup = new THREE.Group();
    tempGroup.add(wireScene.clone(true));
    tempGroup.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(tempGroup);
    return box.min.y;
  }, [wireScene]);

  return (
    <group ref={groupRef}>
      <primitive object={wireScene} />
      <primitive object={glowScene} />

      {/* Base ring at feet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, ringY, 0]}>
        <ringGeometry args={[2.0, 2.1, 64]} />
        <meshBasicMaterial
          ref={glowRef}
          color="#00E5FF"
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, ringY - 0.01, 0]}>
        <circleGeometry args={[2.0, 64]} />
        <meshBasicMaterial
          color="#00E5FF"
          transparent
          opacity={0.02}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

useGLTF.preload('/models/human-body.glb');
