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
  getAdaptiveBanner,
  getAdaptiveDayMode,
  getAICoachMessage,
  getActionableInsights,
  getCurrentStreak,
  getDietFeedback,
  getDietScoreFromLog,
  getProgressPrediction,
  getSmartInsights,
  getTodayFocus,
  getTodayPlan,
  getTodayStatus,
  getWorkoutNextSuggestion,
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

function ensureExercisePerformance(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const normalized = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    normalized[key] = {
      weightKg: Number.isFinite(Number(entry.weightKg)) ? Number(entry.weightKg) : null,
      repsCompleted: Number.isFinite(Number(entry.repsCompleted)) ? Number(entry.repsCompleted) : null,
      updatedAt: typeof entry.updatedAt === "string" ? entry.updatedAt : "",
    };
  }
  return normalized;
}

function ensureWorkoutNudgeState(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { workout: "" };
  }
  return {
    workout: typeof value.workout === "string" ? value.workout : "",
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
  const [exercisePerformance, setExercisePerformance] = useLocalStorage("exercisePerformance", {}, {
    sanitize: ensureExercisePerformance,
  });
  const [workoutNudgeState, setWorkoutNudgeState] = useLocalStorage("workoutNudgeState", ensureWorkoutNudgeState, {
    sanitize: ensureWorkoutNudgeState,
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
    document.documentElement.classList.toggle("dark", Boolean(userSettings.darkMode));
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
  const yesterdayPlan = useMemo(() => weekPlan.days.find((day) => day.dateKey === yesterdayKey) ?? null, [weekPlan.days, yesterdayKey]);
  const missedYesterdayWorkout = Boolean(yesterdayPlan?.type === "workout" && !previousLog.tasks?.workout);
  const dietScore = useMemo(() => getDietScoreFromLog(todayLog), [todayLog]);
  const yesterdayWorkout = useMemo(
    () => Boolean(previousLog.tasks?.workout || previousLog.tasks?.cardio),
    [previousLog.tasks?.cardio, previousLog.tasks?.workout],
  );
  const adaptiveMode = useMemo(
    () =>
      getAdaptiveDayMode({
        sleepHours: todayLog.sleepHours,
        yesterdayWorkout,
        dietScore,
      }),
    [dietScore, todayLog.sleepHours, yesterdayWorkout],
  );
  const adaptiveBanner = useMemo(() => getAdaptiveBanner(adaptiveMode), [adaptiveMode]);
  const aiCoachMessage = useMemo(
    () =>
      getAICoachMessage({
        mode: adaptiveMode,
        sleepHours: todayLog.sleepHours,
        yesterdayWorkout,
        dietScore,
      }),
    [adaptiveMode, dietScore, todayLog.sleepHours, yesterdayWorkout],
  );
  const dietFeedback = useMemo(() => getDietFeedback(dietScore), [dietScore]);
  const streakCount = useMemo(() => getCurrentStreak(dailyLogs, now), [dailyLogs, now]);
  const shouldBoostProteinTomorrow = useMemo(() => getDietScoreFromLog(previousLog) < 50, [previousLog]);
  const showWorkoutNudge = useMemo(
    () => workoutNudgeState.workout === todayKey && todayPlan?.type === "workout" && !todayLog.tasks?.workout,
    [todayKey, todayLog.tasks?.workout, todayPlan?.type, workoutNudgeState.workout],
  );

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
  const actionableInsights = useMemo(
    () =>
      getActionableInsights({
        sleepHours: todayLog.sleepHours,
        streak: streakCount,
        dietScore,
        completion: todayStatus.completionPercent,
      }),
    [dietScore, streakCount, todayLog.sleepHours, todayStatus.completionPercent],
  );
  const progressPrediction = useMemo(
    () =>
      getProgressPrediction({
        consistencyPercent: weeklyMetrics.workoutConsistency,
        dietScore,
        streak: streakCount,
      }),
    [dietScore, streakCount, weeklyMetrics.workoutConsistency],
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
        diet: {
          ...createDefaultDailyLog().diet,
          ...(previous?.[dateKey]?.diet ?? {}),
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

  function toggleDietMeal(mealId, checked) {
    if (!["breakfast", "lunch", "dinner"].includes(mealId)) {
      return;
    }
    updateDailyLog(todayKey, (previous) => ({
      ...previous,
      diet: {
        ...previous.diet,
        [mealId]: Boolean(checked),
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

  function saveWorkoutSession({ durationSec, completionPercent, setProgress, exercises, exercisePerformance: performanceInput }) {
    const record = createSessionRecord({
      dateKey: todayKey,
      durationSec,
      completionPercent,
      setProgress,
      exercises,
      exercisePerformance: performanceInput,
    });

    setSessionLogs((previous) => [...(previous ?? []), record]);

    setExercisePerformance((previous) => {
      const next = { ...(previous ?? {}) };
      for (const exercise of exercises ?? []) {
        const key = String(exercise?.name ?? "").trim().toLowerCase();
        if (!key) {
          continue;
        }
        const input = performanceInput?.[exercise.id] ?? {};
        const weight = Number(input.weightKg);
        const reps = Number(input.repsCompleted);
        if (!Number.isFinite(weight) && !Number.isFinite(reps)) {
          continue;
        }
        next[key] = {
          weightKg: Number.isFinite(weight) ? weight : previous?.[key]?.weightKg ?? null,
          repsCompleted: Number.isFinite(reps) ? reps : previous?.[key]?.repsCompleted ?? null,
          updatedAt: new Date().toISOString(),
        };
      }
      return next;
    });

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

  function getExerciseSuggestion(exerciseName, plannedReps) {
    const key = String(exerciseName ?? "").trim().toLowerCase();
    return getWorkoutNextSuggestion({
      lastWorkout: exercisePerformance?.[key],
      plannedReps,
      missedYesterdayWorkout,
    });
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

  useEffect(() => {
    const hour = now.getHours();
    const shouldTrigger =
      hour >= 18 &&
      todayPlan?.type === "workout" &&
      !todayLog.tasks?.workout &&
      workoutNudgeState.workout !== todayKey;

    if (!shouldTrigger) {
      return;
    }

    setWorkoutNudgeState((previous) => ({
      ...(previous ?? { workout: "" }),
      workout: todayKey,
    }));

    if (
      userSettings.notificationsEnabled &&
      notificationPermission === "granted" &&
      typeof window !== "undefined" &&
      "Notification" in window
    ) {
      new Notification("Workout reminder", {
        body: "No workout logged yet. Start a short session now to protect your streak.",
      });
    }
  }, [
    notificationPermission,
    now,
    setWorkoutNudgeState,
    todayKey,
    todayLog.tasks?.workout,
    todayPlan?.type,
    userSettings.notificationsEnabled,
    workoutNudgeState.workout,
  ]);

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
    missedYesterdayWorkout,
    controlRecommendation,
    weeklyMetrics,
    lastWeekMetrics,
    insights,
    actionableInsights,
    progressPrediction,
    dietScore,
    dietFeedback,
    adaptiveMode,
    adaptiveBanner,
    aiCoachMessage,
    streakCount,
    shouldBoostProteinTomorrow,
    showWorkoutNudge,
    getExerciseSuggestion,
    notificationPermission,
    toggleTodayTask,
    setTodaySleepHours,
    setAdvancedTodayField,
    toggleDietMeal,
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
