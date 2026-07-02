import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function cancelAll(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Schedule one daily-repeating notification per computed "HH:mm" slot.
export async function rescheduleAll(slots: string[]): Promise<void> {
  await cancelAll();
  for (const slot of slots) {
    const [hour, minute] = slot.split(":").map(Number);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Vibrational State",
        body: "Time for your VS practice.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }
}
