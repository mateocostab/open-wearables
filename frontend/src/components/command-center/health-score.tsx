import { useHealthSignals } from '@/hooks/use-health-signals';
import { calculateHealthScore } from '@/lib/utils/health-score';
import { NumberTicker } from '@/components/ui/number-ticker';

interface HealthScoreProps {
  userId: string;
}

const SEGMENTS = [
  { key: 'recovery', label: 'Recovery', color: '#00FF7F', weight: 0.4 },
  { key: 'sleep', label: 'Sleep', color: '#818CF8', weight: 0.35 },
  { key: 'activity', label: 'Activity', color: '#00E5FF', weight: 0.25 },
] as const;

// SVG ring geometry
const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function HealthScore({ userId }: HealthScoreProps) {
  const signals = useHealthSignals(userId);

  const scores = calculateHealthScore({
    recoveryScore: signals.recovery.value,
    sleepDurationHours: signals.sleep.value,
    sleepEfficiency: null,
    activeCalories: signals.activity.value,
  });

  // Calculate arc segments
  // Each segment occupies its weight proportion of the circle
  const arcs = SEGMENTS.map((segment, index) => {
    const segmentLength = CIRCUMFERENCE * segment.weight;
    const gapSize = 4; // small gap between segments
    const dashLength = segmentLength - gapSize;

    // Calculate offset: sum of all previous segment lengths
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += CIRCUMFERENCE * SEGMENTS[i].weight;
    }

    // stroke-dashoffset is measured from the top (12 o'clock), going clockwise
    // We rotate the starting point by -90deg in the SVG to start from the top
    const dashoffset = CIRCUMFERENCE - offset;

    return {
      ...segment,
      dashArray: `${dashLength} ${CIRCUMFERENCE - dashLength}`,
      dashOffset: dashoffset,
      subScore: scores[segment.key as keyof typeof scores] as number,
    };
  });

  return (
    <div className="glass-panel p-4">
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-4">
        Health Score
      </p>

      {/* Donut chart */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          <svg viewBox="0 0 120 120" width={120} height={120}>
            {/* Background circle */}
            <circle
              cx={60}
              cy={60}
              r={RADIUS}
              fill="none"
              stroke="rgb(39 39 42)" // zinc-800
              strokeWidth={8}
            />

            {/* Colored arc segments */}
            {arcs.map((arc) => (
              <circle
                key={arc.key}
                cx={60}
                cy={60}
                r={RADIUS}
                fill="none"
                stroke={arc.color}
                strokeWidth={8}
                strokeDasharray={arc.dashArray}
                strokeDashoffset={arc.dashOffset}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                className="transition-all duration-1000"
                opacity={0.85}
              />
            ))}
          </svg>

          {/* Center score */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {scores.composite > 0 ? (
              <>
                <NumberTicker
                  value={scores.composite}
                  className="text-2xl font-bold text-white"
                />
                <span className="text-xs text-zinc-500">/ 100</span>
              </>
            ) : (
              <>
                <span className="text-2xl font-bold text-zinc-600">-</span>
                <span className="text-xs text-zinc-600">/ 100</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {arcs.map((arc) => (
          <div key={arc.key} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: arc.color }}
              />
              <span className="text-xs text-zinc-400">{arc.label}</span>
            </div>
            <span className="text-xs font-medium text-zinc-300 tabular-nums">
              {arc.subScore}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
