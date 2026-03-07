import { BarChart3, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ViewMode } from '@/hooks/use-view-mode';

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ mode, onChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-zinc-900/50 border border-zinc-800">
      <button
        onClick={() => onChange('simple')}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all',
          mode === 'simple'
            ? 'bg-zinc-800 text-white'
            : 'text-zinc-500 hover:text-zinc-300'
        )}
      >
        <Layers className="h-3 w-3" />
        Simple
      </button>
      <button
        onClick={() => onChange('advanced')}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all',
          mode === 'advanced'
            ? 'bg-zinc-800 text-white'
            : 'text-zinc-500 hover:text-zinc-300'
        )}
      >
        <BarChart3 className="h-3 w-3" />
        Advanced
      </button>
    </div>
  );
}
