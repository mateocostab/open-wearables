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

export function AvatarCanvas({
  restingHr,
  hrv,
  recoveryScore,
  sleepHours,
  activeCalories,
}: AvatarCanvasProps) {
  return (
    <div className="relative h-full min-h-[400px] w-full">
      <Canvas
        camera={{ position: [0, 0, 20], fov: 45, near: 0.1, far: 200 }}
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
