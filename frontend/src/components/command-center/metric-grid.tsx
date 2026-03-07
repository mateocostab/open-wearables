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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <MetricRingCard
        label="Recovery"
        sublabel={signals.recovery.value !== null ? '14 days tracked' : undefined}
        value={signals.recovery.value}
        unit="%"
        max={100}
        color="#00FF7F"
        avg={signals.recovery.avg14d}
      />

      <MetricRingCard
        label="HRV"
        sublabel={signals.hrv.avg14d !== null ? `${signals.hrv.value !== null && signals.hrv.avg14d !== null ? (signals.hrv.value - Math.round(signals.hrv.avg14d) > 0 ? '+' : '') + (signals.hrv.value - Math.round(signals.hrv.avg14d)) : '0'} ms vs avg` : undefined}
        value={signals.hrv.value}
        unit="ms"
        max={200}
        color="#FF33AA"
        avg={signals.hrv.avg14d}
      />

      <MetricRingCard
        label="Resting HR"
        sublabel={restingHR !== null ? `${Math.round(restingHR)} bpm avg` : undefined}
        value={restingHR !== null ? Math.round(restingHR) : null}
        unit="bpm"
        max={100}
        color="#FB7185"
        avg={restingHR !== null ? Math.round(restingHR) : null}
      />

      <MetricRingCard
        label="Sleep"
        sublabel={signals.sleep.value !== null ? 'avg per night' : undefined}
        value={signals.sleep.value}
        unit="hrs"
        max={10}
        color="#818CF8"
        avg={signals.sleep.avg14d}
      />

      <MetricRingCard
        label="Sleep Efficiency"
        sublabel={undefined}
        value={null}
        unit="%"
        max={100}
        color="#34D399"
      />

      <MetricRingCard
        label="Active Calories"
        sublabel={signals.activity.avg14d !== null ? `avg ${Math.round(signals.activity.avg14d)} daily` : undefined}
        value={signals.activity.value}
        unit="kcal"
        max={1000}
        color="#00E5FF"
        avg={signals.activity.avg14d}
      />
    </div>
  );
}
