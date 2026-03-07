import type { RecoverySummary } from '@/lib/api/types';

export interface RecoveryStats {
  avgRecoveryScore: number | null;
  avgHrv: number | null;
  avgRestingHr: number | null;
  avgSpo2: number | null;
  daysTracked: number;
}

export function calculateRecoveryStats(summaries: RecoverySummary[]): RecoveryStats | null {
  if (summaries.length === 0) return null;

  const scores = summaries.map((s) => s.recovery_score).filter((v): v is number => v !== null);
  const hrvs = summaries.map((s) => s.avg_hrv_sdnn_ms).filter((v): v is number => v !== null);
  const hrs = summaries.map((s) => s.resting_heart_rate_bpm).filter((v): v is number => v !== null);
  const spo2s = summaries.map((s) => s.avg_spo2_percent).filter((v): v is number => v !== null);

  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

  return {
    avgRecoveryScore: avg(scores),
    avgHrv: avg(hrvs),
    avgRestingHr: avg(hrs),
    avgSpo2: avg(spo2s),
    daysTracked: summaries.length,
  };
}

export function formatRecoveryScore(score: number | null): string {
  if (score === null) return '-';
  return `${Math.round(score)}%`;
}

export function getRecoveryLevel(score: number | null): { label: string; color: string } {
  if (score === null) return { label: '', color: 'text-zinc-500' };
  if (score >= 67) return { label: 'Green', color: 'text-emerald-400' };
  if (score >= 34) return { label: 'Yellow', color: 'text-amber-400' };
  return { label: 'Red', color: 'text-rose-400' };
}
