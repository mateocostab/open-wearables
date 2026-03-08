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
  // Single hook call — signals passed to all children via props
  const signals = useHealthSignals(userId);
  const { data: bodySummary } = useBodySummary(userId, { average_period: 7 });
  const isMobile = useIsMobile();

  const restingHr = bodySummary?.averaged?.resting_heart_rate_bpm ?? null;

  if (signals.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6" aria-busy="true" aria-label="Loading health data">
        {/* Boot sequence ring */}
        <div className="relative w-28 h-28">
          <svg viewBox="0 0 100 100" className="w-full h-full animate-spin" style={{ animationDuration: '3s' }} aria-hidden="true">
            <circle cx={50} cy={50} r={42} fill="none" stroke="rgb(39 39 42)" strokeWidth={2} />
            <circle
              cx={50} cy={50} r={42}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              strokeDasharray={`${2 * Math.PI * 42 * 0.25} ${2 * Math.PI * 42 * 0.75}`}
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 6px hsl(185 100% 50% / 0.5))' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-cyan-400 animate-pulse-glow" aria-hidden="true" />
          </div>
        </div>

        {/* Status text */}
        <div className="text-center space-y-1.5">
          <p className="text-sm font-semibold text-white tracking-wide">
            Initializing Health OS
          </p>
          <p className="text-[11px] text-zinc-500 uppercase tracking-widest">
            Syncing biometric data
          </p>
        </div>

        {/* Scan line effect */}
        <div className="w-48 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent animate-pulse-glow" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
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
          <Command className="h-3 w-3" aria-hidden="true" />
          Quick Command
          <kbd className="text-[10px] text-zinc-500 ml-1">&#8984;K</kbd>
        </div>
      </header>

      {/* Top Section: 2-column layout — avatar column shrinks on medium screens */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_360px] gap-6">
        {/* Left: At-a-glance snapshot */}
        <div className="space-y-4">
          {/* Snapshot card */}
          <section className="glass-panel p-5" aria-labelledby="snapshot-title">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 id="snapshot-title" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  At-a-Glance Snapshot
                </h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Today's key signals at a glance.
                </p>
              </div>
              <span className="text-[11px] text-zinc-500 px-2 py-1 rounded-md bg-zinc-800/50 border border-zinc-800">
                <Sparkles className="h-3 w-3 inline mr-1 text-cyan-500" aria-hidden="true" />
                {format(new Date(), 'yyyy-MM-dd')}
              </span>
            </div>
            <SignalCards signals={signals} />
          </section>

          {/* Momentum + Coverage side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SignalMomentum signals={signals} />
            <DataCoverage userId={userId} />
          </div>
        </div>

        {/* Right: Biometric Avatar — hidden only on phones, visible on tablet+ */}
        {!isMobile && (
          <section className="hidden md:flex glass-panel p-4 relative overflow-visible flex-col" aria-label="Biometric avatar">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Biometric Avatar
                </h2>
                <p className="text-[11px] text-zinc-500">
                  Realtime physiology scan
                </p>
              </div>
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-dot" aria-hidden="true" />
                <span className="text-[10px] font-semibold tracking-wider uppercase text-emerald-400">
                  Scan Active
                </span>
              </span>
            </div>

            {/* Avatar container */}
            <div className="relative flex-1 min-h-[200px]">
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
              <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-cyan-500/30" aria-hidden="true" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-cyan-500/30" aria-hidden="true" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-cyan-500/30" aria-hidden="true" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-cyan-500/30" aria-hidden="true" />
            </div>
          </section>
        )}
      </div>

      {/* Bottom Section: Health Score + Metric Cards */}
      <section className="grid grid-cols-1 md:grid-cols-[320px_1fr] lg:grid-cols-[400px_1fr] gap-6" aria-label="Detailed metrics">
        <HealthScore signals={signals} />
        <MetricGrid signals={signals} />
      </section>
    </div>
  );
}
