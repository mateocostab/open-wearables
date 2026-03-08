import { Sparkles, HeartPulse, Moon, Zap, ShieldCheck, type LucideIcon } from 'lucide-react';
import { format } from 'date-fns';
import type { HealthSignals } from '@/hooks/use-health-signals';
import { calculateHealthScore } from '@/lib/utils/health-score';
import { NumberTicker } from '@/components/ui/number-ticker';
import { SCORE_SEGMENT_COLORS, getScoreColor } from '@/lib/constants/signal-colors';

interface HealthScoreProps {
  signals: HealthSignals;
}

const SEGMENTS: readonly { key: string; label: string; icon: LucideIcon; color: string }[] = [
  { key: 'sleep', label: 'Sleep', icon: Moon, color: SCORE_SEGMENT_COLORS.sleep },
  { key: 'activity', label: 'Activity', icon: Zap, color: SCORE_SEGMENT_COLORS.activity },
  { key: 'heart', label: 'Heart', icon: HeartPulse, color: SCORE_SEGMENT_COLORS.heart },
  { key: 'recovery', label: 'Recovery', icon: ShieldCheck, color: SCORE_SEGMENT_COLORS.recovery },
];

const RADIUS = 70;
const STROKE_WIDTH = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function HealthScore({ signals }: HealthScoreProps) {
  const scores = calculateHealthScore({
    sleepDurationHours: signals.sleep.value,
    sleepEfficiency: signals.sleepEfficiency.value,
    activeCalories: signals.activity.value,
    restingHr: signals.restingHr.value,
    hrv: signals.hrv.value,
    recoveryScore: signals.recovery.value,
  });

  const mainProgress = scores.composite / 100;
  const mainDashoffset = CIRCUMFERENCE * (1 - mainProgress);
  const scoreColor = getScoreColor(scores.composite);

  return (
    <div
      className="glass-panel p-5 relative overflow-hidden"
      style={{
        boxShadow: `0 0 30px ${scoreColor}10, inset 0 1px 0 rgba(255,255,255,0.03)`,
      }}
      role="region"
      aria-label="Health score"
    >
      {/* Header with pulse dot */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-400" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-white">Health Score</h2>
          <span className="flex items-center gap-1.5 ml-2">
            <span
              className="h-1.5 w-1.5 rounded-full animate-pulse-dot"
              style={{ backgroundColor: scoreColor }}
              aria-hidden="true"
            />
            <span className="text-[9px] font-medium uppercase tracking-wider text-zinc-500">
              Live
            </span>
          </span>
        </div>
        <span className="text-[11px] text-zinc-500 px-2 py-0.5 rounded bg-zinc-800/50">
          {format(new Date(), 'yyyy-MM-dd')}
        </span>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        {/* Donut with glow — responsive: 120px on mobile, 160px on desktop */}
        <div className="relative shrink-0 w-[120px] h-[120px] md:w-[160px] md:h-[160px]">
          <div
            className="absolute inset-0 rounded-full blur-xl opacity-30"
            style={{ background: `radial-gradient(circle, ${scoreColor}40 0%, transparent 70%)` }}
            aria-hidden="true"
          />

          <svg
            viewBox="0 0 160 160"
            className="relative w-full h-full"
            aria-hidden="true"
          >
            <defs>
              <filter id="health-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <circle
              cx={80}
              cy={80}
              r={RADIUS}
              fill="none"
              stroke="rgb(39 39 42)"
              strokeWidth={STROKE_WIDTH}
            />

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
              filter="url(#health-glow)"
            />

            {mainProgress > 0.02 && (
              <circle
                cx={80 + RADIUS * Math.cos(-Math.PI / 2 + mainProgress * 2 * Math.PI)}
                cy={80 + RADIUS * Math.sin(-Math.PI / 2 + mainProgress * 2 * Math.PI)}
                r={6}
                fill={scoreColor}
                opacity={0.5}
                filter="url(#health-glow)"
              />
            )}
          </svg>

          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {scores.composite > 0 ? (
              <>
                <NumberTicker
                  value={scores.composite}
                  className="text-3xl md:text-4xl font-bold text-white"
                />
                <span className="text-[9px] md:text-[10px] font-medium text-zinc-500 uppercase tracking-wider mt-0.5">
                  Score
                </span>
              </>
            ) : (
              <>
                <span className="text-3xl md:text-4xl font-bold text-zinc-700" aria-label="No data">-</span>
                <span className="text-[9px] md:text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">
                  Score
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
                <Icon className="h-4 w-4 shrink-0" style={{ color: segment.color }} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-zinc-400">{segment.label}</span>
                    <span className="text-xs font-semibold text-zinc-200 tabular-nums">
                      {subScore}
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full bg-zinc-800 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={subScore}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${segment.label} score`}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${subScore}%`,
                        backgroundColor: segment.color,
                        boxShadow: subScore > 0 ? `0 0 8px ${segment.color}60` : 'none',
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
