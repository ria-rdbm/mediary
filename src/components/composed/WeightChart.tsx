import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { colors, typography, spacing } from '@/theme';
import { formatLocalDate } from '@/lib/dateTime';
import type { WeightRecord } from '@/types/domain';

const CHART_HEIGHT = 140;

export function WeightChart({ records }: { records: WeightRecord[] }) {
  if (records.length === 0) return null;

  const chronological = [...records].reverse();
  const values = chronological.map((r) => r.weightKg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = Math.max(chronological.length * 48, 260);

  const points = values.map((v, i) => {
    const x = (i / Math.max(values.length - 1, 1)) * (width - 24) + 12;
    const y = CHART_HEIGHT - ((v - min) / range) * (CHART_HEIGHT - 32) - 16;
    return { x, y, value: v };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const latest = chronological[chronological.length - 1];
  const first = chronological[0];

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={typography.cardTitle}>
          {values[values.length - 1].toFixed(1)} kg
        </Text>
        <Text style={typography.caption}>
          {formatLocalDate(first.recordedLocal, 'd MMM')} – {formatLocalDate(latest.recordedLocal, 'd MMM')}
        </Text>
      </View>
      <Svg width={width} height={CHART_HEIGHT} style={{ marginTop: spacing.sm }}>
        <Line x1={0} y1={CHART_HEIGHT - 16} x2={width} y2={CHART_HEIGHT - 16} stroke={colors.divider} strokeWidth={1} />
        <Polyline points={polylinePoints} fill="none" stroke={colors.accent} strokeWidth={2.5} />
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={colors.accent} />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
});
