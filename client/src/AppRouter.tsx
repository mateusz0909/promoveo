import { Routes, Route, useLocation } from "react-router-dom";
import { StudioHome } from "./pages/StudioHome";
import { ProjectWorkspace } from "./pages/ProjectWorkspace";
import { ProjectHistory } from "./pages/ProjectHistory";
import { SettingsPage } from "./pages/SettingsPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { MagicDemo } from "./pages/MagicDemo";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthRouter } from "./pages/AuthRouter";

export function AppRouter() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";
  const isMagicDemo = location.pathname === "/demo";

  // Magic demo and auth pages should not have the main container padding
  if (isAuthPage || isMagicDemo) {
    return (
      <Routes>
        <Route path="/*" element={<AuthRouter />} />
        <Route path="/demo" element={<MagicDemo />} />
      </Routes>
    );
  }

  return (
    <div className="h-full">
      <Routes>
        <Route path="/*" element={<AuthRouter />} />
        <Route path="/demo" element={<MagicDemo />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <StudioHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/new-project"
          element={
            <ProtectedRoute>
              <ProjectWorkspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project/:id"
          element={
            <ProtectedRoute>
              <ProjectWorkspace />
            </ProtectedRoute>
          }
        />
        {/* Studio section routes - now support project context */}
        <Route
          path="/project/:id"
          element={
            <ProtectedRoute>
              <ProjectWorkspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project/:id/images"
          element={
            <ProtectedRoute>
              <ProjectWorkspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project/:id/text-content"
          element={
            <ProtectedRoute>
              <ProjectWorkspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project/:id/overview"
          element={
            <ProtectedRoute>
              <ProjectWorkspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project/:id/landing-page"
          element={
            <ProtectedRoute>
              <ProjectWorkspace />
            </ProtectedRoute>
          }
        />
        {/* Legacy studio routes - redirect to home when not in project context */}
        <Route
          path="/images"
          element={
            <ProtectedRoute>
              <StudioHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/text-content"
          element={
            <ProtectedRoute>
              <StudioHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/overview"
          element={
            <ProtectedRoute>
              <StudioHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/landing-page"
          element={
            <ProtectedRoute>
              <StudioHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <ProjectHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/privacy"
          element={
            <ProtectedRoute>
              <PrivacyPolicyPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
