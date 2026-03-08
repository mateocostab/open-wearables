import { useMemo } from 'react';
import {
  useActivitySummaries,
  useSleepSummaries,
  useRecoverySummaries,
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
  provider: string | null;
}

export interface HealthSignals {
  sleep: HealthSignal;
  activity: HealthSignal;
  recovery: HealthSignal;
  hrv: HealthSignal;
  restingHr: HealthSignal;
  steps: HealthSignal;
  sleepEfficiency: HealthSignal;
  spo2: HealthSignal;
  respiratoryRate: HealthSignal;
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

  const { data: recoveryData, isLoading: recoveryLoading } =
    useRecoverySummaries(userId, {
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
    const recoverySummaries = recoveryData?.data ?? [];

    // Sleep (convert minutes to hours)
    const sleepDurations = sleepSummaries.map((s) =>
      s.duration_minutes !== null ? s.duration_minutes / 60 : null
    );
    const latestSleep = sleepDurations[0] ?? null;
    const avgSleep = computeAvg(sleepDurations);
    const sleepProvider = sleepSummaries[0]?.source?.provider ?? null;

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
    const activityProvider = activitySummaries[0]?.source?.provider ?? null;

    // Steps
    const stepValues = activitySummaries.map((a) => a.steps);
    const latestSteps = stepValues[0] ?? null;
    const avgSteps = computeAvg(stepValues);

    // Recovery score
    const recoveryScores = recoverySummaries.map((r) => r.recovery_score);
    const latestRecovery = recoveryScores[0] ?? null;
    const avgRecovery = computeAvg(recoveryScores);
    const recoveryProvider = recoverySummaries[0]?.source?.provider ?? null;

    // SpO2 — prefer recovery summaries, fallback to sleep summaries
    const spo2FromRecovery = recoverySummaries.map((r) => r.avg_spo2_percent);
    const spo2FromSleep = sleepSummaries.map((s) => s.avg_spo2_percent);
    const spo2Values = spo2FromRecovery.some((v) => v !== null) ? spo2FromRecovery : spo2FromSleep;
    const latestSpo2 = spo2Values[0] ?? null;
    const avgSpo2 = computeAvg(spo2Values);
    const spo2Provider = spo2FromRecovery.some((v) => v !== null)
      ? recoveryProvider
      : sleepProvider;

    // Respiratory rate from sleep summaries
    const respValues = sleepSummaries.map((s) => s.avg_respiratory_rate);
    const latestResp = respValues[0] ?? null;
    const avgResp = computeAvg(respValues);

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
    const bodyProvider = bodySummary?.source?.provider ?? null;

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
        provider: sleepProvider,
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
        provider: sleepProvider,
      },
      activity: {
        label: 'Activity',
        value: latestActivity !== null ? Math.round(latestActivity) : null,
        unit: 'kcal',
        avg14d: avgActivity !== null ? Math.round(avgActivity) : null,
        momentum: computeMomentum(latestActivity, activeCals),
        color: '#00E5FF',
        accentClass: 'text-cyan-400',
        provider: activityProvider,
      },
      recovery: {
        label: 'Recovery',
        value: latestRecovery !== null ? Math.round(latestRecovery) : null,
        unit: '%',
        avg14d: avgRecovery !== null ? Math.round(avgRecovery) : null,
        momentum: computeMomentum(latestRecovery, recoveryScores),
        color: '#FBBF24',
        accentClass: 'text-amber-400',
        provider: recoveryProvider,
      },
      steps: {
        label: 'Steps',
        value: latestSteps !== null ? Math.round(latestSteps) : null,
        unit: '',
        avg14d: avgSteps !== null ? Math.round(avgSteps) : null,
        momentum: computeMomentum(latestSteps, stepValues),
        color: '#10B981',
        accentClass: 'text-emerald-400',
        provider: activityProvider,
      },
      hrv: {
        label: 'HRV',
        value: latestHrv !== null ? Math.round(latestHrv) : null,
        unit: 'ms',
        avg14d: avgHrv !== null ? Math.round(avgHrv) : null,
        momentum: computeMomentum(latestHrv, hrvValues),
        color: '#FF33AA',
        accentClass: 'text-pink-400',
        provider: latestHrvFromSleep !== null ? sleepProvider : bodyProvider,
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
        provider: bodyProvider,
      },
      spo2: {
        label: 'SpO2',
        value: latestSpo2 !== null ? Math.round(latestSpo2 * 10) / 10 : null,
        unit: '%',
        avg14d: avgSpo2 !== null ? Math.round(avgSpo2 * 10) / 10 : null,
        momentum: latestSpo2 !== null ? Math.min(100, Math.max(0, (latestSpo2 - 90) * 10)) : 0,
        color: '#38BDF8',
        accentClass: 'text-sky-400',
        provider: spo2Provider,
      },
      respiratoryRate: {
        label: 'Resp Rate',
        value: latestResp !== null ? Math.round(latestResp * 10) / 10 : null,
        unit: 'brpm',
        avg14d: avgResp !== null ? Math.round(avgResp * 10) / 10 : null,
        momentum: computeMomentum(latestResp, respValues),
        color: '#A78BFA',
        accentClass: 'text-violet-400',
        provider: sleepProvider,
      },
    };
  }, [sleepData, activityData, recoveryData, bodySummary]);

  return {
    ...signals,
    isLoading: sleepLoading || activityLoading || recoveryLoading || bodyLoading,
  };
}
