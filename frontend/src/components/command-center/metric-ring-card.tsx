import { memo } from 'react';
import { NumberTicker } from '@/components/ui/number-ticker';
import { SourceBadge } from '@/components/common/source-badge';

interface MetricRingCardProps {
  label: string;
  sublabel?: string;
  value: number | null;
  unit: string;
  max: number;
  color: string;
  avg?: number | null;
  provider?: string | null;
}

const ARC_RADIUS = 16;
const ARC_CIRCUMFERENCE = 2 * Math.PI * ARC_RADIUS;
const ARC_VISIBLE = ARC_CIRCUMFERENCE * 0.55;

export const MetricRingCard = memo(function MetricRingCard({
  label,
  sublabel,
  value,
  unit,
  max,
  color,
  avg,
  provider,
}: MetricRingCardProps) {
  const progress = value !== null ? Math.min(1, value / max) : 0;
  const arcFill = ARC_VISIBLE * progress;

  return (
    <div
      className="glass-panel p-4 relative overflow-hidden"
      style={{ borderTop: `2px solid ${color}` }}
    >
      {/* Top row: label + arc */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="inline-block w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider truncate">
            {label}
          </span>
          {provider && <SourceBadge provider={provider} />}
        </div>

        {/* Semi-circle arc */}
        <svg
          viewBox="0 0 40 40"
          width={40}
          height={40}
          className="shrink-0 -mt-1"
          aria-hidden="true"
        >
          <circle
            cx={20}
            cy={20}
            r={ARC_RADIUS}
            fill="none"
            stroke="rgb(39 39 42)"
            strokeWidth={3}
            strokeDasharray={`${ARC_VISIBLE} ${ARC_CIRCUMFERENCE - ARC_VISIBLE}`}
            strokeLinecap="round"
            transform="rotate(-190 20 20)"
          />
          <circle
            cx={20}
            cy={20}
            r={ARC_RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeDasharray={`${arcFill} ${ARC_CIRCUMFERENCE - arcFill}`}
            strokeLinecap="round"
            transform="rotate(-190 20 20)"
            className="transition-all duration-700"
            style={{ filter: `drop-shadow(0 0 3px ${color}40)` }}
          />
        </svg>
      </div>

      {/* Value row */}
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-1">
          {value !== null ? (
            <>
              <NumberTicker
                value={value}
                className="text-3xl font-bold text-white"
                decimalPlaces={unit === 'hrs' ? 1 : 0}
              />
              <span className="text-sm text-zinc-500 font-medium">{unit}</span>
            </>
          ) : (
            <>
              <span className="text-3xl font-bold text-zinc-700">-</span>
              <span className="text-sm text-zinc-700">{unit}</span>
            </>
          )}
        </div>
        {avg !== undefined && avg !== null && (
          <span className="text-xs text-zinc-500 tabular-nums">
            avg {unit === 'hrs' ? avg.toFixed(1) : Math.round(avg).toLocaleString()}
          </span>
        )}
      </div>

      {/* Progress line */}
      <div className="mt-3 mb-2 h-[2px] rounded-full bg-zinc-800 overflow-hidden" aria-hidden="true">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${progress * 100}%`,
            backgroundColor: color,
          }}
        />
      </div>

      {/* Sublabel */}
      {sublabel && (
        <p className="text-[9px] font-medium text-zinc-500 uppercase tracking-wider truncate" title={sublabel}>
          {sublabel}
        </p>
      )}
    </div>
  );
});
