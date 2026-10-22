import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, Image, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/ui/Screen';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { PrimaryButton, TextButton } from '@/components/ui/Button';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { InitialAvatar } from '@/components/ui/InitialAvatar';
import { QuickAddSheet } from '@/components/composed/QuickAddSheet';
import { HeroHeader, HeroSheet } from '@/components/composed/HeroLayout';
import { colors, fonts, typography, spacing } from '@/theme';
import { useMedications } from '@/hooks/useMedications';
import { useLifetimePrice } from '@/hooks/useLifetimePrice';
import { useUpcomingMedicationReminders } from '@/hooks/useReminders';
import { useAppointments } from '@/hooks/useAppointments';
import { useRecentTakenRecords } from '@/hooks/useTreatmentRecords';
import { useSymptoms } from '@/hooks/useSymptoms';
import { useWeightRecords } from '@/hooks/useWeight';
import { STATUS_LABELS } from '@/constants/categories';
import { SEVERITY_LABELS } from '@/constants/symptoms';
import { formatAmount } from '@/lib/formatAmount';
import { useEntitlement } from '@/context/EntitlementProvider';
import { formatLocalDate, formatLocalTime, localDateKey, parseDateKey, todayDateKey } from '@/lib/dateTime';

const UPCOMING_PREVIEW_COUNT = 4;

