import { useMemo } from 'react';
import {
  useActivitySummaries,
  useSleepSummaries,
  useBodySummary,
} from '@/hooks/api/use-health';
import { useDateRange } from '@/hooks/use-date-range';

export interface HealthSignal {
  label: string;
  value: number | null;
  unit: string;
  avg14d: number | null;
  momentum: number; // 0-100 percentage
  color: string;
  accentClass: string;
}

export interface HealthSignals {
  sleep: HealthSignal;
  activity: HealthSignal;
  hrv: HealthSignal;
  restingHr: HealthSignal;
  steps: HealthSignal;
  sleepEfficiency: HealthSignal;
  isLoading: boolean;
}

function computeAvg(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function computeMomentum(
  current: number | null,
  values: (number | null)[]
): number {
  if (current === null) return 0;
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return 50;
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  if (max === min) return 50;
  return Math.min(
    100,
    Math.max(0, ((current - min) / (max - min)) * 100)
  );
}

export function useHealthSignals(userId: string): HealthSignals {
  const { startDate, endDate } = useDateRange(14);

  const { data: sleepData, isLoading: sleepLoading } = useSleepSummaries(
    userId,
    {
      start_date: startDate,
      end_date: endDate,
      limit: 14,
      sort_order: 'desc',
    }
  );

  const { data: activityData, isLoading: activityLoading } =
    useActivitySummaries(userId, {
      start_date: startDate,
      end_date: endDate,
      limit: 14,
      sort_order: 'desc',
    });

  const { data: bodySummary, isLoading: bodyLoading } = useBodySummary(
    userId,
    { average_period: 7 }
  );

  const signals = useMemo((): Omit<HealthSignals, 'isLoading'> => {
    const sleepSummaries = sleepData?.data ?? [];
    const activitySummaries = activityData?.data ?? [];

    // Sleep (convert minutes to hours)
    const sleepDurations = sleepSummaries.map((s) =>
      s.duration_minutes !== null ? s.duration_minutes / 60 : null
    );
    const latestSleep = sleepDurations[0] ?? null;
    const avgSleep = computeAvg(sleepDurations);

    // Sleep efficiency
    const sleepEfficiencies = sleepSummaries.map(
      (s) => s.efficiency_percent
    );
    const latestEfficiency = sleepEfficiencies[0] ?? null;
    const avgEfficiency = computeAvg(sleepEfficiencies);

    // Activity (calories)
    const activeCals = activitySummaries.map(
      (a) => a.active_calories_kcal
    );
    const latestActivity = activeCals[0] ?? null;
    const avgActivity = computeAvg(activeCals);

    // Steps
    const stepValues = activitySummaries.map((a) => a.steps);
    const latestSteps = stepValues[0] ?? null;
    const avgSteps = computeAvg(stepValues);

    // HRV — prefer sleep summaries (nightly HRV), fallback to body summary
    const hrvValues = sleepSummaries.map((s) => s.avg_hrv_sdnn_ms);
    const latestHrvFromSleep = hrvValues[0] ?? null;
    const avgHrvFromSleep = computeAvg(hrvValues);
    const hrvFromBody = bodySummary?.averaged?.avg_hrv_sdnn_ms ?? null;
    const latestHrv = latestHrvFromSleep ?? hrvFromBody;
    const avgHrv = avgHrvFromSleep ?? hrvFromBody;

    // Resting HR from body summary
    const restingHrValue =
      bodySummary?.averaged?.resting_heart_rate_bpm ?? null;

    return {
      sleep: {
        label: 'Sleep',
        value:
          latestSleep !== null
            ? Math.round(latestSleep * 10) / 10
            : null,
        unit: 'hrs',
        avg14d: avgSleep !== null ? Math.round(avgSleep * 10) / 10 : null,
        momentum: computeMomentum(latestSleep, sleepDurations),
        color: '#818CF8',
        accentClass: 'text-indigo-400',
      },
      sleepEfficiency: {
        label: 'Sleep Efficiency',
        value:
          latestEfficiency !== null ? Math.round(latestEfficiency) : null,
        unit: '%',
        avg14d:
          avgEfficiency !== null ? Math.round(avgEfficiency) : null,
        momentum: computeMomentum(latestEfficiency, sleepEfficiencies),
        color: '#34D399',
        accentClass: 'text-emerald-400',
      },
      activity: {
        label: 'Activity',
        value: latestActivity !== null ? Math.round(latestActivity) : null,
        unit: 'kcal',
        avg14d: avgActivity !== null ? Math.round(avgActivity) : null,
        momentum: computeMomentum(latestActivity, activeCals),
        color: '#00E5FF',
        accentClass: 'text-cyan-400',
      },
      steps: {
        label: 'Steps',
        value: latestSteps !== null ? Math.round(latestSteps) : null,
        unit: '',
        avg14d: avgSteps !== null ? Math.round(avgSteps) : null,
        momentum: computeMomentum(latestSteps, stepValues),
        color: '#10B981',
        accentClass: 'text-emerald-400',
      },
      hrv: {
        label: 'HRV',
        value: latestHrv !== null ? Math.round(latestHrv) : null,
        unit: 'ms',
        avg14d: avgHrv !== null ? Math.round(avgHrv) : null,
        momentum: computeMomentum(latestHrv, hrvValues),
        color: '#FF33AA',
        accentClass: 'text-pink-400',
      },
      restingHr: {
        label: 'Resting HR',
        value:
          restingHrValue !== null ? Math.round(restingHrValue) : null,
        unit: 'bpm',
        avg14d:
          restingHrValue !== null ? Math.round(restingHrValue) : null,
        momentum: 50,
        color: '#FB7185',
        accentClass: 'text-rose-400',
      },
    };
  }, [sleepData, activityData, bodySummary]);

  return {
    ...signals,
    isLoading: sleepLoading || activityLoading || bodyLoading,
  };
}
