import { useHealthSignals } from '@/hooks/use-health-signals';
import { MetricRingCard } from './metric-ring-card';

interface MetricGridProps {
  userId: string;
}

export function MetricGrid({ userId }: MetricGridProps) {
  const signals = useHealthSignals(userId);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        sublabel={
          signals.sleepEfficiency.avg14d !== null
            ? `${signals.sleepEfficiency.avg14d}% avg`
            : undefined
        }
        value={signals.sleepEfficiency.value}
        unit="%"
        max={100}
        color="#34D399"
        avg={signals.sleepEfficiency.avg14d}
      />

      <MetricRingCard
        label="Active Calories"
        sublabel={
          signals.activity.avg14d !== null
            ? `avg ${Math.round(signals.activity.avg14d)} daily`
            : undefined
        }
        value={signals.activity.value}
        unit="kcal"
        max={1000}
        color="#00E5FF"
        avg={signals.activity.avg14d}
      />

      <MetricRingCard
        label="Steps"
        sublabel={
          signals.steps.avg14d !== null
            ? `avg ${Math.round(signals.steps.avg14d).toLocaleString()} daily`
            : undefined
        }
        value={signals.steps.value}
        unit=""
        max={15000}
        color="#10B981"
        avg={signals.steps.avg14d}
      />

      <MetricRingCard
        label="HRV"
        sublabel={
          signals.hrv.avg14d !== null && signals.hrv.value !== null
            ? `${signals.hrv.value - signals.hrv.avg14d > 0 ? '+' : ''}${signals.hrv.value - signals.hrv.avg14d} ms vs avg`
            : undefined
        }
        value={signals.hrv.value}
        unit="ms"
        max={200}
        color="#FF33AA"
        avg={signals.hrv.avg14d}
      />

      <MetricRingCard
        label="Resting HR"
        sublabel={
          signals.restingHr.value !== null
            ? `${signals.restingHr.value} bpm avg`
            : undefined
        }
        value={signals.restingHr.value}
        unit="bpm"
        max={100}
        color="#FB7185"
        avg={signals.restingHr.avg14d}
      />
    </div>
  );
}
