import { useAppState } from "../state/AppState";

function StatCard({ label, value, tone = "default" }) {
  const toneClass =
    tone === "good"
      ? "border-protocol-positiveBg bg-protocol-positiveBg"
      : tone === "adjusted"
        ? "border-protocol-warningBg bg-protocol-warningBg"
        : "border-protocol-line bg-protocol-surface";

  return (
    <div className={`rounded-xl border p-3.5 ${toneClass}`}>
      <p className="text-xs uppercase tracking-wide text-protocol-muted">{label}</p>
      <p className="mt-1 font-heading text-xl tracking-tight text-protocol-ink">{value}</p>
    </div>
  );
}

export default function ProgressPage() {
  const { weeklyMetrics, insights } = useAppState();

  return (
    <div className="space-y-5">
      <section>
        <h1 className="font-heading text-3xl tracking-tight text-protocol-ink">Insights</h1>
        <p className="mt-1 text-sm text-protocol-muted">Performance trends and smart recommendations.</p>
      </section>

      <section className="grid grid-cols-2 gap-2.5">
        <StatCard label="Weekly completion" value={`${weeklyMetrics.completionPercent}%`} tone="good" />
        <StatCard label="Workout consistency" value={`${weeklyMetrics.workoutConsistency}%`} tone="good" />
        <StatCard
          label="Control sessions used"
          value={`${weeklyMetrics.controlUsed}/${weeklyMetrics.controlLimit}`}
          tone="adjusted"
        />
        <StatCard label="Avg sleep" value={`${weeklyMetrics.avgSleep}h`} />
        <StatCard label="Recovery score" value={`${weeklyMetrics.recoveryScore}/100`} tone="adjusted" />
        <StatCard label="This week workout time" value={`${weeklyMetrics.weeklyWorkoutHours}h`} />
        <StatCard label="Streak" value={`${weeklyMetrics.streak} day`} tone="good" />
      </section>

      <section className="rounded-2xl border border-protocol-line bg-protocol-card p-5 shadow-card">
        <h2 className="font-heading text-xl tracking-tight text-protocol-ink">Smart Insight Engine</h2>
        <div className="mt-3 space-y-2.5">
          {insights.map((insight) => (
            <p key={insight} className="rounded-xl border border-protocol-line bg-protocol-surface px-3 py-2 text-sm text-protocol-ink">
              {insight}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}