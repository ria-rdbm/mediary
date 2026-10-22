import { StyleSheet } from 'react-native';
import { colors, typography, spacing, radius, controlHeight } from '@/theme';

/**
 * Shared look for every form control (Input, Select, date/time fields): a
 * filled pill with no resting border, a label above it, and an optional
 * white icon puck on the leading edge.
 */
export const fieldStyles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.xs,
    marginLeft: spacing.xxs,
  },
  required: {
    color: colors.required,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: controlHeight.field,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fieldMultiline: {
    minHeight: 96,
    borderRadius: 24,
    alignItems: 'flex-start',
    paddingVertical: 14,
  },
  fieldFocused: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  fieldError: {
    borderColor: colors.error,
  },
  iconPuck: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    ...typography.body,
    flex: 1,
  },
  placeholder: {
    ...typography.body,
    flex: 1,
    color: colors.textPlaceholder,
  },
  helperText: {
    ...typography.caption,
    marginTop: spacing.xxs,
    marginLeft: spacing.xxs,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xxs,
    marginLeft: spacing.xxs,
  },
});
