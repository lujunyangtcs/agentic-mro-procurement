/**
 * The shape of a guided agent run — the vocabulary every case is written in.
 *
 * A run is a list of steps. Each step is one specialist agent doing its job on
 * the same request: it reads upstream evidence (clickable source files), streams
 * its reasoning, produces an artifact, and pauses for a human decision. Approve
 * hands the output to the next agent.
 *
 * The steps themselves live with their cases — `prCases.tsx` for the exception
 * examples, `bearingCase.tsx` for the clean run — so this file defines only the
 * types they share: the extraction stages, the four-way match grid, the RFQ
 * flow, the inbound-email modal and the exception resolution card.
 */

import * as React from "react";
import type { AgentId } from "@/mro/data/agents";
import type { BudgetApproval } from "@/mro/components/workspace/BudgetApprovalSignable";

export type SourceKind =
  | "sap"
  | "email"
  | "contract"
  | "policy"
  | "budget"
  | "master"
  | "external"
  | "edi"
  | "kb"
  | "invoice";

export type SourceArtifact = {
  id: string;
  label: string;
  meta: string;
  kind: SourceKind;
  /** Marks the previous agent's output handed into this step. */
  handoff?: boolean;
  body: React.ReactNode;
};

export type EmailReply = {
  from: string;
  receivedMeta: string;
  subject: string;
  lines: string[];
  /** Appended to the step's source panel once the reply lands. */
  source: SourceArtifact;
};

export type EmailAction = {
  /** English alongside, when the message itself goes out in another language. */
  review?: { subject: string; body: string[]; sendingIn: string };
  cta: string;
  to: string;
  subject: string;
  lines: string[];
  /**
   * The reply round-trip. OMIT for a one-way email (a notification/confirmation):
   * "send" just fires it and the run proceeds immediately — no 3s wait, no receipt.
   * Keep it ONLY where a genuine human reply gates the step (e.g. a signed approval).
   */
  reply?: EmailReply;
  /** Toast shown once the email is sent (one-way) or its reply lands. */
  toastTitle?: string;
  toastBody?: string;
  /** The produced doc, re-rendered (with a spring) once the email resolves the open item
   *  (on the reply for a round-trip email, or on send for a one-way email). */
  resolvedDocument?: React.ReactNode;
  /** When set, "send" first opens a signable budget approval — the human signs it, then the email sends. */
  signable?: { approval: BudgetApproval };
  /** Optional attachment rendered in the draft pop-up (e.g. a renewed contract). */
  attachment?: React.ReactNode;
  attachmentLabel?: string;
};

/** One evaluated control in the settlement envelope. */
export type ControlGate = {
  name: string;
  result: string;
  state: "clear" | "tripped";
};

export type ExceptionResolution = {
  title: string;
  gates: ControlGate[];
  evidence: { label: string; detail: string }[];
  handoff: { to: string; sla: string; nextStep: string };
  audit: { id: string; logged: string; note: string };
  draft?: {
    to: string;
    subject: string;
    lines: string[];
    sendLabel: string;
    sentLabel: string;
  };
};

export type ExtractStage = {
  /** Must match one of the step's sources[].id — rendered on the right. */
  sourceId: string;
  /** The reasoning line for this stage (spins until Proceed). */
  reasoning: string;
  /** The form-box section title. */
  title: string;
  /**
   * A short AI rationale written out (typed) above the fields — used on a
   * recommendation stage so the agent explains its pick in prose, not just
   * form cells. Omit on the plain extraction stages.
   */
  narrative?: string;
  /**
   * Auto-filled, editable fields extracted from the source. A field with
   * `options` renders as a dropdown (e.g. payment terms — Net 30 / 60 / 90) so
   * the reviewer can override the agent's pick; a field with `type: "date"`
   * renders a date input with a native calendar picker; otherwise text.
   * Omit on match-grid stages.
   */
  fields?: { label: string; value: string; options?: string[]; type?: "date" }[];
  /**
   * Renders the cumulative four-way-match grid instead of a form box. The grid
   * persists across the match stages: each stage reveals one more column
   * (`reveal` is the cumulative set), so the checked values from the previous
   * file stay on screen and the next file's column fills in beside them — a
   * live side-by-side comparison. Same model is shared by every match stage.
   */
  matchGrid?: MatchGrid;
  /** Renders an option CHOICE (cards + an AI recommendation) instead of an
   *  immediate auto-fill: the reviewer picks a supplier (the recommended one is
   *  highlighted), and only THEN do that option's fields auto-fill. Omit fields. */
  choice?: ChoiceStage;
};

