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
    <div className="pointer-events-none select-none whitespace-nowrap rounded-lg bg-black/85 px-3 py-1.5 backdrop-blur-sm border border-white/10 shadow-lg">
      <div className="flex items-center gap-1.5 mb-0.5">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span className="text-sm font-bold text-white">{value}</span>
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
            lineWidth={1.5}
            transparent
            opacity={0.5}
          />
          <Html
            position={marker.labelOffset}
            distanceFactor={6}
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
