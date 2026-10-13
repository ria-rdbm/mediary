import React from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { LoadingState } from '@/components/ui/States';
import { ProfileDetailsForm } from '@/components/composed/ProfileDetailsForm';
import { useProfile, useUpdateProfileDetails } from '@/hooks/useProfile';

export default function ProfileScreen() {
  const { data: profile, isLoading } = useProfile();
  const updateProfileDetails = useUpdateProfileDetails();

  return (
    <Screen scroll>
      <Header title="Profile" />

      {isLoading ? (
        <LoadingState />
      ) : (
        <ProfileDetailsForm
          initial={{
            fullName: profile?.full_name,
            gender: profile?.gender,
            dateOfBirth: profile?.date_of_birth,
            weightKg: profile?.weight_kg,
            nhiNumber: profile?.nhi_number,
            preferredProviderName: profile?.preferred_provider_name,
          }}
          submitLabel="Save"
          submitting={updateProfileDetails.isPending}
          onSubmit={async (values) => {
            await updateProfileDetails.mutateAsync(values);
            router.back();
          }}
        />
      )}
    </Screen>
  );
}
