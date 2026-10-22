import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Geist_400Regular, Geist_500Medium, Geist_600SemiBold } from '@expo-google-fonts/geist';
import { Fraunces_500Medium, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/context/AuthProvider';
import { EntitlementProvider } from '@/context/EntitlementProvider';
import { addNotificationResponseListener, getLastNotificationRoute, type NotificationRoute } from '@/lib/notifications';

// Hold the native splash until the brand fonts are ready, so no screen ever
// renders a frame in the system font.
void SplashScreen.preventAutoHideAsync();

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

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      <Stack.Screen name="health-summary-view" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  // On a load failure, fall through and render with system fonts rather
  // than leaving the user stuck on the splash.
  if (!fontsLoaded && !fontError) return null;

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
