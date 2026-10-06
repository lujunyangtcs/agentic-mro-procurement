import { AppProvider, useApp } from "@/o2c/state";
import { Sidebar } from "@/o2c/components/layout/Sidebar";
import { Login } from "@/o2c/views/Login";
import { Cockpit } from "@/o2c/views/Cockpit";
import { Workspace } from "@/o2c/views/Workspace";
import { DocView } from "@/o2c/views/DocView";
import { IntakeConsole } from "@/o2c/views/IntakeConsole";
import { SourcingConsole } from "@/o2c/views/SourcingConsole";
import { POConsole } from "@/o2c/views/POConsole";
import { InvoiceConsole } from "@/o2c/views/InvoiceConsole";
import { VendorConsole } from "@/o2c/views/VendorConsole";
import { OrchestratorConsole } from "@/o2c/views/OrchestratorConsole";

function Router({ onExit }: { onExit?: () => void }) {
  const { view } = useApp();

  switch (view.kind) {
    case "login":
      return <Login onExit={onExit} />;
    case "cockpit":
      return <Cockpit />;
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
