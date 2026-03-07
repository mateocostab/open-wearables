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
        label="RECOVERY"
        sublabel={`${signals.recovery.avg14d !== null ? Math.round(signals.recovery.avg14d) : '-'}% avg`}
        value={signals.recovery.value}
        unit="%"
        max={100}
        color="#00FF7F"
      />

      <MetricRingCard
        label="HRV"
        sublabel={`${signals.hrv.avg14d !== null ? Math.round(signals.hrv.avg14d) : '-'} avg`}
        value={signals.hrv.value}
        unit="ms"
        max={200}
        color="#FF33AA"
      />

      <MetricRingCard
        label="RESTING HR"
        sublabel={restingHR !== null ? `avg ${Math.round(restingHR)}` : undefined}
        value={restingHR !== null ? Math.round(restingHR) : null}
        unit="bpm"
        max={100}
        color="#FB7185"
      />

      <MetricRingCard
        label="SLEEP"
        sublabel={`${signals.sleep.avg14d !== null ? signals.sleep.avg14d.toFixed(1) : '-'}h avg`}
        value={signals.sleep.value}
        unit="hrs"
        max={10}
        color="#818CF8"
      />

      <MetricRingCard
        label="SLEEP EFFICIENCY"
        sublabel={undefined}
        value={null}
        unit="%"
        max={100}
        color="#34D399"
      />

      <MetricRingCard
        label="ACTIVE CALORIES"
        sublabel={`avg ${signals.activity.avg14d !== null ? Math.round(signals.activity.avg14d) : '-'}`}
        value={signals.activity.value}
        unit="kcal"
        max={1000}
        color="#00E5FF"
      />
    </div>
  );
}
