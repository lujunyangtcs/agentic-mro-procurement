/**
 * View-state machine for the MRO procurement & PR validation demo.
 * Forked from the HR Concierge engine: no real router, just a typed `view`
 * field that App.tsx switches on. Single buyer persona for v1.
 */

import * as React from "react";
import { agents, type AgentId, type AutonomyLevel } from "@/mro/data/agents";
import type { StoryId } from "@/mro/domain/types";

/**
 * The guided runs this workspace plays: the clean pump-diaphragm request, the four
 * exception cases, and the sourcing-and-onboarding run for a brand-new
 * supplier. The inherited freight and receivables runs were removed — they
 * belong to the sibling demos, not to an MRO procurement desk.
 */
export type FlowId = "catalogue" | "bearing" | "pump" | "gearbox" | "risk" | "compliance" | "onboarding" | "off-catalogue";

/** Lifecycle of an agent's output artifact — drives the handoff to the next agent. */
export type AgentOutputStatus = "none" | "pending" | "approved" | "rejected" | "escalated";

/** A human decision on a run step (everything but the un-acted "none"). */
export type Decision = Exclude<AgentOutputStatus, "none">;

/** Configurable guardrail saved from the gear → settings modal. */
export type AgentConfig = {
  level: AutonomyLevel;
  /** Auto-execute money ceiling (USD) for this agent at the chosen level. */
  autoThreshold: number;
  /** Minimum AI confidence to act without a human. */
  minConfidence: number;
};

export type DocId =
  | "purchase-req"
  | "bid-comparison"
  | "draft-po"
  | "envelope-report"
  | "invoice-match"
  | "payment-advice";

export type View =
  | { kind: "login" }
  | { kind: "cockpit" }
  /* The reviewer's personal queues; the dashboard stays the landing page. */
  | { kind: "desk" }
  | { kind: "workspace"; flow: FlowId }
  /* A case from the client's use-case I/O, run agent by agent. */
  | { kind: "story"; storyId: StoryId; step?: number }
  /* A Flow 1 case created live from New Request. */
  | { kind: "case"; caseId: string }
  /* Workbenches and assurance surfaces over the same records. */
  | { kind: "opportunities" }
  | { kind: "sourcing" }
  | { kind: "suppliers" }
  | { kind: "contracts" }
  | { kind: "value" }
  | { kind: "governance" }
  | { kind: "agent"; id: AgentId }
  | { kind: "doc"; id: DocId }
  /* Work-menu pages — the procurement desk's own surfaces. */
  | { kind: "requisitions" }
  | { kind: "exceptions" }
  | { kind: "invoice-matching" }
  /* The buyer's queue of questions a supplier asked. */
  | { kind: "service-desk" }
  /* The supplier's own portal — the other side of the same desk. */
  | { kind: "supplier-overview" }
  | { kind: "supplier-center" }
  /* Group-level spend picture across every site. */
  | { kind: "control-tower" };

/**
 * Whose screen this is. The demo shows both ends of the same conversation, so
 * the presenter switches rather than signing out and back in.
 */
export type Persona = "buyer" | "supplier";

export type FlowProgress = {
  activeStep: number;
  /**
   * Which way the sourcing decision went. The PR step's choice cards normally
   * set this, so a run entered *past* that step — from the intake desk, say —
   * has to be told, or it renders the off-contract documents for a buy that
   * was already settled on contract.
   */
  sourcing?: "contract" | "rfq";
  /** True once the run reaches its happy-path terminal state (e.g. Paid). */
  approved: boolean;
  /** Per-step human decisions, keyed by step index — decoupled from agentOutputs. */
  decisions: Record<number, Decision>;
  /** True once the run is settled — happy-path done OR halted on an exception. */
  settled: boolean;
};

export type AppState = {
  view: View;
  /** Whose screen this is — the buyer's desk or the supplier's portal. */
  persona: Persona;
  /** Stack of previous views (most recent at end). Drives the back button. */
  history: View[];
  /**
   * Per-flow workspace progress, lifted out of the workspace components so
   * navigating to a doc preview and back doesn't restart the auto-advance.
   */
  flowProgress: Record<FlowId, FlowProgress>;
  /** Each agent's output status — an "approved" output hands off to the next agent. */
  agentOutputs: Record<AgentId, AgentOutputStatus>;
  /** Each agent's saved guardrail config (autonomy level + thresholds). */
  agentConfig: Record<AgentId, AgentConfig>;
};

export type AppActions = {
  go: (view: View) => void;
  /** Switch ends of the conversation, landing on that persona's home page. */
  setPersona: (p: Persona) => void;
  back: () => void;
  signIn: () => void;
  signOut: () => void;
  setFlowProgress: (flow: FlowId, next: Partial<FlowProgress>) => void;
  setAgentOutput: (id: AgentId, status: AgentOutputStatus) => void;
  setAgentConfig: (id: AgentId, next: Partial<AgentConfig>) => void;
};

const freshFlow = (): FlowProgress => ({
  activeStep: 0,
  approved: false,
  decisions: {},
  settled: false,
});

