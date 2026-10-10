import { Platform } from 'react-native';
import { colors } from './colors';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

const fontFamilyMedium = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'System',
});

export type TypeStyle = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700';
  letterSpacing?: number;
  color: string;
};

/**
 * Type scale. Deliberately restrained — refined and readable rather than
 * oversized. Every screen should pull from this scale rather than inlining
 * fontSize values.
 */
export const typography: Record<string, TypeStyle> = {
  display: {
    fontFamily: fontFamilyMedium as string,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: colors.textPrimary,
  },
  screenTitle: {
    fontFamily: fontFamilyMedium as string,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontFamily: fontFamilyMedium as string,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardTitle: {
    fontFamily: fontFamilyMedium as string,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  body: {
    fontFamily: fontFamily as string,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
    color: colors.textPrimary,
  },
  bodySecondary: {
    fontFamily: fontFamily as string,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  caption: {
    fontFamily: fontFamily as string,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '400',
    color: colors.textMuted,
  },
  button: {
    fontFamily: fontFamilyMedium as string,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.textOnAccent,
  },
  metadata: {
    fontFamily: fontFamily as string,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
    color: colors.textMuted,
  },
};
