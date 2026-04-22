import { Link } from "react-router-dom";
import { useAppState } from "../state/AppState";

const DAY_OPTIONS = [
  { day: 1, label: "Mon" },
  { day: 2, label: "Tue" },
  { day: 3, label: "Wed" },
  { day: 4, label: "Thu" },
  { day: 5, label: "Fri" },
  { day: 6, label: "Sat" },
  { day: 7, label: "Sun" },
];

function clampControlLimit(value) {
  return Math.min(4, Math.max(2, Number(value) || 3));
}

function clampCardioFrequency(value) {
  return Math.min(6, Math.max(1, Number(value) || 3));
}

function permissionLabel(permission) {
  if (permission === "granted") {
    return "Allowed";
  }
  if (permission === "denied") {
    return "Blocked";
  }
  if (permission === "unsupported") {
    return "Unsupported";
  }
  return "Not set";
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between ui-surface px-3 py-2.5">
      <span className="text-sm font-semibold text-protocol-ink">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-5 w-5 rounded border-protocol-line bg-protocol-bgElevated"
      />
    </label>
  );
}

export default function SettingsPage() {
  const { userSettings, updateSettings, requestNotificationPermission, notificationPermission } = useAppState();

  function togglePreferredDay(day) {
    const current = userSettings.controlPreferredDays ?? [];
    const hasDay = current.includes(day);
    const next = hasDay ? current.filter((item) => item !== day) : [...current, day].sort((a, b) => a - b);
    updateSettings("controlPreferredDays", next);
  }

  return (
    <div className="space-y-5">
      <section>
        <h1 className="font-heading text-3xl tracking-tight text-protocol-ink">Settings</h1>
        <p className="mt-1 text-sm text-protocol-muted">Tune rules, plans, and notifications.</p>
      </section>

      <section className="ui-card p-5">
        <h2 className="font-heading text-xl tracking-tight text-protocol-ink">General</h2>
        <div className="mt-4 space-y-3.5">
          <ToggleRow
            label="Dark mode"
            checked={userSettings.darkMode}
            onChange={(event) => updateSettings("darkMode", event.target.checked)}
          />
          <ToggleRow
            label="Focus mode"
            checked={userSettings.focusMode}
            onChange={(event) => updateSettings("focusMode", event.target.checked)}
          />
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-protocol-ink">Sleep target (bedtime)</span>
            <input
              type="time"
              value={userSettings.sleepTarget}
              onChange={(event) => updateSettings("sleepTarget", event.target.value)}
              className="ui-input"
            />
          </label>
        </div>
      </section>

      <section className="ui-card p-5">
        <h2 className="font-heading text-xl tracking-tight text-protocol-ink">Workout Plan</h2>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-protocol-ink">Cardio frequency / week</span>
            <input
              type="number"
              min="1"
              max="6"
              value={userSettings.cardioFrequency}
              onChange={(event) => updateSettings("cardioFrequency", clampCardioFrequency(event.target.value))}
              className="ui-input"
            />
          </label>
          <Link to="/edit-workout" className="inline-block text-sm font-semibold text-protocol-primary">
            Edit workout days and exercises
          </Link>
        </div>
      </section>

      <section className="ui-card p-5">
        <h2 className="font-heading text-xl tracking-tight text-protocol-ink">Control Limits</h2>
        <div className="mt-4 space-y-3.5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-protocol-ink">Weekly control limit (2-4)</span>
            <input
              type="number"
              min="2"
              max="4"
              value={userSettings.controlLimit}
              onChange={(event) => updateSettings("controlLimit", clampControlLimit(event.target.value))}
              className="ui-input"
            />
          </label>
          <div>
            <p className="mb-1.5 text-sm font-semibold text-protocol-ink">Preferred control days</p>
            <div className="grid grid-cols-7 gap-1.5">
              {DAY_OPTIONS.map((item) => {
                const selected = (userSettings.controlPreferredDays ?? []).includes(item.day);
                return (
                  <button
                    key={item.day}
                    type="button"
                    onClick={() => togglePreferredDay(item.day)}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                      selected
                        ? "border-protocol-primaryStart bg-gradient-to-r from-protocol-primaryStart to-protocol-accentEmerald text-protocol-onAccent"
                        : "border-protocol-line bg-protocol-surface text-protocol-muted hover:text-protocol-ink"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="ui-card p-5">
        <h2 className="font-heading text-xl tracking-tight text-protocol-ink">Notifications</h2>
        <p className="mt-1.5 text-sm text-protocol-muted">Permission: {permissionLabel(notificationPermission)}</p>
        <div className="mt-4 space-y-3.5">
          <ToggleRow
            label="Enable reminders"
            checked={userSettings.notificationsEnabled}
            onChange={(event) => updateSettings("notificationsEnabled", event.target.checked)}
          />
          <button
            type="button"
            onClick={requestNotificationPermission}
            className="btn-soft w-full"
          >
            Request notification permission
          </button>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-protocol-ink">Kegel reminder</span>
            <input
              type="time"
              value={userSettings.kegelReminderTime}
              onChange={(event) => updateSettings("kegelReminderTime", event.target.value)}
              className="ui-input"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-protocol-ink">Sleep reminder</span>
            <input
              type="time"
              value={userSettings.sleepReminderTime}
              onChange={(event) => updateSettings("sleepReminderTime", event.target.value)}
              className="ui-input"
            />
          </label>
        </div>
      </section>
    </div>
  );
}
