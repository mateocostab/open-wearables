import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo, type ReactNode } from 'react';
import { Activity, Dumbbell, Moon, Scale, Watch, type LucideIcon } from 'lucide-react';
import { useUsers } from '@/hooks/api/use-users';
import { useUserConnections } from '@/hooks/api/use-health';
import { ActivitySection } from '@/components/user/activity-section';
import { SleepSection } from '@/components/user/sleep-section';
import { WorkoutSection } from '@/components/user/workout-section';
import { BodySection } from '@/components/user/body-section';
import { ConnectionCard } from '@/components/user/connection-card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { DateRangeValue } from '@/components/ui/date-range-selector';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
});

interface TabConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  content: ReactNode;
}

function DashboardPage() {
  const { data: users, isLoading } = useUsers({ limit: 1 });
  const userId = users?.items?.[0]?.id;
  const userName = users?.items?.[0]?.first_name;

  const [activeTab, setActiveTab] = useState('activity');
  const [activityDateRange, setActivityDateRange] = useState<DateRangeValue>(30);
  const [sleepDateRange, setSleepDateRange] = useState<DateRangeValue>(30);
  const [workoutDateRange, setWorkoutDateRange] = useState<DateRangeValue>(30);

  const tabs: TabConfig[] = useMemo(
    () =>
      userId
        ? [
            {
              id: 'activity',
              label: 'Activity',
              icon: Activity,
              content: (
                <ActivitySection
                  userId={userId}
                  dateRange={activityDateRange}
                  onDateRangeChange={setActivityDateRange}
                />
              ),
            },
            {
              id: 'sleep',
              label: 'Sleep',
              icon: Moon,
              content: (
                <SleepSection
                  userId={userId}
                  dateRange={sleepDateRange}
                  onDateRangeChange={setSleepDateRange}
                />
              ),
            },
            {
              id: 'workouts',
              label: 'Workouts',
              icon: Dumbbell,
              content: (
                <WorkoutSection
                  userId={userId}
                  dateRange={workoutDateRange}
                  onDateRangeChange={setWorkoutDateRange}
                />
              ),
            },
            {
              id: 'body',
              label: 'Body',
              icon: Scale,
              content: <BodySection userId={userId} />,
            },
            {
              id: 'devices',
              label: 'Devices',
              icon: Watch,
              content: <DevicesSection userId={userId} />,
            },
          ]
        : [],
    [userId, activityDateRange, sleepDateRange, workoutDateRange]
  );

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-zinc-800 rounded" />
          <div className="h-4 w-64 bg-zinc-800 rounded" />
          <div className="h-10 w-96 bg-zinc-800 rounded mt-6" />
          <div className="h-64 bg-zinc-800 rounded mt-4" />
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-medium text-white">Health Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">
          No user found. Create a user in Settings to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Health Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {userName ? `${userName}'s health data` : 'Your health data overview'}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function DevicesSection({ userId }: { userId: string }) {
  const { data: connections, isLoading } = useUserConnections(userId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-40 bg-zinc-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!connections || connections.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500">No devices connected yet</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(400px,1fr))] mt-4">
      {connections.map((connection) => (
        <ConnectionCard key={connection.id} connection={connection} />
      ))}
    </div>
  );
}
