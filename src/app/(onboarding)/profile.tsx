import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { ProfileDetailsForm } from '@/components/composed/ProfileDetailsForm';
import { typography, spacing } from '@/theme';
import { useUpdateProfileDetails } from '@/hooks/useProfile';

export default function OnboardingProfileScreen() {
  const updateProfileDetails = useUpdateProfileDetails();

  return (
    <Screen scroll>
      <Text style={[typography.screenTitle, styles.title]}>Profile</Text>

      <ProfileDetailsForm
        submitLabel="Continue"
        submitting={updateProfileDetails.isPending}
        onSubmit={async (values) => {
          await updateProfileDetails.mutateAsync(values);
          router.push('/(onboarding)/categories');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.lg, marginBottom: spacing.lg },
});
