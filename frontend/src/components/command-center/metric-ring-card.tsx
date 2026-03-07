import { NumberTicker } from '@/components/ui/number-ticker';

interface MetricRingCardProps {
  label: string;
  value: number | null;
  unit: string;
  max: number;
  avg?: number | null;
  color: string; // hex color
}

const RADIUS = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function MetricRingCard({
  label,
  value,
  unit,
  max,
  avg,
  color,
}: MetricRingCardProps) {
  const progress = value !== null ? Math.min(1, value / max) : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="glass-panel p-3 flex items-center gap-3">
      {/* Mini SVG ring */}
      <svg viewBox="0 0 48 48" width={48} height={48} className="shrink-0">
        {/* Background ring */}
        <circle
          cx={24}
          cy={24}
          r={RADIUS}
          fill="none"
          stroke="rgb(39 39 42)" // zinc-800
          strokeWidth={4}
        />
        {/* Progress ring */}
        <circle
          cx={24}
          cy={24}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 24 24)"
          className="animate-ring-fill"
          style={
            {
              '--ring-circumference': CIRCUMFERENCE,
              '--ring-offset': strokeDashoffset,
            } as React.CSSProperties
          }
        />
      </svg>

      {/* Value and label */}
      <div className="min-w-0">
        <div className="flex items-baseline gap-1">
          {value !== null ? (
            <>
              <NumberTicker
                value={value}
                className="text-lg font-semibold text-white"
                decimalPlaces={unit === 'hrs' ? 1 : 0}
              />
              <span className="text-xs text-zinc-500">{unit}</span>
            </>
          ) : (
            <>
              <span className="text-lg font-semibold text-zinc-600">-</span>
              <span className="text-xs text-zinc-600">{unit}</span>
            </>
          )}
        </div>

        <p className="text-xs text-zinc-400 truncate">{label}</p>

        {avg !== undefined && avg !== null && (
          <p className="text-[10px] text-zinc-500 tabular-nums">
            avg {unit === 'hrs' ? avg.toFixed(1) : Math.round(avg)}
          </p>
        )}
      </div>
    </div>
  );
}
