/**
 * Per-flow run registry — the gated agent runs the user opens from the cockpit.
 *
 *  ① belt    — HERO · inbound copper freight settlement · three-way check (steps in runSteps.tsx).
 *  ② pump    — MRO PR intake & validation · mechanical seal example (steps in prCases.tsx).
 *  ③ gearbox — MRO PR intake & validation · grinding media example (steps in prCases.tsx).
 *  ④ collect — carrier overcharge recovery · dunning ladder (defined below).
 *
 * Every figure ties out across a run's documents. A non-approve decision halts the
 * run; the terminal pill is flow-specific.
 */

import type { FlowId, Decision } from "@/mro/state";
import type { RunStep } from "@/mro/data/runSteps";
import { beltPrSteps, rollerPrSteps, riskPrSteps, compliancePrSteps } from "@/mro/data/prCases";
import { filterBagSteps } from "@/mro/data/filterBagCase";
import { bearingPrSteps } from "@/mro/data/bearingCase";
import { onboardingSteps } from "@/mro/data/onboardingCase";
import { offContractSteps, offContractPick } from "@/mro/data/offContractCase";
import { usd } from "@/mro/data/procurement";


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
  /** For a flagged step (RunStep.flagged): the amber "continue despite the flag"
   *  action — label + the toast shown when the run is carried on with it parked. */
  holdContinue?: { label: string; toastTitle: string; toastBody: string };
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
 * Registry
 * ════════════════════════════════════════════════════════════════════════ */

