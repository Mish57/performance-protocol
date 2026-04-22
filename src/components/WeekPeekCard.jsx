function statusClass(status) {
  if (status === "good") {
    return "bg-protocol-positiveBg text-protocol-positiveInk";
  }
  if (status === "adjusted") {
    return "bg-protocol-warningBg text-protocol-warningInk";
  }
  if (status === "missed") {
    return "bg-protocol-dangerBg text-protocol-dangerInk";
  }
  return "bg-protocol-neutralBg text-protocol-neutralInk";
}

function WeekRow({ day }) {
  return (
    <div className="flex items-center justify-between ui-surface px-3 py-2.5">
      <div>
        <p className="text-sm font-semibold text-protocol-ink">{day.label}</p>
        <p className="text-xs text-protocol-muted">{day.name}</p>
      </div>
      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusClass(day.status)}`}>
        {day.status}
      </span>
    </div>
  );
}

export default function WeekPeekCard({ weekSlice }) {
  return (
    <section className="ui-card p-5">
      <h2 className="font-heading text-xl tracking-tight text-protocol-ink">Week View</h2>
      <p className="mt-1.5 text-sm text-protocol-muted">Yesterday, today, tomorrow first. Full week on demand.</p>

      <div className="mt-4 space-y-2">
        {weekSlice.highlight.map((day) => (
          <WeekRow key={day.dateKey} day={day} />
        ))}
      </div>

      <details className="mt-4 rounded-xl border border-protocol-line bg-protocol-bgElevated p-3">
        <summary className="cursor-pointer text-sm font-semibold text-protocol-primary">Show full week</summary>
        <div className="mt-2.5 space-y-2">
          {weekSlice.fullWeek.map((day) => (
            <WeekRow key={day.dateKey} day={day} />
          ))}
        </div>
      </details>
    </section>
  );
}