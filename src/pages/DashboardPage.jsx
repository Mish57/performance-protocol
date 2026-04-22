import CompactTaskCard from "../components/CompactTaskCard";
import QuickLogCard from "../components/QuickLogCard";
import TodayFocusCard from "../components/TodayFocusCard";
import TodayStatusCard from "../components/TodayStatusCard";
import WeekPeekCard from "../components/WeekPeekCard";
import { formatReadableDate } from "../lib/date";
import { formatDuration, getSmartEngineOutput } from "../lib/smartEngine";
import { useAppState } from "../state/AppState";

export default function DashboardPage() {
  const {
    now,
    todayTasks,
    todayFocus,
    todayStatus,
    controlRecommendation,
    todayLog,
    toggleTodayTask,
    setTodaySleepHours,
    setAdvancedTodayField,
    toggleDietMeal,
    dietScore,
    dietFeedback,
    adaptiveMode,
    adaptiveBanner,
    aiCoachMessage,
    streakCount,
    shouldBoostProteinTomorrow,
    weekSlice,
    dailyLogs,
    sessionLogs,
    userSettings,
    actionableInsights,
    progressPrediction,
    showWorkoutNudge,
    workoutTimerState,
  } = useAppState();
  const smartOutput = getSmartEngineOutput({
    dailyLogs,
    sessionLogs,
    userSettings,
    referenceDate: now,
    adaptiveMode,
    dietScore,
    proteinBoost: shouldBoostProteinTomorrow,
  });
  const diet = smartOutput.diet;
  const modeToneClass =
    adaptiveBanner.tone === "success"
      ? "bg-protocol-positiveBg text-protocol-positiveInk"
      : adaptiveBanner.tone === "warning"
        ? "bg-protocol-warningBg text-protocol-warningInk"
        : "bg-protocol-neutralBg text-protocol-neutralInk";

  if (userSettings.focusMode) {
    return (
      <div className="space-y-4">
        <section>
          <p className="text-sm text-protocol-muted">{formatReadableDate(now)}</p>
          <h1 className="mt-1 font-heading text-3xl tracking-tight text-protocol-ink">Focus Mode</h1>
        </section>
        <section className="ui-card p-4">
          <p className="text-xs uppercase tracking-wide text-protocol-muted">Timer</p>
          <p className="mt-1 font-heading text-3xl tracking-tight text-protocol-ink">
            {formatDuration(Math.floor((workoutTimerState?.elapsedTime ?? 0) / 1000))}
          </p>
        </section>
        {showWorkoutNudge ? (
          <section className="ui-card p-4">
            <p className="text-sm font-semibold text-protocol-warningInk">
              Reminder: no workout logged yet this evening. Start a short session now.
            </p>
          </section>
        ) : null}
        <section className="space-y-3">
          <h2 className="font-heading text-2xl tracking-tight text-protocol-ink">Main Tasks</h2>
          {todayTasks.map((task) => (
            <CompactTaskCard key={task.id} task={task} onToggle={toggleTodayTask} />
          ))}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section>
        <p className="text-sm text-protocol-muted">{formatReadableDate(now)}</p>
        <h1 className="mt-1 font-heading text-3xl tracking-tight text-protocol-ink">Dashboard</h1>
      </section>

      <section className="ui-card p-4">
        <div className="flex items-center justify-between gap-3">
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${modeToneClass}`}>
            {adaptiveBanner.title}
          </span>
          <p className="text-sm font-semibold text-protocol-ink">{"\uD83D\uDD25"} {streakCount} Day Streak</p>
        </div>
        <p className="mt-2 text-sm text-protocol-ink">{adaptiveBanner.message}</p>
        <p className="mt-2 text-sm font-semibold text-protocol-primary">AI Coach: {aiCoachMessage}</p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-protocol-muted">
          Progress Prediction: {progressPrediction}
        </p>
      </section>
      {showWorkoutNudge ? (
        <section className="ui-card p-4">
          <p className="text-sm font-semibold text-protocol-warningInk">
            Reminder: no workout logged yet this evening. Start a short session now.
          </p>
        </section>
      ) : null}
      <section className="ui-card p-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-protocol-muted">Smart Insights</p>
        <div className="mt-2 space-y-2">
          {actionableInsights.map((item) => (
            <p key={item} className="ui-surface px-3 py-2 text-sm text-protocol-ink">
              {item}
            </p>
          ))}
        </div>
      </section>

      <TodayFocusCard focus={todayFocus} />
      <TodayStatusCard status={todayStatus} />

      <section className="ui-card p-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-protocol-muted">Control Recommendation</p>
        <p className="mt-2 text-sm text-protocol-ink">{controlRecommendation.reason}</p>
      </section>

      <section id="diet-section" className="ui-card p-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-protocol-muted">Diet</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { id: "breakfast", label: "Breakfast" },
            { id: "lunch", label: "Lunch" },
            { id: "dinner", label: "Dinner" },
          ].map((meal) => {
            const checked = Boolean(todayLog.diet?.[meal.id]);
            return (
              <label key={meal.id} className="ui-surface flex items-center justify-between px-3 py-2 text-sm">
                <span className="font-semibold text-protocol-ink">{meal.label}</span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => toggleDietMeal(meal.id, event.target.checked)}
                  className="h-4 w-4 rounded border-protocol-line bg-protocol-bgElevated"
                />
              </label>
            );
          })}
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm">
            <p className="font-semibold text-protocol-ink">Diet score</p>
            <p className="font-semibold text-protocol-primary">{dietScore}%</p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-protocol-neutralBg">
            <div
              className="progress-fill h-full bg-gradient-to-r from-protocol-primaryStart to-protocol-primaryEnd"
              style={{ width: `${dietScore}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-protocol-muted">{dietFeedback}</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2.5 text-sm">
          <p className="ui-surface px-3 py-2 text-protocol-ink">Calories: {diet.calories}</p>
          <p className="ui-surface px-3 py-2 text-protocol-ink">Protein: {diet.protein}g</p>
          <p className="ui-surface px-3 py-2 text-protocol-ink">Carbs: {diet.carbs}g</p>
          <p className="ui-surface px-3 py-2 text-protocol-ink">Fats: {diet.fats}g</p>
        </div>
        {shouldBoostProteinTomorrow ? (
          <p className="mt-2 text-xs font-semibold text-protocol-warningInk">
            Protein target is boosted today because yesterday's diet score was below 50%.
          </p>
        ) : null}
        <div className="mt-3 space-y-1.5">
          {diet.meals.map((meal) => (
            <p key={meal.name} className="text-xs text-protocol-muted">
              {meal.name}: {meal.focus}
            </p>
          ))}
        </div>
      </section>

      <QuickLogCard
        sleepHours={todayLog.sleepHours}
        workoutDone={Boolean(todayLog.tasks.workout)}
        onSetSleep={setTodaySleepHours}
        onToggleWorkout={(value) => toggleTodayTask("workout", value)}
        advanced={todayLog.advanced}
        onAdvancedChange={setAdvancedTodayField}
      />

      <section className="space-y-3">
        <h2 className="font-heading text-2xl tracking-tight text-protocol-ink">Main Tasks</h2>
        {todayTasks.map((task) => (
          <CompactTaskCard key={task.id} task={task} onToggle={toggleTodayTask} />
        ))}
      </section>

      <WeekPeekCard weekSlice={weekSlice} />
    </div>
  );
}
