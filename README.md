# P2P Workforce — demo

Agentic-AI **procure-to-pay** demo for a global paper & packaging manufacturer
(fictional "Northgate Paper"). CXO audience. A six-agent procurement workforce
runs requisition → sourcing → PO → goods receipt → invoice → payment, halting
on policy breaches, price variance, and payment fraud so a human approves every
exception. Built on a captured enterprise design system (mint #C3E6E1, DM Sans,
pill CTAs, sentence case) with an extended set of AI-motion primitives.

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. The demo starts on the P2P Cockpit.

## Stack

- Vite 8 + React 19 + TypeScript
- Tailwind v4 with the design-system token foundation (`src/index.css`)
- `lucide-react` icons, `motion` for handoff transitions, `clsx` +
  `tailwind-merge` for class composition
- No backend, no router — view state is a discriminated union in
  `src/state.tsx` (`login | cockpit | workspace | agent | doc`)

## The workforce

Six specialist agents plus a coordinator, each with a configurable autonomy
level (L2 assistant · L3 supervised · L4 autonomous) and a USD auto-threshold:

| Agent | Role | Auto-threshold |
|---|---|---|
| Intake | PR processing | $5k |
| Sourcing | Tactical & spot buying | $25k |
| PO | PO management | $25k |
| Invoice | Invoice resolution | $10k |
| Vendor (MDM) | Master-data support | manual |
| Orchestrator | P2P process coordinator | manual |

Each approved step triggers a visible baton-pass handoff to the next agent.
Anything over threshold, off-contract, or fraud-flagged escalates to a human
with an immutable audit reference (e.g. `EXC-48630-PO`).

## Demo script

Four transaction flows, all reachable from the Cockpit. The Cockpit leads with
KPIs (money under management, touchless %, capacity freed), a pipeline strip,
pending decisions, and an overdue-payments panel.

### Flow 1 — Belt spot-buy ★ (the hero, happy path)

1. Cockpit → open the **corrugator belt** requisition (Northgate mill M042,
   requester Dale Whitfield).
2. Workspace auto-advances through 4 agent steps: **Intake** drafts PR-48201
   ($48,200, on-contract, on-spec 98%) → **Sourcing** runs three-bid
   RFQ-6600-2241 and awards BeltPro Industrial (−8% vs list, 5-day lead) →
   **PO** posts PO-77310 to SAP and confirms with the supplier → **Invoice**
   runs a clean four-way match (INV-BPI-5567, $0 variance, fraud score 0.02).
3. Each step shows AI reasoning, the artifact, and a decision card.
4. Final step posts to MIRO and schedules the F110 payment (Net 30) — the
   clean close, payment-scheduled card.

### Flow 2 — Pump exception (front-office escalation)

1. Cockpit → open the **boiler feed pump** requisition (Power House P051).
2. Intake drafts PR-48630 ($96,400) and flags it: off-contract **and** above
   the $50k MRO ceiling.
3. Sourcing runs RFQ-6600-2390 — only Cascade Fluid Systems returns a
   compliant quote (single-source, below the three-bid threshold).
4. PO is **blocked**: 24% over the last comparable buy, no framework, above the
   touchless limit. The run halts and routes to the Category Manager with
   evidence bundle `EXC-48630-PO`.

### Flow 3 — Gearbox fraud hold (back-office escalation)

1. Cockpit → open the **drive gearbox** invoice (supplier Apex Drive Systems).
2. PO Management posts a partial goods receipt (1 of 2 — unit 2 damaged in
   transit), raising a quality hold.
3. Invoice blocks INV-ADS-4419: quantity mismatch (invoiced 2, received 1)
   **and** a mid-stream bank-account change (IBAN ·· 4471 → ·· 9920,
   unverified, beneficiary mismatch) → fraud score 0.86.
4. Payment is held and routed to the fraud desk (`EXC-ADS-4419-PAY`) pending a
   signed bank-change letter and a successful callback.

### Flow 4 — Collections (order-to-cash dunning)

1. Cockpit → open the **BlueRidge Foods** overdue receivable ($208,400, 47 days
   past Net-45).
2. The O2C chain is pre-posted (sales order → outbound delivery → customer
   invoice INV-90357). The live step drafts the **tier-4 final dunning notice**.
3. Approve → the notice is sent and the account is queued for follow-up. The
   panel shows the broader run: 31 reminders auto-sent today across 8 accounts
   ($1.84M overdue).

## Files

```
src/
  state.tsx                  view-state machine + context (login/cockpit/workspace/agent/doc)
  index.css                  design-system tokens + AI-motion contracts
  data/
    agents.ts                agent catalog (6 specialists + coordinator) + autonomy config
    flows.ts                 flow definitions (context, steps, timelines)
    flowRuns.tsx             per-flow run registry (3 exception flows + collections)
    runSteps.tsx             belt happy-path run steps (Intake → Sourcing → PO → Invoice)
    cockpit.ts               KPIs, pipeline, pending decisions, overdue payments
    dunning.ts               dunning-tier templates + collections data
  components/
    ds/                      design-system components (copied from the captured design system)
    ai/                      AI-motion primitives: AIDot · StreamingText · SpringIn · CountUp · StaggerList
    blocks/                  cockpit building blocks (KPI strip, pipeline, pill buttons)
    workspace/               topbar · steps rail · AI workspace panel · handoff overlay · complete/payment modals
    docs/
      sap/                   SAP renders: purchase requisition · RFQ comparison · draft PO · invoice match
      o2c/                   order-to-cash docs: sales order · delivery · customer invoice
      finance/               ledger / payment-advice docs
      sources.tsx            source docs (maintenance email, spending policy)
    layout/Sidebar.tsx       work menu + agents card + sign out
    agents/                  per-agent console pages
  views/
    Cockpit.tsx              hub
    Workspace.tsx            run workspace (steps rail + AI panel)
    DocView.tsx              artifact preview (routes by DocId)
    {Intake,Sourcing,PO,Invoice,Vendor,Orchestrator}Console.tsx
    Login.tsx
```

## Design system

All design-system UI components were copied verbatim from the captured
enterprise design system (only the `"use client"` directives removed for Vite). Tokens come from the
DS's `globals.css` and live in `src/index.css` with three extra AI-motion
contracts on top:

- `--motion-duration-stream: 80ms` — per-row stagger on activity logs
- `--motion-duration-spring: 420ms` — decision-card scale-in
- `--motion-duration-pulse: 1800ms` — agent "thinking" dot

`tailwind-merge` + `cn()` follow the same composition pattern the DS uses.

## Standing rules

1. **No procurement jargon** in user-visible copy. Use plain professional
   words: "approval needed", not "authorization gate"; "payment hold", not
   "AP block"; "spend under control", not "maverick-spend fence".
2. **No big-then-small text stacks.** One eyebrow per card max. Body text
   ≥ 14 px. Avoid stacking a 72 px metric on a 12 px sub-caption.
3. **CXO audience.** Money and outcomes lead (spend, touchless %, capacity
   freed). Story-first, no system-trace detail surfaced by default.
4. **Anonymized client.** The buyer is the fictional "Northgate Paper" — never
   surface a real client name, plant, or ticker anywhere in the demo.
5. **A human approves every exception.** Agents draft and recommend; the person
   clicks the decision. Over-threshold, off-contract, and fraud-flagged runs
   always escalate — they never auto-execute.
