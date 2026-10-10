import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { LoadingState } from '@/components/ui/States';
import { Screen } from '@/components/ui/Screen';

export default function Index() {
  const { status } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  if (status === 'loading' || (status === 'signed_in' && profileLoading)) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (status === 'signed_out') {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!profile?.onboarding_completed_at) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  return <Redirect href="/(app)/home" />;
}
