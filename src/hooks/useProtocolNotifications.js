import { useEffect } from "react";

function toMinutes(timeValue) {
  const [hourString, minuteString] = timeValue.split(":");
  const hours = Number(hourString);
  const minutes = Number(minuteString);
  return hours * 60 + minutes;
}

function getCurrentMinutes(now) {
  return now.getHours() * 60 + now.getMinutes();
}

function isSleepReminderWindow(currentMinutes, sleepReminderMinutes) {
  const cutoffWindowMinutes = 5 * 60; // limit sleep reminders to late-night/early-morning.

  if (sleepReminderMinutes < cutoffWindowMinutes) {
    return currentMinutes >= sleepReminderMinutes && currentMinutes <= cutoffWindowMinutes;
  }

  return currentMinutes >= sleepReminderMinutes || currentMinutes <= cutoffWindowMinutes;
}

function canNotify(permissionState, remindersEnabled) {
  return remindersEnabled && permissionState === "granted" && typeof window !== "undefined" && "Notification" in window;
}

export function useProtocolNotifications({
  now,
  todayKey,
  remindersEnabled,
  permissionState,
  reminderSettings,
  completionToday,
  lastNotified,
  setLastNotified,
}) {
  useEffect(() => {
    if (!canNotify(permissionState, remindersEnabled)) {
      return;
    }

    const currentMinutes = getCurrentMinutes(now);
    const kegelReminderMinutes = toMinutes(reminderSettings.kegelTime);
    const sleepReminderMinutes = toMinutes(reminderSettings.sleepTime);

    if (!completionToday.kegels && currentMinutes >= kegelReminderMinutes && lastNotified.kegels !== todayKey) {
      new Notification("Performance Protocol: Kegels", {
        body: "Time for your Kegels: 15 reps x 3 sets.",
      });
      setLastNotified((previous) => ({
        ...previous,
        kegels: todayKey,
      }));
    }

    if (
      !completionToday.sleep &&
      isSleepReminderWindow(currentMinutes, sleepReminderMinutes) &&
      lastNotified.sleep !== todayKey
    ) {
      new Notification("Performance Protocol: Sleep", {
        body: "It is past your sleep reminder. Start wind-down now.",
      });
      setLastNotified((previous) => ({
        ...previous,
        sleep: todayKey,
      }));
    }
  }, [
    now,
    todayKey,
    remindersEnabled,
    permissionState,
    reminderSettings,
    completionToday.kegels,
    completionToday.sleep,
    lastNotified.kegels,
    lastNotified.sleep,
    setLastNotified,
  ]);
}
