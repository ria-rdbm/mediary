import React, { forwardRef } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { colors, fonts, spacing } from '@/theme';
import { formatAmount } from '@/lib/formatAmount';
import { formatLocalDate } from '@/lib/dateTime';
import { SEVERITY_LABELS } from '@/constants/symptoms';
import type { ShareSummaryData } from '@/services/shareSummary';

const MAX_ROWS = 6;
const CHART_WIDTH = 300;
const CHART_HEIGHT = 64;

interface SummaryShareCardProps {
  data: ShareSummaryData;
  periodLabel: string;
  startDateKey: string;
  endDateKey: string;
  includeWeight: boolean;
  includeSymptoms: boolean;
}

type Row = { key: string; local: string; label: string; tone: 'dose' | 'symptom' };

function WeightSparkline({ values }: { values: number[] }) {
  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;
  const pts = values.map((v, i) => ({
    x: (i / Math.max(values.length - 1, 1)) * (CHART_WIDTH - 8) + 4,
    y: CHART_HEIGHT - 6 - ((v - min) / range) * (CHART_HEIGHT - 16),
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  const area = `${line} L${last.x.toFixed(1)} ${CHART_HEIGHT} L${pts[0].x.toFixed(1)} ${CHART_HEIGHT} Z`;
  return (
    <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} preserveAspectRatio="none">
      <Defs>
        <SvgGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.accentBright} stopOpacity={0.18} />
          <Stop offset="1" stopColor={colors.accentBright} stopOpacity={0} />
        </SvgGradient>
      </Defs>
      <Path d={area} fill="url(#weightFill)" />
      <Path d={line} fill="none" stroke={colors.accent} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <Circle cx={last.x} cy={last.y} r={3.5} fill={colors.accent} />
    </Svg>
  );
}

/**
 * The shareable "treatment summary" card. Rendered on screen as a preview and
 * captured to a PNG by the share flow, so it must not depend on anything
 * outside its own bounds (the wrapper sets collapsable={false} for capture).
 */
export const SummaryShareCard = forwardRef<View, SummaryShareCardProps>(function SummaryShareCard(
  { data, periodLabel, startDateKey, endDateKey, includeWeight, includeSymptoms },
  ref,
) {
  const medicationById = new Map(data.medications.map((m) => [m.id, m]));
  const latest = data.records[0];
  const latestMedication = latest ? medicationById.get(latest.medicationId) : undefined;
  const latestDose = latest ? formatAmount(latest.amount, latest.amountUnit, latest.amountUnitCustom) : null;

  // "Doses logged" counts the medication with the most records in the period
  const countByMedication = new Map<string, number>();
  for (const r of data.records) countByMedication.set(r.medicationId, (countByMedication.get(r.medicationId) ?? 0) + 1);
  const [topMedicationId, topCount] = [...countByMedication.entries()].sort((a, b) => b[1] - a[1])[0] ?? [null, 0];

  const weights = data.weightRecords;
  const showWeight = includeWeight && weights.length >= 2;
  const weightDelta = showWeight ? weights[weights.length - 1].weightKg - weights[0].weightKg : 0;
  // Neutral about weight: only a loss gets the green tile; no change reads
  // "Steady" and a gain is shown plainly as "+n kg", never as a warning.
  const weightTrend = weightDelta <= -0.05 ? 'down' : weightDelta >= 0.05 ? 'up' : 'steady';
  const weightTint = weightTrend === 'down' ? colors.success : colors.textSecondary;

  const rows: Row[] = [
    ...data.records.map((r) => {
      const name = medicationById.get(r.medicationId)?.name ?? 'Treatment';
      const amount = formatAmount(r.amount, r.amountUnit, r.amountUnitCustom);
      return { key: r.id, local: r.occurredLocal, label: amount ? `${name} · ${amount}` : name, tone: 'dose' as const };
    }),
    ...(includeSymptoms
      ? data.symptoms.map((s) => ({
          key: s.id,
          local: s.startLocal,
          label: `${s.name} · ${SEVERITY_LABELS[s.severity]}`,
          tone: 'symptom' as const,
        }))
      : []),
  ]
    .sort((a, b) => (a.local < b.local ? 1 : -1))
    .slice(0, MAX_ROWS);

  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <LinearGradient colors={[colors.heroTop, colors.heroBottom]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.brandRow}>
            <Image source={require('../../../assets/brand/mark-white.png')} style={styles.brandMark} />
            <Image source={require('../../../assets/brand/wordmark-white.png')} style={styles.brandWordmark} />
          </View>
          <Text style={styles.periodLabel}>{periodLabel}</Text>
        </View>
        <Text style={styles.title}>My treatment summary</Text>
        <Text style={styles.range}>
          {formatLocalDate(`${startDateKey}T00:00:00`, 'd MMM')} – {formatLocalDate(`${endDateKey}T00:00:00`)}
        </Text>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Current dose</Text>
            <Text style={styles.statValue}>{latestDose ?? '—'}</Text>
            <Text style={styles.statSub} numberOfLines={1}>{latestMedication?.name ?? 'No doses yet'}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Doses logged</Text>
            <Text style={styles.statValue}>{topCount}</Text>
            <Text style={styles.statSub} numberOfLines={1}>
              {topMedicationId ? medicationById.get(topMedicationId)?.name : 'In this period'}
            </Text>
          </View>
          {showWeight && (
            <View style={[styles.stat, weightTrend === 'down' && styles.statWeightDown]}>
              <Text style={styles.statLabel}>Weight</Text>
              <View style={styles.statWeightRow}>
                <Ionicons
                  name={weightTrend === 'down' ? 'trending-down' : weightTrend === 'up' ? 'trending-up' : 'remove'}
                  size={18}
                  color={weightTint}
                />
                <Text style={[styles.statValue, styles.statWeightValue, { color: weightTint }]}>
                  {weightTrend === 'steady'
                    ? 'Steady'
                    : `${weightTrend === 'up' ? '+' : ''}${Math.abs(weightDelta).toFixed(1)} kg`}
                </Text>
              </View>
              <Text style={styles.statSub}>since {formatLocalDate(weights[0].recordedLocal, 'd MMM')}</Text>
            </View>
          )}
        </View>

        {showWeight && (
          <View style={styles.chart}>
            <WeightSparkline values={weights.map((w) => w.weightKg)} />
            <View style={styles.chartLabels}>
              <Text style={styles.chartLabel}>
                {weights[0].weightKg.toFixed(1)} kg · {formatLocalDate(weights[0].recordedLocal, 'd MMM')}
              </Text>
              <Text style={styles.chartLabel}>
                {weights[weights.length - 1].weightKg.toFixed(1)} kg ·{' '}
                {formatLocalDate(weights[weights.length - 1].recordedLocal, 'd MMM')}
              </Text>
            </View>
          </View>
        )}

        {rows.length === 0 ? (
          <Text style={styles.empty}>No records in this period.</Text>
        ) : (
          <View>
            {rows.map((row, index) => (
              <View key={row.key} style={[styles.row, index > 0 && styles.rowDivider]}>
                <Text style={styles.rowDate}>{formatLocalDate(row.local, 'EEE d MMM')}</Text>
                <Text
                  style={[styles.rowLabel, row.tone === 'symptom' && styles.rowLabelSymptom]}
                  numberOfLines={1}
                >
                  {row.label}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.footer}>A personal record from Mediary · not medical advice</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  header: {
    padding: spacing.md,
    paddingBottom: 18,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandMark: {
    width: 32,
    height: 16,
  },
  brandWordmark: {
    width: 60,
    height: 14,
  },
  periodLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.4,
    color: colors.textOnAccent,
    marginTop: spacing.sm,
  },
  range: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  body: {
    padding: spacing.md,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  stat: {
    flex: 1,
    borderRadius: 14,
    padding: 10,
    backgroundColor: colors.lightBackground,
  },
  statWeightDown: {
    backgroundColor: colors.successSoft,
  },
  statLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  statValue: {
    fontFamily: fonts.serif,
    fontSize: 18,
    lineHeight: 23,
    color: colors.textPrimary,
    marginTop: 2,
  },
  statWeightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statWeightValue: {
    marginTop: 0,
  },
  statSub: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.accent,
  },
  chart: {
    marginTop: spacing.md,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xxs,
  },
  chartLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 34,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.dividerSoft,
  },
  rowDate: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  rowLabel: {
    flexShrink: 1,
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  rowLabelSymptom: {
    color: colors.secondaryAccent,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  footer: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
