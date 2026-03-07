import { Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DataSource } from '@/lib/api/services/priority.service';

interface DeviceSelectorProps {
  dataSources: DataSource[];
  value: string | null; // data_source_id or null for "All Devices"
  onChange: (value: string | null) => void;
  className?: string;
}

export function DeviceSelector({
  dataSources,
  value,
  onChange,
  className,
}: DeviceSelectorProps) {
  if (dataSources.length <= 1) return null;

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center gap-1.5">
        <Monitor className="h-3.5 w-3.5 text-zinc-500" />
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="bg-zinc-800/50 text-xs text-zinc-300 border border-zinc-700 rounded-md px-2 py-1 pr-6 appearance-none cursor-pointer hover:border-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
        >
          <option value="">All Devices</option>
          {dataSources.map((ds) => (
            <option key={ds.id} value={ds.id}>
              {ds.display_name || ds.device_model || ds.source || 'Unknown'}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
