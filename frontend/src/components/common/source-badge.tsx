interface SourceBadgeProps {
  provider: string;
  className?: string;
}

const PROVIDER_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  garmin: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Garmin' },
  fitbit: { bg: 'bg-teal-500/20', text: 'text-teal-400', label: 'Fitbit' },
  oura: { bg: 'bg-violet-500/20', text: 'text-violet-400', label: 'Oura' },
  whoop: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'WHOOP' },
  strava: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Strava' },
  'google-fit': {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    label: 'Google Fit',
  },
  withings: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: 'Withings' },
  apple: { bg: 'bg-zinc-400/20', text: 'text-zinc-300', label: 'Apple' },
  'auto-health-export': {
    bg: 'bg-zinc-400/20',
    text: 'text-zinc-300',
    label: 'Apple',
  },
  'health-auto-export': {
    bg: 'bg-zinc-400/20',
    text: 'text-zinc-300',
    label: 'Apple',
  },
  apple_health_auto_export: {
    bg: 'bg-zinc-400/20',
    text: 'text-zinc-300',
    label: 'Apple',
  },
};

const DEFAULT_STYLE = { bg: 'bg-zinc-500/20', text: 'text-zinc-400' };

function formatProviderLabel(raw: string): string {
  // Convert snake_case/kebab-case to title case, cap at 12 chars
  const cleaned = raw.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return cleaned.length > 12 ? cleaned.slice(0, 11) + '\u2026' : cleaned;
}

export function SourceBadge({ provider, className = '' }: SourceBadgeProps) {
  const style = PROVIDER_STYLES[provider] ?? DEFAULT_STYLE;
  const label = PROVIDER_STYLES[provider]?.label ?? formatProviderLabel(provider);

  return (
    <span
      className={`inline-flex items-center text-[10px] font-medium leading-none px-1.5 py-0.5 rounded max-w-[80px] truncate ${style.bg} ${style.text} ${className}`}
      title={PROVIDER_STYLES[provider]?.label ?? provider}
      aria-label={`Source: ${PROVIDER_STYLES[provider]?.label ?? provider}`}
    >
      {label}
    </span>
  );
}
