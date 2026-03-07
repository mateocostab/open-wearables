import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * A horizontal scan line that sweeps up and down the body,
 * giving a futuristic holographic scanning effect.
 */
export function ScanPlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  // Vertical range the scan line travels
  const bottom = -1.6;
  const top = 1.6;

  useFrame(({ clock }) => {
    if (!meshRef.current || !matRef.current) return;
    const t = clock.getElapsedTime();
    // Ping-pong between bottom and top over ~4 seconds
    const phase = ((t * 0.25) % 1); // 0..1 over 4s
    const ping = phase < 0.5 ? phase * 2 : 2 - phase * 2; // 0→1→0
    meshRef.current.position.y = bottom + ping * (top - bottom);

    // Fade opacity: brighter at center, dim at edges
    matRef.current.opacity = 0.12 + Math.sin(t * 3) * 0.04;
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[2.5, 2.5]} />
      <meshBasicMaterial
        ref={matRef}
        color="#00E5FF"
        transparent
        opacity={0.12}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
