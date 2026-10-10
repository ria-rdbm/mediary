import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { PrimaryButton } from '@/components/ui/Button';
import { colors, typography, spacing, radius } from '@/theme';
import { ALL_CATEGORIES, CATEGORY_LABELS, CATEGORY_ICONS } from '@/constants/categories';
import type { MedicationCategory } from '@/constants/categories';

export default function CategoriesScreen() {
  const [selected, setSelected] = useState<MedicationCategory[]>([]);

  const toggle = (category: MedicationCategory) => {
    setSelected((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    );
  };

  const handleContinue = () => {
    router.push({ pathname: '/(onboarding)/first-medication', params: { categories: selected.join(',') } });
  };

  return (
    <Screen scroll>
      <Text style={[typography.screenTitle, styles.title]}>What would you like to track?</Text>
      <Text style={[typography.bodySecondary, styles.subtitle]}>Choose everything that applies.</Text>

      <View style={styles.list}>
        {ALL_CATEGORIES.map((category) => {
          const active = selected.includes(category);
          return (
            <Pressable
              key={category}
              onPress={() => toggle(category)}
              style={[styles.option, active && styles.optionActive]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
            >
              <View style={[styles.iconCircle, active && styles.iconCircleActive]}>
                <Ionicons
                  name={CATEGORY_ICONS[category]}
                  size={18}
                  color={active ? colors.textOnAccent : colors.accentStrong}
                />
              </View>
              <Text style={typography.body}>{CATEGORY_LABELS[category]}</Text>
              {active && (
                <Ionicons name="checkmark-circle" size={20} color={colors.accent} style={styles.checkmark} />
              )}
            </Pressable>
          );
        })}
      </View>

      <PrimaryButton
        label="Continue"
        onPress={handleContinue}
        disabled={selected.length === 0}
        style={styles.continueButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.lg },
  subtitle: { marginTop: spacing.xxs, marginBottom: spacing.lg },
  list: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  optionActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleActive: {
    backgroundColor: colors.accent,
  },
  checkmark: {
    marginLeft: 'auto',
  },
  continueButton: {
    marginTop: spacing.xl,
  },
});
