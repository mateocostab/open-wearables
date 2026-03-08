import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const ROTATION_SPEED = 0.004;
const TARGET_HEIGHT = 3.5;
const HALF_HEIGHT = TARGET_HEIGHT / 2;
const CYAN = '#00E5FF';
const WIRE_COLOR = '#C0F0F8';

interface ModelTransform {
  rotation: [number, number, number];
  scale: number;
  position: [number, number, number];
}

/**
 * Compute rotation, scale, and position to orient a skinned model upright at origin.
 *
 * Uses Box3.setFromObject for scale/position (captures full scene hierarchy transforms).
 * Uses boneInverses for orientation heuristic (head direction via bone density).
 */
function computeModelTransform(
  scene: THREE.Object3D,
  targetHeight: number
): ModelTransform | null {
  let skinned: THREE.SkinnedMesh | null = null;
  scene.traverse((child) => {
    if (child instanceof THREE.SkinnedMesh && !skinned) {
      skinned = child as THREE.SkinnedMesh;
    }
  });
  if (!skinned) return null;

  scene.updateWorldMatrix(true, true);
  const sceneBox = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  sceneBox.getSize(size);
  sceneBox.getCenter(center);

  const axes: Array<{ axis: 'x' | 'y' | 'z'; extent: number }> = [
    { axis: 'x', extent: size.x },
    { axis: 'y', extent: size.y },
    { axis: 'z', extent: size.z },
  ];
  axes.sort((a, b) => b.extent - a.extent);
  const tallAxis = axes[0].axis;
  const tallExtent = axes[0].extent;

  const boneInverses = skinned.skeleton.boneInverses;
  const tempMat = new THREE.Matrix4();
  const localBonePositions: THREE.Vector3[] = [];

  for (let i = 0; i < boneInverses.length; i++) {
    tempMat.copy(boneInverses[i]).invert();
    const pos = new THREE.Vector3();
    pos.setFromMatrixPosition(tempMat);
    localBonePositions.push(pos);
  }

  const boneBox = new THREE.Box3();
  for (const p of localBonePositions) boneBox.expandByPoint(p);
  const boneSize = new THREE.Vector3();
  const boneCenter = new THREE.Vector3();
  boneBox.getSize(boneSize);
  boneBox.getCenter(boneCenter);

  const boneTallAxis =
    boneSize.y >= boneSize.x && boneSize.y >= boneSize.z
      ? 'y'
      : boneSize.x >= boneSize.z
        ? 'x'
        : 'z';

  const boneMidpoint = boneCenter[boneTallAxis];
  let countAbove = 0;
  let countBelow = 0;
  for (const p of localBonePositions) {
    if (p[boneTallAxis] >= boneMidpoint) countAbove++;
    else countBelow++;
  }
  const localHeadSign = countAbove >= countBelow ? 1 : -1;
  const headSign = boneTallAxis === tallAxis ? localHeadSign : 1;

  let rx = 0,
    ry = 0,
    rz = 0;
  if (tallAxis === 'z') {
    rx = headSign > 0 ? -Math.PI / 2 : Math.PI / 2;
  } else if (tallAxis === 'x') {
    rz = headSign > 0 ? Math.PI / 2 : -Math.PI / 2;
  } else if (headSign < 0) {
    rz = Math.PI;
  }

  const rotation: [number, number, number] = [rx, ry, rz];
  const scale = targetHeight / tallExtent;

  const rotEuler = new THREE.Euler(rx, ry, rz);
  const rotatedCenter = center.clone().applyEuler(rotEuler);
  const position: [number, number, number] = [
    -rotatedCenter.x * scale,
    -rotatedCenter.y * scale,
    -rotatedCenter.z * scale,
  ];

  return { rotation, scale, position };
}

// ---------------------------------------------------------------------------
// Wireframe body mesh — single clone (no glow clone for perf)
// ---------------------------------------------------------------------------

