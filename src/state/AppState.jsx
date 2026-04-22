import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useProtocolNotifications } from "../hooks/useProtocolNotifications";
import { addDays, formatDateKey } from "../lib/date";
import {
  createDefaultDailyLog,
  createDefaultSessionLogs,
  createDefaultUserSettings,
  createDefaultWorkoutPlans,
  TASK_LIBRARY,
} from "../lib/defaultData";
import {
  buildDashboardTasks,
  createAdaptiveWeekPlan,
  createSessionRecord,
  getControlRecommendation,
  getLastWeekMetrics,
  getRelativeWeekSlice,
  getSmartInsights,
  getTodayFocus,
  getTodayPlan,
  getTodayStatus,
  getWeeklyMetrics,
  normalizeDailyLogs,
} from "../lib/smartEngine";

const AppStateContext = createContext(null);

function ensureSettings(value) {
  return {
    ...createDefaultUserSettings(),
    ...(value ?? {}),
  };
}

function ensureWorkoutPlans(value) {
  const defaults = createDefaultWorkoutPlans();
  if (!value || !Array.isArray(value.days) || value.days.length === 0) {
    return defaults;
  }
  return {
    ...defaults,
    ...value,
    days: value.days.map((day) => ({
      ...day,
      exercises: Array.isArray(day.exercises) ? day.exercises : [],
    })),
  };
}

function ensureSessionLogs(value) {
  return Array.isArray(value) ? value : createDefaultSessionLogs();
}

function ensureNotificationState(value) {
  const fallback = {
    kegels: "",
    sleep: "",
  };

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }

  return {
    kegels: typeof value.kegels === "string" ? value.kegels : fallback.kegels,
    sleep: typeof value.sleep === "string" ? value.sleep : fallback.sleep,
  };
}

function ensureTimerState(value) {
  const fallback = {
    startTime: null,
    elapsedTime: 0,
    isRunning: false,
  };

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }

  const startTime = typeof value.startTime === "number" ? value.startTime : null;
  const elapsedTime = typeof value.elapsedTime === "number" && value.elapsedTime > 0 ? value.elapsedTime : 0;

  return {
    startTime,
    elapsedTime,
    isRunning: Boolean(value.isRunning) && startTime !== null,
  };
}

