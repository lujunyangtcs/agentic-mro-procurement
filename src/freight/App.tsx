import { AppProvider, useApp } from "@/freight/state";
import { Sidebar } from "@/freight/components/layout/Sidebar";
import { Login } from "@/freight/views/Login";
import { Cockpit } from "@/freight/views/Cockpit";
import { Workspace } from "@/freight/views/Workspace";
import { DocView } from "@/freight/views/DocView";
import { IntakeConsole } from "@/freight/views/IntakeConsole";
import { SourcingConsole } from "@/freight/views/SourcingConsole";
import { POConsole } from "@/freight/views/POConsole";
import { InvoiceConsole } from "@/freight/views/InvoiceConsole";
import { VendorConsole } from "@/freight/views/VendorConsole";
import { OrchestratorConsole } from "@/freight/views/OrchestratorConsole";

function Router() {
  const { view } = useApp();

  switch (view.kind) {
    case "login":
      return <Login />;
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

function Shell() {
  const { view } = useApp();
  // The work menu stays docked on every signed-in surface; login is full-screen.
  const showSidebar = view.kind !== "login";

  return (
    <div className="min-h-screen bg-surface-fog text-ink font-sans">
      <div className="flex">
        {showSidebar && <Sidebar />}
        <main className="flex-1 min-w-0">
          <Router />
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
      <Shell />
    </AppProvider>
  );
}
