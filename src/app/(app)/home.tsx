import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setStatusBarStyle } from 'expo-status-bar';
import { Screen } from '@/components/ui/Screen';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { PrimaryButton, TextButton } from '@/components/ui/Button';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { MedicationListItem } from '@/components/composed/MedicationListItem';
import { QuickAddSheet } from '@/components/composed/QuickAddSheet';
import { colors, typography, spacing, radius } from '@/theme';
import { useMedications } from '@/hooks/useMedications';
import { useUpcomingMedicationReminders } from '@/hooks/useReminders';
import { useAppointments } from '@/hooks/useAppointments';
import { useEntitlement } from '@/context/EntitlementProvider';
import { formatLocalDate, formatLocalTime, todayDateKey } from '@/lib/dateTime';

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

  // Sampled into state (not read via Date.now() during render) so the
  // "days until expiry" math below stays a pure function of state.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  const { showTrialCountdown, trialDaysLeft, isReadOnly } = useEntitlement();

  // The gradient hero runs edge-to-edge under the status bar, so the bar's
  // own text has to flip to light while this tab is focused, and back to
  // the app-wide dark when it isn't.
  const insets = useSafeAreaInsets();
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('dark');
    }, []),
  );

  const upcoming = useMemo<UpcomingEntry[]>(() => {
    const entries: UpcomingEntry[] = [];
    const medicationById = new Map((medications ?? []).map((m) => [m.id, m]));

    for (const reminder of reminders ?? []) {
      const medication = medicationById.get(reminder.medicationId);
      if (!medication) continue;
      entries.push({
        id: `reminder-${reminder.id}`,
        icon: 'notifications-outline',
        title: medication.name,
        subtitle: `${formatLocalDate(`${reminder.reminderDate}T${reminder.reminderTime}:00`)} · ${formatLocalTime(`${reminder.reminderDate}T${reminder.reminderTime}:00`)}`,
        tone: 'accent',
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
        medication.lowStockThreshold != null &&
        medication.totalStock <= medication.lowStockThreshold
      ) {
        entries.push({
          id: `low-stock-${medication.id}`,
          icon: 'alert-circle-outline',
          title: medication.name,
          subtitle: `Low stock — ${medication.totalStock} ${medication.stockUnit} left`,
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
  const lowStockCount = upcoming.filter((e) => e.tone === 'warning').length;
  const greeting = greetingForHour(new Date(now).getHours());

  const quickActions: QuickAction[] = [
    { key: 'add', icon: 'add', label: 'Add', onPress: () => setQuickAddVisible(true), primary: true },
    { key: 'history', icon: 'time-outline', label: 'History', onPress: () => router.push('/(app)/history') },
    { key: 'providers', icon: 'people-outline', label: 'Providers', onPress: () => router.push('/provider') },
    {
      key: 'summary',
      icon: 'document-text-outline',
      label: 'Summary',
      onPress: () => router.push('/(app)/health-summary'),
    },
  ];

  return (
    <Screen scroll padded={false} edges={['bottom']} contentStyle={styles.screenContent}>
      <LinearGradient
        colors={[colors.accent, colors.accentDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.heroGreeting}>{greeting}</Text>
            <Text style={styles.heroSubtitle}>
              {activeCount === 0
                ? 'Nothing tracked yet'
                : `${activeCount} active medication${activeCount === 1 ? '' : 's'}`}
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Settings"
            onPress={() => router.push('/(app)/settings')}
            style={styles.heroIconButton}
          >
            <Ionicons name="settings-outline" size={20} color={colors.textOnAccent} />
          </Pressable>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <Card style={styles.statsCard} elevated>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{upcoming.length}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, lowStockCount > 0 && { color: colors.warning }]}>{lowStockCount}</Text>
            <Text style={styles.statLabel}>Needs attention</Text>
          </View>
        </Card>

        <View style={styles.quickActions}>
          {quickActions.map((action) => (
            <Pressable
              key={action.key}
              onPress={action.onPress}
              disabled={action.primary && isReadOnly}
              style={styles.quickAction}
              accessibilityLabel={action.label}
            >
              <View style={[styles.quickActionIcon, action.primary && styles.quickActionIconPrimary]}>
                <Ionicons
                  name={action.icon}
                  size={22}
                  color={action.primary ? colors.textOnAccent : colors.accentStrong}
                />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        {showTrialCountdown && (
          <Card style={styles.trialCard}>
            <Text style={typography.bodySecondary}>
              {trialDaysLeft === 0 ? 'Your free trial ends today' : `${trialDaysLeft} days left in your free trial`}
            </Text>
          </Card>
        )}

        {isReadOnly && (
          <Card style={[styles.trialCard, { backgroundColor: colors.errorSoft }]}>
            <Text style={typography.cardTitle}>Your free trial has ended</Text>
            <Text style={[typography.bodySecondary, { marginTop: 2 }]}>
              Unlock Mediary for lifetime access — NZ$16.99
            </Text>
            <PrimaryButton label="Unlock Lifetime Access" onPress={() => router.push('/paywall')} style={{ marginTop: spacing.sm }} />
          </Card>
        )}

        <Section title="Upcoming">
        {upcoming.length === 0 ? (
          <Text style={typography.bodySecondary}>Nothing coming up right now.</Text>
        ) : (
          <View style={styles.upcomingList}>
            {visibleUpcoming.map((entry) => (
              <Pressable key={entry.id} onPress={entry.onPress} style={styles.upcomingRow}>
                <View
                  style={[
                    styles.upcomingIcon,
                    { backgroundColor: entry.tone === 'warning' ? colors.warningSoft : colors.accentSoft },
                  ]}
                >
                  <Ionicons
                    name={entry.icon}
                    size={17}
                    color={entry.tone === 'warning' ? colors.warning : colors.accentStrong}
                  />
                </View>
                <View style={styles.upcomingText}>
                  <Text style={typography.body} numberOfLines={1}>
                    {entry.title}
                  </Text>
                  <Text style={typography.caption}>{entry.subtitle}</Text>
                </View>
              </Pressable>
            ))}
            {upcoming.length > UPCOMING_PREVIEW_COUNT && !showAllUpcoming && (
              <TextButton label={`+${upcoming.length - UPCOMING_PREVIEW_COUNT} more`} onPress={() => setShowAllUpcoming(true)} />
            )}
          </View>
        )}
      </Section>

      <Section title="Your medications" action={<TextButton label="Add" onPress={() => router.push('/medication/new')} />}>
        {medicationsLoading ? (
          <LoadingState />
        ) : !medications?.length ? (
          <EmptyState
            icon="leaf-outline"
            title="No medications yet"
            message="Add a medication or treatment to start recording."
            actionLabel="Add medication"
            onAction={() => router.push('/medication/new')}
          />
        ) : (
          <View>
            {medications.map((medication) => (
              <MedicationListItem
                key={medication.id}
                medication={medication}
                onPress={() => router.push(`/medication/${medication.id}`)}
              />
            ))}
          </View>
        )}
        </Section>
      </View>

      <QuickAddSheet visible={quickAddVisible} onClose={() => setQuickAddVisible(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: 0,
  },
  hero: {
    // paddingTop is applied inline — it has to include the status-bar inset,
    // since this gradient deliberately extends under it.
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroGreeting: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.textOnAccent,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.82)',
    marginTop: spacing.xxs,
  },
  heroIconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: spacing.lg,
  },
  statsCard: {
    flexDirection: 'row',
    marginTop: -40,
    backgroundColor: colors.surface,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.caption,
    marginTop: 2,
    textAlign: 'center',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginVertical: 2,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  quickAction: {
    alignItems: 'center',
    gap: spacing.xxs,
    width: 72,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIconPrimary: {
    backgroundColor: colors.accent,
  },
  quickActionLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  trialCard: {
    marginTop: spacing.md,
    backgroundColor: colors.accentSoft,
  },
  upcomingList: {
    gap: 2,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  upcomingIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingText: {
    flex: 1,
  },
});
