import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '@/theme';
import { INJECTION_SITES } from '@/constants/units';
import type { InjectionSite } from '@/constants/units';
import { Input } from '@/components/ui/Input';

interface SiteSelectorProps {
  value: InjectionSite | null;
  onChange: (site: InjectionSite | null) => void;
  customValue: string;
  onCustomChange: (value: string) => void;
}

export function SiteSelector({ value, onChange, customValue, onCustomChange }: SiteSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Site (optional)</Text>
      <View style={styles.grid}>
        {INJECTION_SITES.map((site) => {
          const active = value === site;
          return (
            <Pressable
              key={site}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onChange(active ? null : site)}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{site}</Text>
            </Pressable>
          );
        })}
      </View>
      {value === 'Other' && (
        <Input placeholder="Describe the site" value={customValue} onChangeText={onCustomChange} containerStyle={{ marginTop: spacing.sm }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: {
    ...typography.bodySecondary,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
  },
  chipActive: {
    backgroundColor: colors.accent,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipLabelActive: {
    color: colors.textOnAccent,
  },
});