export const flowRuns: Record<FlowId, FlowRun> = {
  /**
   * The same seal request, bought the other way. Step 1 of this run offers a
   * choice — buy on the agreement, or test the market — and this flow is that
   * second answer: the competitive RFQ stays in, so the run is seven steps
   * instead of six and the vendor cards decide who wins it.
   *
   * It reuses the seal case's own steps rather than restating them. There is
   * one set of documents for this requisition; the branch is the only thing
   * that differs.
   */
  "off-catalogue": {
    id: "off-catalogue",
    contextTitle: "Deburring Plant · Deburring Line 1 · no agreement covers it",
    contextSub: "Nothing on contract · taken to market · four suppliers asked, three quoted",
    reviewPill: "Off-contract sourcing · in review",
    completeNote: `PO-77318 raised to ${offContractPick.vendor} · shipping this week`,
    steps: offContractSteps,
    terminal: (d) =>
      halted(d)
        ? { label: "Halted · sourcing exception", kind: "critical" }
        : { label: "Order raised", kind: "ready" },
    completion: {
      title: "Bought at a market price, on evidence",
      tone: "ready",
      routedTo: "Plant lead",
      routedSub: "one signature",
      stats: [
        { value: "4", label: "suppliers asked" },
        { value: "3", label: "quotes compared" },
        { value: usd(offContractPick.value, 0), label: "order raised" },
      ],
      caption:
        "Nothing on file covered this seal, so there was no agreed price to fall back on · four suppliers were asked — three German, one overseas — each in the language they work in · three quoted and one declined on capacity · the cheapest was four days slower, and with the line stopped that is the wrong trade, so the order went to the supplier holding it in stock, with all three quotes on file behind the price.",
    },
  },
  onboarding: {
    id: "onboarding",
    contextTitle: "Riomar · vessel relining · new supplier",
    contextSub: "No approved supplier in the category · quotes sought · winner onboarded",
    reviewPill: "Supplier onboarding · in review",
    completeNote: "Supplier prepared · one signature left · bank details by callback",
    steps: onboardingSteps,
    terminal: () => ({ label: "Prepared · awaiting one signature", kind: "ready" }),
    completion: {
      title: "Calibraciones Ibéricas · sourced, screened and prepared",
      tone: "ready",
      routedTo: "Category manager",
      routedSub: "one signature",
      stats: [
        { value: "2", label: "quotes compared" },
        { value: "$6,500", label: "below the alternative" },
        { value: "0", label: "fields typed by hand" },
      ],
      caption:
        "No approved supplier existed for vessel relining, so the market was searched and two quotes taken · Ibérica won at $38,400, $6,500 below the alternative and the only one able to mobilise inside the shutdown · their Spanish registration pack was read, translated and checked field by field, the compliance and risk screens ran clear, and the supplier record is prepared for one signature — with the bank account deliberately left blank until a callback verifies it.",
    },
  },
  /* The catalogue buy — the run that opens from "New request". */
  catalogue: {
    id: "catalogue",
    contextTitle: "Deburring Plant · Deburring Line 1 · quarterly filter change",
    contextSub: "A catalogue line · bought again every quarter · four sites buying it apart",
    reviewPill: "Catalogue purchase · in review",
    completeNote: "Invoice matched · $20,696.00 cleared, billed at the consolidated break",
    steps: filterBagSteps,
    terminal: () => ({ label: "Matched & paid · consolidated across three plants", kind: "ready" }),
    completion: {
      title: "Bought at the right break, on one order",
      tone: "ready",
      routedTo: "Apex Industrial Supply",
      routedSub: "one purchase order",
      stats: [
        { value: "1,040 EA", label: "on one order" },
        { value: "$2,750", label: "saved this week" },
        { value: "$20,560", label: "a year, if held" },
      ],
      caption:
        "Nobody negotiated anything. The saving came from seeing three plants ask for the same bag in the same week, and from reading the price list the agreement already published.",
    },
  },

  bearing: {
    id: "bearing",
    contextTitle: "Amberg · Assembly Line 1 · pump diaphragm PR",
    contextSub: "Complete request · every check clean · released and paid without a person",
    reviewPill: "PR validation · running",
    completeNote: "Released by rule · four-way matched · scheduled for payment",
    steps: bearingPrSteps,
    terminal: () => ({ label: "Released and matched · nobody touched it", kind: "ready" }),
    completion: {
      title: "PR-48692 · released, received and matched",
      tone: "ready",
      routedTo: "Accounts payable",
      routedSub: "payment run",
      stats: [
        { value: "6", label: "checks passed" },
        { value: "$888", label: "on-contract" },
        { value: "0", label: "people involved" },
      ],
      caption:
        "Complete request coded to MRO-DIAPH-PTFE-2IN · master data, stock, coverage and contract all clean · released inside the plant limit as PO-77342 · invoice BPI-5602 four-way matched against the order, the goods receipt and SA-MRO-07 and scheduled for payment on Net 30.",
    },
  },
  pump: {
    id: "pump",
    contextTitle: "Amberg · Assembly Line 2 · mechanical seal PR",
    contextSub: "Free-text request · intake structured it, every check cleared · released on contract",
    reviewPill: "PR validation · in review",
    completeNote: "PR released · structured, coded and validated on-contract",
    steps: beltPrSteps,
    terminal: () => ({ label: "PR released · on-contract", kind: "ready" }),
    completion: {
      title: "PR-48630 · structured, validated & released",
      tone: "ready",
      routedTo: "Buyer · plant maintenance",
      routedSub: "PR release",
      stats: [
        { value: "5", label: "checks passed" },
        { value: "$4,180", label: "on-contract" },
        { value: "50 mm", label: "spec confirmed" },
      ],
      caption:
        "Free-text request structured to MRO-SEAL-MECH-50MM-SIC · master data, warranty, vendor and approval validated · diameter confirmed with the engineer · released to Apex on-contract.",
    },
  },
  gearbox: {
    id: "gearbox",
    contextTitle: "Amberg · Deburring Line 3 · grinding media PR",
    contextSub: "Free-text request · intake found a duplicate, sister-plant stock and warranty cover",
    reviewPill: "PR validation · in review",
    completeNote: "Re-scoped · interplant transfer + warranty claim + 2-unit buy",
    steps: rollerPrSteps,
    terminal: () => ({ label: "Re-scoped · duplicate cancelled", kind: "ready" }),
    completion: {
      title: "PR-48655 · re-scoped and routed",
      tone: "ready",
      routedTo: "Buyer · plant maintenance",
      routedSub: "transfer + claim + buy",
      stats: [
        { value: "6 BAG", label: "transferred in-plant" },
        { value: "$236", label: "residual buy only" },
        { value: "1", label: "duplicate PR cancelled" },
      ],
      caption:
        "8-unit buy re-scoped to a 6-unit interplant transfer + a warranty claim + a 2-unit on-contract buy · duplicate PR-48641 cancelled · avoided buying inventory the network already had.",
    },
  },
  risk: {
    id: "risk",
    contextTitle: "Amberg · Utilities line · drive-gearbox seal kit · stock-out risk",
    contextSub: "No PR raised · agent predicted a stock-out from SNOP + consumption + lead-time signals · pre-buy recommended",
    reviewPill: "Risk pre-buy · in review",
    completeNote: "Pre-buy approved · proactive PR routed on-contract ahead of the stock-out",
    steps: riskPrSteps,
    terminal: (d) =>
      halted(d)
        ? { label: "Risk accepted · no pre-buy", kind: "critical" }
        : { label: "Pre-buy approved · PR routed", kind: "ready" },
    completion: {
      title: "RISK-49001 · stock-out prevented, pre-buy routed",
      tone: "ready",
      routedTo: "Buyer · plant maintenance",
      routedSub: "proactive pre-buy",
      stats: [
        { value: "9 days", label: "stock-out averted" },
        { value: "$18.4K", label: "pre-buy on-contract" },
        { value: "~$1.4M/day", label: "downtime exposure avoided" },
      ],
      caption:
        "Stock-out predicted from SNOP, criticality, consumption, lead time and market · deterministic reorder overridden · 2-unit GearTech pre-buy approved by the reliability lead and routed on-contract ahead of the 9-week lead.",
    },
  },
  compliance: {
    id: "compliance",
    contextTitle: "Winding Plant · Winding Line · gearbox rebuild kit · PR → PO",
    contextSub: "PR-48690 validated · ready for PO conversion · the orchestrator runs the compliance & commercial gate",
    reviewPill: "Compliance gate · in review",
    completeNote: "PO released · compliant PO-77412 issued to GearTech on-contract",
    holdContinue: {
      label: "Pending PO · continue the run",
      toastTitle: "Flagged — continuing",
      toastBody: "SA-MRO-09 expires in 28 days. The PO is parked pending the contract renewal, and the run carries on.",
    },
    steps: compliancePrSteps,
    terminal: (d) =>
      halted(d)
        ? { label: "Halted · compliance exception", kind: "critical" }
        : { label: "PO released · compliant", kind: "ready" },
    completion: {
      title: "PR-48690 → PO-77412 · issued compliant",
      tone: "ready",
      routedTo: "Buyer · purchasing",
      routedSub: "PO release",
      stats: [
        { value: "$42,000", label: "compliant PO issued" },
        { value: "5/5", label: "compliance gates cleared" },
        { value: "L2", label: "DOA sign-off routed" },
      ],
      caption:
        "PR-48690 cleared contract compliance, HSE & insurance, GL/cost-center and delivery feasibility · converted to PO-77412 on SA-MRO-09 · the Procurement Manager approved the over-DOA L2 sign-off and the PO released to GearTech.",
    },
  },
};
