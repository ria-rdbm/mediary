import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { colors, typography, spacing } from '@/theme';
import { formatLocalDate } from '@/lib/dateTime';
import type { WeightRecord } from '@/types/domain';

const CHART_HEIGHT = 140;

export function WeightChart({ records }: { records: WeightRecord[] }) {
  // Measured so the chart fills its card instead of a fixed pixel width
  const [width, setWidth] = useState(0);
  if (records.length === 0) return null;

  // Sort here rather than trusting the caller's order: callers fetch in
  // different directions, and a reversed series draws the trend upside down.
  const chronological = [...records].sort((a, b) => (a.recordedLocal < b.recordedLocal ? -1 : 1));
  const values = chronological.map((r) => r.weightKg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

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
          {latest.weightKg.toFixed(1)} kg
        </Text>
        <Text style={typography.caption}>
          {formatLocalDate(first.recordedLocal, 'd MMM')} – {formatLocalDate(latest.recordedLocal, 'd MMM')}
        </Text>
      </View>
      <View style={styles.chart} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <Svg width={width} height={CHART_HEIGHT}>
            <Line x1={0} y1={CHART_HEIGHT - 16} x2={width} y2={CHART_HEIGHT - 16} stroke={colors.divider} strokeWidth={1} />
            <Polyline points={polylinePoints} fill="none" stroke={colors.accent} strokeWidth={2.5} />
            {points.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={colors.accent} />
            ))}
          </Svg>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  chart: {
    marginTop: spacing.sm,
    height: CHART_HEIGHT,
  },
});
