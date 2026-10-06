# Multi-flow enterprise rework — design

**Date:** 2026-06-03 · **Repo:** ip-p2p-workforce (TCS → IP P2P demo)
**Audience:** CPO + Controller · **Data:** all fabricated.

## 1. Problem

Today the whole app is ONE transaction (the BeltPro belt) viewed across 7 consoles.
A buyer clicking any run lands on the same single belt flow. That reads as a toy, not
an enterprise P2P solution. We need DISTINCT transactions, each console a queue
spanning many transactions, and exceptions caught at the right stage.

## 2. Locked structure (3 runnable transactions + 2 standalone consoles)

### Flow ① "belt" — happy path (UNCHANGED)
Corrugator No.2 double-backer belt · BeltPro 100482 · $48,200 · runs clean
Intake → Sourcing → PO → Fulfillment → Invoices → **Paid · audit closed**.

### Flow ② "pump" — front-office exceptions (NEW · 3-step run)
Boiler feed pump · Power House P051 · Cascade Fluid Systems (vendor 200914, off-contract) · $96,400.
Run = Intake → Sourcing → PO, blocked before release (never reaches Fulfillment):
- **Intake exception** — off-contract, no framework agreement, above the $50k MRO ceiling
  → drafted + routed to buyer. Buyer *approves to proceed*.
- **Sourcing exception** — only one compliant bid returned (below the 3-bid threshold)
  → single-source justification. Buyer *approves to proceed*.
- **PO exception** — quote $96,400 vs benchmark + supplier not on a framework + over threshold
  → PO **blocked**; recommended **Escalate**. Run STOPS. Terminal pill: "Escalated · buyer review".

### Flow ③ "gearbox" — back-office exceptions (NEW · 2-step run)
Line drive gearbox · Containerboard M042 · Apex Drive Systems (vendor 201185) · PO-77642 · $72,000.
Order already placed; run picks up at delivery & payment:
- **Fulfillment exception** — short / damaged delivery: 1 of 2 units received, 2nd damaged in
  transit → **quality hold**, partial GR. Buyer *approves partial receipt to proceed*.
- **Invoices payment exception** — invoice INV-ADS-4419 lists a NEW bank account that does
  not match vendor master 201185 → **bank-change fraud**, payment **blocked**, recommended
  **Reject/Escalate**. Run STOPS. Terminal pill: "Payment blocked · fraud review".
  Cross-links to the Supplier-onboarding (KYB) console.

### Standalone consoles — full rework, own data
- **Vendor master → "Supplier onboarding"** (KYB / due-diligence): queue of suppliers under
  review; per-supplier checks = sanctions/OFAC, duplicate, bank verification, tax/EIN. The
  gearbox flow's blocked payment shows as the top queue item, linking the run to the console.
- **Helpdesk → "Procurement helpdesk"**: queue of buyer/supplier tickets, classified +
  deflected, knowledge match, cross-links to PO/invoice/supplier. Own ticket data.

## 3. Engine changes (keep belt behaviour identical)

- `FlowId = "belt" | "pump" | "gearbox"`.
- `flowProgress: Record<FlowId, FlowProgress>`, `FlowProgress = { activeStep, approved,
  decisions: Record<number, Decision>, settled: boolean }`. `decisions` keyed by step INDEX,
  decoupled from the global per-agent `agentOutputs` (consoles keep using agentOutputs).
- Per-flow run registry `flowRuns: Record<FlowId, FlowRun>`:
  `FlowRun = { contextTitle, contextSub, steps: RunStep[], terminalPill(decisions) }`.
- `Workspace` (renamed from `WorkspaceBelt`) reads `flowRuns[view.flow]`.
- `RunStepsRail` takes `decisions` (by index) instead of global `outputs`.
- `onDecision`: approve & not last → advance; approve & last → `approved:true` (paid);
  non-approve → `settled:true`, run halts (later steps stay locked). Terminal pill is
  flow-specific.
- Cockpit "Decisions for you" lists 3 runs (belt/pump/gearbox) via `pendingDecisions`.

## 4. New docs (lightweight but faithful)

- Pump: requisition (off-contract flag), single-bid RFQ comparison, blocked PO.
- Gearbox: short/damaged goods receipt, invoice match with bank-change fraud flag.
- Reuse DocChrome/Paper/SAP-doc patterns; new flow-specific source cards.

## 5. Build order (full build, one flow at a time)

1. Engine generalization + cockpit lists 3 runs → verify belt still works.
2. Flow ② pump end-to-end (docs + sources + exception decisions) → verify.
3. Flow ③ gearbox end-to-end → verify.
4. Rework Vendor (KYB) + Helpdesk consoles with own data + cross-links → verify.

## 6. Constraints
Fabricated data only · layout stays simple/calm · buttons never wrap · nav labels ≤3 words ·
verify tsc + build + Chrome MCP on 5174.
