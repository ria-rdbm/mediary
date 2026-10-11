import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthProvider';

export default function AuthLayout() {
  const { status } = useAuth();

  // Once a sign-in completes, hand off to the index route, which decides
  // between onboarding and home based on the profile.
  if (status === 'signed_in') {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
