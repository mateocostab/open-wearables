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
        provider={signals.sleep.provider}
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
        provider={signals.sleepEfficiency.provider}
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
        provider={signals.activity.provider}
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
        provider={signals.steps.provider}
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
        provider={signals.hrv.provider}
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
        provider={signals.restingHr.provider}
      />

      <MetricRingCard
        label="SpO2"
        sublabel={
          signals.spo2.avg14d !== null
            ? `${signals.spo2.avg14d}% avg`
            : undefined
        }
        value={signals.spo2.value}
        unit="%"
        max={100}
        color="#38BDF8"
        avg={signals.spo2.avg14d}
        provider={signals.spo2.provider}
      />

      <MetricRingCard
        label="Resp Rate"
        sublabel={
          signals.respiratoryRate.avg14d !== null
            ? `${signals.respiratoryRate.avg14d} brpm avg`
            : undefined
        }
        value={signals.respiratoryRate.value}
        unit="brpm"
        max={30}
        color="#A78BFA"
        avg={signals.respiratoryRate.avg14d}
        provider={signals.respiratoryRate.provider}
      />
    </div>
  );
}
