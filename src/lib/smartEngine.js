import { addDays, formatDateKey, getProtocolDayNumber, getWeekDates, parseDateKey, startOfWeekMonday } from "./date";
import { generateDiet } from "./dietEngine";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function safeNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function getRecentDateKeys(referenceDate, days) {
  const keys = [];
  for (let index = 0; index < days; index += 1) {
    keys.push(formatDateKey(addDays(referenceDate, -index)));
  }
  return keys;
}

function countCompletedSessionsByDate(sessionLogs, dateKeysSet) {
  if (!Array.isArray(sessionLogs)) {
    return 0;
  }

  return sessionLogs.filter((item) => {
    if (!item || !dateKeysSet.has(item.dateKey)) {
      return false;
    }
    return safeNumber(item.durationSec, 0) > 0;
  }).length;
}

function averageSleepHoursByDate(dailyLogs, dateKeys) {
  const sleepValues = dateKeys
    .map((dateKey) => safeNumber(dailyLogs?.[dateKey]?.sleepHours, 0))
    .filter((value) => value > 0);

  if (sleepValues.length === 0) {
    return 0;
  }

  return sleepValues.reduce((sum, value) => sum + value, 0) / sleepValues.length;
}

function dayLabel(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function byDayNumber(dayA, dayB) {
  return dayA.dayNumber - dayB.dayNumber;
}

function normalizePlanDays(workoutPlans) {
  const days = Array.isArray(workoutPlans?.days) ? [...workoutPlans.days].sort(byDayNumber) : [];
  return Array.from({ length: 7 }, (_, index) => {
    const dayNumber = index + 1;
    const existing = days.find((item) => item.dayNumber === dayNumber);
    if (existing) {
      return {
        dayNumber,
        type: existing.type ?? (dayNumber <= 5 ? "workout" : dayNumber === 6 ? "recovery" : "rest"),
        intensity: existing.intensity ?? "medium",
        name: existing.name ?? `Day ${dayNumber} Plan`,
        exercises: Array.isArray(existing.exercises) ? existing.exercises : [],
      };
    }
    return {
      dayNumber,
      type: dayNumber <= 5 ? "workout" : dayNumber === 6 ? "recovery" : "rest",
      intensity: dayNumber <= 4 ? "high" : dayNumber === 5 ? "medium" : "recovery",
      name: dayNumber <= 5 ? `Workout Day ${dayNumber}` : dayNumber === 6 ? "Active Recovery" : "Rest",
      exercises: [],
    };
  });
}

function getPreferredControlDays(limit, preferredDays) {
  const normalizedLimit = clamp(safeNumber(limit, 3), 2, 4);
  const preferred = Array.from(new Set((preferredDays ?? []).map(Number)))
    .filter((day) => day >= 1 && day <= 7)
    .sort((left, right) => left - right);
  const selected = [];

  function hasAdjacent(day) {
    return selected.some((item) => Math.abs(item - day) === 1);
  }

  for (const day of preferred) {
    if (selected.length >= normalizedLimit) {
      break;
    }
    if (!hasAdjacent(day)) {
      selected.push(day);
    }
  }

  for (let day = 1; day <= 7; day += 1) {
    if (selected.length >= normalizedLimit) {
      break;
    }
    if (!hasAdjacent(day)) {
      selected.push(day);
    }
  }

  return selected.sort((left, right) => left - right);
}

function getCardioDays(frequency) {
  const normalized = clamp(safeNumber(frequency, 3), 1, 6);
  const patterns = {
    1: [6],
    2: [3, 6],
    3: [2, 4, 6],
    4: [1, 3, 5, 6],
    5: [1, 2, 4, 5, 6],
    6: [1, 2, 3, 4, 5, 6],
  };
  return patterns[normalized];
}

function getRequiredTaskIds(day) {
  const required = ["kegels"];
  if (day.type === "workout") {
    required.unshift("workout");
  }
  if (day.cardioScheduled) {
    required.push("cardio");
  }
  if (day.controlScheduled) {
    required.push("control");
  }
  return required;
}

function getCompletionPercent(day, log) {
  const required = getRequiredTaskIds(day);
  const tasks = log?.tasks ?? {};
  const done = required.filter((taskId) => Boolean(tasks[taskId])).length;
  return required.length ? Math.round((done / required.length) * 100) : 0;
}

function previousDayOverloaded(previousDay, previousLog) {
  if (!previousDay || !previousLog) {
    return false;
  }
  const hadWorkout = previousDay.type === "workout" && previousLog.tasks?.workout;
  const hadCardio = previousDay.cardioScheduled && previousLog.tasks?.cardio;
  return Boolean(hadWorkout && hadCardio);
}

function previousDayMissedCritical(previousDay, previousLog) {
  if (!previousDay || !previousLog) {
    return false;
  }
  if (previousDay.type === "workout" && !previousLog.tasks?.workout) {
    return true;
  }
  return !previousLog.tasks?.kegels;
}

function intensityRank(intensity) {
  if (intensity === "high") {
    return 3;
  }
  if (intensity === "medium") {
    return 2;
  }
  if (intensity === "low") {
    return 1;
  }
  return 0;
}

function cloneWorkoutFromDay(day) {
  return {
    type: "workout",
    intensity: day.intensity,
    name: day.name,
    exercises: day.exercises.map((exercise) => ({ ...exercise })),
  };
}

function formatControlReason({ scheduled, used, limit, blockedByConsecutive }) {
  if (!scheduled) {
    return "Not scheduled today.";
  }
  if (blockedByConsecutive) {
    return "Skip: no control training on consecutive days.";
  }
  if (used >= limit) {
    return "Skip: weekly control limit reached.";
  }
  return "Do: session is within weekly rules.";
}

export function createAdaptiveWeekPlan({ referenceDate, userSettings, workoutPlans, dailyLogs }) {
  const weekDates = getWeekDates(referenceDate);
  const todayKey = formatDateKey(referenceDate);
  const baseDays = normalizePlanDays(workoutPlans);
  const cardioDays = getCardioDays(userSettings.cardioFrequency);
  const controlDays = getPreferredControlDays(userSettings.controlLimit, userSettings.controlPreferredDays);
  const carryQueue = [];
  const outputDays = [];
  let intenseStreak = 0;

  for (let index = 0; index < weekDates.length; index += 1) {
    const date = weekDates[index];
    const dayNumber = index + 1;
    const base = baseDays[index];
    const dateKey = formatDateKey(date);
    const isPast = dateKey < todayKey;
    const day = {
      dateKey,
      dayNumber,
      label: dayLabel(date),
      type: base.type,
      intensity: base.intensity,
      name: base.name,
      exercises: base.exercises.map((exercise) => ({ ...exercise })),
      cardioScheduled: cardioDays.includes(dayNumber) || base.type === "recovery",
      controlScheduled: controlDays.includes(dayNumber),
      adjustments: [],
      mode: "Normal",
      priority: "Medium",
      status: "planned",
    };

    if (!isPast && carryQueue.length > 0 && day.type !== "rest") {
      const incoming = carryQueue.shift();
      if (day.type === "workout") {
        carryQueue.unshift(cloneWorkoutFromDay(day));
      }
      day.type = incoming.type;
      day.intensity = incoming.intensity;
      day.name = incoming.name;
      day.exercises = incoming.exercises.map((exercise) => ({ ...exercise }));
      day.adjustments.push("Workout shifted forward from missed day.");
    }

    const previous = outputDays[index - 1];
    const previousDateKey = previous?.dateKey ?? formatDateKey(addDays(date, -1));
    const previousLog = dailyLogs[previousDateKey];
    const previousSleep = safeNumber(previousLog?.sleepHours, 0);
    const overloadedYesterday = previousDayOverloaded(previous, previousLog);
    const missedYesterday = previousDayMissedCritical(previous, previousLog);

    if (!isPast && day.type === "workout" && previousSleep > 0 && previousSleep < 6) {
      day.intensity = "low";
      day.mode = "Adjusted";
      day.adjustments.push("Sleep below 6h yesterday. Reduced to light intensity.");
    }

    if (!isPast && day.type === "workout" && (missedYesterday || overloadedYesterday)) {
      if (intensityRank(day.intensity) > 1) {
        day.intensity = "low";
      }
      day.cardioScheduled = true;
      day.mode = "Adjusted";
      day.adjustments.push("Compensation mode due to missed or overloaded previous day.");
    }

    if (!isPast && day.type === "workout" && intenseStreak >= 2 && intensityRank(day.intensity) >= 2) {
      carryQueue.unshift(cloneWorkoutFromDay(day));
      day.type = "recovery";
      day.intensity = "recovery";
      day.name = "Forced Recovery / Cardio";
      day.exercises = [];
      day.cardioScheduled = true;
      day.mode = "Recovery";
      day.adjustments.push("Two intense days back-to-back. Recovery forced.");
    }

    const log = dailyLogs[dateKey];
    const workoutMissed = day.type === "workout" && isPast && !Boolean(log?.tasks?.workout);
    if (workoutMissed) {
      carryQueue.push(cloneWorkoutFromDay(day));
    }

    if (day.type === "workout" && intensityRank(day.intensity) >= 2) {
      intenseStreak += 1;
    } else {
      intenseStreak = 0;
    }

    const completionPercent = getCompletionPercent(day, log);
    if (isPast) {
      if (completionPercent >= 75) {
        day.status = "good";
      } else if (workoutMissed) {
        day.status = "missed";
      } else {
        day.status = "adjusted";
      }
    } else if (dateKey === todayKey) {
      day.status = day.mode === "Normal" ? "planned" : "adjusted";
    } else {
      day.status = day.mode === "Normal" ? "planned" : "adjusted";
    }

    outputDays.push(day);
  }

  const pastDays = outputDays.filter((day) => day.dateKey < todayKey);
  const pastCompletionAvg =
    pastDays.length > 0
      ? pastDays.reduce((sum, day) => sum + getCompletionPercent(day, dailyLogs[day.dateKey]), 0) / pastDays.length
      : 100;

  return {
    weekStartKey: formatDateKey(startOfWeekMonday(referenceDate)),
    cardioDays,
    controlDays,
    days: outputDays.map((day) => {
      if (day.type !== "workout" || day.mode === "Recovery") {
        return {
          ...day,
          priority: "Recovery",
        };
      }
      if (day.mode === "Adjusted" || pastCompletionAvg < 65) {
        return {
          ...day,
          priority: "High",
        };
      }
      return {
        ...day,
        priority: "Medium",
      };
    }),
  };
}

export function getTodayPlan(weekPlan, referenceDate) {
  const dateKey = formatDateKey(referenceDate);
  return weekPlan.days.find((day) => day.dateKey === dateKey) ?? null;
}

export function getControlRecommendation({ referenceDate, weekPlan, dailyLogs, controlLimit }) {
  const todayKey = formatDateKey(referenceDate);
  const day = weekPlan.days.find((item) => item.dateKey === todayKey);
  const weekKeys = weekPlan.days.map((item) => item.dateKey);
  const used = weekKeys.filter((dateKey) => Boolean(dailyLogs[dateKey]?.tasks?.control)).length;
  const todayDone = Boolean(dailyLogs[todayKey]?.tasks?.control);
  const yesterdayKey = formatDateKey(addDays(referenceDate, -1));
  const yesterdayDone = Boolean(dailyLogs[yesterdayKey]?.tasks?.control);
  const usedWithoutToday = used - (todayDone ? 1 : 0);
  const scheduled = Boolean(day?.controlScheduled);
  const blockedByConsecutive = scheduled && !todayDone && yesterdayDone;
  const canDo = scheduled && !blockedByConsecutive && (todayDone || usedWithoutToday < controlLimit);

  return {
    scheduled,
    used,
    limit: controlLimit,
    recommended: canDo ? "Do" : "Skip",
    reason: formatControlReason({
      scheduled,
      used: usedWithoutToday,
      limit: controlLimit,
      blockedByConsecutive,
    }),
    canToggleOn: canDo || todayDone,
  };
}

export function buildDashboardTasks({ todayPlan, todayLog, controlRecommendation, taskLibrary }) {
  if (!todayPlan) {
    return [];
  }

  const tasks = [
    {
      id: "workout",
      title: "Workout",
      checked: Boolean(todayLog?.tasks?.workout),
      scheduled: todayPlan.type === "workout",
      instruction: taskLibrary.workout.short,
      details: taskLibrary.workout.details,
      disabled: todayPlan.type !== "workout",
      status: todayPlan.status,
    },
    {
      id: "cardio",
      title: "Cardio",
      checked: Boolean(todayLog?.tasks?.cardio),
      scheduled: todayPlan.cardioScheduled,
      instruction: taskLibrary.cardio.short,
      details: taskLibrary.cardio.details,
      disabled: !todayPlan.cardioScheduled,
      status: todayPlan.status,
    },
    {
      id: "kegels",
      title: "Kegels",
      checked: Boolean(todayLog?.tasks?.kegels),
      scheduled: true,
      instruction: taskLibrary.kegels.short,
      details: taskLibrary.kegels.details,
      disabled: false,
      status: todayPlan.status,
    },
    {
      id: "control",
      title: "Control Training",
      checked: Boolean(todayLog?.tasks?.control),
      scheduled: controlRecommendation.scheduled,
      instruction: taskLibrary.control.short,
      details: taskLibrary.control.details,
      disabled: !controlRecommendation.canToggleOn,
      status: controlRecommendation.canToggleOn ? todayPlan.status : "adjusted",
      meta: `Recommended: ${controlRecommendation.recommended}`,
    },
  ];

  return tasks;
}

export function getTodayStatus({ todayPlan, todayLog, controlRecommendation }) {
  if (!todayPlan) {
    return {
      completionPercent: 0,
      mode: "Normal",
      controlUsedLabel: `${controlRecommendation.used}/${controlRecommendation.limit}`,
    };
  }

  const completionPercent = getCompletionPercent(todayPlan, todayLog);
  const mode = todayPlan.type === "recovery" || todayPlan.type === "rest" ? "Recovery" : todayPlan.mode;

  return {
    completionPercent,
    mode,
    controlUsedLabel: `${controlRecommendation.used}/${controlRecommendation.limit}`,
  };
}

export function getWeeklyWorkoutSeconds(referenceDate, sessionLogs) {
  const weekStart = startOfWeekMonday(referenceDate);
  const weekStartKey = formatDateKey(weekStart);
  const weekEndKey = formatDateKey(addDays(weekStart, 6));
  return sessionLogs
    .filter((item) => item.dateKey >= weekStartKey && item.dateKey <= weekEndKey)
    .reduce((sum, item) => sum + safeNumber(item.durationSec, 0), 0);
}

export function formatDuration(durationSec) {
  const totalSeconds = Math.max(0, Math.floor(safeNumber(durationSec, 0)));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function getWeeklyMetrics({ referenceDate, weekPlan, dailyLogs, sessionLogs, controlLimit }) {
  const completionByDay = weekPlan.days.map((day) => getCompletionPercent(day, dailyLogs[day.dateKey]));
  const completionPercent =
    completionByDay.length > 0
      ? Math.round(completionByDay.reduce((sum, value) => sum + value, 0) / completionByDay.length)
      : 0;

  const workoutDays = weekPlan.days.filter((day) => day.type === "workout");
  const completedWorkouts = workoutDays.filter((day) => Boolean(dailyLogs[day.dateKey]?.tasks?.workout)).length;
  const workoutConsistency =
    workoutDays.length > 0 ? Math.round((completedWorkouts / workoutDays.length) * 100) : 0;

  const controlUsed = weekPlan.days.filter((day) => Boolean(dailyLogs[day.dateKey]?.tasks?.control)).length;
  const sleepValues = weekPlan.days
    .map((day) => safeNumber(dailyLogs[day.dateKey]?.sleepHours, 0))
    .filter((value) => value > 0);
  const avgSleep =
    sleepValues.length > 0 ? Number((sleepValues.reduce((sum, value) => sum + value, 0) / sleepValues.length).toFixed(1)) : 0;

  const missedWorkouts = workoutDays.filter((day) => day.dateKey < formatDateKey(referenceDate) && !dailyLogs[day.dateKey]?.tasks?.workout)
    .length;

  const workoutSeconds = getWeeklyWorkoutSeconds(referenceDate, sessionLogs);
  const weeklyWorkoutHours = Number((workoutSeconds / 3600).toFixed(2));

  const sleepScore = clamp((avgSleep / 8) * 40, 0, 40);
  const completionScore = clamp((completionPercent / 100) * 35, 0, 35);
  const consistencyScore = clamp((workoutConsistency / 100) * 25, 0, 25);
  const recoveryScore = Math.round(clamp(sleepScore + completionScore + consistencyScore - missedWorkouts * 3, 0, 100));

  const todayKey = formatDateKey(referenceDate);
  let streak = 0;
  const orderedKeys = Object.keys(dailyLogs).sort();
  for (let index = orderedKeys.length - 1; index >= 0; index -= 1) {
    const dateKey = orderedKeys[index];
    if (dateKey > todayKey) {
      continue;
    }
    const log = dailyLogs[dateKey];
    const successful = Boolean(log?.tasks?.kegels) && (log?.tasks?.workout || log?.tasks?.cardio || log?.tasks?.control);
    if (!successful) {
      break;
    }
    streak += 1;
  }

  return {
    completionPercent,
    workoutConsistency,
    controlUsed,
    controlLimit,
    avgSleep,
    recoveryScore,
    missedWorkouts,
    weeklyWorkoutHours,
    streak,
  };
}

export function getSmartInsights({ metrics, lastWeekMetrics, controlRecommendation }) {
  const insights = [];

  if (metrics.avgSleep > 0 && metrics.avgSleep < 6.5) {
    insights.push("Low sleep reduced recovery score. Prioritize 7h+ for stronger sessions.");
  }

  if (metrics.missedWorkouts >= 2) {
    insights.push("Missed workouts triggered extra adjustments. Keep sessions shorter but non-negotiable.");
  }

  if (lastWeekMetrics && metrics.completionPercent > lastWeekMetrics.completionPercent) {
    insights.push("Consistency is improving versus last week. Keep the current execution rhythm.");
  } else if (metrics.workoutConsistency >= 75) {
    insights.push("Workout consistency is strong. Keep protecting recovery to sustain output.");
  }

  if (metrics.controlUsed >= metrics.controlLimit) {
    insights.push("Control frequency is at weekly cap. Skip additional sessions to avoid overload.");
  } else if (controlRecommendation.recommended === "Skip" && controlRecommendation.scheduled) {
    insights.push("Today's control recommendation is Skip due to rule protection (limit/consecutive guard).");
  }

  if (insights.length === 0) {
    insights.push("Execution is stable. Keep sleep and task completion tight for compounding gains.");
  }

  return insights.slice(0, 4);
}

export function getSmartEngineOutput({ dailyLogs, sessionLogs, userSettings }) {
  const referenceDate = new Date();
  const todayKey = formatDateKey(referenceDate);
  const recentWeekKeys = getRecentDateKeys(referenceDate, 7);
  const recentSleepKeys = getRecentDateKeys(referenceDate, 3);
  const recentWeekKeySet = new Set(recentWeekKeys);

  const targetSessionsPerWeek = clamp(safeNumber(userSettings?.cardioFrequency, 3) + 1, 3, 6);
  const completedSessions = countCompletedSessionsByDate(sessionLogs, recentWeekKeySet);
  const missedWorkouts = Math.max(0, targetSessionsPerWeek - completedSessions);
  const avgRecentSleep = averageSleepHoursByDate(dailyLogs, recentSleepKeys);

  const restrictions = [];
  const warnings = [];
  let todayFocus = "baseline";
  let recommendation = "Maintain the planned session with steady execution and clean technique.";

  if (avgRecentSleep > 0 && avgRecentSleep < 6.5) {
    todayFocus = "recovery";
    recommendation = "Shift to recovery focus today: low intensity, shorter duration, and mobility emphasis.";
    restrictions.push("No high-intensity session until sleep recovers above 6.5h average.");
    warnings.push("Low sleep detected in recent logs. Recovery capacity is reduced.");
  }

  if (missedWorkouts >= 2) {
    if (todayFocus !== "recovery") {
      todayFocus = "lighter_session";
      recommendation = "Use a lighter catch-up session today and rebuild consistency before increasing load.";
    }
    restrictions.push("Cap workout intensity to low/medium until missed sessions are recovered.");
    warnings.push("Multiple missed workouts detected. Avoid jumping directly to max effort.");
  }

  if (missedWorkouts === 0 && completedSessions >= targetSessionsPerWeek && avgRecentSleep >= 7) {
    todayFocus = "progressive_overload";
    recommendation = "Progressive overload is cleared: increase load slightly or add one controlled set.";
    restrictions.push("Increase workload gradually (5-10%) and preserve form quality.");
  }

  const sleepHours = safeNumber(dailyLogs?.[todayKey]?.sleepHours, 0);
  const diet = generateDiet({
    todayFocus,
    sleepHours,
  });

  return {
    todayFocus,
    recommendation,
    restrictions,
    warnings,
    diet,
  };
}

export function parseSetCount(value) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function getRelativeWeekSlice(referenceDate, weekPlan) {
  const todayKey = formatDateKey(referenceDate);
  const yesterdayKey = formatDateKey(addDays(referenceDate, -1));
  const tomorrowKey = formatDateKey(addDays(referenceDate, 1));

  const highlight = weekPlan.days.filter((day) =>
    [yesterdayKey, todayKey, tomorrowKey].includes(day.dateKey),
  );

  return {
    highlight,
    fullWeek: weekPlan.days,
  };
}

export function getLastWeekMetrics({ referenceDate, userSettings, workoutPlans, dailyLogs, sessionLogs }) {
  const lastWeekDate = addDays(referenceDate, -7);
  const lastWeekPlan = createAdaptiveWeekPlan({
    referenceDate: lastWeekDate,
    userSettings,
    workoutPlans,
    dailyLogs,
  });
  return getWeeklyMetrics({
    referenceDate: lastWeekDate,
    weekPlan: lastWeekPlan,
    dailyLogs,
    sessionLogs,
    controlLimit: userSettings.controlLimit,
  });
}

export function getWorkoutForDate(workoutPlans, referenceDate) {
  const dayNumber = getProtocolDayNumber(referenceDate);
  const days = normalizePlanDays(workoutPlans);
  return days.find((day) => day.dayNumber === dayNumber) ?? null;
}

export function normalizeDailyLogs(dailyLogs, createEmptyLog) {
  const normalized = {};
  for (const [dateKey, value] of Object.entries(dailyLogs ?? {})) {
    normalized[dateKey] = {
      ...createEmptyLog(),
      ...(value ?? {}),
      tasks: {
        ...createEmptyLog().tasks,
        ...(value?.tasks ?? {}),
      },
      advanced: {
        ...createEmptyLog().advanced,
        ...(value?.advanced ?? {}),
      },
      flags: {
        ...createEmptyLog().flags,
        ...(value?.flags ?? {}),
      },
    };
  }
  return normalized;
}

export function getTodayFocus({ todayPlan, controlRecommendation, weeklyMetrics, previousSleep }) {
  const workout = todayPlan?.type === "workout" ? todayPlan.name : todayPlan?.type === "recovery" ? "Recovery / Cardio" : "Rest";
  const cardio = todayPlan?.cardioScheduled ? "Yes" : "No";
  const control = controlRecommendation.recommended;

  let priority = todayPlan?.priority ?? "Medium";
  if ((previousSleep > 0 && previousSleep < 6) || todayPlan?.mode === "Recovery") {
    priority = "Recovery";
  } else if (weeklyMetrics.completionPercent < 65 || todayPlan?.mode === "Adjusted") {
    priority = "High";
  }

  return {
    workout,
    cardio,
    control,
    priority,
  };
}

export function createSessionRecord({ dateKey, durationSec, completionPercent, setProgress, exercises }) {
  return {
    id: `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    dateKey,
    createdAt: new Date().toISOString(),
    durationSec,
    completionPercent,
    setProgress,
    exercises,
  };
}
