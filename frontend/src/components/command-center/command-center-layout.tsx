import { lazy, Suspense } from 'react';
import { format } from 'date-fns';
import { Sparkles, Command } from 'lucide-react';
import { useHealthSignals } from '@/hooks/use-health-signals';
import { useBodySummary } from '@/hooks/api/use-health';
import { useIsMobile } from '@/hooks/use-mobile';
import { SignalCards } from './signal-cards';
import { SignalMomentum } from './signal-momentum';
import { DataCoverage } from './data-coverage';
import { HealthScore } from './health-score';
import { MetricGrid } from './metric-grid';
import { AvatarFallback } from './avatar/avatar-fallback';

const AvatarCanvas = lazy(() =>
  import('./avatar/avatar-canvas').then((m) => ({ default: m.AvatarCanvas }))
);

interface CommandCenterLayoutProps {
  userId: string;
}

export function CommandCenterLayout({ userId }: CommandCenterLayoutProps) {
  const signals = useHealthSignals(userId);
  const { data: bodySummary } = useBodySummary(userId, { average_period: 7 });
  const isMobile = useIsMobile();

  const restingHr = bodySummary?.averaged?.resting_heart_rate_bpm ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[11px] font-semibold tracking-wider uppercase text-cyan-400">
              Overview
            </span>
            <h1 className="text-xl font-semibold text-white">
              Health Command Center
            </h1>
          </div>
          <p className="text-sm text-zinc-500 mt-1">
            Dashboard &middot; 14-day health overview
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50">
          <Command className="h-3 w-3" />
          Quick Command
          <kbd className="text-[10px] text-zinc-600 ml-1">&#8984;K</kbd>
        </div>
      </div>

      {/* Top Section: 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Left: At-a-glance snapshot */}
        <div className="space-y-4">
          {/* Snapshot card */}
          <div className="glass-panel p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  At-a-Glance Snapshot
                </p>
                <p className="text-[11px] text-zinc-600 mt-0.5">
                  Today's key signals at a glance.
                </p>
              </div>
              <span className="text-[11px] text-zinc-500 px-2 py-1 rounded-md bg-zinc-800/50 border border-zinc-800">
                <Sparkles className="h-3 w-3 inline mr-1 text-cyan-500" />
                {format(new Date(), 'yyyy-MM-dd')}
              </span>
            </div>
            <SignalCards signals={signals} />
          </div>

          {/* Momentum + Coverage side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SignalMomentum signals={signals} />
            <DataCoverage userId={userId} />
          </div>
        </div>

        {/* Right: Biometric Avatar */}
        {!isMobile && (
          <div className="glass-panel p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Biometric Avatar
                </p>
                <p className="text-[11px] text-zinc-600">
                  Realtime physiology scan
                </p>
              </div>
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
                <span className="text-[10px] font-semibold tracking-wider uppercase text-emerald-400">
                  Scan Active
                </span>
              </span>
            </div>

            {/* Avatar container - aspect-ratio to match body proportions */}
            <div className="relative aspect-[3/4]">
              <Suspense fallback={<AvatarFallback />}>
                <AvatarCanvas
                  restingHr={restingHr}
                  hrv={signals.hrv.value}
                  recoveryScore={signals.recovery.value}
                  sleepHours={signals.sleep.value}
                  activeCalories={signals.activity.value}
                />
              </Suspense>

              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-cyan-500/30" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-cyan-500/30" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-cyan-500/30" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-cyan-500/30" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: Health Score + Metric Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
        <HealthScore userId={userId} />
        <MetricGrid userId={userId} />
      </div>
    </div>
  );
}