function WireframeMesh({ scene }: { scene: THREE.Object3D }) {
  const wireframeMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: WIRE_COLOR,
        wireframe: true,
        transparent: true,
        opacity: 0.55,
      }),
    []
  );

  const clone = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    c.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh) {
        child.material = wireframeMaterial;
      }
    });
    return c;
  }, [scene, wireframeMaterial]);

  // Subtle pulse
  useFrame(({ clock }) => {
    wireframeMaterial.opacity = 0.50 + Math.sin(clock.getElapsedTime() * 1.5) * 0.05;
  });

  return <primitive object={clone} />;
}

// ---------------------------------------------------------------------------
// Scan ring — thin ring that sweeps up and down the body
// ---------------------------------------------------------------------------

function ScanRing() {
  const ringRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t = clock.getElapsedTime();
    ringRef.current.position.y = Math.sin(t * 0.5) * HALF_HEIGHT * 0.9;
    if (matRef.current) {
      matRef.current.opacity = 0.55 + Math.sin(t * 4) * 0.2;
    }
  });

  return (
    <group ref={ringRef}>
      {/* Bright scan ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.85, 0.98, 48]} />
        <meshBasicMaterial
          ref={matRef}
          color="#33FFEE"
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Data particles — float upward around the body
// ---------------------------------------------------------------------------

const PARTICLE_COUNT = 30;

function DataParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const frameCount = useRef(0);

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.5 + Math.random() * 0.7;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * TARGET_HEIGHT;
      pos[i * 3 + 2] = Math.sin(angle) * r;
      vel[i] = 0.006 + Math.random() * 0.015;
    }
    return { positions: pos, velocities: vel };
  }, []);

  // Update every 3rd frame to reduce CPU overhead
  useFrame(() => {
    frameCount.current++;
    if (frameCount.current % 3 !== 0) return;
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.getAttribute(
      'position'
    ) as THREE.BufferAttribute;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let y = pos.getY(i) + velocities[i];
      if (y > HALF_HEIGHT) y = -HALF_HEIGHT;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={PARTICLE_COUNT}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={CYAN}
        size={0.025}
        transparent
        opacity={0.45}
        sizeAttenuation
      />
    </points>
  );
}

// ---------------------------------------------------------------------------
// Base platform — concentric rings + rotating hexagonal outer ring
// ---------------------------------------------------------------------------

function BasePlatform() {
  const hexRingRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (hexRingRef.current) {
      hexRingRef.current.rotation.z = clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <group position={[0, -HALF_HEIGHT, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Ground glow fill */}
      <mesh position={[0, 0, -0.02]}>
        <circleGeometry args={[0.85, 32]} />
        <meshBasicMaterial
          color={CYAN}
          transparent
          opacity={0.02}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Inner ring */}
      <mesh>
        <ringGeometry args={[0.45, 0.47, 32]} />
        <meshBasicMaterial
          color={CYAN}
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Main ring */}
      <mesh>
        <ringGeometry args={[0.8, 0.85, 32]} />
        <meshBasicMaterial
          color={CYAN}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Outer hexagonal ring (rotating) */}
      <mesh ref={hexRingRef}>
        <ringGeometry args={[1.1, 1.14, 6]} />
        <meshBasicMaterial
          color={CYAN}
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Far outer ring */}
      <mesh>
        <ringGeometry args={[1.3, 1.32, 32]} />
        <meshBasicMaterial
          color={CYAN}
          transparent
          opacity={0.04}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export function WireframeBody() {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/human-body.glb');

  const transform = useMemo(
    () => computeModelTransform(scene, TARGET_HEIGHT),
    [scene]
  );

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += ROTATION_SPEED;
    }
  });

  if (!transform) return null;

  const { rotation, scale, position } = transform;

  return (
    <group ref={groupRef}>
      <group
        rotation={rotation}
        scale={[scale, scale, scale]}
        position={position}
      >
        <WireframeMesh scene={scene} />
      </group>
      <ScanRing />
      <DataParticles />
      <BasePlatform />
    </group>
  );
}

useGLTF.preload('/models/human-body.glb');
