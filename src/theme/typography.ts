import { colors } from './colors';

/**
 * Font families loaded in the root layout (see `fontAssets`). Each weight is
 * its own family, so styles pick a family instead of setting fontWeight —
 * Android ignores fontWeight on custom fonts.
 */
export const fonts = {
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semibold: 'Geist_600SemiBold',
  serifMedium: 'Fraunces_500Medium',
  serif: 'Fraunces_600SemiBold',
} as const;

export type TypeStyle = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
  color: string;
};

/**
 * Type scale. Fraunces (serif) carries titles and hero numbers; Geist carries
 * everything else. Every screen should pull from this scale rather than
 * inlining fontSize values.
 */
export const typography: Record<string, TypeStyle> = {
  display: {
    fontFamily: fonts.serif,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.6,
    color: colors.textPrimary,
  },
  screenTitle: {
    fontFamily: fonts.serif,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontFamily: fonts.serif,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.3,
    color: colors.textPrimary,
  },
  // Centered title in the compact navigation header
  headerTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 21,
    color: colors.textPrimary,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  bodySecondary: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textPrimary,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 17,
    color: colors.textMuted,
  },
  button: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 22,
    color: colors.textOnAccent,
  },
  metadata: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
    color: colors.textMuted,
  },
};
