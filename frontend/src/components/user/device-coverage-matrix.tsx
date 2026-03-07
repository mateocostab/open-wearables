import { SectionHeader } from '@/components/common/section-header';
import type { DataSourceCoverage } from '@/lib/api/services/priority.service';

// Key metrics to show as columns
const COVERAGE_METRICS = [
  { key: 'steps', label: 'Steps' },
  { key: 'heart_rate', label: 'HR' },
  { key: 'energy', label: 'Energy' },
  { key: 'distance_walking_running', label: 'Distance' },
  { key: 'heart_rate_variability_sdnn', label: 'HRV' },
  { key: 'oxygen_saturation', label: 'SpO2' },
  { key: 'resting_heart_rate', label: 'RHR' },
  { key: 'weight', label: 'Weight' },
  { key: 'body_temperature', label: 'Temp' },
  { key: 'respiratory_rate', label: 'Resp' },
] as const;

interface DeviceCoverageMatrixProps {
  coverage: DataSourceCoverage[];
}

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`;
  return String(count);
}

export function DeviceCoverageMatrix({ coverage }: DeviceCoverageMatrixProps) {
  if (coverage.length === 0) return null;

  // Build lookup: { deviceId: { seriesType: count } }
  const deviceMetrics = new Map<string, Map<string, number>>();
  for (const device of coverage) {
    const metricMap = new Map<string, number>();
    for (const metric of device.metrics) {
      metricMap.set(metric.series_type, metric.count);
    }
    deviceMetrics.set(device.data_source_id, metricMap);
  }

  // Filter to only show metrics that at least one device has
  const activeMetrics = COVERAGE_METRICS.filter((m) =>
    coverage.some((d) => deviceMetrics.get(d.data_source_id)?.has(m.key))
  );

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
      <SectionHeader title="Data Coverage" />

      <div className="p-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left text-xs font-medium text-zinc-400 pb-3 pr-4">
                Device
              </th>
              {activeMetrics.map((m) => (
                <th
                  key={m.key}
                  className="text-center text-xs font-medium text-zinc-400 pb-3 px-2"
                >
                  {m.label}
                </th>
              ))}
              <th className="text-right text-xs font-medium text-zinc-400 pb-3 pl-4">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {coverage.map((device) => {
              const metrics = deviceMetrics.get(device.data_source_id)!;
              return (
                <tr
                  key={device.data_source_id}
                  className="border-b border-zinc-800/50 last:border-b-0"
                >
                  <td className="py-3 pr-4">
                    <p className="text-sm font-medium text-white">
                      {device.display_name}
                    </p>
                    {device.device_model && (
                      <p className="text-xs text-zinc-500">
                        {device.device_model}
                      </p>
                    )}
                  </td>
                  {activeMetrics.map((m) => {
                    const count = metrics.get(m.key);
                    return (
                      <td key={m.key} className="text-center py-3 px-2">
                        {count ? (
                          <span className="inline-flex items-center justify-center min-w-[2rem] px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400">
                            {formatCount(count)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center min-w-[2rem] px-1.5 py-0.5 rounded text-xs text-zinc-600">
                            -
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="text-right py-3 pl-4">
                    <span className="text-xs font-medium text-zinc-300">
                      {formatCount(device.total_data_points)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
