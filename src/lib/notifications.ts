import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type NotificationRoute =
  | { kind: 'medication_reminder'; medicationId: string; reminderDate: string }
  | { kind: 'appointment_reminder'; appointmentId: string }
  | { kind: 'low_stock'; medicationId: string }
  | { kind: 'expiry'; medicationId: string; batchId: string };

let permissionRequestedThisSession = false;

/** Request notification permission. Call this contextually (e.g. right
 * after the user sets their first reminder), never on cold app launch. */
export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (permissionRequestedThisSession && !current.canAskAgain) return false;

  permissionRequestedThisSession = true;
  const result = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: false },
  });
  return result.granted;
}

export async function hasNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  return current.granted;
}

/** Schedule a one-off local notification for an exact local date/time. */
export async function scheduleLocalNotification(params: {
  title: string;
  body: string;
  date: Date;
  data: NotificationRoute;
}): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: params.title,
      body: params.body,
      data: params.data as Record<string, unknown>,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: params.date,
    },
  });
}

export async function cancelLocalNotification(notificationId: string | null | undefined): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Already fired or cancelled — safe to ignore.
  }
}

export function addNotificationResponseListener(
  callback: (route: NotificationRoute) => void,
): { remove: () => void } {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as NotificationRoute | undefined;
    if (data?.kind) callback(data);
  });
  return subscription;
}

export async function getLastNotificationRoute(): Promise<NotificationRoute | null> {
  const last = await Notifications.getLastNotificationResponseAsync();
  const data = last?.notification.request.content.data as NotificationRoute | undefined;
  return data?.kind ? data : null;
}

export function combineDateTime(dateKey: string, time: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm, 0);
}

export const isAndroid = Platform.OS === 'android';
