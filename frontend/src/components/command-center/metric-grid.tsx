import type { HealthSignals } from '@/hooks/use-health-signals';
import { MetricRingCard } from './metric-ring-card';

interface MetricGridProps {
  signals: HealthSignals;
}

export function MetricGrid({ signals }: MetricGridProps) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      role="list"
      aria-label="Detailed health metrics"
    >
      {/* Whoop-first: Recovery, Sleep, HRV, RHR, SpO2 */}
      <MetricRingCard
        label="Recovery"
        sublabel={
          signals.recovery.avg14d !== null
            ? `${signals.recovery.avg14d}% avg`
            : undefined
        }
        value={signals.recovery.value}
        unit="%"
        max={100}
        color={signals.recovery.color}
        avg={signals.recovery.avg14d}
        provider={signals.recovery.provider}
      />

      <MetricRingCard
        label="Sleep"
        sublabel={signals.sleep.value !== null ? 'avg per night' : undefined}
        value={signals.sleep.value}
        unit="hrs"
        max={10}
        color={signals.sleep.color}
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
        color={signals.sleepEfficiency.color}
        avg={signals.sleepEfficiency.avg14d}
        provider={signals.sleepEfficiency.provider}
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
        color={signals.hrv.color}
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
        color={signals.restingHr.color}
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
        color={signals.spo2.color}
        avg={signals.spo2.avg14d}
        provider={signals.spo2.provider}
      />

      {/* Apple fills gaps: Activity, Steps, Resp Rate */}
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
        color={signals.activity.color}
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
        color={signals.steps.color}
        avg={signals.steps.avg14d}
        provider={signals.steps.provider}
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
        color={signals.respiratoryRate.color}
        avg={signals.respiratoryRate.avg14d}
        provider={signals.respiratoryRate.provider}
      />
    </div>
  );
}
