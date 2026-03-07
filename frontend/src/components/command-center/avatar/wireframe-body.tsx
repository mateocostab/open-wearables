import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Generate points along a parametric human body silhouette
function generateBodyPoints(): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];

  // Helper to add ring of points at a given height, radius, and count
  const addRing = (y: number, rx: number, rz: number, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * rx + (Math.random() - 0.5) * 0.02,
          y + (Math.random() - 0.5) * 0.02,
          Math.sin(angle) * rz + (Math.random() - 0.5) * 0.02
        )
      );
    }
  };

  // Head - sphere
  for (let lat = 0; lat < 12; lat++) {
    const phi = (lat / 12) * Math.PI;
    const r = Math.sin(phi) * 0.22;
    const y = 1.7 + Math.cos(phi) * 0.22;
    addRing(y, r, r, 16);
  }

  // Neck
  addRing(1.42, 0.08, 0.07, 10);
  addRing(1.38, 0.09, 0.08, 10);

  // Shoulders and upper torso
  addRing(1.32, 0.32, 0.14, 20);
  addRing(1.25, 0.34, 0.15, 20);
  addRing(1.18, 0.33, 0.15, 18);

  // Torso - ribcage to waist
  for (let i = 0; i < 12; i++) {
    const t = i / 12;
    const y = 1.15 - t * 0.8;
    const rx = 0.28 - t * 0.06 + Math.sin(t * Math.PI) * 0.04;
    const rz = 0.14 - t * 0.02;
    addRing(y, rx, rz, 16);
  }

  // Hips
  addRing(0.32, 0.26, 0.14, 16);
  addRing(0.28, 0.27, 0.15, 16);
  addRing(0.22, 0.25, 0.14, 14);

  // Left leg
  const legOffsetX = 0.12;
  for (let i = 0; i < 16; i++) {
    const t = i / 16;
    const y = 0.2 - t * 1.2;
    const r = 0.09 - t * 0.03;
    const rz = 0.08 - t * 0.02;
    addRing(y, r, rz, 10);
    // Offset to left
    const lastN = 10;
    for (let j = points.length - lastN; j < points.length; j++) {
      points[j].x -= legOffsetX;
    }
  }

  // Right leg
  for (let i = 0; i < 16; i++) {
    const t = i / 16;
    const y = 0.2 - t * 1.2;
    const r = 0.09 - t * 0.03;
    const rz = 0.08 - t * 0.02;
    addRing(y, r, rz, 10);
    const lastN = 10;
    for (let j = points.length - lastN; j < points.length; j++) {
      points[j].x += legOffsetX;
    }
  }

  // Left arm
  for (let i = 0; i < 14; i++) {
    const t = i / 14;
    const y = 1.28 - t * 1.0;
    const baseX = -0.36 - t * 0.15;
    const r = 0.055 - t * 0.015;
    for (let j = 0; j < 8; j++) {
      const angle = (j / 8) * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          baseX + Math.cos(angle) * r + (Math.random() - 0.5) * 0.01,
          y + (Math.random() - 0.5) * 0.01,
          Math.sin(angle) * r + (Math.random() - 0.5) * 0.01
        )
      );
    }
  }

  // Right arm
  for (let i = 0; i < 14; i++) {
    const t = i / 14;
    const y = 1.28 - t * 1.0;
    const baseX = 0.36 + t * 0.15;
    const r = 0.055 - t * 0.015;
    for (let j = 0; j < 8; j++) {
      const angle = (j / 8) * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          baseX + Math.cos(angle) * r + (Math.random() - 0.5) * 0.01,
          y + (Math.random() - 0.5) * 0.01,
          Math.sin(angle) * r + (Math.random() - 0.5) * 0.01
        )
      );
    }
  }

  return points;
}

// Generate wireframe connections between nearby points
function generateEdges(points: THREE.Vector3[], maxDist: number): number[] {
  const indices: number[] = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dist = points[i].distanceTo(points[j]);
      if (dist < maxDist && dist > 0.01) {
        indices.push(i, j);
      }
    }
  }
  return indices;
}

export function WireframeBody() {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Points>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
    }
    // Subtle glow pulse
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.PointsMaterial;
      mat.opacity = 0.3 + Math.sin(Date.now() * 0.002) * 0.1;
    }
  });

  const { pointsGeometry, wireGeometry, glowGeometry } = useMemo(() => {
    const bodyPoints = generateBodyPoints();

    // Points geometry
    const pGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(bodyPoints.length * 3);
    bodyPoints.forEach((p, i) => {
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    });
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Wireframe edges
    const edges = generateEdges(bodyPoints, 0.12);
    const wGeo = new THREE.BufferGeometry();
    const linePositions = new Float32Array(edges.length * 3);
    for (let i = 0; i < edges.length; i++) {
      const p = bodyPoints[edges[i]];
      linePositions[i * 3] = p.x;
      linePositions[i * 3 + 1] = p.y;
      linePositions[i * 3 + 2] = p.z;
    }
    wGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    // Glow particles (larger, fewer, for outer glow effect)
    const glowCount = Math.floor(bodyPoints.length * 0.3);
    const gGeo = new THREE.BufferGeometry();
    const glowPositions = new Float32Array(glowCount * 3);
    for (let i = 0; i < glowCount; i++) {
      const src = bodyPoints[Math.floor(Math.random() * bodyPoints.length)];
      glowPositions[i * 3] = src.x + (Math.random() - 0.5) * 0.06;
      glowPositions[i * 3 + 1] = src.y + (Math.random() - 0.5) * 0.06;
      glowPositions[i * 3 + 2] = src.z + (Math.random() - 0.5) * 0.06;
    }
    gGeo.setAttribute('position', new THREE.BufferAttribute(glowPositions, 3));

    return { pointsGeometry: pGeo, wireGeometry: wGeo, glowGeometry: gGeo };
  }, []);

  const pointsMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: '#00E5FF',
        size: 0.012,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true,
      }),
    []
  );

  const wireMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: '#00E5FF',
        transparent: true,
        opacity: 0.15,
      }),
    []
  );

  const glowMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: '#80F0FF',
        size: 0.035,
        transparent: true,
        opacity: 0.3,
        sizeAttenuation: true,
      }),
    []
  );

  return (
    <group ref={groupRef}>
      {/* Main body points */}
      <points geometry={pointsGeometry} material={pointsMaterial} />

      {/* Wireframe connections */}
      <lineSegments geometry={wireGeometry} material={wireMaterial} />

      {/* Outer glow particles */}
      <points ref={glowRef} geometry={glowGeometry} material={glowMaterial} />
    </group>
  );
}
