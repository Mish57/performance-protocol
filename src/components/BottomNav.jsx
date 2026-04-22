import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/workout", label: "Workout" },
  { to: "/progress", label: "Progress" },
  { to: "/settings", label: "Settings" },
];

function linkClassName(isActive) {
  return [
    "flex-1 rounded-xl px-2 py-2.5 text-center text-xs font-semibold tracking-wide transition-colors duration-150",
    isActive
      ? "bg-protocol-primarySoft text-protocol-primary"
      : "text-protocol-muted hover:bg-protocol-surface hover:text-protocol-ink",
  ].join(" ");
}

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-protocol-line bg-protocol-bg/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-protocol-line bg-protocol-card p-1 shadow-card">
        <div className="flex gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"} className={({ isActive }) => linkClassName(isActive)}>
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}