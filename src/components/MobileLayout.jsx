import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import { useAppState } from "../state/AppState";

export default function MobileLayout() {
  const { userSettings } = useAppState();

  return (
    <div className="min-h-screen bg-protocol-bg text-protocol-ink">
      {!userSettings.focusMode ? (
        <header className="sticky top-0 z-20 border-b border-protocol-line bg-protocol-bg/90 px-4 py-4 backdrop-blur">
          <div className="mx-auto w-full max-w-xl">
            <p className="font-heading text-[10px] uppercase tracking-[0.24em] text-protocol-muted">Performance Protocol</p>
            <p className="mt-1 font-heading text-xl tracking-tight text-protocol-ink">Execution First</p>
          </div>
        </header>
      ) : null}
      <main className="mx-auto w-full max-w-xl px-4 pb-28 pt-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}