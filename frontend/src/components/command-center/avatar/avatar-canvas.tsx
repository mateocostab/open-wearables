import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
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
        camera={{ position: [0, 0.8, 3.5], fov: 45 }}
        frameloop="always"
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <WireframeBody />
          <DataMarkers
            restingHr={restingHr}
            hrv={hrv}
            recoveryScore={recoveryScore}
            sleepHours={sleepHours}
            activeCalories={activeCalories}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
