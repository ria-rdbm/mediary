import React, { useState } from 'react';
import { View, Text, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, typography, spacing } from '@/theme';
import { formatLocalDate } from '@/lib/dateTime';
import type { WeightRecord } from '@/types/domain';

const CHART_HEIGHT = 160;
const PADDING_X = 44;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 24;

function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 1) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
  }
  return d;
}

export function WeightChart({ records }: { records: WeightRecord[] }) {
  const [width, setWidth] = useState(0);

  if (records.length === 0) return null;

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const chronological = [...records].reverse();
  const values = chronological.map((r) => r.weightKg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const baselineY = CHART_HEIGHT - PADDING_BOTTOM;
  const plotWidth = Math.max(width - PADDING_X * 2, 1);

  const points = values.map((v, i) => {
    const x = values.length > 1 ? PADDING_X + (i / (values.length - 1)) * plotWidth : PADDING_X + plotWidth / 2;
    const y = PADDING_TOP + (1 - (v - min) / range) * (CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM);
    return { x, y };
  });

  const linePath = smoothPath(points);
  const areaPath = points.length > 1 ? `${linePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z` : '';

  const latest = chronological[chronological.length - 1];
  const first = chronological[0];

  return (
    <View onLayout={onLayout}>
      <View style={styles.headerRow}>
        <Text style={typography.cardTitle}>{values[values.length - 1].toFixed(1)} kg</Text>
        <Text style={typography.caption}>
          {formatLocalDate(first.recordedLocal, 'd MMM')} – {formatLocalDate(latest.recordedLocal, 'd MMM')}
        </Text>
      </View>
      {width > 0 && (
        <Svg width={width} height={CHART_HEIGHT} style={{ marginTop: spacing.sm }}>
          <Defs>
            <LinearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.accent} stopOpacity={0.22} />
              <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Line x1={0} y1={baselineY} x2={width} y2={baselineY} stroke={colors.divider} strokeWidth={1} />
          {areaPath && <Path d={areaPath} fill="url(#weightFill)" />}
          <Path d={linePath} fill="none" stroke={colors.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p, i) => {
            const isLatest = i === points.length - 1;
            return (
              <Circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={isLatest ? 5 : 3}
                fill={isLatest ? colors.surface : colors.accent}
                stroke={colors.accent}
                strokeWidth={isLatest ? 2.5 : 0}
              />
            );
          })}
        </Svg>
      )}
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
