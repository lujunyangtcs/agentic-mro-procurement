# Client Tail Spend – AI Agent Input / Output Samples (first 5 use cases, sheet order)

Folder per use case → folder per AI agent → `input.json` and `output.json`. Each use case has a `case_manifest.json` (flow path, agent chain, outcome, human touchpoints).

| Folder | Use case | Agents | Lane outcome |
|---|---|---|---|
| UC06_Software_Licence_Reuse | Licence reuse before buy | Intake → Spend Intelligence → Channel Decision | Touchless |
| UC09_Quote_Benchmarking_Negotiation | Quote benchmarking | Sourcing → Bid Scoring | HiTL review (TCS) |
| UC04_Preferred_Supplier_Redirect | Preferred supplier | Supplier Match → Onboarding → Risk Screening | HiTL (Client Category Lead, Risk) |
| UC10_Clause_Risk_To_Cost_Advisor | Clause risk | Contract → Clause Compare | HiTL (Delegated Approver, Legal) |
| UC02_Specification_Challenge | Spec challenge | Intake (spec) → Sourcing | Touchless |

Common envelope: `meta` (case, agent, flow step, timestamp) • `confidence` (score + weighted signals) • `guardrail_checks` • `lane_decision` (TOUCHLESS / HiTL, band, route_to persona & org) • `audit`.
Confidence policy: ≥0.90 touchless (5% post-audit by TCS AI Ops); 0.70–0.89 TCS review; <0.70 Client decides; a tripped guardrail always routes to HiTL.
All data is synthetic and illustrative (names, IDs, prices); thresholds are proposed defaults to calibrate in Month Zero.
