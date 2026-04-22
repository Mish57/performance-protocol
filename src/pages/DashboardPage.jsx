import CompactTaskCard from "../components/CompactTaskCard";
import QuickLogCard from "../components/QuickLogCard";
import TodayFocusCard from "../components/TodayFocusCard";
import TodayStatusCard from "../components/TodayStatusCard";
import WeekPeekCard from "../components/WeekPeekCard";
import { formatReadableDate } from "../lib/date";
import { getSmartEngineOutput } from "../lib/smartEngine";
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
    weekSlice,
    dailyLogs,
    sessionLogs,
    userSettings,
  } = useAppState();
  const smartOutput = getSmartEngineOutput({ dailyLogs, sessionLogs, userSettings });
  const diet = smartOutput.diet;

  return (
    <div className="space-y-5">
      <section>
        <p className="text-sm text-protocol-muted">{formatReadableDate(now)}</p>
        <h1 className="mt-1 font-heading text-3xl tracking-tight text-protocol-ink">Dashboard</h1>
      </section>

      <TodayFocusCard focus={todayFocus} />
      <TodayStatusCard status={todayStatus} />

      <section className="rounded-2xl border border-protocol-line bg-protocol-card p-5 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-wide text-protocol-muted">Control Recommendation</p>
        <p className="mt-2 text-sm text-protocol-ink">{controlRecommendation.reason}</p>
      </section>

      <section className="rounded-2xl border border-protocol-line bg-protocol-card p-5 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-wide text-protocol-muted">Diet</p>
        <div className="mt-3 grid grid-cols-2 gap-2.5 text-sm">
          <p className="rounded-xl border border-protocol-line bg-protocol-surface px-3 py-2 text-protocol-ink">Calories: {diet.calories}</p>
          <p className="rounded-xl border border-protocol-line bg-protocol-surface px-3 py-2 text-protocol-ink">Protein: {diet.protein}g</p>
          <p className="rounded-xl border border-protocol-line bg-protocol-surface px-3 py-2 text-protocol-ink">Carbs: {diet.carbs}g</p>
          <p className="rounded-xl border border-protocol-line bg-protocol-surface px-3 py-2 text-protocol-ink">Fats: {diet.fats}g</p>
        </div>
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