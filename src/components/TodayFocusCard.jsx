function priorityClass(priority) {
  if (priority === "High") {
    return "bg-protocol-warningBg text-protocol-warningInk";
  }
  if (priority === "Recovery") {
    return "bg-protocol-neutralBg text-protocol-neutralInk";
  }
  return "bg-protocol-positiveBg text-protocol-positiveInk";
}

export default function TodayFocusCard({ focus }) {
  return (
    <section className="ui-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-heading text-xl tracking-tight text-protocol-ink">Today Focus</h2>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${priorityClass(focus.priority)}`}>{focus.priority}</span>
      </div>
      <div className="space-y-2.5 text-sm">
        <div className="flex items-center justify-between ui-surface px-3 py-2">
          <span className="text-protocol-muted">Workout</span>
          <span className="font-semibold text-protocol-ink">{focus.workout}</span>
        </div>
        <div className="flex items-center justify-between ui-surface px-3 py-2">
          <span className="text-protocol-muted">Cardio</span>
          <span className="font-semibold text-protocol-ink">{focus.cardio}</span>
        </div>
        <div className="flex items-center justify-between ui-surface px-3 py-2">
          <span className="text-protocol-muted">Control Training</span>
          <span className="font-semibold text-protocol-ink">{focus.control}</span>
        </div>
      </div>
    </section>
  );
}