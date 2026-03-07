import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 60;

/**
 * Small glowing particles that float around the body,
 * giving a futuristic holographic data-stream feel.
 */
export function FloatingParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  // Generate random starting positions in a cylinder around the body
  const { positions, speeds } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const spd = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.6 + Math.random() * 1.2;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3.5; // vertical spread
      pos[i * 3 + 2] = Math.sin(angle) * radius;
      spd[i] = 0.2 + Math.random() * 0.5;
    }
    return { positions: pos, speeds: spd };
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const t = clock.getElapsedTime();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Slowly drift upward, wrap around
      let y = posAttr.getY(i) + speeds[i] * 0.005;
      if (y > 1.8) y = -1.8;
      posAttr.setY(i, y);

      // Gentle horizontal sway
      const x0 = positions[i * 3];
      const z0 = positions[i * 3 + 2];
      posAttr.setX(i, x0 + Math.sin(t * speeds[i] + i) * 0.08);
      posAttr.setZ(i, z0 + Math.cos(t * speeds[i] + i) * 0.08);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={PARTICLE_COUNT}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#00E5FF"
        size={0.025}
        transparent
        opacity={0.5}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
