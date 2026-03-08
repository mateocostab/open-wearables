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
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
} as const;

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
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 divide-x divide-zinc-800/50"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      role="list"
      aria-label="Health signal cards"
    >
      {cards.map((signal) => (
        <motion.div
          key={signal.label}
          variants={itemVariants}
          className="px-4 py-2 lg:first:pl-0 lg:last:pr-0"
          role="listitem"
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              {signal.label}
            </p>
            {signal.provider && (
              <SourceBadge provider={signal.provider} />
            )}
          </div>

          <div className="flex items-baseline gap-1.5">
            {signal.value !== null ? (
              <>
                <NumberTicker
                  value={signal.value}
                  className="text-[28px] font-extrabold leading-none"
                  style={{ color: signal.color }}
                  decimalPlaces={signal.unit === 'hrs' ? 1 : 0}
                />
                <span className="text-xs font-semibold uppercase" style={{ color: signal.color, opacity: 0.5 }}>
                  {signal.unit}
                </span>
              </>
            ) : (
              <>
                <span className="text-[28px] font-extrabold leading-none text-zinc-800">--</span>
                <span className="text-xs text-zinc-700">{signal.unit}</span>
              </>
            )}
          </div>

          <p className="text-[11px] text-zinc-500 mt-1 truncate">
            14d avg:{' '}
            {signal.avg14d !== null ? (
              <span className="text-zinc-400">
                {signal.unit === 'hrs'
                  ? signal.avg14d.toFixed(1)
                  : Math.round(signal.avg14d).toLocaleString()}
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
