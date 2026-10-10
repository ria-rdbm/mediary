/**
 * Mediary colour tokens.
 * V1 is light mode only, but every screen must consume these semantic
 * roles (never a raw hex value) so a future dark palette is a one-file change.
 */
export const colors = {
  // Surfaces
  background: '#F4F6FB', // cool, light neutral app background
  surface: '#FFFFFF',
  surfaceSecondary: '#EEF1F8',
  surfaceSunken: '#E6EAF3',

  // Text
  textPrimary: '#161A2B', // near-black, cool
  textSecondary: '#5A6072',
  textMuted: '#9AA0B2',
  textOnAccent: '#FFFFFF',
  textLink: '#3B5BFF',

  // Accent — confident blue
  accent: '#3B5BFF',
  accentStrong: '#2742D1',
  accentSoft: '#E7EBFF',
  accentSoftBorder: '#C9D3FF',
  // Second stop for the hero header gradient (deeper blue-violet)
  accentDeep: '#2135A8',

  // Secondary accent (used sparingly, e.g. cosmetic category)
  secondaryAccent: '#F0A23D',
  secondaryAccentSoft: '#FCEEDA',

  // Semantic
  success: '#1FAE6E',
  successSoft: '#DEF6E9',
  warning: '#F0973D',
  warningSoft: '#FCEEDC',
  error: '#F0484F',
  errorSoft: '#FCE2E3',
  info: '#3B82D6',
  infoSoft: '#E4F0FC',

  // Structure
  divider: '#E4E8F1',
  dividerStrong: '#D3D9E6',
  disabled: '#DCE0EB',
  disabledText: '#A3A9BA',
  overlay: 'rgba(16, 19, 33, 0.5)',

  // Curated medication colour palette (optional per-medication accent) —
  // vivid and distinct so a medication list reads at a glance, not a muted
  // single-hue wash.
  medicationPalette: [
    '#3B5BFF', // blue (default)
    '#FF6B88', // coral pink
    '#17B3A3', // teal
    '#F0A23D', // amber
    '#8B6CF1', // violet
    '#2FB869', // green
    '#FF8B5E', // tangerine
    '#4DAAD9', // sky
  ],
} as const;

export type ColorToken = keyof typeof colors;
