function modeClass(mode) {
  if (mode === "Adjusted") {
    return "bg-protocol-warningBg text-protocol-warningInk";
  }
  if (mode === "Recovery") {
    return "bg-protocol-neutralBg text-protocol-neutralInk";
  }
  return "bg-protocol-positiveBg text-protocol-positiveInk";
}

export default function TodayStatusCard({ status }) {
  return (
    <section className="rounded-2xl border border-protocol-line bg-protocol-card p-5 shadow-card">
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl border border-protocol-line bg-protocol-surface p-3">
          <p className="text-xs uppercase tracking-wide text-protocol-muted">Completion</p>
          <p className="mt-1 font-heading text-xl tracking-tight text-protocol-ink">{status.completionPercent}%</p>
        </div>
        <div className="rounded-xl border border-protocol-line bg-protocol-surface p-3">
          <p className="text-xs uppercase tracking-wide text-protocol-muted">Control</p>
          <p className="mt-1 font-heading text-xl tracking-tight text-protocol-ink">{status.controlUsedLabel}</p>
        </div>
        <div className="rounded-xl border border-protocol-line bg-protocol-surface p-3">
          <p className="text-xs uppercase tracking-wide text-protocol-muted">Mode</p>
          <p className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-bold ${modeClass(status.mode)}`}>{status.mode}</p>
        </div>
      </div>
    </section>
  );
}