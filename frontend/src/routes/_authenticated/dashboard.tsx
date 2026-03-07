import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useCallback } from 'react';
import { useUsers } from '@/hooks/api/use-users';
import { useUserDataSources } from '@/hooks/api/use-priorities';
import { CommandCenterLayout } from '@/components/command-center';
import { ActivitySection } from '@/components/user/activity-section';
import { SleepSection } from '@/components/user/sleep-section';
import { WorkoutSection } from '@/components/user/workout-section';
import { BodySection } from '@/components/user/body-section';
import { RecoverySection } from '@/components/user/recovery-section';
import { ROUTES } from '@/lib/constants/routes';
import type { DateRangeValue } from '@/components/ui/date-range-selector';

interface DashboardSearch {
  section?: string;
}

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
  validateSearch: (search: Record<string, unknown>): DashboardSearch => ({
    section: (search.section as string) ?? 'overview',
  }),
});

function DashboardPage() {
  const { data: users, isLoading } = useUsers({ limit: 1 });
  const userId = users?.items?.[0]?.id;
  const navigate = useNavigate();
  const { section } = Route.useSearch();
  const activeSection = section ?? 'overview';

  const [activityDateRange, setActivityDateRange] = useState<DateRangeValue>(30);
  const [sleepDateRange, setSleepDateRange] = useState<DateRangeValue>(30);
  const [workoutDateRange, setWorkoutDateRange] = useState<DateRangeValue>(30);
  const [activityDeviceFilter, setActivityDeviceFilter] = useState<string | null>(null);
  const [sleepDeviceFilter, setSleepDeviceFilter] = useState<string | null>(null);

  const { data: dataSources } = useUserDataSources(userId ?? '');

  const setActiveSection = useCallback(
    (newSection: string) => {
      navigate({
        to: ROUTES.dashboard,
        search: { section: newSection },
      });
    },
    [navigate]
  );

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-4">
          <div className="h-6 w-48 bg-zinc-800/50 rounded animate-shimmer" />
          <div className="h-4 w-64 bg-zinc-800/30 rounded animate-shimmer" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 glass-panel animate-shimmer" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="p-8">
        <h1 className="text-lg font-semibold tracking-widest uppercase text-cyan-400 text-glow-primary">
          Health Command Center
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          No user found. Create a user in Settings to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      {activeSection === 'overview' && <CommandCenterLayout userId={userId} />}
      {activeSection === 'recovery' && <RecoverySection userId={userId} />}
      {activeSection === 'activity' && (
        <ActivitySection
          userId={userId}
          dateRange={activityDateRange}
          onDateRangeChange={setActivityDateRange}
          dataSources={dataSources ?? []}
          deviceFilter={activityDeviceFilter}
          onDeviceFilterChange={setActivityDeviceFilter}
        />
      )}
      {activeSection === 'sleep' && (
        <SleepSection
          userId={userId}
          dateRange={sleepDateRange}
          onDateRangeChange={setSleepDateRange}
          dataSources={dataSources ?? []}
          deviceFilter={sleepDeviceFilter}
          onDeviceFilterChange={setSleepDeviceFilter}
        />
      )}
      {activeSection === 'workouts' && (
        <WorkoutSection
          userId={userId}
          dateRange={workoutDateRange}
          onDateRangeChange={setWorkoutDateRange}
        />
      )}
      {activeSection === 'body' && <BodySection userId={userId} />}
    </div>
  );
}
