import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { Vector3Tuple } from 'three';

interface DataMarkersProps {
  restingHr?: number | null;
  hrv?: number | null;
  recoveryScore?: number | null;
  sleepHours?: number | null;
  activeCalories?: number | null;
}

interface MarkerConfig {
  label: string;
  value: string;
  unit: string;
  color: string;
  bodyAnchor: Vector3Tuple;
  labelOffset: Vector3Tuple;
}

// Pulsing dot at the body anchor point
function AnchorDot({ position, color }: { position: Vector3Tuple; color: string }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const s = 0.04 + Math.sin(t * 3) * 0.015;
    ref.current.scale.setScalar(s);
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} />
    </mesh>
  );
}

function MarkerLabel({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <div className="pointer-events-none select-none whitespace-nowrap">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full shadow-[0_0_6px_currentColor]"
          style={{ backgroundColor: color, color }}
        />
        <span className="text-[9px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {label}
        </span>
      </div>
      <div className="mt-0.5 pl-3.5">
        <span className="text-[15px] font-bold tabular-nums" style={{ color }}>
          {value}
        </span>
        <span className="text-[9px] font-medium ml-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {unit}
        </span>
      </div>
    </div>
  );
}

export function DataMarkers({
  restingHr,
  hrv,
  sleepHours,
  activeCalories,
}: DataMarkersProps) {
  const markers: MarkerConfig[] = [];

  // Heart — left chest area
  if (restingHr != null) {
    markers.push({
      label: 'Heart Rate',
      value: `${restingHr}`,
      unit: 'bpm',
      color: '#EF4444',
      bodyAnchor: [-0.3, 0.4, 0],
      labelOffset: [-1.5, 0.5, 0],
    });
  }

  // HRV — right chest area
  if (hrv != null) {
    markers.push({
      label: 'HRV',
      value: `${hrv}`,
      unit: 'ms',
      color: '#A78BFA',
      bodyAnchor: [0.3, 0.2, 0],
      labelOffset: [1.5, 0.2, 0],
    });
  }

  // Sleep — near head
  if (sleepHours != null) {
    markers.push({
      label: 'Sleep',
      value: sleepHours.toFixed(1),
      unit: 'hrs',
      color: '#818CF8',
      bodyAnchor: [0.2, 1.4, 0],
      labelOffset: [1.5, 1.4, 0],
    });
  }

  // Activity — lower body / legs
  if (activeCalories != null) {
    markers.push({
      label: 'Active',
      value: `${activeCalories}`,
      unit: 'kcal',
      color: '#34D399',
      bodyAnchor: [-0.4, -0.7, 0],
      labelOffset: [-1.5, -0.7, 0],
    });
  }

  if (markers.length === 0) return null;

  return (
    <group>
      {markers.map((marker) => (
        <group key={marker.label}>
          {/* Pulsing dot on body */}
          <AnchorDot position={marker.bodyAnchor} color={marker.color} />

          {/* Connector line */}
          <Line
            points={[marker.bodyAnchor, marker.labelOffset]}
            color={marker.color}
            lineWidth={1}
            transparent
            opacity={0.3}
          />

          {/* Floating label */}
          <Html
            position={marker.labelOffset}
            distanceFactor={6}
            zIndexRange={[10, 0]}
            center
          >
            <MarkerLabel
              label={marker.label}
              value={marker.value}
              unit={marker.unit}
              color={marker.color}
            />
          </Html>
        </group>
      ))}
    </group>
  );
}
