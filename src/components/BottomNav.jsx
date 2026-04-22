import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/workout", label: "Workout" },
  { to: "/progress", label: "Progress" },
  { to: "/settings", label: "Settings" },
];

function linkClassName(isActive) {
  return [
    "relative flex-1 rounded-xl px-2 py-2.5 text-center text-xs font-semibold tracking-wide transition-all duration-200 active:scale-95",
    isActive
      ? "bg-gradient-to-r from-protocol-primarySoft to-protocol-accentSoft text-protocol-textPrimary shadow-sm"
      : "text-protocol-muted hover:bg-protocol-surface hover:text-protocol-ink",
  ].join(" ");
}

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-protocol-line bg-protocol-bg px-4 py-3 backdrop-blur">
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-protocol-line bg-protocol-card p-1 shadow-lg">
        <div className="flex gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"} className={({ isActive }) => linkClassName(isActive)}>
              {({ isActive }) => (
                <>
                  <span>{item.label}</span>
                  <span
                    className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-protocol-accent transition-opacity ${
                      isActive ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
