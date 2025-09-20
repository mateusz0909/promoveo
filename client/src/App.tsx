import { Navbar } from "./components/Navbar";
import { ThemeProvider } from "./providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "./context/AuthContext";
import { AppRouter } from "./AppRouter";
import { useLocation } from "react-router-dom";

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  if (isAuthPage) {
    return (
      <div className="app-container">
        <AppRouter />
        <Toaster position="top-center" />
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <AppRouter />
      <Toaster position="top-center" />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
