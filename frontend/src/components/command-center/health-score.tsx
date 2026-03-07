import { Sparkles, HeartPulse, Moon, Zap, type LucideIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useHealthSignals } from '@/hooks/use-health-signals';
import { calculateHealthScore } from '@/lib/utils/health-score';
import { NumberTicker } from '@/components/ui/number-ticker';

interface HealthScoreProps {
  userId: string;
}

const SEGMENTS: readonly { key: string; label: string; icon: LucideIcon; color: string }[] = [
  { key: 'sleep', label: 'Sleep', icon: Moon, color: '#818CF8' },
  { key: 'activity', label: 'Activity', icon: Zap, color: '#FBBF24' },
  { key: 'heart', label: 'Heart', icon: HeartPulse, color: '#FB7185' },
];

const RADIUS = 70;
const STROKE_WIDTH = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 6;

export function HealthScore({ userId }: HealthScoreProps) {
  const signals = useHealthSignals(userId);

  const scores = calculateHealthScore({
    sleepDurationHours: signals.sleep.value,
    sleepEfficiency: signals.sleepEfficiency.value,
    activeCalories: signals.activity.value,
    restingHr: signals.restingHr.value,
    hrv: signals.hrv.value,
  });

  // Calculate filled arc for the main ring
  const mainProgress = scores.composite / 100;
  const mainDashoffset = CIRCUMFERENCE * (1 - mainProgress);

  // Score color based on value
  const scoreColor =
    scores.composite >= 70
      ? '#00FF7F'
      : scores.composite >= 40
        ? '#FBBF24'
        : '#EF4444';

  return (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-semibold text-white">Health Score</span>
        </div>
        <span className="text-[11px] text-zinc-500 px-2 py-0.5 rounded bg-zinc-800/50">
          {format(new Date(), 'yyyy-MM-dd')}
        </span>
      </div>

      <div className="flex items-center gap-6">
        {/* Donut */}
        <div className="relative shrink-0">
          <svg viewBox="0 0 160 160" width={160} height={160}>
            {/* Background ring */}
            <circle
              cx={80}
              cy={80}
              r={RADIUS}
              fill="none"
              stroke="rgb(39 39 42)"
              strokeWidth={STROKE_WIDTH}
            />
            {/* Score arc */}
            <circle
              cx={80}
              cy={80}
              r={RADIUS}
              fill="none"
              stroke={scoreColor}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={mainDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 80 80)"
              className="transition-all duration-1000"
              style={{ filter: `drop-shadow(0 0 6px ${scoreColor}40)` }}
            />
          </svg>

          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {scores.composite > 0 ? (
              <>
                <NumberTicker
                  value={scores.composite}
                  className="text-4xl font-bold text-white"
                />
                <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mt-0.5">
                  Health Score
                </span>
              </>
            ) : (
              <>
                <span className="text-4xl font-bold text-zinc-600">-</span>
                <span className="text-[10px] text-zinc-600 uppercase tracking-wider mt-0.5">
                  Health Score
                </span>
              </>
            )}
          </div>
        </div>

        {/* Sub-scores with progress bars */}
        <div className="flex-1 space-y-3">
          {SEGMENTS.map((segment) => {
            const subScore = scores[segment.key as keyof typeof scores] as number;
            const Icon = segment.icon;
            return (
              <div key={segment.key} className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0" style={{ color: segment.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-zinc-400">{segment.label}</span>
                    <span className="text-xs font-semibold text-zinc-200 tabular-nums">
                      {subScore}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${subScore}%`,
                        backgroundColor: segment.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
