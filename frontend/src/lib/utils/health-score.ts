export interface HealthScoreBreakdown {
  composite: number;
  sleep: number;
  activity: number;
  heart: number;
  recovery: number;
}

interface HealthScoreInput {
  sleepDurationHours: number | null;
  sleepEfficiency: number | null; // 0-100
  activeCalories: number | null;
  targetCalories?: number;
  restingHr: number | null; // bpm
  hrv: number | null; // ms
  recoveryScore: number | null; // 0-100
}

export function calculateHealthScore(
  input: HealthScoreInput
): HealthScoreBreakdown {
  const {
    sleepDurationHours,
    sleepEfficiency,
    activeCalories,
    targetCalories = 500,
    restingHr,
    hrv,
    recoveryScore,
  } = input;

  // Sleep sub-score (0-100) — weight: 30%
  const durationScore =
    sleepDurationHours !== null
      ? Math.min(1, sleepDurationHours / 8) * 100
      : 0;
  const efficiencyScore = sleepEfficiency !== null ? sleepEfficiency : 0;
  const sleep =
    durationScore > 0 && efficiencyScore > 0
      ? durationScore * 0.6 + efficiencyScore * 0.4
      : Math.max(durationScore, efficiencyScore);

  // Activity sub-score (0-100) — weight: 25%
  const activity =
    activeCalories !== null
      ? Math.min(100, (activeCalories / targetCalories) * 100)
      : 0;

  // Heart sub-score (0-100) — weight: 25%
  // RHR: lower is better (40-80 range -> 100-0 score)
  // HRV: higher is better (20-100 range -> 0-100 score)
  let heartScore = 0;
  let heartParts = 0;
  if (restingHr !== null) {
    const rhrScore = Math.min(
      100,
      Math.max(0, ((80 - restingHr) / 40) * 100)
    );
    heartScore += rhrScore;
    heartParts++;
  }
  if (hrv !== null) {
    const hrvScore = Math.min(100, Math.max(0, ((hrv - 20) / 80) * 100));
    heartScore += hrvScore;
    heartParts++;
  }
  const heart = heartParts > 0 ? heartScore / heartParts : 0;

  // Recovery sub-score (0-100) — weight: 20%
  // Direct pass-through if available (Whoop provides 0-100)
  const recovery = recoveryScore !== null ? Math.min(100, Math.max(0, recoveryScore)) : 0;

  // Weighted composite: Sleep 30% + Activity 25% + Heart 25% + Recovery 20%
  const composite = Math.round(
    sleep * 0.3 + activity * 0.25 + heart * 0.25 + recovery * 0.2
  );

  return {
    composite: Math.min(100, Math.max(0, composite)),
    sleep: Math.round(sleep),
    activity: Math.round(activity),
    heart: Math.round(heart),
    recovery: Math.round(recovery),
  };
}
