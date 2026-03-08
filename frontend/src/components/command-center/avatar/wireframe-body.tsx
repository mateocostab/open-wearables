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
 *
 * Uses Box3.setFromObject for scale/position (captures full scene hierarchy transforms).
 * Uses boneInverses for orientation heuristic (head direction via bone density).
 */
function computeModelTransform(
  scene: THREE.Object3D,
  targetHeight: number
): ModelTransform | null {
  // 1. Find first SkinnedMesh for bone analysis
  let skinned: THREE.SkinnedMesh | null = null;
  scene.traverse((child) => {
    if (child instanceof THREE.SkinnedMesh && !skinned) {
      skinned = child as THREE.SkinnedMesh;
    }
  });
  if (!skinned) return null;

  // 2. Scene bounds via Box3.setFromObject (includes all hierarchy transforms)
  scene.updateWorldMatrix(true, true);
  const sceneBox = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  sceneBox.getSize(size);
  sceneBox.getCenter(center);

  // 3. Identify tallest axis from scene bounds
  const axes: Array<{ axis: 'x' | 'y' | 'z'; extent: number }> = [
    { axis: 'x', extent: size.x },
    { axis: 'y', extent: size.y },
    { axis: 'z', extent: size.z },
  ];
  axes.sort((a, b) => b.extent - a.extent);
  const tallAxis = axes[0].axis;
  const tallExtent = axes[0].extent;

  // 4. Bone density heuristic for head direction
  //    Transform bone positions to world space (matching scene bounds space),
  //    then count bones above/below midpoint on tallAxis.
  const boneInverses = skinned.skeleton.boneInverses;
  const meshWorldMatrix = skinned.matrixWorld;
  const tempMat = new THREE.Matrix4();
  const worldBonePositions: THREE.Vector3[] = [];

  for (let i = 0; i < boneInverses.length; i++) {
    tempMat.copy(boneInverses[i]).invert().premultiply(meshWorldMatrix);
    const pos = new THREE.Vector3();
    pos.setFromMatrixPosition(tempMat);
    worldBonePositions.push(pos);
  }

  const boneMidpoint = center[tallAxis];
  let countAbove = 0;
  let countBelow = 0;
  for (const p of worldBonePositions) {
    if (p[tallAxis] >= boneMidpoint) countAbove++;
    else countBelow++;
  }
  const headSign = countAbove >= countBelow ? 1 : -1;

  // 5. Compute rotation to align tallAxis → Y-up with head pointing +Y
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

  // 6. Compute uniform scale from scene bounds
  const scale = targetHeight / tallExtent;

  // 7. Compute position offset: rotate center, negate, scale
  const rotEuler = new THREE.Euler(rx, ry, rz);
  const rotatedCenter = center.clone().applyEuler(rotEuler);
  const position: [number, number, number] = [
    -rotatedCenter.x * scale,
    -rotatedCenter.y * scale,
    -rotatedCenter.z * scale,
  ];

  // Temporary debug log — compare bone bounds vs scene bounds
  const boneBox = new THREE.Box3();
  for (const p of worldBonePositions) boneBox.expandByPoint(p);
  const boneSize = new THREE.Vector3();
  const boneCenter = new THREE.Vector3();
  boneBox.getSize(boneSize);
  boneBox.getCenter(boneCenter);

  console.log('[WireframeBody] computeModelTransform:', {
    boneCount: worldBonePositions.length,
    tallAxis,
    tallExtent: tallExtent.toFixed(3),
    headSign,
    bonesAbove: countAbove,
    bonesBelow: countBelow,
    rotation: rotation.map((r) => ((r * 180) / Math.PI).toFixed(1) + '°'),
    scale: scale.toFixed(4),
    position: position.map((p) => p.toFixed(3)),
    sceneBounds: {
      center: [center.x.toFixed(3), center.y.toFixed(3), center.z.toFixed(3)],
      size: [size.x.toFixed(3), size.y.toFixed(3), size.z.toFixed(3)],
    },
    boneBoundsWorld: {
      center: [
        boneCenter.x.toFixed(3),
        boneCenter.y.toFixed(3),
        boneCenter.z.toFixed(3),
      ],
      size: [
        boneSize.x.toFixed(3),
        boneSize.y.toFixed(3),
        boneSize.z.toFixed(3),
      ],
    },
    sceneRootTransform: {
      scale: [scene.scale.x, scene.scale.y, scene.scale.z],
      position: [scene.position.x, scene.position.y, scene.position.z],
      rotation: [scene.rotation.x, scene.rotation.y, scene.rotation.z],
    },
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
