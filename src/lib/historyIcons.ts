import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { HistoryRecordType } from '@/types/domain';
import { colors } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export const HISTORY_ICONS: Record<HistoryRecordType, IconName> = {
  treatment: 'water-outline',
  symptom: 'pulse-outline',
  weight: 'scale-outline',
  note: 'document-text-outline',
  appointment: 'calendar-outline',
  stock: 'cube-outline',
};

export const HISTORY_COLORS: Record<HistoryRecordType, string> = {
  treatment: colors.accent,
  symptom: colors.secondaryAccent,
  weight: colors.info,
  note: colors.accentStrong,
  appointment: colors.accentStrong,
  stock: colors.textMuted,
};

export const HISTORY_TYPE_LABELS: Record<HistoryRecordType, string> = {
  treatment: 'Dose',
  symptom: 'Symptom',
  weight: 'Weight',
  note: 'Note',
  appointment: 'Appointment',
  stock: 'Stock',
};

// Background of the timeline icon puck — symptoms get the teal tint
export const HISTORY_ICON_BACKGROUNDS: Record<HistoryRecordType, string> = {
  treatment: colors.accentSoft,
  symptom: colors.secondaryAccentSoft,
  weight: colors.infoSoft,
  note: colors.accentSoft,
  appointment: colors.accentSoft,
  stock: colors.surfaceSecondary,
};

export function historyItemRoute(type: HistoryRecordType, id: string): string {
  switch (type) {
    case 'treatment':
      return `/record/${id}/edit`;
    case 'symptom':
      return `/symptom/${id}/edit`;
    case 'weight':
      return `/weight/${id}/edit`;
    case 'note':
      return `/note/${id}/edit`;
    case 'appointment':
      return `/appointment/${id}/edit`;
    case 'stock':
      return '';
  }
}
