/**
 * Signal color definitions — single source of truth.
 *
 * Each signal has a unique color used for data visualization.
 * HSL values mirror the CSS custom properties in styles.css (--signal-*).
 * Hex values are provided for inline styles, SVG strokes, and box-shadow computations.
 * Tailwind accent classes are for text/bg utilities on static elements.
 */

export interface SignalColor {
  /** Hex value for inline styles, SVG strokes, and dynamic computations */
  hex: string;
  /** Tailwind text utility class */
  tw: string;
}

export const SIGNAL_COLORS = {
  sleep: { hex: '#818CF8', tw: 'text-indigo-400' },
  sleepEfficiency: { hex: '#34D399', tw: 'text-emerald-400' },
  activity: { hex: '#00E5FF', tw: 'text-cyan-400' },
  recovery: { hex: '#FBBF24', tw: 'text-amber-400' },
  steps: { hex: '#10B981', tw: 'text-emerald-500' },
  hrv: { hex: '#FF33AA', tw: 'text-pink-400' },
  restingHr: { hex: '#FB7185', tw: 'text-rose-400' },
  spo2: { hex: '#38BDF8', tw: 'text-sky-400' },
  respiratoryRate: { hex: '#A78BFA', tw: 'text-violet-400' },
  strain: { hex: '#F59E0B', tw: 'text-amber-500' },
} as const satisfies Record<string, SignalColor>;

export type SignalKey = keyof typeof SIGNAL_COLORS;

/**
 * Health score segment colors — maps score segments to their signal colors.
 */
export const SCORE_SEGMENT_COLORS = {
  sleep: SIGNAL_COLORS.sleep.hex,
  activity: SIGNAL_COLORS.recovery.hex, // amber for activity segment
  heart: SIGNAL_COLORS.restingHr.hex,
  recovery: SIGNAL_COLORS.spo2.hex, // sky blue for recovery segment
} as const;

/**
 * Returns the color for a composite health score value.
 * Green (good) >= 70, amber (moderate) >= 40, red (poor) < 40.
 */
export function getScoreColor(composite: number): string {
  if (composite >= 70) return '#00FF7F';
  if (composite >= 40) return '#FBBF24';
  return '#EF4444';
}
