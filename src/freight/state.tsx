/**
 * View-state machine for the freight settlement & PR validation demo.
 * Forked from the HR Concierge engine: no real router, just a typed `view`
 * field that App.tsx switches on. Single buyer persona for v1.
 */

import * as React from "react";
import { agents, type AgentId, type AutonomyLevel } from "@/freight/data/agents";

export type FlowId = "belt" | "settle" | "pump" | "gearbox" | "collect";

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
  | { kind: "workspace"; flow: FlowId }
  | { kind: "agent"; id: AgentId }
  | { kind: "doc"; id: DocId };

export type FlowProgress = {
  activeStep: number;
  /** True once the run reaches its happy-path terminal state (e.g. Paid). */
  approved: boolean;
  /** Per-step human decisions, keyed by step index — decoupled from agentOutputs. */
  decisions: Record<number, Decision>;
  /** True once the run is settled — happy-path done OR halted on an exception. */
  settled: boolean;
};

export type AppState = {
  view: View;
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

/**
 * The collections run opens on its single Payment step (index 4): the four
 * order-to-cash lead-up steps are already complete and reviewable, so the
 * cockpit's overdue-payment alert deep-links straight to the work that needs a
 * person. The lead-up steps are pre-approved; only the Payment step is live.
 */
const freshCollect = (): FlowProgress => ({
  activeStep: 4,
  approved: false,
  decisions: { 0: "approved", 1: "approved", 2: "approved", 3: "approved" },
  settled: false,
});

const freshProgress = (): Record<FlowId, FlowProgress> => ({
  belt: freshFlow(),
  settle: freshFlow(),
  pump: freshFlow(),
  gearbox: freshFlow(),
  collect: freshCollect(),
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

export function AppProvider({
  children,
  initialView,
  onExit,
}: {
  children: React.ReactNode;
  initialView?: View;
  onExit?: () => void;
}) {
  const [state, setState] = React.useState<AppState>({
    view: initialView ?? { kind: "login" },
    history: [],
    flowProgress: freshProgress(),
    agentOutputs: freshOutputs(),
    agentConfig: freshConfig(),
  });

  const go = React.useCallback(
    (view: View) =>
      setState((s) => ({
        ...s,
        view,
        history: [...s.history, s.view],
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
        view: { kind: "cockpit" },
        history: [],
        flowProgress: freshProgress(),
        agentOutputs: freshOutputs(),
        agentConfig: freshConfig(),
      })),
    [],
  );

  const signOut = React.useCallback(() => {
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
