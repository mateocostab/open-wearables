import { Html, Line } from '@react-three/drei';
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
  color: string;
  bodyAnchor: Vector3Tuple;
  labelOffset: Vector3Tuple;
}

function MarkerLabel({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="pointer-events-none select-none whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 backdrop-blur-sm border border-white/5"
      style={{ fontSize: '9px' }}
    >
      <div className="flex items-center gap-1">
        <span
          className="inline-block h-1 w-1 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="font-medium text-white/60">{label}</span>
      </div>
      <span className="font-bold text-white" style={{ fontSize: '10px' }}>
        {value}
      </span>
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

  // Positions are in world space - the model extends roughly:
  // Y: -1.5 to 2.2, Z: -18 to 0, X: -3.3 to 3.4
  // Center is around (0, 0.4, -9)
  // Camera looks at center, so markers should be offset from center

  if (restingHr != null || hrv != null) {
    const parts: string[] = [];
    if (restingHr != null) parts.push(`${restingHr} bpm`);
    if (hrv != null) parts.push(`HRV ${hrv}ms`);

    markers.push({
      label: 'Heart',
      value: parts.join(' · '),
      color: '#EF4444',
      bodyAnchor: [-1.5, 0.5, -7],
      labelOffset: [-4.5, 0.5, -7],
    });
  }

  if (sleepHours != null) {
    markers.push({
      label: 'Sleep',
      value: `${sleepHours.toFixed(1)}h`,
      color: '#818CF8',
      bodyAnchor: [1.5, 1.5, -5],
      labelOffset: [4.5, 1.5, -5],
    });
  }

  if (activeCalories != null) {
    markers.push({
      label: 'Activity',
      value: `${activeCalories} kcal`,
      color: '#34D399',
      bodyAnchor: [2.0, -0.5, -12],
      labelOffset: [5.0, -0.5, -12],
    });
  }

  return (
    <group>
      {markers.map((marker) => (
        <group key={marker.label}>
          <Line
            points={[marker.bodyAnchor, marker.labelOffset]}
            color={marker.color}
            lineWidth={1}
            transparent
            opacity={0.4}
          />
          <Html
            position={marker.labelOffset}
            distanceFactor={12}
            zIndexRange={[10, 0]}
            center
          >
            <MarkerLabel
              label={marker.label}
              value={marker.value}
              color={marker.color}
            />
          </Html>
        </group>
      ))}
    </group>
  );
}
