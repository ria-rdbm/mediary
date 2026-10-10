import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type MedicationCategory =
  | 'glp1'
  | 'insulin'
  | 'other_medication'
  | 'cosmetic_treatment'
  | 'other_health_injection';

type IconName = ComponentProps<typeof Ionicons>['name'];

export const CATEGORY_LABELS: Record<MedicationCategory, string> = {
  glp1: 'GLP-1',
  insulin: 'Insulin',
  other_medication: 'Other Medication',
  cosmetic_treatment: 'Cosmetic Treatment',
  other_health_injection: 'Other Health Injection',
};

export const CATEGORY_ICONS: Record<MedicationCategory, IconName> = {
  glp1: 'water-outline',
  insulin: 'pulse-outline',
  other_medication: 'medkit-outline',
  cosmetic_treatment: 'sparkles-outline',
  other_health_injection: 'bandage-outline',
};

// Tasteful automatic default colour per category (index into colors.medicationPalette).
export const CATEGORY_DEFAULT_COLOR_INDEX: Record<MedicationCategory, number> = {
  glp1: 0,
  insulin: 1,
  other_medication: 2,
  cosmetic_treatment: 3,
  other_health_injection: 4,
};

export const ALL_CATEGORIES: MedicationCategory[] = [
  'glp1',
  'insulin',
  'other_medication',
  'cosmetic_treatment',
  'other_health_injection',
];

export type MedicationStatus = 'active' | 'paused' | 'finished';

export const STATUS_LABELS: Record<MedicationStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  finished: 'Finished',
};
