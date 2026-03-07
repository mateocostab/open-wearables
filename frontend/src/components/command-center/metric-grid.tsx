import { useHealthSignals } from '@/hooks/use-health-signals';
import { useBodySummary } from '@/hooks/api/use-health';
import { MetricRingCard } from './metric-ring-card';

interface MetricGridProps {
  userId: string;
}

export function MetricGrid({ userId }: MetricGridProps) {
  const signals = useHealthSignals(userId);
  const { data: bodySummary } = useBodySummary(userId, {
    average_period: 7,
  });

  const restingHR = bodySummary?.averaged?.resting_heart_rate_bpm ?? null;

  return (
    <div className="glass-panel p-4">
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
        Metrics
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MetricRingCard
          label="Recovery"
          value={signals.recovery.value}
          unit="%"
          max={100}
          avg={signals.recovery.avg14d}
          color="#00FF7F"
        />

        <MetricRingCard
          label="HRV"
          value={signals.hrv.value}
          unit="ms"
          max={200}
          avg={signals.hrv.avg14d}
          color="#FF33AA"
        />

        <MetricRingCard
          label="Resting HR"
          value={restingHR !== null ? Math.round(restingHR) : null}
          unit="bpm"
          max={100}
          avg={null}
          color="#FB7185"
        />

        <MetricRingCard
          label="Sleep"
          value={signals.sleep.value}
          unit="hrs"
          max={10}
          avg={signals.sleep.avg14d}
          color="#818CF8"
        />

        <MetricRingCard
          label="Sleep Efficiency"
          value={null}
          unit="%"
          max={100}
          avg={null}
          color="#34D399"
        />

        <MetricRingCard
          label="Active Calories"
          value={signals.activity.value}
          unit="kcal"
          max={1000}
          avg={signals.activity.avg14d}
          color="#00E5FF"
        />
      </div>
    </div>
  );
}
