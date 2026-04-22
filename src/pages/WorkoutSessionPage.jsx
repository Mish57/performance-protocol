import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTimer } from "../hooks/useTimer";
import { formatDuration, parseSetCount } from "../lib/smartEngine";
import { useAppState } from "../state/AppState";

function createSetProgress(exercises) {
  const progress = {};
  for (const exercise of exercises) {
    const setCount = parseSetCount(exercise.sets);
    progress[exercise.id] = Array.from({ length: setCount }, () => false);
  }
  return progress;
}

function calculateCompletion(setProgress) {
  const allSets = Object.values(setProgress).flat();
  if (allSets.length === 0) {
    return 0;
  }
  const completed = allSets.filter(Boolean).length;
  return Math.round((completed / allSets.length) * 100);
}

export default function WorkoutSessionPage() {
  const { todayPlan, saveWorkoutSession, weeklyMetrics } = useAppState();
  const exercises = todayPlan?.type === "workout" ? todayPlan.exercises : [];
  const planIdentity = `${todayPlan?.dateKey ?? "none"}:${todayPlan?.name ?? "workout"}:${exercises.length}`;
  const timerStorageKey = `workoutSessionTimer:${todayPlan?.dateKey ?? "none"}:${todayPlan?.name ?? "workout"}`;
  const timer = useTimer(timerStorageKey);
  const [setProgress, setSetProgress] = useState(() => createSetProgress(exercises));
  const [saved, setSaved] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [finalDurationSec, setFinalDurationSec] = useState(null);
  const previousPlanKeyRef = useRef(planIdentity);

  useEffect(() => {
    const currentPlanKey = planIdentity;
    const previousPlanKey = previousPlanKeyRef.current;

    if (currentPlanKey !== previousPlanKey) {
      setSetProgress(createSetProgress(exercises));
      setSaved(false);
      setSessionEnded(false);
      setFinalDurationSec(null);
    }

    previousPlanKeyRef.current = currentPlanKey;
  }, [exercises, planIdentity]);

  const sessionState = sessionEnded
    ? "ended"
    : timer.isRunning
      ? "running"
      : timer.elapsedSec > 0
        ? "paused"
        : "idle";
  const elapsedSec = finalDurationSec ?? timer.elapsedSec;

  const completionPercent = useMemo(() => calculateCompletion(setProgress), [setProgress]);
  const totalWeeklyTime = weeklyMetrics.weeklyWorkoutHours.toFixed(2);

  function toggleSet(exerciseId, setIndex) {
    setSetProgress((previous) => ({
      ...previous,
      [exerciseId]: previous[exerciseId].map((value, index) => (index === setIndex ? !value : value)),
    }));
  }

  function startSession() {
    if (sessionEnded) {
      return;
    }
    if (sessionState === "idle" || sessionState === "paused") {
      timer.start();
    }
  }

  function pauseSession() {
    if (sessionState === "running") {
      timer.pause();
    }
  }

  function endSession() {
    if (saved || sessionState === "idle") {
      return;
    }

    const elapsedMs = timer.pause();
    const durationSec = Math.floor(elapsedMs / 1000);
    setFinalDurationSec(durationSec);
    setSessionEnded(true);

    saveWorkoutSession({
      durationSec,
      completionPercent,
      setProgress,
      exercises,
    });
    setSaved(true);
    timer.reset();
  }

  if (!todayPlan || todayPlan.type !== "workout") {
    return (
      <div className="space-y-5">
        <section>
          <h1 className="font-heading text-3xl tracking-tight text-protocol-ink">Workout Session</h1>
          <p className="mt-1 text-sm text-protocol-muted">No workout scheduled for today.</p>
        </section>

        <section className="rounded-2xl border border-protocol-line bg-protocol-card p-5 shadow-card">
          <p className="text-sm text-protocol-muted">Use recovery/cardio today or edit your split.</p>
          <Link to="/edit-workout" className="mt-3 inline-block text-sm font-semibold text-protocol-primary">
            Open Workout Builder
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="flex items-start justify-between gap-3">
        <h1 className="font-heading text-3xl tracking-tight text-protocol-ink">Workout Session</h1>
        <Link to="/edit-workout" className="text-xs font-semibold uppercase tracking-wide text-protocol-primary">
          Edit workout
        </Link>
      </section>
      <p className="-mt-3 text-sm text-protocol-muted">{todayPlan.name}</p>

      <section className="rounded-2xl border border-protocol-line bg-protocol-card p-5 shadow-card">
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-xl border border-protocol-line bg-protocol-surface p-3">
            <p className="text-xs uppercase tracking-wide text-protocol-muted">Timer</p>
            <p className="mt-1 font-heading text-xl tracking-tight text-protocol-ink">{formatDuration(elapsedSec)}</p>
          </div>
          <div className="rounded-xl border border-protocol-line bg-protocol-surface p-3">
            <p className="text-xs uppercase tracking-wide text-protocol-muted">Completion</p>
            <p className="mt-1 font-heading text-xl tracking-tight text-protocol-ink">{completionPercent}%</p>
          </div>
          <div className="rounded-xl border border-protocol-line bg-protocol-surface p-3">
            <p className="text-xs uppercase tracking-wide text-protocol-muted">This week</p>
            <p className="mt-1 font-heading text-xl tracking-tight text-protocol-ink">{totalWeeklyTime}h</p>
          </div>
        </div>

        <div className="mt-3.5 flex gap-2">
          <button
            type="button"
            onClick={startSession}
            className="flex-1 rounded-xl bg-protocol-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            disabled={sessionState === "running" || sessionState === "ended"}
          >
            {sessionState === "paused" ? "Resume" : "Start"}
          </button>
          <button
            type="button"
            onClick={pauseSession}
            className="flex-1 rounded-xl border border-protocol-line bg-protocol-bgElevated px-3 py-2 text-sm font-semibold text-protocol-ink disabled:opacity-50"
            disabled={sessionState !== "running"}
          >
            Pause
          </button>
          <button
            type="button"
            onClick={endSession}
            className="flex-1 rounded-xl border border-protocol-line bg-protocol-bgElevated px-3 py-2 text-sm font-semibold text-protocol-ink disabled:opacity-50"
            disabled={sessionState === "idle" || sessionState === "ended"}
          >
            End
          </button>
        </div>
      </section>

      <section className="space-y-3.5">
        {exercises.map((exercise) => (
          <article key={exercise.id} className="rounded-2xl border border-protocol-line bg-protocol-card p-4 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-heading text-base tracking-tight text-protocol-ink">{exercise.name}</h3>
              <p className="text-xs text-protocol-muted">
                {exercise.sets} x {exercise.reps}
              </p>
            </div>
            {exercise.notes ? <p className="mt-1.5 text-xs text-protocol-muted">{exercise.notes}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {(setProgress[exercise.id] ?? []).map((checked, index) => (
                <button
                  key={`${exercise.id}-${index}`}
                  type="button"
                  onClick={() => toggleSet(exercise.id, index)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                    checked
                      ? "border-protocol-positiveBg bg-protocol-positiveBg text-protocol-positiveInk"
                      : "border-protocol-line bg-protocol-surface text-protocol-neutralInk"
                  }`}
                >
                  Set {index + 1}
                </button>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}