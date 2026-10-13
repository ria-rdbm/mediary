import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, typography, spacing, radius } from '@/theme';
import { BottomSheet } from '@/components/ui/BottomSheet';

interface QuickAddSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Pre-fills the new entry's date (yyyy-MM-dd), e.g. when adding from a calendar day. */
  dateKey?: string | null;
}

const ACTIONS: { icon: keyof typeof Ionicons.glyphMap; label: string; route: string }[] = [
  { icon: 'water-outline', label: 'Log injection or treatment', route: '/record/new' },
  { icon: 'pulse-outline', label: 'Add symptom', route: '/symptom/new' },
  { icon: 'scale-outline', label: 'Add weight', route: '/weight/new' },
  { icon: 'document-text-outline', label: 'Add note', route: '/note/new' },
  { icon: 'calendar-outline', label: 'Add appointment', route: '/appointment/new' },
];

export function QuickAddSheet({ visible, onClose, dateKey }: QuickAddSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={[typography.sectionTitle, styles.title]}>Add</Text>
      {ACTIONS.map((action) => (
        <Pressable
          key={action.route}
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
          onPress={() => {
            onClose();
            router.push((dateKey ? { pathname: action.route, params: { date: dateKey } } : action.route) as never);
          }}
        >
          <View style={styles.iconCircle}>
            <Ionicons name={action.icon} size={19} color={colors.accentStrong} />
          </View>
          <Text style={typography.body}>{action.label}</Text>
        </Pressable>
      ))}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
