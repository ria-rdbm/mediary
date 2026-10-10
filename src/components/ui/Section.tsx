import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing } from '@/theme';

interface SectionProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  spacingTop?: keyof typeof spacing;
}

export function Section({ title, action, children, spacingTop = 'lg' }: SectionProps) {
  return (
    <View style={{ marginTop: spacing[spacingTop] }}>
      {title && (
        <View style={styles.headerRow}>
          <Text style={typography.sectionTitle}>{title}</Text>
          {action}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
});