/** One supplier/option card in a choice stage. */
export type ChoiceOption = {
  id: string;
  name: string;
  /** One-line context under the name, e.g. "Distributor · on SA-MRO-07". */
  meta: string;
  /** Small status pills, e.g. ["Approved", "Preferred", "On-contract"]. */
  badges?: string[];
  /** Comparison stats shown on the card (price · lead · contract · vs OEM). */
  stats: { label: string; value: string }[];
  /** The fields that auto-fill once THIS option is selected. A field with
   *  `options` renders as a dropdown; `type: "date"` a date picker; else text. */
  fields: { label: string; value: string; options?: string[]; type?: "date" }[];
};

/** A decision stage — the agent recommends one option; the human picks, then it fills. */
export type ChoiceStage = {
  /** The AI recommendation summary, typed out above the cards (the "why"). */
  recommendation: string;
  /** id of the recommended option — highlighted with a "Recommended" tag. */
  recommendedId: string;
  options: ChoiceOption[];
  /**
   * When set, a centered "searching…" modal spins before the option cards appear
   * — e.g. the agent scanning the supplier master + active outline agreements for
   * an on-contract source before it offers the on-contract vs RFQ decision.
   */
  searchModal?: { title: string; sub: string };
};

/** One cell of the four-way-match grid — a value and whether it agrees. */
export type MatchCell = { value: string; ok: boolean };

/** The shared four-way-match comparison grid (contract · PO · GR · invoice). */
export type MatchGrid = {
  columns: { key: string; label: string }[];
  rows: { dimension: string; cells: Record<string, MatchCell> }[];
  /** Cumulative columns visible by the end of THIS stage (left → right fill). */
  reveal: string[];
  /** Summary line shown under the grid once every column is in. */
  verdict?: string;
};

export type RunStep = {
  id: AgentId;
  agentName?: string;
  n: number;
  title: string;
  sub: string;
  /** A one-line natural-language "agent thought" shown at the top of the step —
   *  the agent interpreting the request in plain English (the NLP read). */
  aiThought?: string;
  reasoning: string[];
  docLabel: string;
  document: React.ReactNode;
  /** An alternate produced document used when the off-contract branch is active
   *  (e.g. the PR doc with vendor, price & source of supply hidden because they're
   *  pending the competitive RFQ). Falls back to `document` when unset. */
  altDocument?: React.ReactNode;
  sources: SourceArtifact[];
  email?: EmailAction;
  recommendation: string;
  exception?: ExceptionResolution;
  stages?: ExtractStage[];
  /** The step carries an unresolved flag — its primary action becomes the amber
   *  "continue with the flag" instead of a clean green approve (see FlowRun.holdContinue). */
  flagged?: boolean;
  /** The produced report surfaced red exceptions (a failing verdict / red checks).
   *  The approve action turns AMBER ("Approve with flags & hand off") so it doesn't
   *  read as a clean green approve — but the human can still approve and continue. */
  hasExceptions?: boolean;
  /** An inbound email that pops up the moment the step opens (e.g. a manager reply). */
  inbound?: { source: SourceArtifact };
  /** An inbound email WITH a previewable attachment (e.g. the vendor's invoice
   *  arriving before a match step) — pops as a received-email modal on step open. */
  inboundEmail?: InboundEmail;
  /**
   * A category-level panel that lands when the step's output is revealed —
   * the question a buyer asks next, once this step has answered its own.
   */
  insight?:
    | { kind: "adoption"; spec: import("@/mro/components/workspace/BuyingInsight").AdoptionSpec }
    | { kind: "demand"; spec: import("@/mro/components/workspace/BuyingInsight").DemandSpec }
    | { kind: "pricing"; spec: import("@/mro/components/workspace/BuyingInsight").PricingSpec }
    | { kind: "consolidation"; spec: import("@/mro/components/workspace/BuyingInsight").ConsolidationSpec };
  /** Runs the RFQ / request-for-quote flow (auto-fill → web search for suppliers →
   *  generate RFQ → send two vendor RFQ emails → wait for quotes) before revealing. */
  rfq?: RfqSpec;
  /** Reading the quotes that came back, side by side, and picking one. */
  quotes?: QuoteReview;
  /** Renders the signal-fusion view (a list of previewable evidence rows + a fused
   *  AI analysis) instead of the extraction wizard — used by the predictive risk step. */
  signals?: SignalSpec;
};

