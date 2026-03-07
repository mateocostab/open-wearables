import { useMemo } from 'react';
import { format } from 'date-fns';
import { LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts';
import { HeartPulse, Activity, Heart, Droplets } from 'lucide-react';
import { useRecoverySummaries } from '@/hooks/api/use-health';
import { useDateRange } from '@/hooks/use-date-range';
import {
  calculateRecoveryStats,
  formatRecoveryScore,
  getRecoveryLevel,
} from '@/lib/utils/recovery';
import { formatHrv, formatHeartRate } from '@/lib/utils/body';
import { MetricCard } from '@/components/common/metric-card';
import { SectionHeader } from '@/components/common/section-header';
import { ScanCardSkeleton } from '@/components/common/scan-skeleton';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface RecoverySectionProps {
  userId: string;
}

export function RecoverySection({ userId }: RecoverySectionProps) {
  // Use a fixed 30-day window for recovery data
  const { startDate, endDate } = useDateRange(30);

  // Fetch recovery summaries
  const { data: recoveryData, isLoading } = useRecoverySummaries(userId, {
    start_date: startDate,
    end_date: endDate,
    limit: 30,
    sort_order: 'asc',
  });

  // Calculate aggregate statistics
  const stats = useMemo(
    () => calculateRecoveryStats(recoveryData?.data || []),
    [recoveryData]
  );

  // Recovery level color indicator
  const recoveryLevel = useMemo(
    () => getRecoveryLevel(stats?.avgRecoveryScore ?? null),
    [stats]
  );

  // Prepare chart data sorted by date ascending
  const chartData = useMemo(() => {
    const summaries = recoveryData?.data || [];
    if (summaries.length === 0) return [];

    return [...summaries]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((r) => ({
        date: format(new Date(r.date), 'MMM d'),
        recovery: r.recovery_score ?? 0,
        hrv: r.avg_hrv_sdnn_ms ?? 0,
      }));
  }, [recoveryData]);

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
      <SectionHeader title="Recovery & HRV" />

      <div className="p-6">
        {isLoading ? (
          <ScanCardSkeleton count={4} />
        ) : !stats ? (
          <p className="text-sm text-zinc-500 text-center py-8">
            No recovery data available
          </p>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Recovery Score */}
              <div className="relative">
                <MetricCard
                  icon={HeartPulse}
                  iconColor="text-emerald-400"
                  iconBgColor="bg-emerald-500/10"
                  value={formatRecoveryScore(stats.avgRecoveryScore)}
                  label="Recovery Score"
                />
                {recoveryLevel.label && (
                  <span
                    className={`absolute top-3 right-3 text-[10px] font-medium ${recoveryLevel.color}`}
                  >
                    {recoveryLevel.label}
                  </span>
                )}
              </div>

              {/* HRV */}
              <MetricCard
                icon={Activity}
                iconColor="text-indigo-400"
                iconBgColor="bg-indigo-500/10"
                value={formatHrv(stats.avgHrv)}
                label="HRV"
              />

              {/* Resting HR */}
              <MetricCard
                icon={Heart}
                iconColor="text-rose-400"
                iconBgColor="bg-rose-500/10"
                value={formatHeartRate(stats.avgRestingHr)}
                label="Resting HR"
              />

              {/* SpO2 */}
              <MetricCard
                icon={Droplets}
                iconColor="text-sky-400"
                iconBgColor="bg-sky-500/10"
                value={
                  stats.avgSpo2 ? `${Math.round(stats.avgSpo2)}%` : '-'
                }
                label="SpO2"
              />
            </div>

            {/* Recovery Trend Chart */}
            {chartData.length > 1 && (
              <div className="pt-4 border-t border-zinc-800">
                <h4 className="text-sm font-medium text-white mb-4">
                  Recovery Trend (30 days)
                </h4>
                <ChartContainer
                  config={{
                    recovery: {
                      label: 'Recovery Score',
                      color: '#10b981',
                    },
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
                      domain={[0, 100]}
                      width={35}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent />}
                    />
                    <Line
                      dataKey="recovery"
                      type="monotone"
                      stroke="var(--color-recovery)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: 'var(--color-recovery)' }}
                    />
                  </LineChart>
                </ChartContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
