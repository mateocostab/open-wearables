import { format } from 'date-fns';
import { formatDistanceToNow } from 'date-fns';
import {
  Heart,
  Activity,
  Scale,
  Percent,
  Footprints,
  Flame,
  Timer,
  Moon,
  Zap,
  Clock,
  ChevronRight,
  Watch,
  CheckCircle2,
  XCircle,
  TriangleAlert,
} from 'lucide-react';
import {
  useBodySummary,
  useActivitySummaries,
  useSleepSummaries,
  useWorkouts,
  useUserConnections,
} from '@/hooks/api/use-health';
import { useDateRange } from '@/hooks/use-date-range';
import { MetricCard } from '@/components/common/metric-card';
import { providerDisplayNames } from '@/components/user/connection-card';
import { getWorkoutStyle } from '@/lib/utils/workout-styles';
import {
  formatNumber,
  formatMinutes,
  formatDuration,
  formatCalories,
  formatWeight,
  formatPercentDecimal,
  formatHeartRate,
} from '@/lib/utils/format';
import { formatHrv } from '@/lib/utils/body';
import {
  getSleepStageData,
  SLEEP_STAGE_COLORS,
} from '@/lib/utils/sleep';

interface HomeSectionProps {
  userId: string;
  userName?: string;
  onNavigateToTab: (tab: string) => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function SectionSkeleton({ rows = 1 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 bg-zinc-800/50 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

function SectionContainer({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-zinc-900/50 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-colors"
    >
      <div className="px-6 py-4 flex items-center justify-between border-b border-zinc-800">
        <h3 className="text-sm font-medium text-white">{title}</h3>
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          View details
          <ChevronRight className="h-3 w-3" />
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ============================================================================
// Section 1: Body Vitals
// ============================================================================
function BodyVitalsSection({
  userId,
  onClick,
}: {
  userId: string;
  onClick: () => void;
}) {
  const { data: bodySummary, isLoading } = useBodySummary(userId, {
    average_period: 7,
    latest_window_hours: 24,
  });

  return (
    <SectionContainer title="Body Vitals" onClick={onClick}>
      {isLoading ? (
        <SectionSkeleton />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon={Heart}
            iconColor="text-rose-400"
            iconBgColor="bg-rose-500/10"
            value={
              bodySummary?.averaged?.resting_heart_rate_bpm
                ? `${Math.round(bodySummary.averaged.resting_heart_rate_bpm)}`
                : '-'
            }
            label="Resting HR (bpm)"
          />
          <MetricCard
            icon={Activity}
            iconColor="text-indigo-400"
            iconBgColor="bg-indigo-500/10"
            value={formatHrv(bodySummary?.averaged?.avg_hrv_sdnn_ms)}
            label="HRV (ms)"
          />
          <MetricCard
            icon={Scale}
            iconColor="text-blue-400"
            iconBgColor="bg-blue-500/10"
            value={formatWeight(bodySummary?.slow_changing?.weight_kg ?? null)}
            label="Weight"
          />
          <MetricCard
            icon={Percent}
            iconColor="text-orange-400"
            iconBgColor="bg-orange-500/10"
            value={formatPercentDecimal(
              bodySummary?.slow_changing?.body_fat_percent ?? null
            )}
            label="Body Fat"
          />
        </div>
      )}
    </SectionContainer>
  );
}

// ============================================================================
// Section 2: Today's Activity
// ============================================================================
function ActivityOverviewSection({
  userId,
  onClick,
}: {
  userId: string;
  onClick: () => void;
}) {
  const { startDate, endDate } = useDateRange(1);
  const { data, isLoading } = useActivitySummaries(userId, {
    start_date: startDate,
    end_date: endDate,
    limit: 1,
    sort_order: 'desc',
  });

  const today = data?.data?.[0];

  return (
    <SectionContainer title="Today's Activity" onClick={onClick}>
      {isLoading ? (
        <SectionSkeleton />
      ) : !today ? (
        <p className="text-sm text-zinc-500 text-center py-2">
          No activity data recorded today
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon={Footprints}
            iconColor="text-emerald-400"
            iconBgColor="bg-emerald-500/10"
            value={formatNumber(today.steps)}
            label="Steps"
          />
          <MetricCard
            icon={Flame}
            iconColor="text-orange-400"
            iconBgColor="bg-orange-500/10"
            value={formatNumber(today.active_calories_kcal)}
            label="Active Calories"
          />
          <MetricCard
            icon={Timer}
            iconColor="text-sky-400"
            iconBgColor="bg-sky-500/10"
            value={formatMinutes(today.active_minutes)}
            label="Active Time"
          />
          <MetricCard
            icon={Heart}
            iconColor="text-rose-400"
            iconBgColor="bg-rose-500/10"
            value={formatHeartRate(today.heart_rate?.avg_bpm)}
            label="Avg Heart Rate"
          />
        </div>
      )}
    </SectionContainer>
  );
}

// ============================================================================
// Section 3: Last Night's Sleep
// ============================================================================
function SleepOverviewSection({
  userId,
  onClick,
}: {
  userId: string;
  onClick: () => void;
}) {
  const { startDate, endDate } = useDateRange(2);
  const { data, isLoading } = useSleepSummaries(userId, {
    start_date: startDate,
    end_date: endDate,
    limit: 1,
    sort_order: 'desc',
  });

  const lastNight = data?.data?.[0];
  const stageData = getSleepStageData(lastNight?.stages);

  return (
    <SectionContainer title="Last Night's Sleep" onClick={onClick}>
      {isLoading ? (
        <SectionSkeleton />
      ) : !lastNight ? (
        <p className="text-sm text-zinc-500 text-center py-2">
          No sleep data recorded
        </p>
      ) : (
        <div className="space-y-4">
          {/* Simple sleep stages bar */}
          {stageData.length > 0 && (
            <div className="h-3 bg-zinc-700 rounded-full overflow-hidden flex">
              {stageData.map(
                (stage) =>
                  stage.pct > 0 && (
                    <div
                      key={stage.key}
                      className={SLEEP_STAGE_COLORS[stage.key as keyof typeof SLEEP_STAGE_COLORS]}
                      style={{ width: `${stage.pct}%` }}
                    />
                  )
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <MetricCard
              icon={Moon}
              iconColor="text-indigo-400"
              iconBgColor="bg-indigo-500/10"
              value={formatMinutes(lastNight.duration_minutes)}
              label="Duration"
            />
            <MetricCard
              icon={Zap}
              iconColor="text-emerald-400"
              iconBgColor="bg-emerald-500/10"
              value={
                lastNight.efficiency_percent !== null &&
                lastNight.efficiency_percent !== undefined
                  ? `${Math.round(lastNight.efficiency_percent)}%`
                  : '-'
              }
              label="Efficiency"
            />
            <MetricCard
              icon={Clock}
              iconColor="text-sky-400"
              iconBgColor="bg-sky-500/10"
              value={
                lastNight.start_time
                  ? format(new Date(lastNight.start_time), 'h:mm a')
                  : '-'
              }
              label="Bedtime"
            />
          </div>
        </div>
      )}
    </SectionContainer>
  );
}

// ============================================================================
// Section 4: Recent Workouts
// ============================================================================
function WorkoutsOverviewSection({
  userId,
  onClick,
}: {
  userId: string;
  onClick: () => void;
}) {
  const { data, isLoading } = useWorkouts(userId, {
    limit: 3,
    sort_order: 'desc',
  });

  const workouts = data?.data ?? [];

  return (
    <SectionContainer title="Recent Workouts" onClick={onClick}>
      {isLoading ? (
        <SectionSkeleton rows={3} />
      ) : workouts.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-2">
          No workouts recorded yet
        </p>
      ) : (
        <div className="space-y-2">
          {workouts.map((workout) => {
            const style = getWorkoutStyle(workout.type);
            return (
              <div
                key={workout.id}
                className="flex items-center gap-3 p-3 border border-zinc-800 rounded-lg bg-zinc-900/30"
              >
                <span className="text-lg">{style.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {style.label}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {format(new Date(workout.start_time), 'EEE, MMM d')}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  {workout.duration_seconds && (
                    <span className="flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      {formatDuration(workout.duration_seconds)}
                    </span>
                  )}
                  {workout.calories_kcal && (
                    <span className="flex items-center gap-1">
                      <Flame className="h-3 w-3" />
                      {formatCalories(workout.calories_kcal)}
                    </span>
                  )}
                  {workout.avg_heart_rate_bpm && (
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {Math.round(workout.avg_heart_rate_bpm)} bpm
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionContainer>
  );
}

// ============================================================================
// Section 5: Connected Devices
// ============================================================================
function DevicesOverviewSection({
  userId,
  onClick,
}: {
  userId: string;
  onClick: () => void;
}) {
  const { data: connections, isLoading } = useUserConnections(userId);

  return (
    <SectionContainer title="Connected Devices" onClick={onClick}>
      {isLoading ? (
        <SectionSkeleton rows={2} />
      ) : !connections || connections.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-2">
          No devices connected
        </p>
      ) : (
        <div className="space-y-2">
          {connections.map((conn) => (
            <div
              key={conn.id}
              className="flex items-center gap-3 p-3 border border-zinc-800 rounded-lg bg-zinc-900/30"
            >
              <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                <Watch className="h-4 w-4 text-zinc-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {providerDisplayNames[conn.provider] ?? conn.provider}
                </p>
                <p className="text-xs text-zinc-500">
                  {conn.last_synced_at
                    ? `Synced ${formatDistanceToNow(new Date(conn.last_synced_at), { addSuffix: true })}`
                    : 'Never synced'}
                </p>
              </div>
              {conn.status === 'active' && (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  Active
                </span>
              )}
              {conn.status === 'revoked' && (
                <span className="flex items-center gap-1 text-xs text-red-400">
                  <XCircle className="h-3 w-3" />
                  Revoked
                </span>
              )}
              {conn.status === 'expired' && (
                <span className="flex items-center gap-1 text-xs text-orange-400">
                  <TriangleAlert className="h-3 w-3" />
                  Expired
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </SectionContainer>
  );
}

// ============================================================================
// Main Home Section
// ============================================================================
export function HomeSection({ userId, userName, onNavigateToTab }: HomeSectionProps) {
  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-xl font-medium text-white">
          {getGreeting()}, {userName ?? 'there'}
        </h2>
        <p className="text-sm text-zinc-500 mt-0.5">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      <BodyVitalsSection userId={userId} onClick={() => onNavigateToTab('body')} />
      <ActivityOverviewSection userId={userId} onClick={() => onNavigateToTab('activity')} />
      <SleepOverviewSection userId={userId} onClick={() => onNavigateToTab('sleep')} />
      <WorkoutsOverviewSection userId={userId} onClick={() => onNavigateToTab('workouts')} />
      <DevicesOverviewSection userId={userId} onClick={() => onNavigateToTab('devices')} />
    </div>
  );
}
