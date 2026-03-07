import { motion } from 'motion/react';
import { NumberTicker } from '@/components/ui/number-ticker';
import type { HealthSignals } from '@/hooks/use-health-signals';

interface SignalCardsProps {
  signals: HealthSignals;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export function SignalCards({ signals }: SignalCardsProps) {
  const cards = [signals.recovery, signals.sleep, signals.activity, signals.hrv];

  return (
    <motion.div
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {cards.map((signal) => (
        <motion.div
          key={signal.label}
          variants={itemVariants}
          className="glass-panel p-4"
          style={{ borderLeft: `4px solid ${signal.color}` }}
        >
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
            {signal.label}
          </p>

          <div className="flex items-baseline gap-1">
            {signal.value !== null ? (
              <>
                <NumberTicker
                  value={signal.value}
                  className="text-2xl font-semibold text-white"
                  decimalPlaces={signal.unit === 'hrs' ? 1 : 0}
                />
                <span className="text-sm text-zinc-500">{signal.unit}</span>
              </>
            ) : (
              <>
                <span className="text-2xl font-semibold text-zinc-600">-</span>
                <span className="text-sm text-zinc-600">{signal.unit}</span>
              </>
            )}
          </div>

          <p className="text-xs text-zinc-500 mt-2">
            14d avg:{' '}
            {signal.avg14d !== null ? (
              <span className="text-zinc-400">
                {signal.unit === 'hrs'
                  ? signal.avg14d.toFixed(1)
                  : Math.round(signal.avg14d)}
                {signal.unit}
              </span>
            ) : (
              <span className="text-zinc-600">-</span>
            )}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );
}
