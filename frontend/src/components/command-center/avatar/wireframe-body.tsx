import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Target height in scene units — tweak this to fill the viewport
const TARGET_HEIGHT = 3.2;
// Rotation speed (radians per frame at 60fps)
const ROTATION_SPEED = 0.005;

export function WireframeBody() {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.MeshBasicMaterial>(null);
  const { scene } = useGLTF('/models/human-body.glb');

  // Rotate on own axis + pulsing glow
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

  // Clone, apply materials, compute bounding box
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

    // Compute bounding box to auto-center and scale
    const box = new THREE.Box3().setFromObject(wClone);
    const size = box.getSize(new THREE.Vector3());
    const c = box.getCenter(new THREE.Vector3());

    // Scale so the model's height == TARGET_HEIGHT
    const s = TARGET_HEIGHT / size.y;

    return { wireScene: wClone, glowScene: gClone, scale: s, center: c };
  }, [scene, wireframeMaterial, glowMaterial]);

  // Position offsets: center the model at world origin
  const offsetX = -center.x * scale;
  const offsetY = -center.y * scale;
  const offsetZ = -center.z * scale;
  // Bottom of model in world space
  const baseY = offsetY - TARGET_HEIGHT / 2;

  return (
    <group ref={groupRef}>
      <group
        scale={[scale, scale, scale]}
        position={[offsetX, offsetY, offsetZ]}
      >
        <primitive object={wireScene} />
        <primitive object={glowScene} />
      </group>

      {/* Glowing base ring at feet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, baseY, 0]}>
        <ringGeometry args={[0.55, 0.58, 64]} />
        <meshBasicMaterial
          ref={glowRef}
          color="#00E5FF"
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Subtle base disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, baseY - 0.01, 0]}>
        <circleGeometry args={[0.55, 64]} />
        <meshBasicMaterial
          color="#00E5FF"
          transparent
          opacity={0.03}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

useGLTF.preload('/models/human-body.glb');
