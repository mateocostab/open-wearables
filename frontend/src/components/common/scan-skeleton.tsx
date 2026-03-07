import { cn } from '@/lib/utils';

interface ScanSkeletonProps {
  className?: string;
  rows?: number;
}

export function ScanSkeleton({ className, rows = 1 }: ScanSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="relative h-16 rounded-lg overflow-hidden bg-zinc-900/30 border border-zinc-800/50"
        >
          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent" />
          <div className="absolute inset-0 opacity-30">
            <div className="h-full w-0.5 bg-gradient-to-b from-transparent via-cyan-400/40 to-transparent animate-scan-sweep" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ScanCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="relative p-4 rounded-lg overflow-hidden glass-panel"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="h-5 w-5 bg-zinc-800/50 rounded mb-3" />
          <div className="h-7 w-20 bg-zinc-800/50 rounded mb-1" />
          <div className="h-4 w-24 bg-zinc-800/30 rounded" />
          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent" />
        </div>
      ))}
    </div>
  );
}
