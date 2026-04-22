import { useState } from "react";
import { Link } from "react-router-dom";

const ACTIONS = [
  { label: "Workout", to: "/workout" },
  { label: "Meal", to: "/#diet-section" },
  { label: "Timer", to: "/workout" },
];

export default function QuickActionFab() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-24 right-5 z-40">
      <div className="mb-3 flex flex-col items-end gap-2">
        {ACTIONS.map((action, index) => (
          <Link
            key={action.label}
            to={action.to}
            onClick={() => setOpen(false)}
            className={[
              "rounded-full border border-protocol-border/70 bg-protocol-bgSecondary px-3 py-2 text-xs font-semibold text-protocol-textPrimary shadow-md",
              "origin-bottom-right active:scale-95",
              open
                ? "pointer-events-auto translate-y-0 opacity-100"
                : "pointer-events-none translate-y-2 opacity-0",
            ].join(" ")}
            style={{ transitionDelay: `${index * 45}ms` }}
          >
            {action.label}
          </Link>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="h-14 w-14 rounded-full bg-gradient-to-r from-protocol-primaryStart to-protocol-accentEmerald text-3xl font-light leading-none text-protocol-onAccent shadow-lg"
        aria-label="Open quick actions"
      >
        <span className={`inline-block ${open ? "rotate-45" : "rotate-0"}`}>+</span>
      </button>
    </div>
  );
}