function greetingForHour(hour: number): string {
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

interface QuickAction {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  primary?: boolean;
}

interface UpcomingEntry {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  tone: 'accent' | 'warning';
  onPress: () => void;
}

export default function HomeScreen() {
  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);

  const { data: medications, isLoading: medicationsLoading } = useMedications(['active', 'paused']);
  const { data: reminders } = useUpcomingMedicationReminders();
  const { data: appointments } = useAppointments();
  const { data: recentRecords } = useRecentTakenRecords();
  const { data: symptoms } = useSymptoms();
  const { data: weightRecords } = useWeightRecords();

  // Sampled into state each minute (not read via Date.now() during render) so the
  // "days until expiry" math below stays a pure function of state.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  const lifetimePrice = useLifetimePrice();
  const { showTrialCountdown, trialDaysLeft, isReadOnly } = useEntitlement();

  const upcoming = useMemo<UpcomingEntry[]>(() => {
    const entries: UpcomingEntry[] = [];
    const medicationById = new Map((medications ?? []).map((m) => [m.id, m]));

    for (const reminder of reminders ?? []) {
      const medication = medicationById.get(reminder.medicationId);
      if (!medication) continue;
      const reminderLocal = `${reminder.reminderDate}T${reminder.reminderTime}:00`;
      const overdue = new Date(reminderLocal).getTime() < now;
      entries.push({
        id: `reminder-${reminder.id}`,
        icon: overdue ? 'time-outline' : 'notifications-outline',
        title: medication.name,
        subtitle: `${overdue ? 'Overdue · ' : ''}${formatLocalDate(reminderLocal)} · ${formatLocalTime(reminderLocal)}`,
        tone: overdue ? 'warning' : 'accent',
        onPress: () => router.push(`/record/new?medicationId=${medication.id}`),
      });
    }

    const todayKey = todayDateKey();
    for (const appointment of appointments ?? []) {
      const dateKey = appointment.visitLocal.slice(0, 10);
      if (dateKey < todayKey) continue;
      entries.push({
        id: `appointment-${appointment.id}`,
        icon: 'calendar-outline',
        title: appointment.providerNameSnapshot ?? 'Appointment',
        subtitle: `${formatLocalDate(appointment.visitLocal)} · ${formatLocalTime(appointment.visitLocal)}`,
        tone: 'accent',
        onPress: () => router.push(`/appointment/${appointment.id}/edit`),
      });
    }

    for (const medication of medications ?? []) {
      if (
        medication.status === 'active' &&
        medication.stockUnit != null &&
        medication.totalStock <= (medication.lowStockThreshold ?? 0)
      ) {
        entries.push({
          id: `low-stock-${medication.id}`,
          icon: 'alert-circle-outline',
          title: medication.name,
          subtitle:
            medication.totalStock <= 0
              ? `Out of stock — 0 ${medication.stockUnit} left`
              : `Low stock — ${medication.totalStock} ${medication.stockUnit} left`,
          tone: 'warning',
          onPress: () => router.push(`/medication/${medication.id}/stock`),
        });
      }
      if (medication.nearestExpiry) {
        const daysUntil = Math.ceil(
          (new Date(medication.nearestExpiry).getTime() - now) / (1000 * 60 * 60 * 24),
        );
        if (daysUntil <= 30 && daysUntil >= 0) {
          entries.push({
            id: `expiry-${medication.id}`,
            icon: 'hourglass-outline',
            title: medication.name,
            subtitle: `Batch expires ${formatLocalDate(`${medication.nearestExpiry}T00:00:00`)}`,
            tone: 'warning',
            onPress: () => router.push(`/medication/${medication.id}/stock`),
          });
        }
      }
    }

    return entries;
  }, [medications, reminders, appointments, now]);

  const visibleUpcoming = showAllUpcoming ? upcoming : upcoming.slice(0, UPCOMING_PREVIEW_COUNT);
  const activeCount = (medications ?? []).filter((m) => m.status === 'active').length;
  const attentionCount = upcoming.filter((e) => e.tone === 'warning').length;
  const greeting = greetingForHour(new Date(now).getHours());

  const medicationById = new Map((medications ?? []).map((m) => [m.id, m]));
  // Active treatments first; paused ones trail behind
  const sortedMedications = [...(medications ?? [])].sort(
    (a, b) => Number(a.status !== 'active') - Number(b.status !== 'active'),
  );
  const latest = recentRecords?.find((r) => medicationById.has(r.medicationId));
  const latestMedication = latest ? medicationById.get(latest.medicationId) : undefined;
  const latestDose = latest ? formatAmount(latest.amount, latest.amountUnit, latest.amountUnitCustom) : null;
  const latestIsToday = latest ? localDateKey(latest.occurredLocal) === todayDateKey() : false;
  const latestSymptom = symptoms?.[0];
  const latestWeight = weightRecords?.[0];
  const trialLabel = showTrialCountdown
    ? trialDaysLeft === 0
      ? 'Free trial ends today'
      : `Free trial — ${trialDaysLeft} days left`
    : null;

  const quickActions: QuickAction[] = [
    { key: 'log', icon: 'create-outline', label: 'Log', onPress: () => router.push('/record/new'), primary: true },
    { key: 'symptom', icon: 'pulse-outline', label: 'Symptom', onPress: () => router.push('/symptom/new') },
    {
      key: 'weight',
      icon: 'scale-outline',
      label: latestWeight ? `${latestWeight.weightKg} kg` : 'Weight',
      onPress: () => router.push('/weight/new'),
    },
    { key: 'more', icon: 'add', label: 'More', onPress: () => setQuickAddVisible(true) },
  ];

  return (
    <Screen scroll padded={false} edges={[]} tinted={false} aboveTabBar contentStyle={styles.screenContent}>
      <HeroHeader>
        <View style={styles.heroTopRow}>
          <View style={styles.brandRow} accessible accessibilityLabel="Mediary">
            <Image source={require('../../../assets/brand/mark-white.png')} style={styles.brandMark} />
            <Image source={require('../../../assets/brand/wordmark-white.png')} style={styles.brandWordmark} />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add medication"
            onPress={() => router.push('/medication/new')}
            style={({ pressed }) => [styles.heroIconButton, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="add" size={22} color={colors.textOnAccent} />
          </Pressable>
        </View>

        <Text style={styles.heroGreeting}>{greeting}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(app)/history')}
          disabled={!latest}
        >
          {latest && latestMedication ? (
            <Text style={styles.heroHeadline}>
              {latestIsToday ? `${latestMedication.name} logged today` : `Last logged ${latestMedication.name}`}
              {'\n'}
              <Text style={styles.heroHeadlineSoft}>
                {latestIsToday
                  ? `at ${formatLocalTime(latest.occurredLocal)}`
                  : `${formatLocalDate(latest.occurredLocal, 'EEE d MMM')}, ${formatLocalTime(latest.occurredLocal)}`}
              </Text>
              <Text style={styles.heroHeadlineChevron}> ›</Text>
            </Text>
          ) : (
            <Text style={styles.heroHeadline}>
              {activeCount === 0 ? 'Nothing tracked yet' : 'No doses logged yet'}
            </Text>
          )}
        </Pressable>

        <View style={styles.heroPills}>
          <View style={styles.heroPill}>
            <View style={styles.heroPillDot} />
            <Text style={styles.heroPillLabel}>{activeCount} Active</Text>
          </View>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillLabelMuted}>{upcoming.length} Upcoming</Text>
          </View>
          <View style={styles.heroPill}>
            {attentionCount > 0 && <View style={[styles.heroPillDot, { backgroundColor: colors.warningSoft }]} />}
            <Text style={styles.heroPillLabelMuted}>{attentionCount} Needs attention</Text>
          </View>
        </View>
      </HeroHeader>

      <HeroSheet>
        <Pressable
          accessibilityRole="button"
          disabled={!latestMedication}
          onPress={() => latestMedication && router.push(`/medication/${latestMedication.id}`)}
          style={styles.lastDose}
        >
          <View style={styles.lastDoseLabelRow}>
            <Text style={styles.lastDoseLabel}>Last dose</Text>
            {latestMedication && <Ionicons name="chevron-forward" size={15} color={colors.textSecondary} />}
          </View>
          <Text style={styles.lastDoseValue}>{latestDose ?? '—'}</Text>
          <Text style={styles.lastDoseMeta}>
            {[
              latest
                ? `${latestIsToday ? 'Today' : formatLocalDate(latest.occurredLocal, 'EEE d MMM')}, ${formatLocalTime(latest.occurredLocal)}`
                : 'No doses logged yet',
              trialLabel,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </Pressable>

        <View style={styles.quickActions}>
          {quickActions.map((action) => (
            <Pressable
              key={action.key}
              onPress={action.onPress}
              disabled={action.primary && isReadOnly}
              style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.7 }]}
              accessibilityLabel={action.key === 'weight' ? 'Add weight' : action.label}
            >
              <View style={[styles.quickActionIcon, action.key === 'symptom' && styles.quickActionIconTeal]}>
                <Ionicons
                  name={action.icon}
                  size={22}
                  color={action.key === 'symptom' ? colors.secondaryAccent : colors.accent}
                />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        {isReadOnly && (
          <Card style={[styles.readOnlyCard, { backgroundColor: colors.errorSoft, borderColor: colors.errorSoft }]}>
            <Text style={typography.cardTitle}>Your free trial has ended</Text>
            <Text style={[typography.bodySecondary, { marginTop: 2 }]}>
              Unlock Mediary for lifetime access — {lifetimePrice}
            </Text>
            <PrimaryButton label="Unlock Lifetime Access" onPress={() => router.push('/paywall')} style={{ marginTop: spacing.sm }} />
          </Card>
        )}

        <Section
          title="Your medications"
          action={
            <Pressable onPress={() => router.push('/medication/new')} hitSlop={8} accessibilityRole="button">
              <Text style={styles.sectionLink}>Add medication</Text>
            </Pressable>
          }
        >
          {medicationsLoading ? (
            <LoadingState />
          ) : !medications?.length ? (
            <EmptyState
              icon="water-outline"
              title="No medications yet"
              message="Add a medication or treatment to start recording."
              actionLabel="Add medication"
              onAction={() => router.push('/medication/new')}
            />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.medScroller}
              contentContainerStyle={styles.medScrollerContent}
            >
              {sortedMedications.map((medication) => {
                const last = recentRecords?.find((r) => r.medicationId === medication.id);
                const lastAmount = last ? formatAmount(last.amount, last.amountUnit, last.amountUnitCustom) : null;
                const highlighted = medication.id === latestMedication?.id;
                return (
                  <Pressable
                    key={medication.id}
                    accessibilityRole="button"
                    onPress={() => router.push(`/medication/${medication.id}`)}
                    style={({ pressed }) => [styles.medCard, highlighted && styles.medCardOn, pressed && { opacity: 0.7 }]}
                  >
                    {highlighted && (
                      <LinearGradient
                        colors={['#EEF8FF', colors.surface]}
                        style={StyleSheet.absoluteFill}
                        pointerEvents="none"
                      />
                    )}
                    <View style={styles.medCardTop}>
                      <InitialAvatar name={medication.name} />
                      {medication.status === 'active' && <View style={styles.medActiveDot} />}
                    </View>
                    <Text style={styles.medName} numberOfLines={1}>
                      {medication.name}
                    </Text>
                    <Text style={styles.medMeta} numberOfLines={1}>
                      {medication.status !== 'active'
                        ? STATUS_LABELS[medication.status]
                        : last
                          ? [lastAmount, relativeDayLabel(last.occurredLocal)].filter(Boolean).join(' · ')
                          : 'Not logged yet'}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add medication"
                onPress={() => router.push('/medication/new')}
                style={({ pressed }) => [styles.medCard, pressed && { opacity: 0.7 }]}
              >
                <InitialAvatar name="+" tone="muted" />
                <Text style={styles.medName}>Add</Text>
                <Text style={styles.medMeta}>New treatment</Text>
              </Pressable>
            </ScrollView>
          )}
        </Section>

        {latestSymptom && (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/symptom/${latestSymptom.id}/edit`)}
            style={({ pressed }) => [styles.symptomRow, pressed && { opacity: 0.6 }]}
          >
            <View style={styles.symptomIcon}>
              <Ionicons name="pulse-outline" size={20} color={colors.secondaryAccent} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.symptomName} numberOfLines={1}>
                {latestSymptom.name}
              </Text>
              <Text style={typography.caption}>
                Latest symptom · {SEVERITY_LABELS[latestSymptom.severity]} ·{' '}
                {localDateKey(latestSymptom.startLocal) === todayDateKey()
                  ? formatLocalTime(latestSymptom.startLocal)
                  : formatLocalDate(latestSymptom.startLocal, 'd MMM')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        )}

        {upcoming.length > 0 && (
          <Section title="Upcoming & attention">
            <View style={styles.listCard}>
              {visibleUpcoming.map((entry, index) => (
                <Pressable
                  key={entry.id}
                  onPress={entry.onPress}
                  style={({ pressed }) => [
                    styles.upcomingRow,
                    index > 0 && styles.rowDivider,
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <View
                    style={[
                      styles.upcomingIcon,
                      { backgroundColor: entry.tone === 'warning' ? colors.warningSoft : colors.accentSoft },
                    ]}
                  >
                    <Ionicons
                      name={entry.icon}
                      size={16}
                      color={entry.tone === 'warning' ? colors.warning : colors.accent}
                    />
                  </View>
                  <View style={styles.flex}>
                    <Text style={typography.cardTitle} numberOfLines={1}>
                      {entry.title}
                    </Text>
                    <Text style={typography.caption}>{entry.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>
              ))}
              {upcoming.length > UPCOMING_PREVIEW_COUNT && !showAllUpcoming && (
                <TextButton
                  label={`+${upcoming.length - UPCOMING_PREVIEW_COUNT} more`}
                  onPress={() => setShowAllUpcoming(true)}
                  style={styles.rowDivider}
                />
              )}
            </View>
          </Section>
        )}
      </HeroSheet>

      <QuickAddSheet visible={quickAddVisible} onClose={() => setQuickAddVisible(false)} />
    </Screen>
  );
}

/** "Today", "Yesterday", "3 days ago", "7 wks ago" — compact, for the medication cards. */
function relativeDayLabel(local: string): string {
  const days = Math.round(
    (parseDateKey(todayDateKey()).getTime() - parseDateKey(localDateKey(local)).getTime()) / 86400000,
  );
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 14) return `${days} days ago`;
  return `${Math.floor(days / 7)} wks ago`;
}

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: 0,
  },
  flex: {
    flex: 1,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandMark: {
    width: 48,
    height: 24,
  },
  brandWordmark: {
    width: 88,
    height: 21,
  },
  heroIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.onAccentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGreeting: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.72)',
    marginTop: spacing.md,
    marginBottom: 6,
  },
  heroHeadline: {
    fontFamily: fonts.serifMedium,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.5,
    color: colors.textOnAccent,
  },
  heroHeadlineSoft: {
    color: '#DBEAFE',
  },
  heroHeadlineChevron: {
    color: 'rgba(255,255,255,0.5)',
  },
  heroPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 18,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: colors.onAccentSoft,
  },
  heroPillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#86EFAC',
  },
  heroPillLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textOnAccent,
  },
  heroPillLabelMuted: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  lastDose: {
    alignItems: 'center',
  },
  lastDoseLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lastDoseLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  lastDoseValue: {
    fontFamily: fonts.serif,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.6,
    color: colors.textPrimary,
    marginTop: 2,
  },
  lastDoseMeta: {
    ...typography.caption,
    marginTop: 4,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xxs,
  },
  quickAction: {
    alignItems: 'center',
    gap: 6,
    width: 76,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIconTeal: {
    backgroundColor: colors.secondaryAccentSoft,
  },
  quickActionLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textPrimary,
  },
  readOnlyCard: {
    marginTop: spacing.lg,
  },
  sectionLink: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textPrimary,
    textDecorationLine: 'underline',
  },
  medScroller: {
    marginHorizontal: -20,
  },
  medScrollerContent: {
    gap: spacing.xs,
    paddingHorizontal: 20,
  },
  medCard: {
    width: 112,
    height: 96,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingVertical: 10,
    paddingHorizontal: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  medCardOn: {
    borderWidth: 1.5,
    borderColor: colors.accentBright,
  },
  medCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  medActiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  medName: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.textPrimary,
    marginTop: 'auto',
  },
  medMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  symptomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 60,
    marginTop: spacing.md,
  },
  symptomIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondaryAccentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symptomName: {
    fontFamily: fonts.medium,
    fontSize: 17,
    color: colors.textPrimary,
  },
  listCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: 14,
    paddingVertical: spacing.xxs,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.dividerSoft,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 60,
  },
  upcomingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
