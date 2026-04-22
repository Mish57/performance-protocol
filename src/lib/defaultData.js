function createExercise(id, name, sets, reps, notes = "") {
  return { id, name, sets, reps, notes };
}

export const QUICK_SLEEP_OPTIONS = [5, 6, 7, 8];

export const TASK_LIBRARY = {
  workout: {
    short: "Complete today's planned training block.",
    details: [
      "Warm up for 5-8 minutes before your first working set.",
      "Move with controlled tempo and avoid ego loading.",
      "Stop 1-2 reps before failure on most sets.",
    ],
  },
  cardio: {
    short: "15-20 min run or brisk walk.",
    details: [
      "Keep effort at a conversational pace.",
      "Focus on steady breathing and upright posture.",
      "If fatigued, choose walking over running.",
    ],
  },
  kegels: {
    short: "15 reps x 3 sets (5s hold / 5s relax).",
    details: [
      "Tighten pelvic floor as if stopping urine flow.",
      "Hold 5 seconds, then relax for 5 seconds.",
      "Keep abs and glutes relaxed while contracting.",
    ],
  },
  control: {
    short: "Structured session only if recommended.",
    details: [
      "No porn.",
      "Stop at 60-70% arousal, then wait 20-30 seconds.",
      "Repeat 3-4 control cycles before finishing.",
    ],
  },
};

export function createDefaultUserSettings() {
  return {
    sleepTarget: "00:45",
    cardioFrequency: 3,
    controlLimit: 3,
    controlPreferredDays: [2, 5, 7],
    darkMode: false,
    focusMode: false,
    notificationsEnabled: false,
    kegelReminderTime: "10:00",
    sleepReminderTime: "00:30",
  };
}

export function createDefaultWorkoutPlans() {
  return {
    days: [
      {
        dayNumber: 1,
        type: "workout",
        intensity: "high",
        name: "Chest + Triceps",
        exercises: [
          createExercise("bench-press", "Bench Press", "4", "6-10"),
          createExercise("push-ups", "Push-Ups", "3", "10-15"),
          createExercise("triceps-dips", "Triceps Dips", "3", "10-12"),
        ],
      },
      {
        dayNumber: 2,
        type: "workout",
        intensity: "high",
        name: "Back + Biceps",
        exercises: [
          createExercise("pull-ups", "Pull-Ups", "4", "5-8"),
          createExercise("rows", "Rows", "4", "8-12"),
          createExercise("curls", "Dumbbell Curls", "3", "10-12"),
        ],
      },
      {
        dayNumber: 3,
        type: "workout",
        intensity: "high",
        name: "Legs",
        exercises: [
          createExercise("squats", "Squats", "4", "6-10"),
          createExercise("lunges", "Lunges", "3", "10/leg"),
          createExercise("leg-press", "Leg Press", "3", "10-12"),
        ],
      },
      {
        dayNumber: 4,
        type: "workout",
        intensity: "high",
        name: "Shoulders + Core",
        exercises: [
          createExercise("shoulder-press", "Shoulder Press", "4", "6-10"),
          createExercise("lateral-raises", "Lateral Raises", "3", "12-15"),
          createExercise("plank", "Plank", "3", "30-60 sec"),
        ],
      },
      {
        dayNumber: 5,
        type: "workout",
        intensity: "medium",
        name: "Optional Repeat / Light",
        exercises: [
          createExercise("incline-db", "Incline Dumbbell Press", "3", "10-12"),
          createExercise("goblet-squat", "Goblet Squat", "3", "10-12"),
          createExercise("farmer-carry", "Farmer Carry", "3", "30 sec"),
        ],
      },
      {
        dayNumber: 6,
        type: "recovery",
        intensity: "recovery",
        name: "Active Recovery / Cardio",
        exercises: [createExercise("brisk-walk", "Brisk Walk", "1", "20 min", "Easy pace")],
      },
      {
        dayNumber: 7,
        type: "rest",
        intensity: "recovery",
        name: "Rest",
        exercises: [],
      },
    ],
  };
}

export function createDefaultDailyLog() {
  return {
    sleepHours: null,
    diet: {
      breakfast: false,
      lunch: false,
      dinner: false,
    },
    tasks: {
      workout: false,
      cardio: false,
      kegels: false,
      control: false,
    },
    advanced: {
      controlSuccess: 3,
      erectionQuality: 3,
      durationEstimate: "",
    },
    flags: {
      bedtimeComplete: false,
    },
  };
}

export function createDefaultSessionLogs() {
  return [];
}

export function createExerciseTemplate() {
  return {
    id: `exercise-${Math.random().toString(36).slice(2, 10)}`,
    name: "",
    sets: "3",
    reps: "10",
    notes: "",
  };
}
