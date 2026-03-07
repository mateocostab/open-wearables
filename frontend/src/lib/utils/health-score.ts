export interface HealthScoreBreakdown {
  composite: number;
  recovery: number;
  sleep: number;
  activity: number;
}

interface HealthScoreInput {
  recoveryScore: number | null; // 0-100
  sleepDurationHours: number | null;
  sleepEfficiency: number | null; // 0-100
  activeCalories: number | null;
  targetCalories?: number;
}

export function calculateHealthScore(input: HealthScoreInput): HealthScoreBreakdown {
  const { recoveryScore, sleepDurationHours, sleepEfficiency, activeCalories, targetCalories = 500 } = input;

  // Recovery sub-score (0-100) - weight: 40%
  const recovery = recoveryScore !== null ? Math.min(100, Math.max(0, recoveryScore)) : 0;

  // Sleep sub-score (0-100) - weight: 35%
  // Normalized: (duration/8h) * efficiency, capped at 100
  const durationScore = sleepDurationHours !== null ? Math.min(1, sleepDurationHours / 8) * 100 : 0;
  const efficiencyScore = sleepEfficiency !== null ? sleepEfficiency : 0;
  const sleep = durationScore > 0 && efficiencyScore > 0
    ? (durationScore * 0.6 + efficiencyScore * 0.4)
    : Math.max(durationScore, efficiencyScore);

  // Activity sub-score (0-100) - weight: 25%
  const activity = activeCalories !== null
    ? Math.min(100, (activeCalories / targetCalories) * 100)
    : 0;

  // Weighted composite
  const composite = Math.round(recovery * 0.4 + sleep * 0.35 + activity * 0.25);

  return {
    composite: Math.min(100, Math.max(0, composite)),
    recovery: Math.round(recovery),
    sleep: Math.round(sleep),
    activity: Math.round(activity),
  };
}
