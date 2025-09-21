import { MainLayout } from "./components/MainLayout";
import { ThemeProvider } from "./providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { ProjectProvider } from "./context/ProjectContext";
import { AppRouter } from "./AppRouter";

function App() {
  return (
    <ThemeProvider>
      <ProjectProvider>
        <MainLayout>
          <AppRouter />
          <Toaster position="top-center" />
        </MainLayout>
      </ProjectProvider>
    </ThemeProvider>
  );
}

export default App;
