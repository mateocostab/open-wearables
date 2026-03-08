import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { WireframeBody } from './wireframe-body';

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
  activeCalories,
}: AvatarCanvasProps) {
  return (
    <div className="relative h-full w-full">
      {/* Data markers as HTML overlays positioned with CSS */}
      <div className="absolute z-10 left-3 bottom-[38%] pointer-events-none">
        {(restingHr != null || hrv != null) && (
          <div className="rounded-lg bg-black/85 px-3 py-1.5 backdrop-blur-sm border border-white/10 shadow-lg">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">
                Heart
              </span>
            </div>
            <span className="text-sm font-bold text-white">
              {restingHr != null ? `${restingHr} bpm` : ''}
              {restingHr != null && hrv != null ? ' · ' : ''}
              {hrv != null ? `HRV ${hrv}ms` : ''}
            </span>
          </div>
        )}
      </div>

      <div className="absolute z-10 right-3 bottom-[32%] pointer-events-none">
        {activeCalories != null && (
          <div className="rounded-lg bg-black/85 px-3 py-1.5 backdrop-blur-sm border border-white/10 shadow-lg">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">
                Activity
              </span>
            </div>
            <span className="text-sm font-bold text-white">{activeCalories} kcal</span>
          </div>
        )}
      </div>

      <Canvas
        camera={{ position: [0, 0, 5], fov: 50, near: 0.01, far: 500 }}
        frameloop="always"
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 10, 10]} intensity={0.3} />
          <WireframeBody />
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
