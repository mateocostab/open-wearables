import { useMemo } from 'react';
import { useRecoverySummaries, useActivitySummaries, useSleepSummaries } from '@/hooks/api/use-health';
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
  recovery: HealthSignal;
  sleep: HealthSignal;
  activity: HealthSignal;
  hrv: HealthSignal;
  isLoading: boolean;
}

function computeAvg(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function computeMomentum(current: number | null, values: (number | null)[]): number {
  if (current === null) return 0;
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return 50;
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  if (max === min) return 50;
  return Math.min(100, Math.max(0, ((current - min) / (max - min)) * 100));
}

export function useHealthSignals(userId: string): HealthSignals {
  const { startDate, endDate } = useDateRange(14);

  const { data: recoveryData, isLoading: recoveryLoading } = useRecoverySummaries(userId, {
    start_date: startDate,
    end_date: endDate,
    limit: 14,
    sort_order: 'desc',
  });

  const { data: sleepData, isLoading: sleepLoading } = useSleepSummaries(userId, {
    start_date: startDate,
    end_date: endDate,
    limit: 14,
    sort_order: 'desc',
  });

  const { data: activityData, isLoading: activityLoading } = useActivitySummaries(userId, {
    start_date: startDate,
    end_date: endDate,
    limit: 14,
    sort_order: 'desc',
  });

  const signals = useMemo((): Omit<HealthSignals, 'isLoading'> => {
    const recoverySummaries = recoveryData?.data ?? [];
    const sleepSummaries = sleepData?.data ?? [];
    const activitySummaries = activityData?.data ?? [];

    // Recovery
    const recoveryScores = recoverySummaries.map((r) => r.recovery_score);
    const latestRecovery = recoveryScores[0] ?? null;
    const avgRecovery = computeAvg(recoveryScores);

    // Sleep (convert minutes to hours)
    const sleepDurations = sleepSummaries.map((s) =>
      s.duration_minutes !== null ? s.duration_minutes / 60 : null
    );
    const latestSleep = sleepDurations[0] ?? null;
    const avgSleep = computeAvg(sleepDurations);

    // Activity
    const activeCals = activitySummaries.map((a) => a.active_calories_kcal);
    const latestActivity = activeCals[0] ?? null;
    const avgActivity = computeAvg(activeCals);

    // HRV (from recovery summaries)
    const hrvValues = recoverySummaries.map((r) => r.avg_hrv_sdnn_ms);
    const latestHrv = hrvValues[0] ?? null;
    const avgHrv = computeAvg(hrvValues);

    return {
      recovery: {
        label: 'Recovery',
        value: latestRecovery,
        unit: '%',
        avg14d: avgRecovery,
        momentum: computeMomentum(latestRecovery, recoveryScores),
        color: '#00FF7F',
        accentClass: 'text-green-400',
      },
      sleep: {
        label: 'Sleep',
        value: latestSleep !== null ? Math.round(latestSleep * 10) / 10 : null,
        unit: 'hrs',
        avg14d: avgSleep !== null ? Math.round(avgSleep * 10) / 10 : null,
        momentum: computeMomentum(latestSleep, sleepDurations),
        color: '#818CF8',
        accentClass: 'text-indigo-400',
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
      hrv: {
        label: 'HRV',
        value: latestHrv !== null ? Math.round(latestHrv) : null,
        unit: 'ms',
        avg14d: avgHrv !== null ? Math.round(avgHrv) : null,
        momentum: computeMomentum(latestHrv, hrvValues),
        color: '#FF33AA',
        accentClass: 'text-pink-400',
      },
    };
  }, [recoveryData, sleepData, activityData]);

  return {
    ...signals,
    isLoading: recoveryLoading || sleepLoading || activityLoading,
  };
}
