import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const TARGET_HEIGHT = 3.2;
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

  const { wireScene, glowScene, scale, yOffset, baseY } = useMemo(() => {
    // Clone and apply materials
    const wClone = scene.clone(true);
    wClone.traverse((child) => {
      if (child instanceof THREE.Mesh) child.material = wireframeMaterial;
    });

    const gClone = scene.clone(true);
    gClone.traverse((child) => {
      if (child instanceof THREE.Mesh) child.material = glowMaterial;
    });

    // The model's armature rotates ~105 degrees around X, so the body
    // extends along -Z instead of +Y. Fix by rotating PI/2 around X.
    wClone.rotation.x = Math.PI / 2;
    wClone.updateMatrixWorld(true);
    gClone.rotation.x = Math.PI / 2;
    gClone.updateMatrixWorld(true);

    // Now compute bounding box (model should be upright along Y)
    const box = new THREE.Box3().setFromObject(wClone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Scale so the tallest dimension fits TARGET_HEIGHT
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = TARGET_HEIGHT / maxDim;

    // Center the model at origin
    const yOff = -center.y * s;

    // Bottom of model
    const bY = (box.min.y - center.y) * s;

    return {
      wireScene: wClone,
      glowScene: gClone,
      scale: s,
      yOffset: yOff,
      baseY: bY,
    };
  }, [scene, wireframeMaterial, glowMaterial]);

  return (
    <group ref={groupRef}>
      <group scale={[scale, scale, scale]} position={[0, yOffset / scale, 0]}>
        <primitive object={wireScene} />
        <primitive object={glowScene} />
      </group>

      {/* Glowing base ring at feet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, baseY, 0]}>
        <ringGeometry args={[0.5, 0.53, 64]} />
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
        <circleGeometry args={[0.5, 64]} />
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
