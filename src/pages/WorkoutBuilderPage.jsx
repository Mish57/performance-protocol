import { useEffect, useState } from "react";
import { createExerciseTemplate } from "../lib/defaultData";
import { useAppState } from "../state/AppState";

function clonePlan(plan) {
  return {
    ...plan,
    days: plan.days.map((day) => ({
      ...day,
      exercises: day.exercises.map((exercise) => ({ ...exercise })),
    })),
  };
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function WorkoutBuilderPage() {
  const { workoutPlans, saveWorkoutPlans, resetWorkoutPlans } = useAppState();
  const [draft, setDraft] = useState(() => clonePlan(workoutPlans));

  useEffect(() => {
    setDraft(clonePlan(workoutPlans));
  }, [workoutPlans]);

  function updateDay(dayNumber, patch) {
    setDraft((previous) => ({
      ...previous,
      days: previous.days.map((day) =>
        day.dayNumber === dayNumber
          ? {
              ...day,
              ...patch,
            }
          : day,
      ),
    }));
  }

  function updateExercise(dayNumber, exerciseId, field, value) {
    setDraft((previous) => ({
      ...previous,
      days: previous.days.map((day) =>
        day.dayNumber === dayNumber
          ? {
              ...day,
              exercises: day.exercises.map((exercise) =>
                exercise.id === exerciseId
                  ? {
                      ...exercise,
                      [field]: value,
                    }
                  : exercise,
              ),
            }
          : day,
      ),
    }));
  }

  function addExercise(dayNumber) {
    setDraft((previous) => ({
      ...previous,
      days: previous.days.map((day) =>
        day.dayNumber === dayNumber
          ? {
              ...day,
              type: "workout",
              exercises: [...day.exercises, createExerciseTemplate()],
            }
          : day,
      ),
    }));
  }

  function removeExercise(dayNumber, exerciseId) {
    setDraft((previous) => ({
      ...previous,
      days: previous.days.map((day) =>
        day.dayNumber === dayNumber
          ? {
              ...day,
              exercises: day.exercises.filter((exercise) => exercise.id !== exerciseId),
            }
          : day,
      ),
    }));
  }

  function addWorkoutDay() {
    const target = draft.days.find((day) => day.type !== "workout");
    if (!target) {
      return;
    }
    updateDay(target.dayNumber, {
      type: "workout",
      intensity: "medium",
      name: target.name === "Rest" ? "Custom Workout Day" : target.name,
      exercises: target.exercises.length > 0 ? target.exercises : [createExerciseTemplate()],
    });
  }

  function saveDraft() {
    saveWorkoutPlans(draft);
  }

  function resetDraft() {
    setDraft(clonePlan(workoutPlans));
  }

  return (
    <div className="space-y-5">
      <section className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl tracking-tight text-protocol-ink">Workout Builder</h1>
          <p className="mt-1 text-sm text-protocol-muted">Edit day plans, muscle groups, and exercise structure.</p>
        </div>
        <button
          type="button"
          onClick={addWorkoutDay}
          className="rounded-xl border border-protocol-line bg-protocol-bgElevated px-3 py-2 text-xs font-semibold uppercase tracking-wide text-protocol-primary"
        >
          Add Workout Day
        </button>
      </section>

      <section className="space-y-3.5">
        {draft.days.map((day) => (
          <article key={day.dayNumber} className="rounded-2xl border border-protocol-line bg-protocol-card p-4 shadow-card">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-protocol-muted">{DAY_LABELS[day.dayNumber - 1]}</p>
            <div className="mt-2.5 grid grid-cols-12 gap-2">
              <select
                value={day.type}
                onChange={(event) =>
                  updateDay(day.dayNumber, {
                    type: event.target.value,
                    intensity: event.target.value === "workout" ? day.intensity : "recovery",
                  })
                }
                className="col-span-4 rounded-lg border border-protocol-line bg-protocol-bgElevated px-2 py-1.5 text-sm text-protocol-ink outline-none ring-protocol-primary focus:ring-2"
              >
                <option value="workout">Workout</option>
                <option value="recovery">Recovery</option>
                <option value="rest">Rest</option>
              </select>
              <select
                value={day.intensity}
                disabled={day.type !== "workout"}
                onChange={(event) => updateDay(day.dayNumber, { intensity: event.target.value })}
                className="col-span-3 rounded-lg border border-protocol-line bg-protocol-bgElevated px-2 py-1.5 text-sm text-protocol-ink outline-none ring-protocol-primary focus:ring-2 disabled:bg-protocol-surface disabled:text-protocol-muted"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="recovery">Recovery</option>
              </select>
              <input
                value={day.name}
                onChange={(event) => updateDay(day.dayNumber, { name: event.target.value })}
                className="col-span-5 rounded-lg border border-protocol-line bg-protocol-bgElevated px-2 py-1.5 text-sm text-protocol-ink outline-none ring-protocol-primary focus:ring-2"
                placeholder="Workout name"
              />
            </div>

            {day.type === "workout" ? (
              <div className="mt-3.5 space-y-2.5">
                {day.exercises.map((exercise) => (
                  <div key={exercise.id} className="rounded-xl border border-protocol-line bg-protocol-surface p-3">
                    <div className="grid grid-cols-12 gap-2">
                      <input
                        value={exercise.name}
                        onChange={(event) => updateExercise(day.dayNumber, exercise.id, "name", event.target.value)}
                        className="col-span-12 rounded-lg border border-protocol-line bg-protocol-bgElevated px-2 py-1.5 text-sm text-protocol-ink outline-none ring-protocol-primary focus:ring-2"
                        placeholder="Exercise name"
                      />
                      <input
                        value={exercise.sets}
                        onChange={(event) => updateExercise(day.dayNumber, exercise.id, "sets", event.target.value)}
                        className="col-span-3 rounded-lg border border-protocol-line bg-protocol-bgElevated px-2 py-1.5 text-sm text-protocol-ink outline-none ring-protocol-primary focus:ring-2"
                        placeholder="Sets"
                      />
                      <input
                        value={exercise.reps}
                        onChange={(event) => updateExercise(day.dayNumber, exercise.id, "reps", event.target.value)}
                        className="col-span-3 rounded-lg border border-protocol-line bg-protocol-bgElevated px-2 py-1.5 text-sm text-protocol-ink outline-none ring-protocol-primary focus:ring-2"
                        placeholder="Reps"
                      />
                      <input
                        value={exercise.notes}
                        onChange={(event) => updateExercise(day.dayNumber, exercise.id, "notes", event.target.value)}
                        className="col-span-6 rounded-lg border border-protocol-line bg-protocol-bgElevated px-2 py-1.5 text-sm text-protocol-ink outline-none ring-protocol-primary focus:ring-2"
                        placeholder="Notes"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExercise(day.dayNumber, exercise.id)}
                      className="mt-2 text-xs font-semibold uppercase tracking-wide text-protocol-dangerInk"
                    >
                      Remove exercise
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addExercise(day.dayNumber)}
                  className="w-full rounded-lg border border-dashed border-protocol-line bg-protocol-bgElevated px-3 py-2 text-sm font-semibold text-protocol-primary"
                >
                  Add Exercise
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </section>

      <section className="grid grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={saveDraft}
          className="rounded-xl bg-protocol-primary px-3 py-2 text-sm font-semibold text-white"
        >
          Save
        </button>
        <button
          type="button"
          onClick={resetDraft}
          className="rounded-xl border border-protocol-line bg-protocol-bgElevated px-3 py-2 text-sm font-semibold text-protocol-ink"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={resetWorkoutPlans}
          className="rounded-xl border border-protocol-line bg-protocol-bgElevated px-3 py-2 text-sm font-semibold text-protocol-dangerInk"
        >
          Default
        </button>
      </section>
    </div>
  );
}