import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Section } from '@/components/ui/Section';
import { ListRow } from '@/components/ui/ListRow';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { LiquidCard } from '@/components/ui/LiquidCard';
import { useWeightRecords } from '@/hooks/useWeight';
import { colors, fonts, typography, spacing } from '@/theme';
import { useAuth } from '@/context/AuthProvider';
import { useEntitlement } from '@/context/EntitlementProvider';
import { deleteAccount } from '@/services/account';
import { ShareHistorySheet } from '@/components/composed/ShareHistorySheet';
import { hasNotificationPermission } from '@/lib/notifications';
import { LEGAL_CONTACT_EMAIL } from '@/constants/legalContent';
import { supabase } from '@/lib/supabase';
import { resetRevenueCatIdentity } from '@/lib/revenuecat';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { isLifetime, isTrialActive, trialDaysLeft } = useEntitlement();

  const [signOutVisible, setSignOutVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [notificationsOn, setNotificationsOn] = useState<boolean | null>(null);
  const [shareVisible, setShareVisible] = useState(false);
  const { data: weightRecords } = useWeightRecords();
  const latestWeight = weightRecords?.[0];

  // Re-check on focus: the user may have changed it in the iOS Settings app.
  useFocusEffect(
    useCallback(() => {
      void hasNotificationPermission().then(setNotificationsOn);
    }, []),
  );

  const handleDelete = async () => {
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteAccount();
      setDeleteVisible(false);
      // The server-side user is already gone, so only clear local state
      // (scope: 'local' skips the now-pointless server-side revocation
      // call) — this triggers the auth listener to redirect to sign-in.
      resetRevenueCatIdentity();
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.warn('Account deletion failed', err);
      setDeleteError('Could not delete your account. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const purchaseStatusLabel = isLifetime
    ? 'Lifetime Access'
    : isTrialActive
      ? `Free trial — ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left`
      : 'Trial ended';

  return (
    <Screen scroll aboveTabBar>
      <Text style={[typography.headerTitle, styles.title]}>Settings</Text>

      <LiquidCard style={styles.purchaseCard}>
        <Text style={styles.purchaseEyebrow}>Purchase</Text>
        <View style={styles.purchaseStatusRow}>
          <Text style={styles.purchaseStatus}>Status</Text>
          <View style={styles.purchasePill}>
            <Text style={styles.purchasePillLabel}>{purchaseStatusLabel}</Text>
          </View>
        </View>
        {!isLifetime && (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/paywall')}
            style={({ pressed }) => [styles.unlockButton, pressed && { opacity: 0.85 }]}
          >
            <View style={styles.unlockIcon}>
              <Ionicons name="star-outline" size={14} color={colors.accent} />
            </View>
            <Text style={styles.unlockLabel}>Unlock Lifetime Access</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
          </Pressable>
        )}
      </LiquidCard>

      <Section title="Manage">
        <ListRow
          icon="scale-outline"
          title="Weight"
          value={latestWeight ? `${latestWeight.weightKg} kg` : undefined}
          subtitle={latestWeight ? undefined : 'Add your first weigh-in'}
          showChevron
          onPress={() => router.push('/weight/new')}
        />
        <ListRow icon="business-outline" title="Providers & clinics" showChevron divider onPress={() => router.push('/provider')} />
      </Section>

      <Section title="Preferences">
        <ListRow
          icon="notifications-outline"
          title="Notifications"
          subtitle={notificationsOn == null ? undefined : notificationsOn ? 'On' : 'Off — tap to turn on in iOS Settings'}
          showChevron
          onPress={() => void Linking.openSettings()}
        />
        <ListRow
          icon="share-outline"
          title="Share my history"
          subtitle="Send a period as an image or text"
          showChevron
          divider
          onPress={() => setShareVisible(true)}
        />
      </Section>

      <Section title="Privacy">
        <ListRow icon="shield-checkmark-outline" title="Privacy Policy" showChevron onPress={() => router.push('/legal/privacy')} />
        <ListRow icon="document-text-outline" title="Terms of Use" showChevron divider onPress={() => router.push('/legal/terms')} />
      </Section>

      <Section title="Support">
        <ListRow
          icon="mail-outline"
          title="Contact support"
          subtitle={LEGAL_CONTACT_EMAIL}
          showChevron
          onPress={() => void Linking.openURL(`mailto:${LEGAL_CONTACT_EMAIL}`)}
        />
        <ListRow
          icon="information-circle-outline"
          title="Version"
          value={Constants.expoConfig?.version ?? '—'}
          divider
        />
      </Section>

      <Section title="Account">
        <ListRow icon="log-out-outline" title="Sign Out" onPress={() => setSignOutVisible(true)} />
        <ListRow
          icon="trash-outline"
          title="Delete Account & All Data"
          destructive
          divider
          onPress={() => setDeleteVisible(true)}
        />
      </Section>

      <Text style={styles.disclaimer}>
        Mediary helps you record and organise your treatment information. It does not provide medical advice,
        diagnosis, or treatment recommendations.
      </Text>

      <ShareHistorySheet visible={shareVisible} onClose={() => setShareVisible(false)} />

      <ConfirmationDialog
        visible={signOutVisible}
        title="Sign out?"
        icon="log-out-outline"
        confirmLabel="Sign Out"
        onConfirm={() => {
          setSignOutVisible(false);
          void signOut();
        }}
        onCancel={() => setSignOutVisible(false)}
      />

      <ConfirmationDialog
        visible={deleteVisible}
        title="Delete your account?"
        icon="trash-outline"
        message={`This will permanently delete your Mediary account and all associated data. This action cannot be undone.${deleteError ? `\n\n${deleteError}` : ''}`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete Account'}
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm, marginBottom: spacing.md, textAlign: 'center' },
  purchaseCard: {
    padding: spacing.md,
  },
  purchaseEyebrow: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
  },
  purchaseStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxs,
  },
  purchaseStatus: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.textOnAccent,
  },
  purchasePill: {
    height: 26,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: 13,
    backgroundColor: colors.onAccentSoft,
  },
  purchasePillLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textOnAccent,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 48,
    marginTop: spacing.md,
    paddingLeft: 8,
    paddingRight: 14,
    borderRadius: 24,
    backgroundColor: colors.surface,
  },
  unlockIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockLabel: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  disclaimer: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
});
