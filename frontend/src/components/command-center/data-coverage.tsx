import {
  Heart,
  Moon,
  Activity,
  Dumbbell,
  Wifi,
} from 'lucide-react';
import {
  useRecoverySummaries,
  useSleepSummaries,
  useActivitySummaries,
  useWorkouts,
  useUserConnections,
} from '@/hooks/api/use-health';
import { useDateRange } from '@/hooks/use-date-range';

interface DataCoverageProps {
  userId: string;
}

interface CoverageRow {
  icon: React.ElementType;
  label: string;
  count: number;
  iconColor: string;
  barColor: string;
}

export function DataCoverage({ userId }: DataCoverageProps) {
  const { startDate, endDate } = useDateRange(14);

  const { data: recoveryData } = useRecoverySummaries(userId, {
    start_date: startDate,
    end_date: endDate,
    limit: 14,
    sort_order: 'desc',
  });

  const { data: sleepData } = useSleepSummaries(userId, {
    start_date: startDate,
    end_date: endDate,
    limit: 14,
    sort_order: 'desc',
  });

  const { data: activityData } = useActivitySummaries(userId, {
    start_date: startDate,
    end_date: endDate,
    limit: 14,
    sort_order: 'desc',
  });

  const { data: workoutsData } = useWorkouts(userId, {
    limit: 50,
    sort_order: 'desc',
  });

  const { data: connections } = useUserConnections(userId);

  const rows: CoverageRow[] = [
    {
      icon: Heart,
      label: 'Recovery',
      count: recoveryData?.data?.length ?? 0,
      iconColor: 'text-green-400',
      barColor: '#4ade80',
    },
    {
      icon: Moon,
      label: 'Sleep',
      count: sleepData?.data?.length ?? 0,
      iconColor: 'text-indigo-400',
      barColor: '#818cf8',
    },
    {
      icon: Activity,
      label: 'Activity',
      count: activityData?.data?.length ?? 0,
      iconColor: 'text-cyan-400',
      barColor: '#00e5ff',
    },
    {
      icon: Dumbbell,
      label: 'Workouts',
      count: workoutsData?.data?.length ?? 0,
      iconColor: 'text-pink-400',
      barColor: '#f472b6',
    },
    {
      icon: Wifi,
      label: 'Devices',
      count: connections?.length ?? 0,
      iconColor: 'text-amber-400',
      barColor: '#fbbf24',
    },
  ];

  return (
    <div className="glass-panel p-4" role="region" aria-label="Data coverage">
      <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
        Data Coverage (14d)
      </h2>

      <div className="space-y-2.5">
        {rows.map((row) => {
          const Icon = row.icon;
          const fill = Math.min(1, row.count / 14);
          return (
            <div key={row.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-3.5 w-3.5 ${row.iconColor}`} aria-hidden="true" />
                  <span className="text-xs text-zinc-400">{row.label}</span>
                </div>
                <span className="text-xs font-semibold text-zinc-200 tabular-nums">
                  {row.count}<span className="text-zinc-600">/14</span>
                </span>
              </div>
              <div className="h-[3px] rounded-full bg-zinc-800/60 overflow-hidden" aria-hidden="true">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${fill * 100}%`, backgroundColor: row.barColor }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
