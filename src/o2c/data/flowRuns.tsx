/**
 * Per-flow run registry. The hero run is the BlueRidge Foods shortage
 * chargeback — a clean order-to-cash recovery that walks Cash Application →
 * Deduction Triage → Evidence & Validation → Dispute Resolution and recovers
 * $208,400 on a single human approval.
 *
 * Only the hero ("belt") run is surfaced from the cockpit; the other flow ids
 * map to the same O2C run so any stray deep-link stays on-theme. The secondary
 * deductions (Sigma OTIF, Cedar pricing) are worked from the agent desks until
 * they get their own per-customer run data.
 */

import type { FlowId, Decision } from "@/o2c/state";
import { runSteps as o2cSteps, type RunStep } from "@/o2c/data/runSteps";

export type TerminalPill = { label: string; kind: "ready" | "critical" | "progress" };

export type FlowRun = {
  id: FlowId;
  /** Topbar context line in the workspace. */
  contextTitle: string;
  contextSub: string;
  /** Pill shown while the run is still in review. */
  reviewPill: string;
  /** Note shown when the final step is approved (happy-path close). */
  completeNote: string;
  steps: RunStep[];
  /** Terminal pill once the run settles (halted or completed). */
  terminal: (decisions: Record<number, Decision>) => TerminalPill;
  /** Close ceremony — the center terminal card shown when the run settles. */
  completion?: {
    title: string;
    /** "ready" = green happy close · "critical" = red halted/blocked close. */
    tone: "ready" | "critical";
    /** The final owner the last step hands off to (control / human reviewer). */
    routedTo: string;
    routedSub: string;
    stats: { value: string; label: string }[];
    caption: string;
  };
};

const halted = (d: Record<number, Decision>) =>
  Object.values(d).some((s) => s === "escalated" || s === "rejected");

/* ════════════════════════════════════════════════════════════════════════
 * HERO — BlueRidge Foods · $208,400 shortage chargeback · recover
 * ════════════════════════════════════════════════════════════════════════ */

const beltRun: FlowRun = {
  id: "belt",
  contextTitle: "BlueRidge Foods · $208,400 shortage chargeback",
  contextSub:
    "Bulk corrugated shipment · proof of delivery signed in full · the deduction looks invalid — recover it",
  reviewPill: "Awaiting your approval",
  completeNote:
    "Recovery posted · invoice 9100488 reopened to its full $1,351,000 · dispute-back sent with the signed proof of delivery attached.",
  steps: o2cSteps,
  terminal: (d) =>
    halted(d)
      ? { label: "Held · routed for review", kind: "critical" }
      : { label: "Recovered · $208,400", kind: "ready" },
  completion: {
    title: "Deduction recovered · $208,400 back to Northgate",
    tone: "ready",
    routedTo: "AR ledger · BlueRidge Foods",
    routedSub: "rebill posted · invoice 9100488 reopened to full value",
    stats: [
      { value: "$208,400", label: "recovered" },
      { value: "$0", label: "written off" },
      { value: "4 agents", label: "one approval" },
      { value: "POD 80017734", label: "evidence on file" },
    ],
    caption:
      "Cash applied, deduction triaged, delivery proof validated, money recovered and disputed back — with a full audit trail the controller can stand behind.",
  },
};

/**
 * Secondary flow ids reuse the hero run so no off-theme content can surface.
 * They are not reachable from the cockpit; the Sigma and Cedar deductions are
 * worked from the Deduction triage and Evidence desks until they get their own
 * per-customer run data.
 */
export const flowRuns: Record<FlowId, FlowRun> = {
  belt: beltRun,
  pump: { ...beltRun, id: "pump" },
  gearbox: { ...beltRun, id: "gearbox" },
  collect: { ...beltRun, id: "collect" },
};
