import React, { useCallback, useState } from 'react';
import { Text, StyleSheet, Linking } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Section } from '@/components/ui/Section';
import { ListRow } from '@/components/ui/ListRow';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { typography, spacing } from '@/theme';
import { useAuth } from '@/context/AuthProvider';
import { useEntitlement } from '@/context/EntitlementProvider';
import { deleteAccount } from '@/services/account';
import { ShareHistorySheet } from '@/components/composed/ShareHistorySheet';
import { hasNotificationPermission } from '@/lib/notifications';
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
    <Screen scroll>
      <Text style={[typography.screenTitle, styles.title]}>Settings</Text>

      <Section title="Purchase">
        <ListRow title="Status" subtitle={purchaseStatusLabel} />
        {!isLifetime && (
          <ListRow title="Unlock Lifetime Access" showChevron onPress={() => router.push('/paywall')} />
        )}
      </Section>

      <Section title="Manage">
        <ListRow title="Profile" showChevron onPress={() => router.push('/profile')} />
        <ListRow title="Weight" showChevron onPress={() => router.push('/weight')} />
        <ListRow title="Medications" showChevron onPress={() => router.push('/medication')} />
        <ListRow title="Providers & clinics" showChevron onPress={() => router.push('/provider')} />
      </Section>

      <Section title="Preferences">
        <ListRow
          title="Notifications"
          subtitle={notificationsOn == null ? undefined : notificationsOn ? 'On' : 'Off — tap to turn on in iOS Settings'}
          showChevron
          onPress={() => void Linking.openSettings()}
        />
        <ListRow title="Share my history" subtitle="Send a period as text to another app" showChevron onPress={() => setShareVisible(true)} />
      </Section>

      <Section title="Privacy">
        <ListRow title="Privacy Policy" showChevron onPress={() => router.push('/legal/privacy')} />
        <ListRow title="Terms of Use" showChevron onPress={() => router.push('/legal/terms')} />
      </Section>

      <Section title="Account">
        <ListRow title="Sign Out" onPress={() => setSignOutVisible(true)} />
        <ListRow title="Delete Account & All Data" destructive onPress={() => setDeleteVisible(true)} />
      </Section>

      <Text style={styles.disclaimer}>
        Mediary helps you record and organise your treatment information. It does not provide medical advice,
        diagnosis, or treatment recommendations.
      </Text>

      <ShareHistorySheet visible={shareVisible} onClose={() => setShareVisible(false)} />

      <ConfirmationDialog
        visible={signOutVisible}
        title="Sign out?"
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
  title: { marginTop: spacing.sm },
  disclaimer: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
});