export function AppStateProvider({ children }) {
  const [now, setNow] = useState(new Date());
  const [userSettings, setUserSettings] = useLocalStorage("userSettings", createDefaultUserSettings, {
    sanitize: ensureSettings,
  });
  const [workoutPlans, setWorkoutPlans] = useLocalStorage("workoutPlans", createDefaultWorkoutPlans, {
    sanitize: ensureWorkoutPlans,
  });
  const [dailyLogs, setDailyLogs] = useLocalStorage("dailyLogs", {}, {
    sanitize: (value) => normalizeDailyLogs(value, createDefaultDailyLog),
  });
  const [sessionLogs, setSessionLogs] = useLocalStorage("sessionLogs", createDefaultSessionLogs, {
    sanitize: ensureSessionLogs,
  });
  const [lastNotified, setLastNotified] = useLocalStorage("notificationState", ensureNotificationState, {
    sanitize: ensureNotificationState,
  });
  const [workoutTimerState, setWorkoutTimerState] = useLocalStorage("workoutSessionTimer", ensureTimerState, {
    sanitize: ensureTimerState,
  });
  const [notificationPermission, setNotificationPermission] = useState(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    return Notification.permission;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("theme-dark", Boolean(userSettings.darkMode));
  }, [userSettings.darkMode]);

  const todayKey = formatDateKey(now);
  const yesterdayKey = formatDateKey(addDays(now, -1));

  const weekPlan = useMemo(
    () =>
      createAdaptiveWeekPlan({
        referenceDate: now,
        userSettings,
        workoutPlans,
        dailyLogs,
      }),
    [dailyLogs, now, userSettings, workoutPlans],
  );

  const todayPlan = useMemo(() => getTodayPlan(weekPlan, now), [weekPlan, now]);
  const todayLog = dailyLogs[todayKey] ?? createDefaultDailyLog();
  const previousLog = dailyLogs[yesterdayKey] ?? createDefaultDailyLog();

  const controlRecommendation = useMemo(
    () =>
      getControlRecommendation({
        referenceDate: now,
        weekPlan,
        dailyLogs,
        controlLimit: userSettings.controlLimit,
      }),
    [dailyLogs, now, userSettings.controlLimit, weekPlan],
  );

  const todayTasks = useMemo(
    () =>
      buildDashboardTasks({
        todayPlan,
        todayLog,
        controlRecommendation,
        taskLibrary: TASK_LIBRARY,
      }),
    [controlRecommendation, todayLog, todayPlan],
  );

  const todayStatus = useMemo(
    () =>
      getTodayStatus({
        todayPlan,
        todayLog,
        controlRecommendation,
      }),
    [controlRecommendation, todayLog, todayPlan],
  );

  const weeklyMetrics = useMemo(
    () =>
      getWeeklyMetrics({
        referenceDate: now,
        weekPlan,
        dailyLogs,
        sessionLogs,
        controlLimit: userSettings.controlLimit,
      }),
    [dailyLogs, now, sessionLogs, userSettings.controlLimit, weekPlan],
  );

  const lastWeekMetrics = useMemo(
    () =>
      getLastWeekMetrics({
        referenceDate: now,
        userSettings,
        workoutPlans,
        dailyLogs,
        sessionLogs,
      }),
    [dailyLogs, now, sessionLogs, userSettings, workoutPlans],
  );

  const insights = useMemo(
    () =>
      getSmartInsights({
        metrics: weeklyMetrics,
        lastWeekMetrics,
        controlRecommendation,
      }),
    [controlRecommendation, lastWeekMetrics, weeklyMetrics],
  );

  const weekSlice = useMemo(() => getRelativeWeekSlice(now, weekPlan), [now, weekPlan]);

  const todayFocus = useMemo(
    () =>
      getTodayFocus({
        todayPlan,
        controlRecommendation,
        weeklyMetrics,
        previousSleep: Number(previousLog.sleepHours) || 0,
      }),
    [controlRecommendation, previousLog.sleepHours, todayPlan, weeklyMetrics],
  );

  function updateDailyLog(dateKey, updater) {
    setDailyLogs((previous) => {
      const base = {
        ...createDefaultDailyLog(),
        ...(previous?.[dateKey] ?? {}),
        tasks: {
          ...createDefaultDailyLog().tasks,
          ...(previous?.[dateKey]?.tasks ?? {}),
        },
        advanced: {
          ...createDefaultDailyLog().advanced,
          ...(previous?.[dateKey]?.advanced ?? {}),
        },
        flags: {
          ...createDefaultDailyLog().flags,
          ...(previous?.[dateKey]?.flags ?? {}),
        },
      };
      const nextDayLog = updater(base);
      return {
        ...(previous ?? {}),
        [dateKey]: nextDayLog,
      };
    });
  }

  function toggleTodayTask(taskId, explicitValue) {
    const task = todayTasks.find((item) => item.id === taskId);
    if (!task || task.disabled) {
      return;
    }

    const current = Boolean(todayLog.tasks?.[taskId]);
    const next = typeof explicitValue === "boolean" ? explicitValue : !current;

    if (taskId === "control" && next && !controlRecommendation.canToggleOn) {
      return;
    }

    updateDailyLog(todayKey, (previous) => ({
      ...previous,
      tasks: {
        ...previous.tasks,
        [taskId]: next,
      },
    }));
  }

  function setTodaySleepHours(hours) {
    updateDailyLog(todayKey, (previous) => ({
      ...previous,
      sleepHours: hours,
    }));
  }

  function setAdvancedTodayField(field, value) {
    updateDailyLog(todayKey, (previous) => ({
      ...previous,
      advanced: {
        ...previous.advanced,
        [field]: value,
      },
    }));
  }

  function updateSettings(field, value) {
    setUserSettings((previous) => ({
      ...ensureSettings(previous),
      [field]: value,
    }));
  }

  function patchSettings(patch) {
    setUserSettings((previous) => ({
      ...ensureSettings(previous),
      ...(patch ?? {}),
    }));
  }

  function saveWorkoutPlans(nextPlans) {
    setWorkoutPlans(ensureWorkoutPlans(nextPlans));
  }

  function resetWorkoutPlans() {
    setWorkoutPlans(createDefaultWorkoutPlans());
  }

  function saveWorkoutSession({ durationSec, completionPercent, setProgress, exercises }) {
    const record = createSessionRecord({
      dateKey: todayKey,
      durationSec,
      completionPercent,
      setProgress,
      exercises,
    });

    setSessionLogs((previous) => [...(previous ?? []), record]);

    updateDailyLog(todayKey, (previous) => ({
      ...previous,
      tasks: {
        ...previous.tasks,
        workout: completionPercent > 0 ? true : previous.tasks.workout,
      },
      advanced: {
        ...previous.advanced,
        durationEstimate: String(Math.round(durationSec / 60)),
      },
    }));
  }

  async function requestNotificationPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return "unsupported";
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    return permission;
  }

  useProtocolNotifications({
    now,
    todayKey,
    remindersEnabled: userSettings.notificationsEnabled,
    permissionState: notificationPermission,
    reminderSettings: {
      kegelTime: userSettings.kegelReminderTime,
      sleepTime: userSettings.sleepReminderTime,
    },
    completionToday: {
      kegels: Boolean(todayLog.tasks?.kegels),
      sleep: Boolean(todayLog.flags?.bedtimeComplete),
    },
    lastNotified,
    setLastNotified,
  });

  const value = {
    now,
    todayKey,
    userSettings,
    workoutPlans,
    dailyLogs,
    sessionLogs,
    workoutTimerState,
    weekPlan,
    weekSlice,
    todayPlan,
    todayLog,
    todayTasks,
    todayStatus,
    todayFocus,
    controlRecommendation,
    weeklyMetrics,
    lastWeekMetrics,
    insights,
    notificationPermission,
    toggleTodayTask,
    setTodaySleepHours,
    setAdvancedTodayField,
    updateSettings,
    patchSettings,
    saveWorkoutPlans,
    resetWorkoutPlans,
    saveWorkoutSession,
    requestNotificationPermission,
    updateDailyLog,
    setWorkoutTimerState,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return context;
}
