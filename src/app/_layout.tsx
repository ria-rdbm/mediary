import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider, useAuth } from '@/context/AuthProvider';
import { EntitlementProvider } from '@/context/EntitlementProvider';
import { addNotificationResponseListener, getLastNotificationRoute, type NotificationRoute } from '@/lib/notifications';

function routeForNotification(route: NotificationRoute): string | null {
  switch (route.kind) {
    case 'medication_reminder':
      return `/record/new?medicationId=${route.medicationId}`;
    case 'appointment_reminder':
      return `/appointment/${route.appointmentId}/edit`;
    case 'low_stock':
      return `/medication/${route.medicationId}/stock`;
    case 'expiry':
      return `/medication/${route.medicationId}/stock`;
    default:
      return null;
  }
}

function useNotificationRouting() {
  useEffect(() => {
    getLastNotificationRoute().then((route) => {
      if (route) {
        const path = routeForNotification(route);
        if (path) router.push(path as never);
      }
    });

    const subscription = addNotificationResponseListener((route) => {
      const path = routeForNotification(route);
      if (path) router.push(path as never);
    });
    return () => subscription.remove();
  }, []);
}

function RootNavigator() {
  useNotificationRouting();
  const { status } = useAuth();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Once signed in, (auth) becomes inaccessible and the router moves the
          user to index, which routes on to onboarding or home. */}
      <Stack.Protected guard={status !== 'signed_in'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      <Stack.Screen name="health-summary-view" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <EntitlementProvider>
              <StatusBar style="dark" />
              <RootNavigator />
            </EntitlementProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
