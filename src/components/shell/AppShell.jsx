import { useState, useEffect } from "react";
import WorkflowVisualizer from "../analysis/WorkflowVisualizer";
import ResultPanel from "../analysis/ResultPanel";
import AnalysisTrace from "../analysis/AnalysisTrace";
import ImageryViewer from "../imagery/ImageryViewer";
import TopBar from "./TopBar";
import NavigationRail from "./NavigationRail";
import QueryDock from "../query/QueryDock";
import SatQueryCore from "../core/SatQueryCore";
import TemporalComparison from "../analysis/TemporalComparison";
import MultimodalComparison from "../analysis/MultimodalComparison";
import HistoryDrawer from "./HistoryDrawer";
import SettingsDrawer from "./SettingsDrawer";
import AuthModal from "../auth/AuthModal";
import { useAuthStore } from "../../store/authStore";

function AppShell() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("workspace");
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser();
    
    const openAuth = () => setAuthOpen(true);
    window.addEventListener('open-auth-modal', openAuth);
    return () => window.removeEventListener('open-auth-modal', openAuth);
  }, [fetchUser]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0b0b0c] text-white">
      <TopBar
        onHistoryClick={() => setHistoryOpen(true)}
        onSettingsClick={() => setSettingsOpen(true)}
      />

      <div className="flex min-h-0 flex-1 flex-col-reverse md:flex-row">
        <NavigationRail
          activeSection={activeSection}
          onWorkspaceClick={() => setActiveSection("workspace")}
          onImageryClick={() => setActiveSection("imagery")}
          onAnalysisClick={() => setActiveSection("analysis")}
          onSettingsClick={() => setSettingsOpen(true)}
        />

        <main className="flex min-w-0 flex-1 flex-col relative pb-[env(safe-area-inset-bottom)]">
          <section
            className={`relative flex min-h-0 flex-1 items-center justify-center overflow-hidden transition-all duration-300 ${
              activeSection === "workspace"
                ? "ring-1 ring-inset ring-amber-400/20"
                : ""
            }`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_55%)] pointer-events-none" />

            <div
              className={`absolute inset-0 transition-all duration-300 ${
                activeSection === "imagery"
                  ? "ring-1 ring-inset ring-cyan-300/30"
                  : ""
              }`}
            >
              <ImageryViewer />
            </div>

            <SatQueryCore />

            <div className="pointer-events-none absolute inset-0 z-20">
              <div className="pointer-events-auto">
                <ResultPanel />
                <TemporalComparison />
                <MultimodalComparison />
              </div>
            </div>

            <div className="pointer-events-auto">
              <AnalysisTrace />
              <WorkflowVisualizer />
            </div>
          </section>

          <div
            className={`transition-all duration-300 ${
              activeSection === "analysis"
                ? "ring-1 ring-inset ring-amber-400/20"
                : ""
            }`}
          >
            <QueryDock />
          </div>
        </main>
      </div>

      {historyOpen && (
        <HistoryDrawer onClose={() => setHistoryOpen(false)} />
      )}

      {settingsOpen && (
        <SettingsDrawer onClose={() => setSettingsOpen(false)} />
      )}

      {authOpen && (
        <AuthModal onClose={() => setAuthOpen(false)} />
      )}
    </div>
  );
}

export default AppShell;