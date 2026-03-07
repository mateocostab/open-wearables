import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import { SectionHeader } from '@/components/common/section-header';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useActivitySummaries } from '@/hooks/api/use-health';
import { useDateRange } from '@/hooks/use-date-range';
import type { DateRangeValue } from '@/components/ui/date-range-selector';
import type { DataSource } from '@/lib/api/services/priority.service';

const COMPARISON_METRICS = [
  { key: 'steps', label: 'Steps', getValue: (s: any) => s.steps || 0 },
  {
    key: 'calories',
    label: 'Calories',
    getValue: (s: any) => s.active_calories_kcal || 0,
  },
  {
    key: 'heartRate',
    label: 'Avg Heart Rate',
    getValue: (s: any) => s.heart_rate?.avg_bpm || 0,
  },
  {
    key: 'distance',
    label: 'Distance (km)',
    getValue: (s: any) => ((s.distance_meters || 0) / 1000),
  },
  {
    key: 'activeMinutes',
    label: 'Active Minutes',
    getValue: (s: any) => s.active_minutes || 0,
  },
] as const;

const DEVICE_COLORS = [
  'hsl(160, 60%, 45%)', // emerald
  'hsl(220, 70%, 55%)', // blue
  'hsl(340, 65%, 50%)', // rose
  'hsl(45, 80%, 50%)',  // amber
  'hsl(280, 60%, 55%)', // purple
];

interface DeviceComparisonChartProps {
  userId: string;
  dataSources: DataSource[];
}

export function DeviceComparisonChart({
  userId,
  dataSources,
}: DeviceComparisonChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>('steps');
  const [dateRange, setDateRange] = useState<DateRangeValue>(7);

  // Only compare first 3 devices max
  const devices = dataSources.slice(0, 3);

  const { startDate, endDate } = useDateRange(dateRange);

  // Fetch data for each device in parallel via separate queries
  const device0 = useActivitySummaries(userId, {
    start_date: startDate,
    end_date: endDate,
    limit: dateRange,
    data_source_id: devices[0]?.id,
  });

  const device1 = useActivitySummaries(userId, {
    start_date: startDate,
    end_date: endDate,
    limit: dateRange,
    ...(devices[1] ? { data_source_id: devices[1].id } : {}),
  });

  const device2Query = devices[2]
    ? {
        start_date: startDate,
        end_date: endDate,
        limit: dateRange,
        data_source_id: devices[2].id,
      }
    : null;

  const device2 = useActivitySummaries(
    userId,
    device2Query ?? { start_date: '', end_date: '', limit: 0 }
  );

  const metricDef = COMPARISON_METRICS.find((m) => m.key === selectedMetric) || COMPARISON_METRICS[0];

  // Merge data from all devices into chart data keyed by date
  const chartData = useMemo(() => {
    const dateMap = new Map<string, Record<string, number>>();

    const deviceResults = [device0.data, device1.data];
    if (devices[2] && device2Query) deviceResults.push(device2.data);

    deviceResults.forEach((result, idx) => {
      const summaries = result?.data || [];
      for (const s of summaries) {
        const dateKey = s.date;
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, {});
        }
        const row = dateMap.get(dateKey)!;
        row[`device${idx}`] = metricDef.getValue(s);
      }
    });

    return Array.from(dateMap.entries())
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([dateStr, values]) => ({
        date: format(new Date(dateStr), 'MMM d'),
        ...values,
      }));
  }, [device0.data, device1.data, device2.data, metricDef, devices.length]);

  const isLoading = device0.isLoading || device1.isLoading;
  const hasData = chartData.length > 0;

  // Build chart config
  const chartConfig: Record<string, { label: string; color: string }> = {};
  devices.forEach((ds, idx) => {
    chartConfig[`device${idx}`] = {
      label: ds.display_name || ds.device_model || `Device ${idx + 1}`,
      color: DEVICE_COLORS[idx],
    };
  });

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
      <SectionHeader
        title="Device Comparison"
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      <div className="p-6 space-y-4">
        {/* Metric Selector */}
        <div className="flex items-center gap-1 bg-zinc-800/50 p-1 rounded-lg w-fit">
          {COMPARISON_METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setSelectedMetric(m.key)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedMetric === m.key
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Chart */}
        {isLoading ? (
          <div className="h-[250px] flex items-center justify-center">
            <div className="h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !hasData ? (
          <p className="text-sm text-zinc-500 text-center py-12">
            No overlapping data between devices for this period
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart accessibilityLayer data={chartData}>
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
                tickFormatter={(value) =>
                  value >= 1000
                    ? `${(value / 1000).toFixed(0)}k`
                    : String(Math.round(value))
                }
              />
              <ChartTooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                content={<ChartTooltipContent />}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              />
              {devices.map((_, idx) => (
                <Bar
                  key={`device${idx}`}
                  dataKey={`device${idx}`}
                  fill={DEVICE_COLORS[idx]}
                  radius={[3, 3, 0, 0]}
                />
              ))}
            </BarChart>
          </ChartContainer>
        )}
      </div>
    </div>
  );
}