/** One fused risk signal — a previewable evidence email plus the agent's one-line read.
 *  Extends SourceArtifact so the row opens in the shared SourceArtifactModal. */
export type RiskSignal = SourceArtifact & {
  /** The one-line read shown on the signal row. */
  summary: string;
};

/** The signal-fusion spec: the agent reads N evidence signals (previewable rows),
 *  then types a fused analysis before the step reveals its prediction. */
export type SignalSpec = {
  signals: RiskSignal[];
  /** The fused AI analysis, typed out once all signals are read. */
  analysis: string;
};

/** One vendor solicited in the RFQ flow. */
export type RfqVendor = {
  id: string;
  name: string;
  /** How the vendor was found, e.g. "web · distributor" / "OEM site". */
  via: string;
  /** Where they are — suppliers for one part rarely sit in one country. */
  country?: string;
  /** The outbound RFQ email draft the human sends, in English. */
  draft: { subject: string; lines: string[] };
  /**
   * The same request in the supplier's own language — what actually goes out.
   * The English above is what the buyer approves.
   */
  local?: { lang: string; subject: string; lines: string[] };
  /** The outgoing RFQ opened in full, with its PDF attached for preview. */
  draftEmail?: InboundEmail;
  /** When true this vendor negotiates — a "negotiation in progress" spinner runs
   *  before its quote lands (vs an instant quote). */
  negotiating?: boolean;
  /** The quote that comes back. */
  quote: { headline: string; lines: string[] };
  /** The vendor's reply email + a previewable quotation PDF — opened by clicking
   *  the landed quote card. */
  reply?: InboundEmail;
};

/** The RFQ flow spec — solicit competitive quotes before the vendor decision. */
export type RfqSpec = {
  /** Auto-filled RFQ header fields. */
  fields: { label: string; value: string }[];
  /** The "search for suppliers" beat — a query + the suppliers it surfaces. */
  search: { query: string; results: { name: string; via: string; note: string }[] };
  /** The generated RFQ document, shown once the search lands. */
  rfqDoc: React.ReactNode;
  /** The two vendors the RFQ goes to. */
  vendors: RfqVendor[];
};

/**
 * Reading the quotes that came back. The replies are laid out side by side —
 * no document rail, because the emails are the evidence — the agent takes a
 * beat to weigh them against each other, and then recommends one.
 */
export type QuoteReview = {
  /** How long the agent spends comparing before it says anything. */
  thinkMs?: number;
  /** What it works through while it thinks. */
  lines: string[];
  /** One card per reply, in the order they arrived. */
  replies: {
    id: string;
    vendor: string;
    country: string;
    /** Headline number, or why there isn't one. */
    headline: string;
    lead: string;
    note: string;
    /** True when they did not quote at all. */
    declined?: boolean;
    /**
     * The clauses behind the number — a price is only comparable once you know
     * what it is a price for. Rendered on the card so the buyer weighs the buy,
     * not just the sticker.
     */
    terms?: { label: string; value: string; tone?: "good" | "warn" }[];
    /** What the buy really costs once freight and settlement terms are applied. */
    landed?: { value: string; note: string };
    email?: InboundEmail;
  }[];
  /** The recommendation, once the thinking is done. */
  verdict: {
    pickId: string;
    headline: string;
    body: string;
    /** The runner-up, and why it lost — a recommendation needs a comparison. */
    against: string;
  };
};

/** A received email shown as a pop-up, with a previewable PDF attachment. */
export type InboundEmail = {
  from: string;
  fromAddr?: string;
  receivedMeta: string;
  subject: string;
  lines: string[];
  /** The attachment rendered as a previewable PDF chip (e.g. the vendor invoice). */
  attachment: React.ReactNode;
  attachmentLabel: string;
  /** Modal headline (defaults to "{from} sent the invoice"). Set for non-invoice
   *  inbound mail, e.g. a vendor's quote: "Midwest Sealing Co. sent their quote". */
  headline?: string;
  /** Attachment-chip subtitle (defaults to the invoice wording). */
  previewNote?: string;
  /** Label for the dismiss button (defaults to "Continue"). */
  cta?: string;
};
