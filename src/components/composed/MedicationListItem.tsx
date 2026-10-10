import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '@/theme';
import { CATEGORY_ICONS, CATEGORY_DEFAULT_COLOR_INDEX } from '@/constants/categories';
import { StatusBadge } from '@/components/ui/Badge';
import type { MedicationWithStock } from '@/types/domain';

export function MedicationListItem({
  medication,
  onPress,
}: {
  medication: MedicationWithStock;
  onPress: () => void;
}) {
  const accentColor = medication.color ?? colors.medicationPalette[CATEGORY_DEFAULT_COLOR_INDEX[medication.category]];
  const hasStock = medication.stockUnit !== null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.65 }]}
      accessibilityRole="button"
    >
      <View style={[styles.iconCircle, { backgroundColor: `${accentColor}22` }]}>
        <Ionicons name={CATEGORY_ICONS[medication.category]} size={20} color={accentColor} />
      </View>
      <View style={styles.textContainer}>
        <Text style={typography.cardTitle} numberOfLines={1}>
          {medication.name}
        </Text>
        {hasStock && (
          <Text style={typography.caption}>
            {medication.totalStock} {medication.stockUnit} remaining
          </Text>
        )}
      </View>
      <StatusBadge status={medication.status} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
});
