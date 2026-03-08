import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { WireframeBody } from './wireframe-body';
import { DataMarkers } from './data-markers';

interface AvatarCanvasProps {
  restingHr?: number | null;
  hrv?: number | null;
  recoveryScore?: number | null;
  sleepHours?: number | null;
  activeCalories?: number | null;
}

// Model center is at roughly (0, 0.37, -9)
// Model height Y: ~3.68, width X: ~6.64
// Camera needs to be at Z > 0 looking at center, far enough to see full body
// At FOV 50, distance ~5 from model front (Z=-0.12) means camera at Z=5
// Looking at center (0, 0.37, -9)

export function AvatarCanvas({
  restingHr,
  hrv,
  recoveryScore,
  sleepHours,
  activeCalories,
}: AvatarCanvasProps) {
  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{
          position: [0, 0.4, 6],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
        frameloop="always"
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 10, 10]} intensity={0.3} />
          <WireframeBody />
          <DataMarkers
            restingHr={restingHr}
            hrv={hrv}
            recoveryScore={recoveryScore}
            sleepHours={sleepHours}
            activeCalories={activeCalories}
          />
          <OrbitControls
            target={[0, 0.4, -9]}
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI * 0.3}
            maxPolarAngle={Math.PI * 0.7}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
