import { NumberTicker } from '@/components/ui/number-ticker';

interface MetricRingCardProps {
  label: string;
  sublabel?: string;
  value: number | null;
  unit: string;
  max: number;
  color: string;
}

const RADIUS = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function MetricRingCard({
  label,
  sublabel,
  value,
  unit,
  max,
  color,
}: MetricRingCardProps) {
  const progress = value !== null ? Math.min(1, value / max) : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="glass-panel p-4 flex items-center justify-between gap-3">
      {/* Left: value + label */}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            {label}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          {value !== null ? (
            <>
              <NumberTicker
                value={value}
                className="text-2xl font-bold text-white"
                decimalPlaces={unit === 'hrs' ? 1 : 0}
              />
              <span className="text-sm text-zinc-500">{unit}</span>
            </>
          ) : (
            <>
              <span className="text-2xl font-bold text-zinc-600">-</span>
              <span className="text-sm text-zinc-600">{unit}</span>
            </>
          )}
        </div>
        {sublabel && (
          <p className="text-[10px] text-zinc-600 mt-1 tabular-nums">{sublabel}</p>
        )}
      </div>

      {/* Right: ring */}
      <svg viewBox="0 0 56 56" width={56} height={56} className="shrink-0">
        <circle
          cx={28}
          cy={28}
          r={RADIUS}
          fill="none"
          stroke="rgb(39 39 42)"
          strokeWidth={4}
        />
        <circle
          cx={28}
          cy={28}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
          className="transition-all duration-700"
          style={{ filter: `drop-shadow(0 0 4px ${color}30)` }}
        />
      </svg>
    </div>
  );
}
