import { motion } from 'motion/react';
import { NumberTicker } from '@/components/ui/number-ticker';
import { SourceBadge } from '@/components/common/source-badge';
import type { HealthSignals } from '@/hooks/use-health-signals';

interface SignalCardsProps {
  signals: HealthSignals;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export function SignalCards({ signals }: SignalCardsProps) {
  const cards = [
    signals.sleep,
    signals.activity,
    signals.strain,
    signals.hrv,
    signals.restingHr,
  ];

  return (
    <motion.div
      className="grid grid-cols-2 lg:grid-cols-5 divide-x divide-zinc-800/50"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {cards.map((signal) => (
        <motion.div
          key={signal.label}
          variants={itemVariants}
          className="px-4 py-2 first:pl-0 last:pr-0"
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              {signal.label}
            </p>
            {signal.provider && (
              <SourceBadge provider={signal.provider} />
            )}
          </div>

          <div className="flex items-baseline gap-2">
            {signal.value !== null ? (
              <>
                <NumberTicker
                  value={signal.value}
                  className="text-2xl font-bold"
                  style={{ color: signal.color }}
                  decimalPlaces={signal.unit === 'hrs' ? 1 : 0}
                />
                <span className="text-sm font-medium" style={{ color: signal.color, opacity: 0.7 }}>
                  {signal.unit}
                </span>
              </>
            ) : (
              <>
                <span className="text-2xl font-bold text-zinc-700">-</span>
                <span className="text-sm text-zinc-700">{signal.unit}</span>
              </>
            )}
          </div>

          <p className="text-[11px] text-zinc-600 mt-1">
            14d avg:{' '}
            {signal.avg14d !== null ? (
              <span className="text-zinc-400">
                {signal.unit === 'hrs'
                  ? signal.avg14d.toFixed(1)
                  : Math.round(signal.avg14d)}
                {signal.unit}
              </span>
            ) : (
              <span className="text-zinc-700">-</span>
            )}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );
}
