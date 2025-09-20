import { Routes, Route, useLocation } from "react-router-dom";
import { ProjectList } from "./pages/ProjectList";
import { ProjectWorkspace } from "./pages/ProjectWorkspace";
import { SettingsPage } from "./pages/SettingsPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { Breadcrumb } from "./components/Breadcrumb";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthRouter } from "./pages/AuthRouter";

export function AppRouter() {
  const location = useLocation();
  // Don't show breadcrumb on settings, privacy, or root projects page
  const hidePages = ["/", "/settings", "/privacy"];
  const showBreadcrumb = !hidePages.includes(location.pathname);
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  // Auth pages should not have the main container padding
  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/*" element={<AuthRouter />} />
      </Routes>
    );
  }

  return (
    <div className="main-content p-4 md:p-8 max-w-7xl mx-auto">
      {showBreadcrumb && <Breadcrumb />}
      <Routes>
        <Route path="/*" element={<AuthRouter />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ProjectList />
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
