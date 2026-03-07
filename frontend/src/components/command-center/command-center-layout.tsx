import { lazy, Suspense } from 'react';
import { format } from 'date-fns';
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
      <div>
        <h1 className="text-lg font-semibold tracking-widest uppercase text-cyan-400 text-glow-primary">
          Health Command Center
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Main grid */}
      {isMobile ? (
        /* Mobile: single column, no avatar */
        <div className="space-y-4">
          <SignalCards signals={signals} />
          <SignalMomentum signals={signals} />
          <HealthScore userId={userId} />
          <MetricGrid userId={userId} />
          <DataCoverage userId={userId} />
        </div>
      ) : (
        /* Desktop: 3-column layout */
        <div className="grid grid-cols-3 gap-6">
          {/* Left column */}
          <div className="space-y-4">
            <SignalCards signals={signals} />
            <SignalMomentum signals={signals} />
            <DataCoverage userId={userId} />
          </div>

          {/* Center column: Avatar */}
          <div className="relative flex items-center justify-center">
            {/* SCAN ACTIVE overlay */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse-dot" />
              <span className="text-[10px] font-medium tracking-wider uppercase text-green-400">
                Scan Active
              </span>
            </div>

            {/* Corner brackets */}
            {/* Top-left */}
            <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-cyan-500/40 rounded-tl" />
            {/* Top-right */}
            <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-cyan-500/40 rounded-tr" />
            {/* Bottom-left */}
            <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-cyan-500/40 rounded-bl" />
            {/* Bottom-right */}
            <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-cyan-500/40 rounded-br" />

            {/* Avatar canvas */}
            <div className="w-full h-full min-h-[400px]">
              <Suspense fallback={<AvatarFallback />}>
                <AvatarCanvas
                  restingHr={restingHr}
                  hrv={signals.hrv.value}
                  recoveryScore={signals.recovery.value}
                  sleepHours={signals.sleep.value}
                  activeCalories={signals.activity.value}
                />
              </Suspense>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <HealthScore userId={userId} />
            <MetricGrid userId={userId} />
          </div>
        </div>
      )}
    </div>
  );
}
