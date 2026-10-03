import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/** Local notifications aren't available in the browser, so every function here is a no-op on web. */
export const remindersSupported = Platform.OS !== 'web';

const CHANNEL_ID = 'reminders';
const EVENING_NUDGE = { hour: 20, minute: 0 };

export type ReminderPlanItem = {
  id: string;
  name: string;
  emoji: string;
  hour: number;
  minute: number;
};

if (remindersSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

const MESSAGES = [
  (n: string) => `Ready to start ${n}? Now's a good time.`,
  (n: string) => `Don't forget ${n}. You set this intention for today.`,
  (n: string) => `Have you done ${n} yet? Keep your streak alive.`,
];

export async function requestReminderPermission(): Promise<boolean> {
  if (!remindersSupported) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/** Replaces every scheduled reminder: one per habit at its chosen time, plus an evening check-in. */
export async function syncReminders(plan: ReminderPlanItem[], enabled: boolean) {
  if (!remindersSupported) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!enabled) return;

    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Habit reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const daily = (hour: number, minute: number) => ({
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    });

    for (const [i, item] of plan.entries()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${item.emoji} ${item.name}`,
          body: MESSAGES[i % MESSAGES.length](item.name),
        },
        trigger: daily(item.hour, item.minute),
      });
    }

    if (plan.length > 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'How did today go?',
          body: 'Check off your habits before the day ends 🔥',
        },
        trigger: daily(EVENING_NUDGE.hour, EVENING_NUDGE.minute),
      });
    }
  } catch {
    // Scheduling failures shouldn't crash the app.
  }
}
