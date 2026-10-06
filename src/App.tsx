import { AppProvider, useApp } from "@/state";
import { Sidebar } from "@/components/layout/Sidebar";
import { Login } from "@/views/Login";
import { Cockpit } from "@/views/Cockpit";
import { FeedbackLoopConsole } from "@/views/FeedbackLoopConsole";
import { Workspace } from "@/views/Workspace";
import { DocView } from "@/views/DocView";
import { IntakeConsole } from "@/views/IntakeConsole";
import { SourcingConsole } from "@/views/SourcingConsole";
import { POConsole } from "@/views/POConsole";
import { InvoiceConsole } from "@/views/InvoiceConsole";
import { VendorConsole } from "@/views/VendorConsole";
import { OrchestratorConsole } from "@/views/OrchestratorConsole";

function Router({ onExit }: { onExit?: () => void }) {
  const { view } = useApp();

  switch (view.kind) {
    case "login":
      return <Login onExit={onExit} />;
    case "cockpit":
      return <Cockpit />;
    case "feedback":
      return <FeedbackLoopConsole />;
    case "workspace":
      return <Workspace flow={view.flow} />;
    case "agent":
      switch (view.id) {
        case "intake":
          return <IntakeConsole />;
        case "sourcing":
          return <SourcingConsole />;
        case "po":
          return <POConsole />;
        case "invoice":
          return <InvoiceConsole />;
        case "vendor":
          return <VendorConsole />;
        case "orchestrator":
          return <OrchestratorConsole />;
      }
    case "doc":
      return <DocView id={view.id} />;
  }
}

function Shell({ onExit }: { onExit?: () => void }) {
  const { view } = useApp();
  // The work menu stays docked on every signed-in surface; login is full-screen.
  const showSidebar = view.kind !== "login";

  return (
    <div className="min-h-screen bg-surface-fog text-ink font-sans">
      <div className="flex">
        {showSidebar && <Sidebar />}
        <main className="flex-1 min-w-0">
          <Router onExit={onExit} />
        </main>
      </div>
    </div>
  );
}

export default function App({
  onExit,
  startSignedIn,
}: {
  onExit?: () => void;
  startSignedIn?: boolean;
}) {
  return (
    <AppProvider initialView={startSignedIn ? { kind: "cockpit" } : undefined} onExit={onExit}>
      <Shell onExit={onExit} />
    </AppProvider>
  );
}
