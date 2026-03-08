import { useMemo } from 'react';
import {
  useActivitySummaries,
  useSleepSummaries,
  useRecoverySummaries,
  useBodySummary,
} from '@/hooks/api/use-health';
import { useDateRange } from '@/hooks/use-date-range';
import { SIGNAL_COLORS } from '@/lib/constants/signal-colors';

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
  strain: HealthSignal;
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

    // Recovery score — endpoint returns asc order, take last (most recent) entry
    const recoveryScores = recoverySummaries.map((r) => r.recovery_score);
    const mostRecentRecovery = recoverySummaries[recoverySummaries.length - 1];
    const latestRecovery = mostRecentRecovery?.recovery_score ?? null;
    const avgRecovery = computeAvg(recoveryScores);
    const recoveryProvider = mostRecentRecovery?.source?.provider ?? null;

    // SpO2 — prefer recovery (Whoop), fallback to sleep (Apple)
    const spo2FromRecovery = recoverySummaries.map((r) => r.avg_spo2_percent);
    const spo2FromSleep = sleepSummaries.map((s) => s.avg_spo2_percent);
    const hasSpo2Recovery = spo2FromRecovery.some((v) => v !== null);
    const spo2Values = hasSpo2Recovery ? spo2FromRecovery : spo2FromSleep;
    const latestSpo2 = hasSpo2Recovery
      ? (mostRecentRecovery?.avg_spo2_percent ?? null)
      : (spo2FromSleep[0] ?? null);
    const avgSpo2 = computeAvg(spo2Values);
    const spo2Provider = hasSpo2Recovery ? recoveryProvider : sleepProvider;

    // Respiratory rate from sleep summaries
    const respValues = sleepSummaries.map((s) => s.avg_respiratory_rate);
    const latestResp = respValues[0] ?? null;
    const avgResp = computeAvg(respValues);

    // HRV — prefer recovery (Whoop RMSSD), fallback to sleep (Apple SDNN), then body
    const hrvFromRecovery = recoverySummaries.map((r) => r.avg_hrv_sdnn_ms);
    const hrvFromSleep = sleepSummaries.map((s) => s.avg_hrv_sdnn_ms);
    const hasHrvRecovery = hrvFromRecovery.some((v) => v !== null);
    const hrvValues = hasHrvRecovery ? hrvFromRecovery : hrvFromSleep;
    const latestHrvDirect = hasHrvRecovery
      ? (mostRecentRecovery?.avg_hrv_sdnn_ms ?? null)
      : (hrvFromSleep[0] ?? null);
    const avgHrvDirect = computeAvg(hrvValues);
    const hrvFromBody = bodySummary?.averaged?.avg_hrv_sdnn_ms ?? null;
    const latestHrv = latestHrvDirect ?? hrvFromBody;
    const avgHrv = avgHrvDirect ?? hrvFromBody;
    const hrvProvider = hrvFromRecovery.some((v) => v !== null)
      ? recoveryProvider
      : (latestHrvDirect !== null ? sleepProvider : bodySummary?.source?.provider ?? null);

    // Resting HR — prefer recovery (Whoop daily RHR), fallback to body summary (7d avg)
    const rhrFromRecovery = recoverySummaries.map((r) => r.resting_heart_rate_bpm);
    const latestRhrFromRecovery = mostRecentRecovery?.resting_heart_rate_bpm ?? null;
    const avgRhrFromRecovery = computeAvg(rhrFromRecovery);
    const rhrFromBody = bodySummary?.averaged?.resting_heart_rate_bpm ?? null;
    const restingHrValue = latestRhrFromRecovery ?? rhrFromBody;
    const restingHrAvg = avgRhrFromRecovery ?? rhrFromBody;
    const rhrProvider = latestRhrFromRecovery !== null
      ? recoveryProvider
      : bodySummary?.source?.provider ?? null;

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
        color: SIGNAL_COLORS.sleep.hex,
        accentClass: SIGNAL_COLORS.sleep.tw,
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
        color: SIGNAL_COLORS.sleepEfficiency.hex,
        accentClass: SIGNAL_COLORS.sleepEfficiency.tw,
        provider: sleepProvider,
      },
      activity: {
        label: 'Activity',
        value: latestActivity !== null ? Math.round(latestActivity) : null,
        unit: 'kcal',
        avg14d: avgActivity !== null ? Math.round(avgActivity) : null,
        momentum: computeMomentum(latestActivity, activeCals),
        color: SIGNAL_COLORS.activity.hex,
        accentClass: SIGNAL_COLORS.activity.tw,
        provider: activityProvider,
      },
      recovery: {
        label: 'Recovery',
        value: latestRecovery !== null ? Math.round(latestRecovery) : null,
        unit: '%',
        avg14d: avgRecovery !== null ? Math.round(avgRecovery) : null,
        momentum: computeMomentum(latestRecovery, recoveryScores),
        color: SIGNAL_COLORS.recovery.hex,
        accentClass: SIGNAL_COLORS.recovery.tw,
        provider: recoveryProvider,
      },
      steps: {
        label: 'Steps',
        value: latestSteps !== null ? Math.round(latestSteps) : null,
        unit: '',
        avg14d: avgSteps !== null ? Math.round(avgSteps) : null,
        momentum: computeMomentum(latestSteps, stepValues),
        color: SIGNAL_COLORS.steps.hex,
        accentClass: SIGNAL_COLORS.steps.tw,
        provider: activityProvider,
      },
      hrv: {
        label: 'HRV',
        value: latestHrv !== null ? Math.round(latestHrv) : null,
        unit: 'ms',
        avg14d: avgHrv !== null ? Math.round(avgHrv) : null,
        momentum: computeMomentum(latestHrv, hrvValues),
        color: SIGNAL_COLORS.hrv.hex,
        accentClass: SIGNAL_COLORS.hrv.tw,
        provider: hrvProvider,
      },
      restingHr: {
        label: 'Resting HR',
        value:
          restingHrValue !== null ? Math.round(restingHrValue) : null,
        unit: 'bpm',
        avg14d:
          restingHrAvg !== null ? Math.round(restingHrAvg) : null,
        momentum: 50,
        color: SIGNAL_COLORS.restingHr.hex,
        accentClass: SIGNAL_COLORS.restingHr.tw,
        provider: rhrProvider,
      },
      spo2: {
        label: 'SpO2',
        value: latestSpo2 !== null ? Math.round(latestSpo2 * 10) / 10 : null,
        unit: '%',
        avg14d: avgSpo2 !== null ? Math.round(avgSpo2 * 10) / 10 : null,
        momentum: latestSpo2 !== null ? Math.min(100, Math.max(0, (latestSpo2 - 90) * 10)) : 0,
        color: SIGNAL_COLORS.spo2.hex,
        accentClass: SIGNAL_COLORS.spo2.tw,
        provider: spo2Provider,
      },
      respiratoryRate: {
        label: 'Resp Rate',
        value: latestResp !== null ? Math.round(latestResp * 10) / 10 : null,
        unit: 'brpm',
        avg14d: avgResp !== null ? Math.round(avgResp * 10) / 10 : null,
        momentum: computeMomentum(latestResp, respValues),
        color: SIGNAL_COLORS.respiratoryRate.hex,
        accentClass: SIGNAL_COLORS.respiratoryRate.tw,
        provider: sleepProvider,
      },
      strain: (() => {
        const strainValues = activitySummaries.map((a) => {
          const cal = a.active_calories_kcal ?? 0;
          const mins = a.active_minutes ?? 0;
          return Math.min(21, (cal / 500) * 10 + (mins / 60) * 4);
        });
        const latestStrain = strainValues[0] ?? null;
        const avgStrain = computeAvg(strainValues.map((v) => (v > 0 ? v : null)));
        return {
          label: 'Strain',
          value: latestStrain !== null && latestStrain > 0 ? Math.round(latestStrain * 10) / 10 : null,
          unit: '',
          avg14d: avgStrain !== null ? Math.round(avgStrain * 10) / 10 : null,
          momentum: computeMomentum(latestStrain, strainValues.map((v) => (v > 0 ? v : null))),
          color: SIGNAL_COLORS.strain.hex,
          accentClass: SIGNAL_COLORS.strain.tw,
          provider: activitySummaries[0]?.source?.provider ?? null,
        };
      })(),
    };
  }, [sleepData, activityData, recoveryData, bodySummary]);

  return {
    ...signals,
    isLoading: sleepLoading || activityLoading || recoveryLoading || bodyLoading,
  };
}
