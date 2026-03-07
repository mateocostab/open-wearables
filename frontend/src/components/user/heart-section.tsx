import { useMemo } from 'react';
import { format } from 'date-fns';
import { LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Heart, Activity, Zap, HeartPulse } from 'lucide-react';
import { useActivitySummaries } from '@/hooks/api/use-health';
import { useBodySummary } from '@/hooks/api/use-health';
import { useDateRange } from '@/hooks/use-date-range';
import { formatHeartRate, formatHrv } from '@/lib/utils/body';
import { formatMinutes } from '@/lib/utils/format';
import { MetricCard } from '@/components/common/metric-card';
import { SectionHeader } from '@/components/common/section-header';
import type { DateRangeValue } from '@/components/ui/date-range-selector';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface HeartSectionProps {
  userId: string;
  dateRange: DateRangeValue;
  onDateRangeChange: (value: DateRangeValue) => void;
}

function HeartSectionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 border border-zinc-800 rounded-lg bg-zinc-900/30"
          >
            <div className="h-5 w-5 bg-zinc-800 rounded animate-pulse mb-3" />
            <div className="h-7 w-20 bg-zinc-800 rounded animate-pulse mb-1" />
            <div className="h-4 w-24 bg-zinc-800/50 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeartSection({
  userId,
  dateRange,
  onDateRangeChange,
}: HeartSectionProps) {
  const { startDate, endDate } = useDateRange(dateRange);

  const { data: activityData, isLoading: activityLoading } =
    useActivitySummaries(userId, {
      start_date: startDate,
      end_date: endDate,
      limit: dateRange,
    });

  const { data: bodySummary, isLoading: bodyLoading } = useBodySummary(
    userId,
    { average_period: 7 }
  );

  const isLoading = activityLoading || bodyLoading;

  // Aggregate HR stats from activity summaries
  const hrStats = useMemo(() => {
    const summaries = activityData?.data || [];
    if (summaries.length === 0) return null;

    const withHr = summaries.filter((s) => s.heart_rate?.avg_bpm);
    if (withHr.length === 0) return null;

    const avgHr =
      withHr.reduce((acc, s) => acc + (s.heart_rate!.avg_bpm || 0), 0) /
      withHr.length;
    const maxHr = Math.max(
      ...withHr.map((s) => s.heart_rate?.max_bpm || 0)
    );

    // Aggregate intensity minutes
    const totalLight = summaries.reduce(
      (acc, s) => acc + (s.intensity_minutes?.light || 0),
      0
    );
    const totalModerate = summaries.reduce(
      (acc, s) => acc + (s.intensity_minutes?.moderate || 0),
      0
    );
    const totalVigorous = summaries.reduce(
      (acc, s) => acc + (s.intensity_minutes?.vigorous || 0),
      0
    );

    return {
      avgHr: Math.round(avgHr),
      maxHr,
      totalLight,
      totalModerate,
      totalVigorous,
    };
  }, [activityData]);

  // Chart data: daily HR trend
  const chartData = useMemo(() => {
    const summaries = activityData?.data || [];
    const withHr = summaries.filter((s) => s.heart_rate?.avg_bpm);
    if (withHr.length === 0) return [];

    return [...withHr]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((s) => ({
        date: format(new Date(s.date), 'MMM d'),
        avg: Math.round(s.heart_rate!.avg_bpm || 0),
        max: s.heart_rate?.max_bpm || 0,
        min: s.heart_rate?.min_bpm || 0,
      }));
  }, [activityData]);

  const restingHr = bodySummary?.averaged?.resting_heart_rate_bpm;
  const hrv = bodySummary?.averaged?.avg_hrv_sdnn_ms;
  const hasData = hrStats !== null || restingHr || hrv;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        <SectionHeader
          title="Heart"
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
        />

        <div className="p-6">
          {isLoading ? (
            <HeartSectionSkeleton />
          ) : !hasData ? (
            <p className="text-sm text-zinc-500 text-center py-8">
              No heart rate data available
            </p>
          ) : (
            <div className="space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  icon={Heart}
                  iconColor="text-rose-400"
                  iconBgColor="bg-rose-500/10"
                  value={formatHeartRate(restingHr)}
                  label="Resting HR (7d avg)"
                />
                <MetricCard
                  icon={HeartPulse}
                  iconColor="text-rose-400"
                  iconBgColor="bg-rose-500/10"
                  value={hrStats ? `${hrStats.avgHr}` : '-'}
                  label="Avg HR (bpm)"
                />
                <MetricCard
                  icon={Zap}
                  iconColor="text-orange-400"
                  iconBgColor="bg-orange-500/10"
                  value={hrStats ? `${hrStats.maxHr}` : '-'}
                  label="Max HR (bpm)"
                />
                <MetricCard
                  icon={Activity}
                  iconColor="text-indigo-400"
                  iconBgColor="bg-indigo-500/10"
                  value={formatHrv(hrv)}
                  label="HRV (7d avg, ms)"
                />
              </div>

              {/* HR Trend Chart */}
              {chartData.length > 1 && (
                <div className="pt-4 border-t border-zinc-800">
                  <h4 className="text-sm font-medium text-white mb-4">
                    Heart Rate Trend
                  </h4>
                  <ChartContainer
                    config={{
                      avg: { label: 'Avg HR', color: '#f43f5e' },
                      max: { label: 'Max HR', color: '#f97316' },
                      min: { label: 'Min HR', color: '#6366f1' },
                    }}
                    className="h-[200px] w-full"
                  >
                    <LineChart accessibilityLayer data={chartData}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        interval="preserveStartEnd"
                        tick={{ fill: '#71717a', fontSize: 11 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{ fill: '#71717a', fontSize: 11 }}
                        width={35}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent />}
                      />
                      <Line
                        dataKey="avg"
                        type="monotone"
                        stroke="var(--color-avg)"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: 'var(--color-avg)' }}
                      />
                      <Line
                        dataKey="max"
                        type="monotone"
                        stroke="var(--color-max)"
                        strokeWidth={1.5}
                        dot={false}
                        strokeDasharray="4 2"
                        activeDot={{ r: 3, fill: 'var(--color-max)' }}
                      />
                      <Line
                        dataKey="min"
                        type="monotone"
                        stroke="var(--color-min)"
                        strokeWidth={1.5}
                        dot={false}
                        strokeDasharray="4 2"
                        activeDot={{ r: 3, fill: 'var(--color-min)' }}
                      />
                    </LineChart>
                  </ChartContainer>
                </div>
              )}

              {/* Intensity Minutes */}
              {hrStats &&
                (hrStats.totalLight > 0 ||
                  hrStats.totalModerate > 0 ||
                  hrStats.totalVigorous > 0) && (
                  <div className="pt-4 border-t border-zinc-800">
                    <h4 className="text-sm font-medium text-white mb-4">
                      HR Zone Minutes
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900/30">
                        <p className="text-xs text-zinc-500 mb-1">Light</p>
                        <p className="text-xl font-semibold text-emerald-400">
                          {formatMinutes(hrStats.totalLight)}
                        </p>
                      </div>
                      <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900/30">
                        <p className="text-xs text-zinc-500 mb-1">Moderate</p>
                        <p className="text-xl font-semibold text-amber-400">
                          {formatMinutes(hrStats.totalModerate)}
                        </p>
                      </div>
                      <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900/30">
                        <p className="text-xs text-zinc-500 mb-1">Vigorous</p>
                        <p className="text-xl font-semibold text-rose-400">
                          {formatMinutes(hrStats.totalVigorous)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
