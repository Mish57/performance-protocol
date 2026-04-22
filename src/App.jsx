import { Navigate, Route, Routes } from "react-router-dom";
import MobileLayout from "./components/MobileLayout";
import DashboardPage from "./pages/DashboardPage";
import ProgressPage from "./pages/ProgressPage";
import SettingsPage from "./pages/SettingsPage";
import WorkoutBuilderPage from "./pages/WorkoutBuilderPage";
import WorkoutSessionPage from "./pages/WorkoutSessionPage";

export default function App() {
  return (
    <Routes>
      <Route element={<MobileLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/workout" element={<WorkoutSessionPage />} />
        <Route path="/edit-workout" element={<WorkoutBuilderPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
