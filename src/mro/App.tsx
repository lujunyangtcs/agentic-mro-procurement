import { AppProvider, useApp, type Persona, type View } from "@/mro/state";
import { Sidebar } from "@/mro/components/layout/Sidebar";
import { Login } from "@/mro/views/Login";
import { Cockpit } from "@/mro/views/Cockpit";
import { Workspace } from "@/mro/views/Workspace";
import { DocView } from "@/mro/views/DocView";
import { IntakeConsole } from "@/mro/views/IntakeConsole";
import { AgentProfile } from "@/mro/views/AgentProfile";
import { Requisitions } from "@/mro/views/Requisitions";
import { Exceptions } from "@/mro/views/Exceptions";
import { InvoiceMatching } from "@/mro/views/InvoiceMatching";
import { ServiceDesk } from "@/mro/views/ServiceDesk";
import { SupplierPortal } from "@/mro/views/SupplierPortal";
import { ControlTower } from "@/mro/views/ControlTower";

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
      /* Intake keeps its own desk — it is where free-text requests land.
         Every other agent shows what it reads, produces and stops for. */
      return view.id === "intake" ? <IntakeConsole /> : <AgentProfile id={view.id} />;
    case "requisitions":
      return <Requisitions />;
    case "exceptions":
      return <Exceptions />;
    case "invoice-matching":
      return <InvoiceMatching />;
    case "service-desk":
      return <ServiceDesk />;
    case "supplier-overview":
      return <SupplierPortal mode="overview" />;
    case "supplier-center":
      return <SupplierPortal mode="ask" />;
    case "control-tower":
      return <ControlTower />;
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
  startPersona = "buyer",
}: {
  onExit?: () => void;
  startSignedIn?: boolean;
  /** Which chair the door opened into — the buyer's desk or the supplier's. */
  startPersona?: Persona;
}) {
  const home: View = startPersona === "supplier" ? { kind: "supplier-overview" } : { kind: "cockpit" };
  return (
    <AppProvider
      initialView={startSignedIn ? home : undefined}
      initialPersona={startPersona}
      onExit={onExit}
    >
      {/* The store lives above this component, in Root — signing out unmounts
          the whole app, and a conversation the supplier just had must still be
          there when the buyer signs in. */}
      <Shell />
    </AppProvider>
  );
}
