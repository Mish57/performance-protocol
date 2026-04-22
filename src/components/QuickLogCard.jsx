import { useState } from "react";
import { QUICK_SLEEP_OPTIONS } from "../lib/defaultData";

export default function QuickLogCard({
  sleepHours,
  workoutDone,
  onSetSleep,
  onToggleWorkout,
  advanced,
  onAdvancedChange,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <section className="ui-card p-5">
      <h2 className="font-heading text-xl tracking-tight text-protocol-ink">Quick Log</h2>
      <p className="mt-1.5 text-sm text-protocol-muted">Fast inputs designed for under 10 seconds.</p>

      <div className="mt-4 space-y-3.5">
        <label className="flex items-center justify-between ui-surface px-3 py-2.5">
          <span className="text-sm font-semibold text-protocol-ink">Workout done</span>
          <input
            type="checkbox"
            checked={workoutDone}
            onChange={(event) => onToggleWorkout(event.target.checked)}
            className="h-5 w-5 rounded border-protocol-line bg-protocol-bgElevated"
          />
        </label>

        <div className="ui-surface px-3 py-3">
          <p className="mb-2 text-sm font-semibold text-protocol-ink">Sleep hours</p>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_SLEEP_OPTIONS.map((hours) => {
              const selected = Number(sleepHours) === hours;
              return (
                <button
                  key={hours}
                  type="button"
                  onClick={() => onSetSleep(hours)}
                  className={`rounded-lg border px-2 py-2 text-xs font-semibold ${
                    selected
                      ? "border-protocol-primaryStart bg-gradient-to-r from-protocol-primaryStart to-protocol-accentEmerald text-protocol-onAccent"
                      : "border-protocol-line bg-protocol-bgElevated text-protocol-muted hover:text-protocol-ink"
                  }`}
                >
                  {hours}h
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced((value) => !value)}
          className="inline-flex rounded-lg px-2 py-1 text-xs font-semibold uppercase tracking-wide text-protocol-primary hover:bg-protocol-accentSoft"
        >
          {showAdvanced ? "Hide advanced inputs" : "Show advanced inputs"}
        </button>

        {showAdvanced ? (
          <div className="space-y-3 rounded-xl border border-protocol-line bg-protocol-bgElevated p-3">
            <label className="block">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-semibold text-protocol-ink">Control success (1-5)</span>
                <span className="font-semibold text-protocol-primary">{advanced.controlSuccess}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={advanced.controlSuccess}
                onChange={(event) => onAdvancedChange("controlSuccess", Number(event.target.value))}
                className="w-full"
              />
            </label>
            <label className="block">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-semibold text-protocol-ink">Erection quality (1-5)</span>
                <span className="font-semibold text-protocol-primary">{advanced.erectionQuality}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={advanced.erectionQuality}
                onChange={(event) => onAdvancedChange("erectionQuality", Number(event.target.value))}
                className="w-full"
              />
            </label>
          </div>
        ) : null}
      </div>
    </section>
  );
}
