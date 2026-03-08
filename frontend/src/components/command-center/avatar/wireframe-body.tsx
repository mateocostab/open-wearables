import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const ROTATION_SPEED = 0.004;
const TARGET_HEIGHT = 3.5;

function WireframeMesh() {
  const { scene } = useGLTF('/models/human-body.glb');

  const lineMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: '#C0F0F8',
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

  const posedGeometry = useMemo(() => {
    // Find the SkinnedMesh in the loaded scene
    let skinned: THREE.SkinnedMesh | null = null;
    scene.updateWorldMatrix(true, true);
    scene.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && !skinned) {
        skinned = child as THREE.SkinnedMesh;
      }
    });
    if (!skinned) return null;

    skinned.skeleton.update();

    // Bake skinned vertex positions into static geometry
    // This sidesteps SkinnedMesh double-rotation issues with parent groups
    const geom = skinned.geometry.clone();
    const pos = geom.getAttribute('position') as THREE.BufferAttribute;
    const v = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
      skinned.applyBoneTransform(i, v);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    pos.needsUpdate = true;
    geom.computeBoundingBox();
    geom.computeVertexNormals();

    const box = geom.boundingBox!;
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Center at origin
    geom.translate(-center.x, -center.y, -center.z);

    // Rotate to stand upright: put longest axis along Y
    if (size.z >= size.x && size.z >= size.y) {
      geom.rotateX(Math.PI / 2);
    } else if (size.x >= size.y && size.x >= size.z) {
      geom.rotateZ(Math.PI / 2);
    }

    // Scale to target height
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = TARGET_HEIGHT / maxDim;
    geom.scale(s, s, s);

    return geom;
  }, [scene]);

  const edgesGeometry = useMemo(() => {
    if (!posedGeometry) return null;
    // Merge coincident vertices to eliminate UV seam splits that create
    // thousands of false "hard edges" on the smooth body surface
    const merged = mergeVertices(posedGeometry, 0.01);
    merged.computeVertexNormals();
    return new THREE.EdgesGeometry(merged, 30);
  }, [posedGeometry]);

  if (!posedGeometry || !edgesGeometry) return null;

  return (
    <group>
      <lineSegments geometry={edgesGeometry} material={lineMaterial} />
      <mesh geometry={posedGeometry} material={glowMaterial} />
    </group>
  );
}

export function WireframeBody() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += ROTATION_SPEED;
    }
  });

  return (
    <group ref={groupRef}>
      <WireframeMesh />

      {/* Base ring at feet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -TARGET_HEIGHT / 2, 0]}>
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
