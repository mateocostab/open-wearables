import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const ROTATION_SPEED = 0.004;
const TARGET_HEIGHT = 3.5;

interface ModelTransform {
  rotation: [number, number, number];
  scale: number;
  position: [number, number, number];
}

/**
 * Compute rotation, scale, and position to orient a skinned model upright at origin.
 * Uses boneInverses (inverse bind matrices from the GLB) — no renderer needed.
 */
function computeModelTransform(
  scene: THREE.Object3D,
  targetHeight: number
): ModelTransform | null {
  // 1. Find first SkinnedMesh
  let skinned: THREE.SkinnedMesh | null = null;
  scene.traverse((child) => {
    if (child instanceof THREE.SkinnedMesh && !skinned) {
      skinned = child as THREE.SkinnedMesh;
    }
  });
  if (!skinned) return null;

  const skeleton = skinned.skeleton;
  const boneInverses = skeleton.boneInverses;

  // 2. Extract bind-pose bone positions by inverting each boneInverse matrix
  const bonePositions: THREE.Vector3[] = [];
  const tempMat = new THREE.Matrix4();

  for (let i = 0; i < boneInverses.length; i++) {
    tempMat.copy(boneInverses[i]).invert();
    const pos = new THREE.Vector3();
    pos.setFromMatrixPosition(tempMat);
    bonePositions.push(pos);
  }

  // 3. Build bounding box from bone positions
  const box = new THREE.Box3();
  for (const p of bonePositions) {
    box.expandByPoint(p);
  }
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  // 4. Identify tallest axis
  const axes: Array<{ axis: 'x' | 'y' | 'z'; extent: number }> = [
    { axis: 'x', extent: size.x },
    { axis: 'y', extent: size.y },
    { axis: 'z', extent: size.z },
  ];
  axes.sort((a, b) => b.extent - a.extent);
  const tallAxis = axes[0].axis;
  const tallExtent = axes[0].extent;

  // 5. Bone density heuristic for head direction:
  //    The half with MORE bones = head side (spine chain, arms, hands, fingers
  //    contribute many more bones than legs/feet)
  const midpoint = center[tallAxis];
  let countAbove = 0;
  let countBelow = 0;
  for (const p of bonePositions) {
    if (p[tallAxis] >= midpoint) countAbove++;
    else countBelow++;
  }
  // headSign: +1 if head is in the positive direction of tallAxis, -1 otherwise
  const headSign = countAbove >= countBelow ? 1 : -1;

  // 6. Compute rotation to align tallAxis → Y-up with head pointing +Y
  let rx = 0,
    ry = 0,
    rz = 0;
  if (tallAxis === 'z') {
    // Z is tall → rotate around X to bring Z to Y
    // headSign > 0: +Z has more bones (head), rotate -90° around X
    // headSign < 0: -Z has more bones (head), rotate +90° around X
    rx = headSign > 0 ? -Math.PI / 2 : Math.PI / 2;
  } else if (tallAxis === 'x') {
    // X is tall → rotate around Z to bring X to Y
    rz = headSign > 0 ? Math.PI / 2 : -Math.PI / 2;
  } else {
    // Y is already tall
    if (headSign < 0) {
      // Head is in -Y, flip 180° around Z
      rz = Math.PI;
    }
  }

  const rotation: [number, number, number] = [rx, ry, rz];

  // 7. Compute uniform scale
  const scale = targetHeight / tallExtent;

  // 8. Compute position offset: rotate center, negate, then scale
  const rotEuler = new THREE.Euler(rx, ry, rz);
  const rotatedCenter = center.clone().applyEuler(rotEuler);
  const position: [number, number, number] = [
    -rotatedCenter.x * scale,
    -rotatedCenter.y * scale,
    -rotatedCenter.z * scale,
  ];

  // Temporary debug log
  console.log('[WireframeBody] computeModelTransform:', {
    boneCount: bonePositions.length,
    tallAxis,
    tallExtent: tallExtent.toFixed(3),
    headSign,
    bonesAbove: countAbove,
    bonesBelow: countBelow,
    rotation: rotation.map((r) => ((r * 180) / Math.PI).toFixed(1) + '°'),
    scale: scale.toFixed(4),
    position: position.map((p) => p.toFixed(3)),
    center: [center.x.toFixed(3), center.y.toFixed(3), center.z.toFixed(3)],
    size: [size.x.toFixed(3), size.y.toFixed(3), size.z.toFixed(3)],
  });

  return { rotation, scale, position };
}

function WireframeMesh({ scene }: { scene: THREE.Object3D }) {
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

  const { wireframeClone, glowClone } = useMemo(() => {
    const clone1 = SkeletonUtils.clone(scene);
    clone1.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh) {
        child.material = wireframeMaterial;
      }
    });

    const clone2 = SkeletonUtils.clone(scene);
    clone2.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh) {
        child.material = glowMaterial;
      }
    });

    return { wireframeClone: clone1, glowClone: clone2 };
  }, [scene, wireframeMaterial, glowMaterial]);

  return (
    <group>
      <primitive object={wireframeClone} />
      <primitive object={glowClone} />
    </group>
  );
}

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
  const feetY = position[1] - TARGET_HEIGHT / 2;

  return (
    <group ref={groupRef}>
      <group
        rotation={rotation}
        scale={[scale, scale, scale]}
        position={position}
      >
        <WireframeMesh scene={scene} />
      </group>

      {/* Base ring at feet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, feetY, 0]}>
        <ringGeometry args={[0.8, 0.85, 64]} />
        <meshBasicMaterial
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