const freshProgress = (): Record<FlowId, FlowProgress> => ({
  catalogue: freshFlow(),
  bearing: freshFlow(),
  onboarding: freshFlow(),
  "off-catalogue": freshFlow(),
  pump: freshFlow(),
  gearbox: freshFlow(),
  risk: freshFlow(),
  compliance: freshFlow(),
});

/** Sensible per-agent guardrail defaults; the gear modal overwrites these. */
const DEFAULT_THRESHOLD: Record<AgentId, number> = {
  intake: 5000,
  sourcing: 25000,
  po: 25000,
  invoice: 10000,
  vendor: 0,
  orchestrator: 0,
};

const freshOutputs = (): Record<AgentId, AgentOutputStatus> =>
  agents.reduce(
    (acc, a) => ((acc[a.id] = "none"), acc),
    {} as Record<AgentId, AgentOutputStatus>,
  );

const freshConfig = (): Record<AgentId, AgentConfig> =>
  agents.reduce(
    (acc, a) => (
      (acc[a.id] = {
        level: a.autonomy,
        autoThreshold: DEFAULT_THRESHOLD[a.id],
        minConfidence: 0.95,
      }),
      acc
    ),
    {} as Record<AgentId, AgentConfig>,
  );

const Ctx = React.createContext<(AppState & AppActions) | null>(null);

/**
 * The open screen survives a refresh within the tab, so reloading at a
 * pending approval lands back on the held case rather than the front door.
 */
const NAV_KEY = "ap-demo:nav:v1";

export function loadNav(): { persona: Persona; view: View } | undefined {
  try {
    const raw = typeof window === "undefined" ? null : window.sessionStorage.getItem(NAV_KEY);
    if (!raw) return undefined;
    const v = JSON.parse(raw) as { persona: Persona; view: View };
    return v.view && v.view.kind !== "login" && v.view.kind !== "workspace" && v.view.kind !== "doc" ? v : undefined;
  } catch {
    return undefined;
  }
}

function saveNav(persona: Persona, view: View | null) {
  try {
    if (view) window.sessionStorage.setItem(NAV_KEY, JSON.stringify({ persona, view }));
    else window.sessionStorage.removeItem(NAV_KEY);
  } catch {
    /* Private mode: refresh returns to the door. */
  }
}

export function AppProvider({
  children,
  initialView,
  initialPersona = "buyer",
  onExit,
}: {
  children: React.ReactNode;
  initialView?: View;
  /** Whose chair this session is in — chosen at the door, fixed thereafter. */
  initialPersona?: Persona;
  onExit?: () => void;
}) {
  const [state, setState] = React.useState<AppState>({
    view: initialView ?? { kind: "login" },
    persona: initialPersona,
    history: [],
    flowProgress: freshProgress(),
    agentOutputs: freshOutputs(),
    agentConfig: freshConfig(),
  });

  React.useEffect(() => {
    if (state.view.kind !== "login") saveNav(state.persona, state.view);
  }, [state.view, state.persona]);

  const go = React.useCallback(
    (view: View) =>
      setState((s) => ({
        ...s,
        view,
        history: [...s.history, s.view],
      })),
    [],
  );

  const setPersona = React.useCallback(
    (p: Persona) =>
      setState((s) => ({
        ...s,
        persona: p,
        view: p === "supplier" ? { kind: "supplier-overview" } : { kind: "cockpit" },
        history: [],
      })),
    [],
  );

  const back = React.useCallback(
    () =>
      setState((s) => {
        if (s.history.length === 0) {
          return { ...s, view: { kind: "cockpit" } };
        }
        const prev = s.history[s.history.length - 1];
        return { ...s, view: prev, history: s.history.slice(0, -1) };
      }),
    [],
  );

  const signIn = React.useCallback(
    () =>
      setState((s) => ({
        ...s,
        view: s.persona === "supplier" ? { kind: "supplier-overview" } : { kind: "cockpit" },
        history: [],
        flowProgress: freshProgress(),
        agentOutputs: freshOutputs(),
        agentConfig: freshConfig(),
      })),
    [],
  );

  const signOut = React.useCallback(() => {
    saveNav("buyer", null);
    if (onExit) {
      onExit();
      return;
    }
    setState((s) => ({ ...s, view: { kind: "login" }, history: [] }));
  }, [onExit]);

  const setFlowProgress = React.useCallback(
    (flow: FlowId, next: Partial<FlowProgress>) =>
      setState((s) => ({
        ...s,
        flowProgress: {
          ...s.flowProgress,
          [flow]: { ...s.flowProgress[flow], ...next },
        },
      })),
    [],
  );

  const setAgentOutput = React.useCallback(
    (id: AgentId, status: AgentOutputStatus) =>
      setState((s) => ({
        ...s,
        agentOutputs: { ...s.agentOutputs, [id]: status },
      })),
    [],
  );

  const setAgentConfig = React.useCallback(
    (id: AgentId, next: Partial<AgentConfig>) =>
      setState((s) => ({
        ...s,
        agentConfig: { ...s.agentConfig, [id]: { ...s.agentConfig[id], ...next } },
      })),
    [],
  );

  return (
    <Ctx.Provider
      value={{
        ...state,
        go,
        setPersona,
        back,
        signIn,
        signOut,
        setFlowProgress,
        setAgentOutput,
        setAgentConfig,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useApp must be inside <AppProvider>");
  return ctx;
}
