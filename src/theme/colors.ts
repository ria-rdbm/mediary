/**
 * Mediary colour tokens — "Blue final" brand concept.
 * V1 is light mode only, but every screen must consume these semantic
 * roles (never a raw hex value) so a future dark palette is a one-file change.
 */
export const colors = {
  // Surfaces
  background: '#FFFFFF',
  // Top stop of the soft sky wash behind light screens (fades to white)
  backgroundTint: '#E6F4FF',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F4F9', // form fields, stat tiles
  surfaceSunken: '#EEF2F8', // segmented-control track
  lightBackground: '#F5FBFF',

  // Text
  textPrimary: '#0B1A33', // Deep Navy
  textSecondary: '#33415A',
  textMuted: '#56627A',
  textPlaceholder: '#64708A',
  textOnAccent: '#FFFFFF',
  textLink: '#1D4ED8',

  // Accent — Mediary Blue
  accent: '#1D4ED8',
  accentStrong: '#1E3A8A',
  accentSoft: '#DDEFFF', // Soft Blue
  accentSoftBorder: '#BFE3FF',
  accentBright: '#3A6BFF', // toggles, selected outlines
  sky: '#60A5FA',
  // Hero header gradient stops (top → bottom)
  heroTop: '#1E5BE6',
  heroBottom: '#4F8FF7',
  // Kept for existing call sites — second stop of the brand gradient
  accentDeep: '#1D4ED8',

  // Secondary tint (used sparingly, e.g. symptom rows)
  secondaryAccent: '#0E6E8C',
  secondaryAccentSoft: '#DFF3FB',

  // Semantic
  success: '#16A34A',
  successSoft: '#DCFCE7',
  warning: '#B45309',
  warningSoft: '#FFF1C2',
  error: '#DC2626',
  errorSoft: '#FDE4E4',
  required: '#C2410C',
  info: '#2E4FB0',
  infoSoft: '#E6EEFF',

  // Structure
  divider: '#E3E8F1',
  dividerSoft: '#EEF2F8',
  dividerStrong: '#CBD5E3',
  disabled: '#E8ECF2',
  disabledText: '#7D889A',
  overlay: 'rgba(11, 26, 51, 0.45)',
  onAccentSoft: 'rgba(255, 255, 255, 0.12)',

  // Curated medication colour palette (optional per-medication accent) —
  // vivid and distinct so a medication list reads at a glance, not a muted
  // single-hue wash.
  medicationPalette: [
    '#3A6BFF', // blue (default)
    '#E86A8A', // rose
    '#17A398', // teal
    '#E0A43A', // amber
    '#C77DD8', // orchid
    '#6FAE4F', // green
    '#EE7F4E', // tangerine
    '#4DAAD9', // sky
  ],
} as const;

export type ColorToken = keyof typeof colors;
