import { motion } from 'motion/react';
import type { HealthSignals } from '@/hooks/use-health-signals';

interface SignalMomentumProps {
  signals: HealthSignals;
}

export function SignalMomentum({ signals }: SignalMomentumProps) {
  const bars = [signals.sleep, signals.activity, signals.recovery, signals.hrv, signals.restingHr];

  return (
    <div className="glass-panel p-4 space-y-3" role="region" aria-label="Signal momentum">
      <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
        Signal Momentum
      </h2>

      {bars.map((signal) => (
        <div key={signal.label} className="flex items-center gap-3">
          <span className="text-xs text-zinc-400 w-20 shrink-0 truncate" title={signal.label}>
            {signal.label}
          </span>

          <div
            className="flex-1 h-2 rounded-full bg-zinc-800/50 overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(signal.momentum)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${signal.label} momentum`}
          >
            <motion.div
              className="h-full rounded-full origin-left"
              style={{ backgroundColor: signal.color }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: signal.momentum / 100 }}
              transition={{ type: 'spring', stiffness: 60, damping: 20, delay: 0.2 }}
            />
          </div>

          <span className="text-xs text-zinc-500 w-10 text-right tabular-nums">
            {Math.round(signal.momentum)}%
          </span>
        </div>
      ))}
    </div>
  );
}
