import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/context/AuthProvider';

export default function AuthLayout() {
  const { status } = useAuth();

  // Once any sign-in method succeeds, hand off to the index route, which
  // decides between onboarding and home.
  if (status === 'signed_in') {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
