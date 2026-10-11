import React, { useState } from 'react';
import { Text, StyleSheet, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Section } from '@/components/ui/Section';
import { ListRow } from '@/components/ui/ListRow';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { typography, spacing } from '@/theme';
import { useAuth } from '@/context/AuthProvider';
import { useEntitlement } from '@/context/EntitlementProvider';
import { deleteAccount, syncEntitlement } from '@/services/account';
import { supabase } from '@/lib/supabase';
import { resetRevenueCatIdentity, restorePurchases, hasLifetimeEntitlement } from '@/lib/revenuecat';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { isLifetime, isTrialActive, trialDaysLeft, refetch } = useEntitlement();

  const [signOutVisible, setSignOutVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const handleRestore = async () => {
    try {
      const info = await restorePurchases();
      if (hasLifetimeEntitlement(info)) {
        try {
          await syncEntitlement(Platform.OS === 'android' ? 'android' : 'ios');
        } catch (err) {
          console.warn('sync-entitlement failed (webhook will catch up)', err);
        }
        refetch();
        Alert.alert('Purchase restored', 'Lifetime Access is active on this account.');
      } else {
        Alert.alert('Nothing to restore', 'No previous purchase was found for this account.');
      }
    } catch {
      Alert.alert('Restore failed', 'Please try again.');
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
        <ListRow title="Restore Purchase" onPress={handleRestore} />
      </Section>

      <Section title="Manage">
        <ListRow title="Providers & clinics" showChevron onPress={() => router.push('/provider')} />
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
