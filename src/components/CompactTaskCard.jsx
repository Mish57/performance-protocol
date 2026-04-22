import { useState } from "react";

function taskAccent(status) {
  if (status === "good") {
    return "border-protocol-positiveBg";
  }
  if (status === "adjusted") {
    return "border-protocol-warningBg";
  }
  if (status === "missed") {
    return "border-protocol-dangerBg";
  }
  return "border-protocol-line";
}

export default function CompactTaskCard({ task, onToggle }) {
  const [open, setOpen] = useState(false);

  return (
    <article className={`rounded-2xl border bg-protocol-card p-4 shadow-card ${taskAccent(task.status)}`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={task.checked}
          onChange={() => onToggle(task.id)}
          disabled={task.disabled}
          className="mt-1 h-5 w-5 rounded border-protocol-line bg-protocol-bgElevated"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-heading text-base tracking-tight text-protocol-ink">{task.title}</h3>
            <span className="rounded-full bg-protocol-neutralBg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-protocol-neutralInk">
              {task.scheduled ? "Scheduled" : "Skip"}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-protocol-muted">{task.instruction}</p>
          {task.meta ? <p className="mt-1.5 text-xs font-semibold text-protocol-primary">{task.meta}</p> : null}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mt-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-protocol-primary"
      >
        <span>{open ? "Hide details" : "Expand"}</span>
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>v</span>
      </button>

      {open ? (
        <ul className="mt-2.5 space-y-1.5">
          {task.details.map((line) => (
            <li key={line} className="rounded-xl border border-protocol-line bg-protocol-surface px-3 py-2 text-sm text-protocol-ink">
              {line}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}