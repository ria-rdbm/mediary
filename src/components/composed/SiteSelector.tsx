import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing } from '@/theme';
import { INJECTION_SITES } from '@/constants/units';
import type { InjectionSite } from '@/constants/units';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { fieldStyles } from '@/components/ui/fieldStyles';

interface SiteSelectorProps {
  value: InjectionSite | null;
  onChange: (site: InjectionSite | null) => void;
  customValue: string;
  onCustomChange: (value: string) => void;
}

export function SiteSelector({ value, onChange, customValue, onCustomChange }: SiteSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={fieldStyles.label}>Site (optional)</Text>
      <View style={styles.grid}>
        {INJECTION_SITES.map((site) => {
          const active = value === site;
          return (
            <Chip key={site} label={site} selected={active} onPress={() => onChange(active ? null : site)} />
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
