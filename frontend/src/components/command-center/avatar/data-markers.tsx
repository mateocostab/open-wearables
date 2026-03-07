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
    <div className="pointer-events-none select-none rounded-md bg-black/80 px-2 py-1 backdrop-blur-sm">
      <div className="flex items-center gap-1.5">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-[10px] font-medium text-white/70">
          {label}
        </span>
      </div>
      <span className="text-xs font-semibold text-white">{value}</span>
    </div>
  );
}

export function DataMarkers({
  restingHr,
  hrv,
  recoveryScore,
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
      value: parts.join(' / '),
      color: '#EF4444',
      bodyAnchor: [-0.3, 1.0, 0.3],
      labelOffset: [-1.0, 1.0, 0.3],
    });
  }

  if (recoveryScore != null || sleepHours != null) {
    const parts: string[] = [];
    if (recoveryScore != null) parts.push(`${recoveryScore}%`);
    if (sleepHours != null)
      parts.push(`${sleepHours.toFixed(1)}h sleep`);

    markers.push({
      label: 'Recovery',
      value: parts.join(' / '),
      color: '#A78BFA',
      bodyAnchor: [0.3, 1.9, 0],
      labelOffset: [1.0, 2.1, 0],
    });
  }

  if (activeCalories != null) {
    markers.push({
      label: 'Activity',
      value: `${activeCalories} kcal`,
      color: '#34D399',
      bodyAnchor: [0.7, 0.9, 0],
      labelOffset: [1.3, 0.9, 0],
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
            opacity={0.5}
          />

          <Html
            position={marker.labelOffset}
            distanceFactor={8}
            zIndexRange={[10, 0]}
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
