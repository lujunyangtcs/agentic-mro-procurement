# Automotive Indirect Procurement Demo Build PRD

Version 1.0 | 7 October 2026 | English development specification

This specification defines the complete build of an anonymous automotive manufacturer's agentic indirect procurement demo. Extend the existing MRO application in `agentic-mro-procurement`, preserve New Request as the main transactional entry, and implement the six operating-model flows from opportunity identification to Finance-validated savings. The result must be a working, connected demo with consistent records, visible evidence and enforceable decision boundaries.

The build includes realistic locations and verified manufacturer part numbers. Transaction values, internal plant and material codes, supplier records, equipment assignments, commercial agreements and approvals are demonstration fixtures. The application and its exported documents must use the neutral identity **Automotive Procurement** and must not display the actual customer's name or logo.

## 1 Product outcome and build scope

The demo must show how a plant request becomes an approved, correctly sourced purchase, how proactive opportunities influence that purchase, and how Finance validates the eventual saving. A presenter must be able to demonstrate a clean touchless path and then show the specific conditions that require human authority.

Keep the existing source-document previews, progressive extraction, agent handoffs, RFQ comparison, supplier conversation and analytics patterns. Expand the business model from individual MRO validations to indirect procurement across maintenance spares, consumables, engineering services and facilities services. Do not interpret the task as replacing names and prices in the current screens.

### 1.1 Included in this build

- Flow 0 Opportunity Pipeline with spend classification, opportunity sizing, Category Lead approval and Finance baseline agreement.
- Flow 1 PR-to-PO with guided intake, policy checks, catalogue and contract matching, opportunity matching, approval and PO dispatch.
- Flow 2 Tail Sourcing with pooling, call-off detection, RFQ, quote comparison, BAFO, competition checks and award.
- Flow 3 Contracting with scope triage, versioned templates, Green/Amber/Red clause comparison, human decisions, simulated signing and repository storage.
- Flow 4 Supplier Onboarding with panel reuse, document validation, risk screening, human bank verification and activation.
- Flow 5 Value Assurance with PO-stage savings, receipt and invoice evidence, leakage recovery, Finance sign-off and governed changes.
- Cross-flow confidence lanes, hard constraints, role-based review, escalation timers, audit history, agent pause and case fallback.
- Existing supplier portal, service desk, requisition list, exception board and control tower, connected to the new records.
- Deterministic scenario replay, bounded free-text intake, reset and simulated time progression.

### 1.2 Demo execution boundary

This is a front-end demonstration build. React state and deterministic mock connectors simulate enterprise events. The build does not require a production backend, live ERP credentials, live supplier screening, a model endpoint, real emails, actual signatures, actual orders or payment execution. A simulated external action must have an explicit event and result in the demo store. It must not claim that a real system received it.

Use brief business copy such as “Demo environment” in the application shell. Place detailed simulation settings in presenter controls, outside normal user flows. Preserve the ability to export the displayed business documents. Production integration requirements are documented in section 20 and are separate from demo acceptance.

### 1.3 Completion definition

All six flows must be executable through their named screens and linked cases. Required decisions must change domain records and derived metrics. No core-flow page may consist only of descriptive agent cards. No happy-path outcome may be obtained by clicking through an unresolved hard constraint. The five primary stories in section 13, their required branches and the acceptance suite in section 22 define completion. These stories replace the previous demo's presenter stories.

## 2 Source basis and current code behavior

The reviewed repository is `https://github.com/lujunyangtcs/agentic-mro-procurement`, pinned to commit `667bad650eb952c3883a04263e0c90f6e2325254`, dated 6 October 2026. Review covered the active application routing, MRO state and data modules, New Request intake, guided workspace, case definitions, source documents, RFQ and onboarding components, exception actions, invoice matching, supplier service desk and analytics selectors. Repository documentation was read as supporting context. Executable code takes precedence where old scripts disagree with it.

The supplied TOM deck contains 21 physical slides. Its visible footer numbers are not a continuous index and extend to 25. All slide references in this PRD use the **physical slide order**. Slides 1–9 explain the operating model and human responsibilities. Slides 10–21 define the agentic extension, confidence lanes, six flows, authority, constraints, measures and memory.

### 2.1 Actual application entry

`src/main.tsx` mounts `Root.tsx`. The root exposes Buyer and Supplier entry cards and launches `src/mro/App.tsx`. The sibling P2P, O2C and Freight applications remain wired in the repository but are not the procurement interface currently exposed at the door. Extend `src/mro` rather than implementing the new procurement requirements in the sibling `src/App.tsx`.

`ProcurementStoreProvider` sits above the entry screen. Its requisitions, invoice tie-outs, supplier conversations and language remain available when the presenter signs out of one seat and enters another. `src/mro/state.tsx` manages navigation and guided-run progress inside the MRO application. That progress is keyed by scenario-level `FlowId`, not by transaction instance.

### 2.2 New Request path as implemented

The work menu opens the intake agent view. `IntakeConsole.tsx` displays three channel cards: Email, Work order and Portal. `intakeChannels.tsx` derives scripted intake content from the first source and extraction stages of the corresponding registered run. The email example uses the `catalogue` filter-bag case, the work-order example uses the `bearing` case, and the portal example uses the `gearbox` case.

The intake conversation animates extraction and fills a requisition preview. Raising the request opens a receipt. Entering the run resets that scenario's progress, marks step zero approved and opens its workspace at index one, carrying the selected contract/RFQ route. It does not create a new business record. The underlying requisitions already exist in the seed dataset.

An arbitrary typed question currently reuses `chips[0].spec` while replacing its displayed question. It therefore plays the same predefined extraction regardless of the user's actual specification. A new build must replace this behavior with the bounded intake behavior in section 6.

### 2.3 Guided workspace as implemented

`flowRuns.tsx` registers eight scenario keys: `catalogue`, `bearing`, `pump`, `gearbox`, `risk`, `compliance`, `onboarding` and `off-catalogue`. These keys do not correspond to the TOM's Flow 0–5 identifiers. For example, `bearing` currently contains a pump-diaphragm purchase, while `pump` contains a mechanical-seal request. Preserve these only as temporary migration aliases.

`Workspace.tsx` reads a scenario's scripted steps, previews evidence, shows the produced artifact, and advances after decisions. Choosing the contract route filters out an RFQ step and renumbers the remaining steps. Decisions are keyed by numerical step index. Approving an intermediate step hands off to the next agent. Approving the final step settles the run. Rejecting or escalating settles it as halted. Some flagged cases can continue with a pending item.

The main MRO workspace does not call the business store's requisition-release or invoice-update actions when it settles. Its progress and the shared business records can therefore describe different outcomes. Editable extraction fields are local wizard state, while many final documents are prebuilt React nodes. Edited values need to become transaction data in the new build.

### 2.4 Existing strengths to reuse

| Existing capability | Code anchor | Reuse decision |
| --- | --- | --- |
| Buyer and supplier entry with shared records | `src/Root.tsx`, `src/views/EntryLogin.tsx` | Retain entry pattern and shared store lifetime |
| Channel intake and extracted PR preview | `src/mro/views/IntakeConsole.tsx`, `data/intakeChannels.tsx` | Retain presentation, replace replay-only submission |
| Source files and produced documents | `components/workspace/SourceFilesPanel.tsx`, `SourceArtifactModal.tsx` | Retain evidence preview and source highlighting |
| Progressive extraction and editable fields | `components/workspace/ExtractionWizard.tsx` | Persist edits and recompute downstream artifacts |
| Catalogue and volume-break story | `data/filterBagCase.tsx`, `components/workspace/BuyingInsight.tsx` | Rebuild with canonical automotive fixtures |
| RFQ generation and quote review | `components/workspace/RfqFlow.tsx`, `QuoteReview.tsx` | Retain interaction and add award rules |
| Supplier registration and screening documents | `data/onboardingCase.tsx` | Retain document-reading pattern and add actual activation state |
| Exceptions update related business pages | `data/store.tsx`, `views/Exceptions.tsx` | Retain shared-state concept, strengthen checks |
| Invoice and contract comparison | `views/InvoiceMatching.tsx`, `FourWayMatchGrid.tsx` | Retain grid, add value record and Finance signature |
| Supplier factual and strategic conversations | `views/SupplierPortal.tsx`, `ServiceDesk.tsx` | Retain and route commercial decisions to client authority |
| Spend charts and dataset-driven answers | `views/ControlTower.tsx`, `data/spend.ts` | Retain charts, unify site model and add actionable opportunities |
| Scripted multilingual rendering and HTML export | `lib/i18n.tsx`, `lib/exportDoc.ts` | Preserve supported languages and scrub legacy identities |

### 2.5 Gaps that must be corrected

| Gap | Observed behavior | Required outcome |
| --- | --- | --- |
| Brand and industry drift | Active data mixes legacy names, electronics, deburring, coatings and other plant contexts | One anonymous automotive setting across UI and exports |
| Currency and geography | USD formatter and legacy country/site types drive most records | GBP-first pricing and shared UK site registry |
| Request creation | Intake replays a pre-existing PR | Submit creates an instance and a durable case in the demo store |
| Flow identity | One progress entry per scenario | Independent progress per case with TOM flow tags |
| Editable extraction | Wizard changes can remain local | Changes persist, regenerate documents and invalidate affected checks |
| Shared-state consistency | Guided completion differs from seed record status | One domain event updates every relevant view |
| Confidence | Default configuration has 0.95, but displayed confidence is mostly fixture copy | Central 0.90/0.70 lane evaluation with evidence and policy snapshot |
| Approval enforcement | Generic approve/continue buttons can advance flagged steps | Specific authorised actions and non-bypassable release checks |
| Supplier competition | Existing onboarding story compares two quotes without the new competition gate | Three compliant quotes or signed sole-source approval |
| Proactive pipeline | Static analytics and contextual insights exist | Executable opportunity approval and live PR matching |
| Contract review | Contract evidence exists, but no complete clause-band workflow | Operable triage, redlines, approval, signing and storage |
| Savings validation | Insights and PO savings can imply final savings | Separate expected, invoice-evidenced and Finance-validated stages |
| Payment wording | Some completion pills say paid while documents only schedule payment | Display matched, scheduled or paid only from the matching event |
| Governance | Agent profiles describe behavior | Governed changes, rule versions, audit samples and agent pause |

`DEMO-SCRIPT.md` contains legacy names and scenarios that disagree with current fixtures. Rewrite it after the build. Do not use it to override this specification or the implemented case data.

## 3 Operating model and interaction design

The demo has two routes into buying. The reactive route begins with New Request. The proactive route begins with a spend refresh and an approved opportunity. They meet when Channel Decision checks an incoming PR against live catalogue items, contracts, rate cards and pipeline opportunities. Sourcing, contracting and onboarding are linked work packages under the same procurement case. Flow 5 preserves the evidence from award through invoice.

TCS personnel perform transaction preparation, review, corrections and follow-up. Client roles own spend commitments above the standing automatic authority, material supplier awards, commercial and legal exceptions, bank verification, risk decisions, baselines and savings sign-off. Specialist agents execute only inside an approved policy envelope. Every human decision records the person, role, organisation, time, evidence and recommendation. Every override also records its reason.

### 3.1 Preserve the current visual approach

Retain the calm card-based console, existing typography, source previews, step rail, staged extraction and handoff animation. Add business pages rather than introducing a second application shell. Use short action labels, clear amounts and concise recommendations. Keep buttons on one line. Use agent icons from the existing icon system. Do not copy the deck's swimlanes literally into the interface.

Use **New Request** consistently in navigation and primary actions. The main workspace shows the case reference, item/service, site, value, current TOM flow, lane and responsible owner. A read-only process strip shows completed and current work packages. Selecting a completed step opens its evidence without replaying actions.

### 3.2 Proposed navigation and surfaces

| Navigation label | Purpose | Implementation |
| --- | --- | --- |
| My Desk | Requests, approvals, exceptions, opportunity alerts and value awaiting sign-off | Extend `Cockpit.tsx` |
| New Request | Guided form, captured email/Teams content and work-order demand | Extend `IntakeConsole.tsx` |
| Requisitions | Searchable PRs with linked cases and purchasing status | Extend `Requisitions.tsx` |
| Opportunities | Spend findings, baseline, approval, pipeline and matched demand | New `OpportunityPipeline.tsx` |
| Sourcing | Pools, RFQs, bids, comparison, BAFO and awards | New `SourcingWorkbench.tsx` using existing components |
| Contracts | Scope, clause comparison, approvals, signature and repository status | New `ContractWorkbench.tsx` |
| Suppliers | Panel matches, registration, risk, bank verification and activation | New `SupplierWorkbench.tsx` |
| Exceptions | Cross-flow queues by reason, owner, SLA and blocked action | Extend `Exceptions.tsx` |
| Invoice Matching | PO/receipt/invoice/contract and baseline evidence | Extend `InvoiceMatching.tsx` |
| Value Assurance | Award records, expected and validated savings, leakage and Finance queue | New `ValueAssurance.tsx` |
| Control Tower | Spend, channels, suppliers, pipeline, process and value analytics | Extend `ControlTower.tsx` |
| Governance | Agent health, audit samples, pause, council decisions and rule versions | New `GovernanceConsole.tsx` |
| Service Desk | Supplier questions and human commercial response queue | Retain and connect existing page |

Keep Supplier entry as a separate seat. Show only that supplier's own orders, invoices, registration tasks, questions and replies. Client decision tasks open in the buyer-side workbench through a clearly labelled **Review as** role selector in presenter controls. This selector simulates identity for the demo and is not production authentication. Normal screens still show the active role and its permitted decisions.

### 3.3 Workspace content contract

Every meaningful agent step shows: the source records it read, the checks and their results, a brief evidence-based recommendation, the produced artifact, and the next owner or action. Show a short decision rationale rather than an invented private reasoning transcript. Existing streamed text can animate these observable checks.

A step that executes automatically displays **Executed under policy** with the policy version and evidence. **View evidence** and **Pause** do not count as purchase approvals. A step requiring human authority displays **Awaiting Budget Holder**, **Awaiting Legal**, **Awaiting Finance** or the applicable owner. Opening an evidence document never commits a business action.

## 4 Roles and authority

| Role | Organisation | Permitted actions | Decisions it cannot make |
| --- | --- | --- | --- |
| Requester | Client | Submit need, confirm specification, revise returned PR, confirm receipt | Own supplier approval or higher spend approval |
| Application Owner | Client | Approve reusable licence pools, functional fit and entitlement assignments | Change security policy or approve unrelated spend |
| IT Security | Client | Approve access-level and licence-tier changes | Treat available seats as permission to grant new access |
| Technical Owner | Client | Confirm essential attributes and application-specific equivalence | Accept supplier award or waive competition alone |
| Buy Desk Analyst | TCS | Correct coding, recommend channel, prepare RFQ and evidence | Commit above authority, award above £30K, accept Amber/Red |
| Contract Analyst | TCS | Draft, compare clauses, prepare recommendation | Approve Amber or Red deviations |
| Value Analyst | TCS | Calculate expected savings, assemble evidence, chase leakage | Validate its own savings claim |
| Buy Desk Lead | TCS | Reassign queues, coordinate fallback and escalation | Raise limits or change policy |
| AI Ops Steward | TCS | Pause agents, lower operational lane availability, review samples | Widen lanes or change approved thresholds alone |
| Budget Holder | Client | Approve spend within own configured DoA | Approve above own limit |
| Category Lead | Client | Pipeline, material awards, sole-source justification and commercial decisions | Accept Red legal clauses or approve banking alone |
| Delegated Approver | Client | Amber deviations inside the approved clause band | Accept Red or unknown clauses |
| Legal | Client | Red clauses and contracts outside desk scope | Finance savings or bank verification |
| Finance BP | Client | Agree baselines, review value evidence, sign savings | Sanctions clearance or legal deviations |
| Finance Controller | Client | Bank mismatch/fraud escalation and exceptional financial authority | Leave an open bank mismatch and activate anyway |
| Risk Analyst and Risk Committee | Client | Investigate risk and identity matches, decide within assigned risk authority | Activate with an open sanctions hit |
| Procurement Head and Value Council | Client and TCS as appropriate | Escalations, policy change approval, lane widening and governance | Bypass any hard constraint |
| Supplier | External | Submit bids, registration documents, redlines, acknowledgements and questions | View other suppliers' bids or approve internal records |

For demo DoA, configure Budget Holder authority at £30,000, Category Lead financial authority at £100,000 and Procurement Head at £250,000. These amounts are illustrative build settings, not a claim about actual client delegation. DoA must be separate from award authority: a £38,400 service can require a Category Lead award and a higher financial approver even after the analyst recommends it.

## 5 Decision engine and non-bypassable controls

Implement a single pure decision service, such as `domain/evaluateGate.ts`, that every action invokes. Evaluate scope and hard constraints first, then domain authority and lane eligibility, then confidence. A confidence score never repairs a failed control. A reviewed case proceeds only when the required evidence or valid approval has actually been recorded.

### 5.1 Value bands and purchasing channels

| Requested commitment in GBP | Default channel without a valid existing agreement | Award behavior |
| --- | --- | --- |
| Below £3,000 | Catalogue or P-Card when eligible | Apply standing approval policy and category exclusions |
| £3,000 through £30,000 inclusive | Spot buy / e-RFx | Auto-award only if all Flow 2 conditions pass |
| Above £30,000 and below £100,000 | LDS, limited competitive sourcing | Human award |
| £100,000 and below £250,000 | RFx / aggregated tender | Human award and applicable financial approval |
| £250,000 or higher | Strategic procurement handoff | Desk cannot commit or finalise automatically |

This build resolves the £30,000 boundary using the agentic Flow 2 rule “≤£30K”. Exactly £100,000 enters RFx. Exactly £250,000 routes outside the desk because the contracting scope is stated as below £250K. Existing valid contracts and rate cards can support call-off at other values, but they do not remove DoA or applicable approval checks. Do not artificially split a pooled requirement to fit a lower band.

Use `autoApproveLimitGBP = 3000` as the initial **illustrative** demo ceiling. Eligibility also requires approved budget, approved standing request policy, allowed category, live agreement and supplier clearance. Crossing the ceiling adds a Budget Holder task. Flow 2's £30K auto-award ceiling does not automatically approve the spend: award selection and spend commitment are separate gates. Requests below £3K without a suitable catalogue/P-Card route can still enter a competitive exception workflow.

### 5.2 Confidence lanes

| Effective score | Initial lane | Behavior |
| --- | --- | --- |
| At least 0.90 | Touchless candidate | Execute only if controls, domain authority and operational state permit |
| At least 0.70 and below 0.90 | TCS review | Analyst confirms or corrects data/channel and the engine reevaluates |
| Below 0.70 | Client decision | Show evidence and route to the correct named authority |

Scores derive from six dimensions in physical slide 11: completeness, classification, match strength, price benchmark, supplier status and pattern history. For demo calculation use configurable weights 0.20, 0.15, 0.25, 0.15, 0.15 and 0.10 respectively. These weights are proposed demo settings. Store component scores and the weight version. They are not validated probabilities and must not be described as measured accuracy.

Incomplete mandatory information, ambiguous identity, expired evidence or a paused pattern blocks action independently of the aggregate score. Where a dimension is inapplicable, record its reason and use an explicit pattern-specific weighting rule. Do not silently replace missing data with a perfect score. Preset scenario quality values may be deterministic, but the displayed lane must be computed from them and from current controls.

### 5.3 Hard constraints

| Control ID | Constraint | Required blocking behavior |
| --- | --- | --- |
| HC01 | No PO without an approved request | Hold release until current request version is approved |
| HC02 | No agent commitment above its standing approval envelope or human DoA | Create the correct spend approval task |
| HC03 | No PO to an inactive or uncleared supplier | Hold award execution/PO release and open supplier work |
| HC04 | No competitive award without three valid quotes or sole-source sign-off | Extend RFQ once, then seek authorised sign-off |
| HC05 | No clause accepted outside the library; Red always Legal | Hold contract finalisation and dependent PO |
| HC06 | No activation with an open sanctions hit | Block activation until investigation clears the hit with evidence |
| HC07 | Bank details must be verified by a client person | Hold new activation and changed bank use until callback is recorded |
| HC08 | No savings claim without invoice evidence and Finance sign-off | Keep value in expected/evidenced, exclude from validated total |
| HC09 | No rule/threshold change without Value Council approval | Keep proposed version inactive |
| HC10 | Every agent action has evidence and an audit event | Block unsupported action and route to review |

Apply the additional TOM guards: no duplicate supplier master, no requester approving its own supplier, no acceptance outside delegated authority, and no PO when a required contract is not stored. Contract call-offs reference the existing contract's approved sourcing authority. A new spot award cannot relabel itself a call-off to evade competition.

Generic **Approve anyway** and **Continue with flags** must not release a PO, activate a supplier, finalise a Red clause or validate savings. A correction may resolve an exception. An authorised sole-source signature may satisfy HC04. An open sanctions match cannot be waived by increasing confidence or clicking Risk approval.

### 5.4 Standing approval and audit semantics

Automatic request approval records actor type `policy`, the approved policy version, budget reservation and applicable standing mandate. Never invent a human signature. Human decisions record the current case revision and requested commitment. Material changes to quantity, specification, supplier, terms or value invalidate affected approvals and require reevaluation. Applying a published contracted quantity break is automatic only where the agreement, site coverage and spending envelope authorise it.

## 6 Flow 1 PR to PO through New Request

Sources: physical slides 2, 5, 10, 11 and 13. New Request remains the most prominent action on My Desk.

### 6.1 Intake channels and actual submission

Provide a guided form and captured Email, Teams and Work Order examples. Email and Teams are capture channels into the same guided intake. A captured message with missing mandatory data creates a clarification task and a prefilled form. It must not create a parallel informal purchasing route. This combines the deck's form-first discipline with its agentic email/Teams capture front door.

The request fields are item or service description, manufacturer part number if known, quantity, UoM, site, delivery location, needed-by date, requester, purpose, cost centre, starting-cost reference, urgency and attachments. Structured service requests include scope and service period. Supplier preference is optional and never establishes supplier approval.

Submission persists a new Request and ProcurementCase with unique IDs. Reopening the same submitted channel item opens the existing case rather than creating a duplicate. Two different requests using the same scenario remain independent cases. A submitted unsupported description stays a draft or enters clarification; it never inherits unrelated filter-bag or seal facts.

### 6.2 Free-text behavior for the front-end demo

The demo parser must support documented patterns for the seeded catalogue materials and service scopes. It extracts explicit quantities, dates and known site/item names, presents inferred fields for confirmation, and looks up account assignment from master data. Unrecognised material, site, quantity or UoM produces a missing-field warning and prevents submission until corrected. Preserve the original text alongside the structured record.

Allow edits before submission. Persist edits from the existing extraction wizard. A quantity change must update the PR, price-break calculation, approval route, PO and savings. A change to payment terms must require a contractual or authorised basis. The old preset chips remain helpful starting examples, but they must populate editable draft records rather than replay unmodifiable transactions.

### 6.3 Steps and branches

1. **Intake, F1 1.0:** capture the need and starting cost, identify the requester and plant, and generate a draft PR with evidence references.
2. **Classify and Policy, F1 2.0–3.0:** validate material/service, account assignment, category, risk, duplicate demand, usable stock, budget and channel eligibility. Retain existing stock/duplicate/warranty checks when the item warrants them. Warranty is supporting evidence, not a mandatory step for every indirect service or consumable.
3. **Review, F1 3.1–3.2:** send 0.70–0.89 coding/channel cases to TCS; send below-0.70 cases or authority conditions to the correct client owner. Resolving a hard-stop condition reruns the gate.
4. **Channel Decision, F1 4.0:** check live catalogue, contract/rate card and approved pipeline matches. Show why the chosen route applies and compare alternatives where relevant.
5. **Approval, F1 5.0–5.1:** apply standing approval only where eligible. Above the demo ceiling create a Budget Holder task. No match creates Flow 2 work. New supplier need creates Flow 4. A required new contract creates Flow 3 after award.
6. **PO, F1 6.0:** rerun request approval, current value, supplier and required contract gates. Create and dispatch the mock PO once. Preserve separate lines, plant delivery dates and allocations. Create the expected value record and link Flow 5.
7. **Follow-up:** collect supplier acknowledgement, receipt and invoice events in the related case. Acknowledgement price/date discrepancies create amendment tasks. Do not show a receipt or invoice before its simulated event occurs.

An above-limit approved request can return from a human lane and execute subsequent permitted steps automatically. “Touchless request” still remains false if substantive human purchase decisions occurred. Transfer-before-buy or warranty outcomes must keep separate cost-avoidance classifications and must not be automatically included in validated sourcing savings.

### 6.4 Request returns and failures

Policy/budget failures show the affected fields and the owner. Allow correction for up to five simulated days, then close with a reason if not corrected. Rejected requests may be revised twice, preserving earlier revisions; a third failed loop closes the request. A PO dispatch failure retries up to three times with back-off, parks the case and creates a manual fallback task due within four hours. A supplier acknowledgement missing after 48 hours creates a chase task.

## 7 Flow 0 Proactive opportunity pipeline

Sources: physical slides 1, 3, 4 and 12. Add Opportunities as an actionable extension of the existing Control Tower.

1. A monthly mock spend refresh produces a versioned snapshot. Show line count, supplier attribution coverage and the source period.
2. Spend Intelligence cleanses and classifies every line. High-confidence lines continue. Low-confidence lines create a TCS Spend Analyst task. Missing supplier IDs link to a data-remediation task in Suppliers without inventing a supplier identity.
3. Opportunity analysis detects catalogue gaps, overlapping suppliers/panels, price variance and compatible demand pooling. Show the exact lines and contracts that support each candidate.
4. The Category Lead accepts or parks the opportunity, recording a reason. Finance agrees the baseline and methodology. Both decisions are required before the item becomes live in the pipeline.
5. The Pipeline Agent assigns the lever, owner, wave, due date and scope. A tender wave opens Flow 2; supplier/panel enablement opens Flow 4; price leakage opens Flow 5.
6. Channel Decision checks a live PR against the active opportunity using material/service, site scope, agreement, dates and required terms. A match records the opportunity ID. An unapproved or expired opportunity cannot authorise a buy.

An approved opportunity can enable matching under already-approved buying rules. If it changes a policy, threshold, catalogue publication rule or clause library, publish only after the separate Value Council approval. This resolves the deck's pipeline-rule update against its mandatory governance rule.

Show statuses `identified`, `analyst-review`, `awaiting-category`, `awaiting-baseline`, `approved`, `live`, `matched`, `parked` and `expired`. At five days remind the approver, at ten days escalate to Procurement Head. Re-prioritise an unmatched live item at 90 days. A parked candidate remains visible for the next monthly cycle.

The main worked opportunity is idle software licences and renewal demand, linked to Story 1. A supporting opportunity is recurring bearing demand across Solihull, Halewood and Wolverhampton. It reuses the existing volume-break interaction and connects to New Request. A data-remediation branch shows a missing supplier ID. These are functional Flow 0 examples, not additional primary presenter stories.

## 8 Flow 2 Tail sourcing

Sources: physical slides 3, 6, 11 and 14. Sourcing opens from a PR without a live match, an approved opportunity wave, or contract expiry.

### 8.1 Pooling and competitive event

The Aggregation Agent proposes a pool only when specifications, manufacturer variant, UoM, required dates and commercial conditions are compatible. Show the included PRs, sites, quantities, baseline and deadline. Pool for at most five days. Urgent line-stop requirements may bypass waiting, with an urgency reason and retained approval/competition checks.

Check existing framework/rate card before issuing RFQ. A valid agreement opens a call-off under Flow 1. Otherwise choose the applicable value-band channel. Prepare scope, quantity, sites, need-by date, terms and comparison criteria. Issue mock RFQs to at least three eligible suppliers where available. Suppliers return structured bids and original quote evidence.

Count **valid comparable quotes**, not invitations. Exclude declines, duplicate supplier identities, incomplete scope, expired offers and noncompliant bids from the count. The initial bid window is three days. Fewer than three quotes extends it once by 48 hours. If still insufficient, create a Category Lead sole-source/limited-competition task. Its signature records why competition was insufficient and the chosen supplier. Otherwise re-source or close.

### 8.2 Evaluation and award

Show quote price, freight, required extras, total evaluated cost, lead time, scope compliance, supplier status, risk, benchmark variance and evidence. A higher-priced but operationally suitable bid can be recommended with a stated tradeoff. Score display must not hide a supplier hold or legal restriction.

Auto-award eligibility requires value at or below £30,000, three valid quotes, at least 0.90 confidence, benchmark compliance, eligible active/risk-cleared supplier and the standing award rule. Spend approval remains separate. A new supplier can be selected conditionally by a human, but no final award execution or PO occurs before clearance and activation.

Above £30,000, a Buy Desk Analyst prepares the recommendation and BAFO pack, while the Category Lead decides. Allow at most two BAFO rounds. Each round preserves the original and revised quote. A rejected recommendation returns to evaluation or closes without award. Technical sign-off is required for an unfamiliar or changed specification and cannot be replaced by supplier price ranking.

An accepted award creates exactly one Award record and one linked ValueRecord. Flow 3 opens if a contract/order form is needed. Flow 4 opens if the supplier requires activation. Flow 1 resumes PO release only after all dependent holds clear. Display the 3–5 day spot-buy target as a target, with actual demo elapsed time derived from timestamps.

## 9 Flow 3 Contracting and clause bands

Sources: physical slides 7, 11, 15, 18 and 20. Add a functional Contracts workbench rather than using a contract preview as the entire flow.

### 9.1 Triage and draft

Capture award, category, value, risk tier, personal/data access, IP, jurisdiction, template and scope. Cases at £250,000 or above, or in excluded risk categories, route to full client Legal review. They cannot use desk Green automation. Eligible cases generate a draft from the approved, versioned template and clause library.

The workbench shows original text, supplier redline, approved preferred text, approved fallback, band, confidence, source clause ID and assigned owner. A clause without a library match is treated as Red/unknown for routing. Confidence cannot convert it to Green.

### 9.2 Green Amber and Red

- **Green:** every clause uses preferred text or an approved fallback, comparison confidence is at least 0.90, and execution authority is covered by the approved signing mandate. The agent may prepare and execute the mock signing process under that standing mandate. Record it as policy execution, not an invented Legal signature.
- **Amber:** a deviation falls inside the versioned delegated band. The Contract Analyst prepares a recommendation. The client Delegated Approver accepts, counters or rejects with evidence and reason.
- **Red:** liability, data/IP, jurisdiction or other restricted deviation lies outside the band. Client Legal accepts, counters or rejects. Route only after Legal resolves it. A rejected clause returns to renegotiation or Flow 2 re-sourcing.

For the demo clause library, use payment terms, liability and data/IP examples. Label clause text as approved demo library content. Do not assert that these examples represent actual client legal positions. The highest unresolved band controls the case route.

### 9.3 Signature storage and amendment

After all necessary decisions, collect the mock authorised signature and supplier countersignature. Store the executed version and metadata: parties, dates, value, scope, clause decisions, signer authority and repository reference. `contractLive` becomes true only after successful storage. PO release remains blocked if required storage or signing fails.

Supplier redline silence at five days triggers a chase; ten days triggers re-sourcing review. Missing countersignature at ten days escalates to Category Lead. At 48 hours remind internal reviewers and at 72 hours escalate/delegate within authority. E-sign/storage failure creates a manual task due within one day. Include a 10% Amber sample in contract QA, separate from the general 5% touchless audit.

Renewal, amendment and scope change create a new contract version and reevaluate affected authority. Clause deviations feed a proposed quarterly library refresh. They do not edit the live clause library without Value Council approval.

## 10 Flow 4 Supplier onboarding and risk

Sources: physical slides 8, 11, 16, 18 and 20. The Supplier workbench must support both panel reuse and genuine new-supplier activation.

1. Match the requirement against approved panels, vendor master and scope. An active, suitable panel match at at least 0.90 can return to Flow 1. Show identity and scope evidence, not only similar names.
2. If no panel fits, capture onboarding justification and send a mock invitation. Collect legal entity, registration/tax evidence, insurance, relevant certifications, ownership, contact and bank evidence. Use masked demo bank data.
3. Validate completeness, validity periods, duplicate identity and document references. Two incomplete-document loops are permitted before closure/remediation review.
4. Run mock financial, legal, cyber and sanctions screening. Low risk with no hits can progress to master-data preparation. Medium risk or gaps go to Risk Analyst. High risk or a sanctions match goes to Risk Committee investigation. An open sanctions hit always blocks activation.
5. The Master Data Agent prepares a record with mandatory supplier ID and group. Draft/pending records cannot receive a PO.
6. A client Finance person verifies bank details by callback using the independently trusted register contact. Record verifier, time, contact source, result and evidence. The requester and the supplier cannot perform this approval.
7. Activate only after required risk approval, valid documents, duplicate clearance, verified bank details and successful mock master sync. Then lift the dependent PO hold and resume the original procurement case.

Store supplier states `invited`, `documents-pending`, `screening`, `risk-review`, `bank-pending`, `ready-to-sync`, `active` and `blocked`. An existing supplier bank change sets `bankChangePending` and restricts use of the changed payment details until reverified. It does not silently rewrite the trusted account.

No registration at five days causes two chasers; at ten days close with reason. Screening timeout creates manual review due within two days. Bank mismatch routes to Finance Controller. Sync failure retries up to three times and creates manual fallback due within four hours. Supplier/customer-visible replies disclose status and required next steps without exposing other suppliers or sensitive internal risk details.

## 11 Flow 5 Value assurance and governance

Sources: physical slides 3, 9, 17, 18, 20 and 21. Value Assurance is a distinct business workbench linked to Invoice Matching and Governance.

### 11.1 One value record from award to invoice

Create one ValueRecord per award. For a contract call-off without a new competitive award, create a stable call-off award-equivalent key. Several PRs, POs or partial invoices may link to the same record. Baseline records are Finance-approved and versioned. Record quantity, UoM, unit baseline, source period, exclusions and methodology. Freeze the applicable baseline at the value record revision.

At PO release calculate **Expected savings at PO**. At receipt/invoice verify actual quantity, agreed price, contract/rate card, relevant scope acceptance and baseline. This produces **Invoice-evidenced savings**. Client Finance then signs or rejects the value record, producing **Finance-validated savings**. Even a clean automatic invoice match still requires the Finance signature for a claimed saving.

Use these states: `expected`, `awaiting-invoice`, `evidenced`, `leakage-open`, `awaiting-finance`, `validated`, `not-claimed` and `lapsed`. Never use “realised” or “validated” for an unsigned PO projection. Keep payment status in a separate record. The core demo ends at validated value, not at a fabricated paid event.

### 11.2 Match and leakage

The comparison includes PO, goods receipt/service acceptance, invoice and contract where applicable. A consumable goods receipt proves quantity, not contractual unit price. Display a dash as not applicable in price/terms cells rather than a failed match. Services use signed acceptance evidence. The baseline comparison is a separate value calculation, not a fourth transactional document masquerading as a goods receipt.

Invoice price or quantity variance creates leakage with affected line IDs, amount, reason and owner. TCS drafts a claim and Category Lead coordinates recovery. A supplier credit note or corrected invoice is an explicit event. A drafted or sent claim alone does not mean recovery. Partial recovery updates remaining leakage and evidence. Finance may validate the supported net value, reject the claim or leave it pending.

Baseline missing/disputed routes to Finance within five days and blocks savings validation. It does not retroactively turn a properly authorised PO into an unapproved purchase. No invoice at 60 days triggers chase/accrual review. At 90 days lapse the unsupported saving. Leakage unresolved at 30 days creates write-off/nonclaim review and a council entry.

### 11.3 Governed changes and memory

The monthly value pack contains expected/evidenced/validated savings, leakage, nonclaims, overrides, SLA failures, audit results and proposed actions. The Value Council approves or rejects changes to rules, thresholds, catalogues and clause libraries. Changes have old/new values, rationale, owner, test evidence, effective date and rollback version.

AI Ops applies only a signed, tested change. Existing cases keep their policy snapshot by default. An explicit migration reevaluates affected cases and records the change. A failed test leaves the current version live. A failed deployment rolls back to the preceding version. No quorum reschedules within five days and escalates if necessary.

Knowledge records store versioned DoA, buying rules, clause libraries, catalogues, contracts, supplier panels, benchmarks and baselines. Case memory stores sources, checks, decisions and linked documents. Learning memory stores proposed improvements. Overrides and audit findings become change signals only after approved governance. A pattern alone is not proof of policy violation.

## 12 Exceptions escalation and agent operations

All workbench pages share one exception model with reason, blocking action, owner role, opened time, due time, severity, evidence and resolution. A case may have several open holds. Resolving one hold does not clear the others. A terminal rejection closes the affected work package and tells the requester what happened.

| Escalation level | Trigger | Owner and behavior |
| --- | --- | --- |
| L1 Operational | Human task over 48h, retries exhausted, supplier silent five days | Buy Desk Lead, reassignment or manual fallback |
| L2 Quality | Pattern overrides above 5%, audit error, low-confidence cluster | AI Ops Steward, lower effective lane availability |
| L3 Policy/commercial | Off-channel request, fewer than three bids, Amber open 72h | Category Lead or Delegated Approver |
| L4 Financial/legal | Above DoA, Red clause, baseline dispute, leakage open 30d | Domain Legal/Finance authority |
| L5 Risk/continuity | Sanctions hit, bank fraud flag, action outside guardrail | Risk Committee or Procurement Head, immediate hold |

The general human-review sequence is reminder before the SLA, reassignment at 48h and authorised delegation/escalation at 72h. Specific Flow 0, supplier, contract and value timers take precedence. Demo timers use elapsed simulated time in `Europe/London`; the default hour SLAs are elapsed hours. Production business calendars and holiday rules remain configuration inputs.

Provide **Pause agent** and **Pause pattern** to AI Ops. Pending permitted actions fall back to the appropriate human queue with their evidence and drafts intact. Pausing cannot retract an already completed action. Resuming reevaluates outstanding gates and does not replay dispatched orders or signed decisions. AI Ops may lower automation immediately to contain an issue. Raising automation requires the Value Council.

Implement deterministic mock failures for ERP dispatch, screening and contract storage. Retry attempts have unique attempt IDs and the same idempotency key. Three failed attempts produce an incident and a fallback task. Unsupported rationale or stale sources blocks action and enters an audit sample. Counterparty chasers are mock events, not actual messages.

## 13 Five primary stories and their builds

The second supplied source is a five-row story matrix. Preserve its listed order. Source row identifiers 6, 9, 4, 10 and 2 are not demo story numbers. Use ST01–ST05 for development and presenter controls, with business titles in normal navigation. These replace the previous demo's presenter stories.

| Story | Business title | Source row | TOM flows | Interventions |
| --- | --- | --- | --- | --- |
| ST01 | Reuse licences before buying | 6 | F0, F1, F5 and renewal branch F2 | T2, T3, T6 |
| ST02 | Negotiate from quote evidence | 9 | F2, F1, F5 | T4, T6 |
| ST03 | Check the panel before onboarding | 4 | F4, F1 and new-supplier branch | T3, T1 |
| ST04 | Resolve contract deviations | 10 | F3, F1, F5 governance | T5 |
| ST05 | Challenge a named specification | 2 | F1, F2, F5 | T4, T2 |

Story choices launch actual cases from New Request or linked work items. They must not create five explanatory landing pages. Each story has a successful path and executable hold/exception branches. The source's 60%, 45%, 50%, 40% and 35% touchless shares are illustrative planning assumptions. Do not present them as measured results from five scripted cases.

### 13.1 ST01 Reuse licences before buying

**Trigger and fixtures.** A Gaydon engineering team asks for 20 additional Engineering Viewer Enterprise seats for the same annual period. This is a fictional application, SKU `SW-EVIEW-STD-ANNUAL`, priced at £120 per seat-year. Original demand is £2,400. Snapshot `SAM-2026-1007` shows six inactive same-tier seats in an Application Owner-approved pool, a fresh entitlement record, compatible role requirements and renewal in 60 days. The recommendation is six reassignments plus 14 purchased seats at £1,680. Administration costs £20. Net avoided cost is £700, or 29.17% of the original request.

Open My Desk, choose New Request and the licence example. Use the existing original-message, agent-work and structured-request layout. Fill application, tier, users, site, service period, purpose and quantity. Submit creates `CASE-ST01-001` and `PR-AP-1001`; it does not immediately buy licences.

| Beat | Action | Visible result and state change | Component plan |
| --- | --- | --- | --- |
| 1 | Submit request | Structured draft becomes a case and PR | Reuse `IntakeConsole`, `PrFormPanel`, `ExtractionWizard` |
| 2 | Read entitlement sources | Owned, assigned, idle and reusable seats reveal with snapshot time | New `LicenceEvidencePanel` in existing `Panel` |
| 3 | Review allocation | 20 seats divide into six reuse and 14 buy; price becomes £1,680 | New `ReuseBuyAllocation`, reuse `CountUp` and `SpringIn` |
| 4 | Confirm mixed route as Buy Desk | Six seat IDs reserved; purchase quantity becomes 14 | New `AllocationConfirm`, reuse decision/handoff shell |
| 5 | Fulfil reuse and release buy | Mock reassignment records and approved 14-seat PO appear | New `InternalFulfilmentCard`, reuse PO/source documents |
| 6 | Receive invoice and verify access | £1,680 invoice plus assignment evidence supports all 20 users | Reuse matching grid, new entitlement evidence rows |
| 7 | Finance signs avoided cost | £700 enters validated cost avoidance, separate from sourcing savings | Shared `ValueSignoffCard` |

**Authority.** Same-tier reuse within an explicitly owner-approved pool, unchanged rights and confidence at least 0.90 may execute under standing approval. New functional access, a different tier or unapproved pool membership requires Application Owner approval. Access-level changes also require IT Security. The main mixed reuse/buy case requires TCS review as stated in the story matrix. Available seats do not establish user access permission.

**Required alternatives.** A six-seat request can reuse all six after reset. Show `Fulfilled internally`, zero PO, zero supplier invoice and an internal fulfillment record. Finance validates cost avoidance using entitlements, assignment and cost evidence. It does not enter invoice-validated sourcing savings. Never fabricate an invoice to complete the no-buy route. A lower-tier recommendation is reviewable, not an automatic downgrade.

**Exceptions.** Demo SAM freshness is 24 hours. Stale records or sync failure drop to manual review due within one day. Reserve seats atomically so two cases cannot reuse the same licence. Requester rejection goes to Application Owner within 48h. No reusable licences and renewal in 90 days or less opens Category Lead renewal sourcing in F2. The monthly idle-seat finding also demonstrates F0 opportunity approval and baseline agreement.

**Measurement.** Preserve original purchase quantity, fulfilled user IDs, purchased quantity, price, period and administration cost. The source's 20–40% avoidance potential is illustrative; £700 comes from this case's actual arithmetic. Do not assert suitable access until assignment and owner evidence confirms it.

### 13.2 ST02 Negotiate from quote evidence

**Trigger and fixtures.** A supplier quotes £50,000 for a Solihull planned-maintenance service. Case `CASE-ST02-001`, PR `PR-AP-1002` and RFQ `RFQ-AP-2002` share the same scope, dates and included costs. Three compliant bids are £50,000, £49,200 and £51,500. An optional £43,000 bid excludes required inspection, so it is shown as noncomparable and does not count. Benchmark is £45,000–£48,000. The initial valid quote is the Finance-approved baseline.

Preferred supplier quote lines are core work £44,000, overtime £3,000, mobilisation £2,000 and inspection £1,000. BAFO changes overtime to £1,000 and mobilisation to zero. Core work and inspection stay unchanged. Final award is £46,000. Expected saving is £4,000, or 8%, with no removed required scope.

| Beat | Action | Visible result and state change | Component plan |
| --- | --- | --- | --- |
| 1 | Open quote or submit service need | Case opens with comparable quote evidence | Reuse `InboundEmailModal`, intake and `RfqFlow` |
| 2 | Analyse quotes | Three valid supplier cards populate; excluded quote shows its reason | Extend `QuoteReview`, source modals |
| 3 | Inspect flagged cost lines | Overtime/mobilisation compare to rates and price history | New `QuoteLineBenchmarkGrid` |
| 4 | Prepare negotiation | Target £46K and fallback £48K show supporting evidence | New `NegotiationPositionCard`, reuse `EmailDraftModal` |
| 5 | Run simulated BAFO | Revised quote animates; original remains reviewable | Extend `RfqFlow`, new `BafoRoundTimeline` |
| 6 | Category Lead awards | Award records chosen revision and competition evidence | New `AwardDecisionCard`, approval shell |
| 7 | Obtain spend/contract clearance | Correct DoA task and linked ST04 contract work open | Reuse `BudgetApprovalSignable` |
| 8 | Dispatch and validate invoice | £46K PO, acceptance and invoice link one value record | Existing PO and invoice components |
| 9 | Finance signs saving | £4,000 enters validated sourcing savings once | Shared `ValueSignoffCard` and derived KPI update |

**Authority.** TCS validates comparability and leads negotiation. The agent drafts positions with evidence and does not make an unapproved commercial commitment. Category Lead accepts the award above £30K. Financial approval is a separate gate. A required contract blocks PO until ST04 completes execution and storage.

**Required branch.** Exclude one compliant quote, leaving two. Award becomes unavailable. Extend once by 48h, then require Category Lead sole-source/limited-competition justification or re-source. Thin history lowers confidence to human review. A bid more than 15% above benchmark without supporting rationale escalates. Limit BAFO to two rounds. Each round preserves original and revised prices and scope.

**Measurement.** Use initial valid quote minus final comparable award, adjusted for scope and commercial terms. A lower price obtained by dropping mandatory inspection is not a saving. ST04 must not claim the same £4,000 again. The matrix's 5–12% range and channel targets are planning inputs, not automatic amounts.

### 13.3 ST03 Check the panel before onboarding

**Trigger and fixtures.** A Wolverhampton business unit asks for a new operational supplier for calibration of two robotic cells. The requested supplier quotes £38,400. A preferred incumbent on `AGR-CAL-2026-01` can deliver the same scope for £36,000 inside the shutdown window. Sources show geography, capability, performance, capacity, valid insurance and active/risk-cleared status. Use `CASE-ST03-001`, `PR-AP-1003` and panel match `PM-3003`.

New Request preserves the named supplier as a preference. Channel Decision checks the panel before opening onboarding.

| Beat | Action | Visible result and state change | Component plan |
| --- | --- | --- | --- |
| 1 | Submit supplier request | Original preference and scope stay on the PR | Reuse intake and structured PR |
| 2 | Match preferred suppliers | Incumbent/requested supplier compare in aligned cards | New `PanelFitCompare`, reuse `ChoiceStage` pattern |
| 3 | Inspect fit | Scope, geography, certifications, commitments and capacity link sources | New `SupplierFitEvidence`, reuse `Scorecard` |
| 4 | Category Lead confirms redirect | Reasoned decision selects incumbent agreement | New `SupplierRouteDecision`, approval shell |
| 5 | Obtain spend approval | £36K request reaches appropriate DoA owner | Existing `BudgetApprovalSignable` |
| 6 | Create call-off and accept service | Existing supplier PO; no new vendor created | Reuse `PurchaseOrderDoc`, new acceptance fixture |
| 7 | Finance signs price saving | £2,400, or 6.25%, is invoice-supported | Shared Value Assurance components |

**Judgment.** Panel membership alone does not prove fit. Scope, capacity, timing and required qualifications all matter. A suitable preapproved panel route can execute inside standing scope. For a business request specifically seeking a new supplier, Category Lead confirms the recommended incumbent fit. Risk and bank authority remain separate.

**Required new-supplier branch.** Mark incumbent capacity unavailable and select justified onboarding. Reuse extraction/screening patterns from `onboardingCase.tsx`, replacing all entities, currency, dates and services. Read registration, tax, insurance and ownership. Run duplicate and screening checks. Stop at client Finance callback. Record verified bank result and master sync, then activate and resume the held PO. A sanctions variant remains blocked. Bank mismatch routes to Finance Controller. Re-entry never creates duplicate masters.

**Measurement.** Record £2,400 like-for-like price saving separately from illustrative £600 onboarding effort avoided. The effort amount is noncash productivity/cost avoidance unless a Finance-approved method establishes otherwise. It never increases invoice-validated savings by default. One redirected request is one avoided onboarding, not proof of 10–25% supplier-base reduction. Measure the source's 4–10% potential only through supported case results.

### 13.4 ST04 Resolve contract deviations

**Trigger and linkage.** ST02's £46,000 award needs a service contract. Its task opens ST04 on `CASE-ST02-001`, contract `CTR-AP-4004`. A standalone presenter launch seeds the upstream award and three-bid evidence as completed. Both launch modes use the same rules and must not create another value record.

The fictional demo library has preferred payment Net 30, a delegated warranty range of 6–12 months and a restricted liability clause. Supplier redlines propose Net 30, six-month warranty and uncapped client liability. They map to Green, Amber and Red. They are example library positions, not actual legal advice or client contract terms.

| Beat | Action | Visible result and state change | Component plan |
| --- | --- | --- | --- |
| 1 | Open contract task | £46K scope passes desk triage; library version visible | Reuse `ConsolePage`, `ContractDoc`, new scope panel |
| 2 | Compare redlines | Clause rows show original/proposed text, band and owner | New `ClauseCompareGrid`, staged source highlights |
| 3 | Resolve Green payment | Preferred text retained under existing authority | New `ClauseBandChip`, existing contract reader |
| 4 | Decide Amber warranty | Delegated Approver counters six months with 12 | New `ClauseDecisionPanel`, signable/modal shell |
| 5 | Refer Red liability | Mandatory Legal task; generic proceed unavailable | New `LegalReviewTask`, shared `ApprovalTaskCard` |
| 6 | Accept countertext and sign | Supplier accepts approved text; authorised mock signature records | Existing email roundtrip, new execution timeline |
| 7 | Store executed version | Repository receipt creates contractLive | New `RepositoryReceipt`, shared async motion |
| 8 | Return to held PO | Contract hold clears on original case | Existing `HandoffOverlay` and PO workspace |

**Controls.** The highest unresolved band determines routing. Green can execute under approved signing mandate and confidence at least 0.90. Amber needs delegated authority. Red or unknown clauses always need Legal. A changed redline increments revision and invalidates affected decisions. Store the reviewed wording and decision evidence.

**Required branches.** An all-Green variant executes and stores touchlessly. Unknown/uncapped text keeps PO blocked until Legal resolves it. A signing/repository outage preserves the approved draft but holds PO and creates a manual task due within one day. Recurring deviations create a proposed quarterly governance refresh, not an immediate rule change.

**Outcome.** Show stored contract, protected warranty/liability terms, decision history and resumed PO. Incremental contract cash savings default to £0 here. Track cycle time and protected terms separately. Do not apply an assumed 2–5% impact or count ST02 savings twice.

### 13.5 ST05 Challenge a named specification

**Trigger and fixtures.** A Halewood maintenance requester specifies 200 SKF 6205 bearings for a non-safety-critical stores conveyor. Original option is £24 each, £4,800 total. Candidate FAG 6205-C is £22 each, £4,400 total. Real manufacturer designations ground the documents. Application suitability, approval status, price and quality history are demo records. Equal dimensions alone do not establish equivalence.

Use `CASE-ST05-001`, `PR-AP-1005`, equivalence record `EQ-AP-5005` and `RFQ-AP-2005`. Compare dimensions, variant/sealing, clearance, load, speed, lubrication, environment, quality, warranty and permitted application. Missing required attributes are unverified. The Technical Owner approves complete demo engineering evidence for this application. Competitive bids are £4,400, £4,600 and £4,700 for the accepted scope.

| Beat | Action | Visible result and state change | Component plan |
| --- | --- | --- | --- |
| 1 | Submit named-brand need | Original specification and £4,800 baseline remain visible | Existing intake and `StructuredPrDoc` |
| 2 | Analyse essential attributes | Compact comparison fills with evidence and unresolved fields | New `TechnicalAttributeGrid`, reuse lookup/scorecards |
| 3 | Review candidate | Criticality, required conditions and fit are shown | New `EquivalentCandidateCard`, choice pattern |
| 4 | Technical Owner signs | Versioned application-specific equivalence recorded | New `TechnicalSignoffCard`, existing approval shell |
| 5 | Buy Desk releases RFQ scope | Approved alternatives widen bidding without dropping warranty | New `SpecificationReleaseCard`, `RfqFlow` |
| 6 | Compare compliant bids | £4,400 recommendation against £4,600/£4,700 | Extend `QuoteReview` |
| 7 | Approve spend and release PO | Budget Holder approval above £3K; selected variant fixed | Existing signable and PO documents |
| 8 | Match and Finance-sign | £400, or 8.33%, becomes validated with invoice evidence | Existing match grid and shared value signoff |

**Authority.** A listed equivalent for exactly the application and criticality can widen RFQ automatically at confidence at least 0.90. This does not authorise shipment of an arbitrary alternative or a safety-critical specification change. A new equivalent needs Technical Owner sign-off. Buy Desk approves supplier-facing wording. Requester rejection needs a reason and routes to Category Lead if unresolved.

**Required branch.** Set safety-critical or quality-flagged. Technical approval becomes mandatory even at score 0.99. A rejected equivalent cannot enter RFQ. A later quality failure opens a governed removal proposal. Remind technical review at 48h, escalate coordination at 72h. Category Lead cannot replace required safety-critical technical approval.

**Measurement.** Keep quantity, accepted specification, logistics and terms comparable. The £400 is 200 × (£24 − £22). Do not monetize risk or warranty without approved evidence. Count actual compliant bidders. The source's 5–10% potential is a planning range, not a guaranteed UI benefit.

### 13.6 Story continuity and replay

Preserve one case ID across related TOM work packages. Launching ST04 from ST02 reuses the award and value record. Presenter controls can reset a story dependency graph or the entire session. Reset clears demo records, progress, reservations, audit sequences and simulated clock consistently. Confirm reset because it discards current work.

F0 is functional through ST01 idle-seat/renewal opportunity and a supporting pooling opportunity. All six flows stay reachable, but the five stories remain the primary narrative. Secondary test fixtures exercise failures rather than adding more main stories.

## 14 Mandatory UI restrictions and motion

These requirements apply to every reused and newly created product component. Claude must treat them as acceptance gates, not optional design preferences.

### 14.1 UI01 Dynamically aligned card heights

Peer cards in the same visual row must have equal outer height based on the tallest card's rendered content. Use CSS grid `align-items: stretch` and card wrappers with `height: 100%`, `min-width: 0` and flex column. Anchor equivalent action areas using `margin-top: auto`. Alignment is per visual row, not one arbitrary fixed height for the page.

Height must respond to data, language, validation, expanded rows and viewport changes. Use a shared layout transition for animated size changes. Prefer normal CSS. Where measurement is essential, use ResizeObserver with cleanup and responsive row grouping. Never clip content, force fixed heights or hide facts to obtain matching bottoms.

**Acceptance:** peer heights differ by no more than one CSS pixel after layout settles at 1440×900, 1280×800 and 1024×768. Repeat after a hold row appears and in each supported language. Matching footer structures align. No fixed height truncates content.

### 14.2 UI02 No paragraph walls and no wrapped text items

Each visible title, label, body text item, button, status, recommendation item and metric caption must occupy at most one physical line in the product UI. Cards may have several short independent evidence rows. They must not contain a paragraph wrapping into multiple lines. Group facts into comparisons, key/value rows, chips and actions.

Define component data as `title`, `metrics`, `evidenceRows`, `status` and `actions`, not long generic `description` strings. Rewrite copy to fit before truncating. Use intentional widths, `min-width: 0` and one-line styles. Critical amounts, identity, actions and blocking reasons must remain visible. Only secondary metadata may ellipsize, with full content reachable in a reader.

If content cannot fit, reduce column count or move peer cards to another row. Do not shrink essential text below 13px, wrap buttons or make the whole page scroll sideways. Dense evidence tables may scroll inside their reader with sticky critical columns. Source documents preserve original physical line breaks, and the reader introduces no additional browser wrapping. Permit internal scrolling/zoom for full original emails and legal text. Downloaded source artifacts remain complete.

Instead of a paragraph announcing licence optimisation, show `6 idle seats available`, `14 seats to buy` and the amount in separate factual rows. Instead of describing competitive sourcing in prose, show `3 compliant quotes`, `Benchmark £45K–£48K` and `Category Lead approval`.

**Acceptance:** no UI text item or action wraps at the supported viewports or during translation. No multi-sentence explanatory paragraph appears in a workbench. Evidence remains available in full. Ellipsis never hides a critical value or required decision.

### 14.3 UI03 Entry click and agent-work animation

Every page entry has a short coherent reveal sequence. Every enabled button has hover/focus/press feedback and visible action-result feedback. Agent work shows source scanning, field highlights, comparison updates and handoffs when the corresponding operation actually runs. A click must not cause an unexplained static jump.

| Interaction | Required motion | Reuse |
| --- | --- | --- |
| Page entry | Header then cards/rows, stagger 40–80ms | `SpringIn`, `StaggerList`, `Reveal` |
| Hover/focus | Border/background or 1–2px lift, 120–180ms | Shared button styles |
| Press | Small scale feedback, 80–120ms | New shared `ActionButton` |
| Async action | Specific working label, progress and duplicate-submit lock | `Spinner`, `TypingDots`, `AgentLiveStrip` |
| Extraction | Source highlight then field reveal at 80–140ms intervals | `ExtractionWizard` |
| Analysis | Evidence rows reveal, compared cells highlight | `QuoteReview`, `StaggerList`, new grids |
| Handoff | Existing baton-pass and destination owner | `HandoffOverlay` |
| Decision | Chip changes, queue updates and KPI delta | `AIDot`, `CountUp`, toast |
| Modal/drawer | Backdrop/fade and small scale/slide, 180–260ms | Existing modal/SpringIn patterns |
| Chart/filter | Data transition and active filter feedback | `useChartAnimation`, Recharts |
| Height change | Row-aligned layout transition | Existing `motion` dependency |

Use AI work animation for an agent operation, not a fake spinner for every tab or document open. Idle buttons remain responsive without endless distracting motion. A paused agent stops its running indicator. Observable checks use short factual lines instead of long streamed paragraphs.

Respect reduced motion using immediate state, progress text and focus feedback. Timers animate presentation, never grant authority. Unmount cleanup cancels animation; persisted operations continue in the store/controller. Returning cannot resend an RFQ. **Skip animation** in presenter controls never skips a gate.

**Acceptance:** every page/modal/action has visible feedback, no dead click and no indefinite spinner. Double click yields one event. Hidden-tab and reduced-motion behavior completes correctly. Required decisions remain on screen until acted upon.

### 14.4 UI04 Business copy without generated-sounding claims

Show objects, evidence, checks, owners and actions directly. Do not announce a capability and then describe the current page as proof. Avoid slogans, self-description, long hero prose and generic repeated claims of intelligence or autonomy.

| Reject | Use |
| --- | --- |
| “Your intelligent procurement optimisation hub” | `My Desk` with actual work queue |
| “Our AI seamlessly unlocks licence savings” | `6 seats reusable` and `14 seats to buy` |
| “This page demonstrates evidence-based negotiation” | Quote lines and `Prepare BAFO` |
| “AI selected the perfect supplier” | Supplier, matched scope, capacity and approval status |
| “Experience autonomous guardrailed contracting” | Clause rows, bands and Legal task |
| “Powerful agents guarantee savings” | Amount, value state and supporting evidence |
| “Fully touchless and paid” after human review | Actual approval history and payment status |

Agent names and specific activities such as `Reading quote` are appropriate. Text must reflect current records. Human approvals remain explicit. Do not repeat “AI recommends” on every card. A neutral demo-environment label is sufficient; do not conceal simulation behind claims of live execution.

**Acceptance:** a reviewer can see the object, state, owner and next action without capability prose. There are no unsupported savings, accuracy, compliance or autonomy claims. Customer and legacy names/logos are absent from UI, fixtures, translations, images, emails, exports and download names.

## 15 Canonical automotive data

Use one normalized profile with identity **Automotive Procurement**, GBP currency and `en-GB` formatting. Locations and manufacturer models below are real. Internal IDs, operational assignments, suppliers, prices, agreements and screening outcomes are demo data. Replace references across all representations, not independent JSX strings.

| Site ID | Display name | Demo function | Cost centre |
| --- | --- | --- | --- |
| UK-SOL-01 | Solihull | Vehicle operations and maintenance | CC-SOL-MAINT |
| UK-HAL-01 | Halewood | Assembly support and stores | CC-HAL-MAINT |
| UK-WOL-01 | Wolverhampton | Propulsion operations support | CC-WOL-ENG |
| UK-GAY-01 | Gaydon | Engineering and shared functions | CC-GAY-IT |

All primary sites are in the United Kingdom. Use illustrative buying organisation `AP-UK`, groups `MRO`, `SERVICES`, `IT`, `FACILITIES` and GL codes `GL-MRO`, `GL-ENG-SVC`, `GL-SOFTWARE`, `GL-FACILITIES`. Current `siteByCountry` assumes one site per country. Replace with `siteById` and country-to-sites arrays so all UK locations remain distinct. Language does not determine country.

| Internal code | Product or service | UoM | Story |
| --- | --- | --- | --- |
| MAT-BRG-SKF-6205 | SKF 6205 open bearing | EA | ST05 and supporting catalogue |
| MAT-BRG-FAG-6205C | FAG 6205-C candidate bearing | EA | ST05, subject to Technical Owner approval |
| SW-EVIEW-STD-ANNUAL | Fictional Engineering Viewer Enterprise | SEAT_YEAR | ST01 |
| SVC-PM-SOL-01 | Planned maintenance with inspection | LOT | ST02/ST04 |
| SVC-CAL-WOL-02 | Calibration of two robotic cells | LOT | ST03 |
| MAT-PPE-3M-6055 | 3M 6055 A2 gas/vapour filter | PAIR | Optional qualified catalogue fixture |

For the optional 3M item, store pair versus four-pair-pack conversion explicitly. The model alone does not establish safety suitability. The primary five stories do not depend on respiratory-protection selection. Real product identity is distinct from fictional equipment suitability and approved supplier relationships.

Use fictional suppliers `Midlands Industrial Supply`, `Precision Maintenance Partners`, `West Midlands Calibration`, `Northern Engineering Services` and `Engineering Software Services`, IDs `SUP-AP-001` through `SUP-AP-005`. Use pending ID `SUP-AP-PENDING-01` before activation. Bank data are masked. Emails use `.example`. Do not invent real vendors' risk clearance or account data.

Initialize the demo to 7 October 2026, 09:00 Europe/London. Events store ISO UTC; display is timezone-aware. The mock clock advances hours/days for quotes, approvals, acceptance, invoices and SLA branches. No June/July legacy dates survive in primary stories.

Seed five cases and their work packages, historical spend, entitlement snapshots, benchmarks, panels and technical records. Secondary fixtures include missing supplier ID, two-bid event, stale SAM data, bank mismatch, sanctions, Red clause, invoice leakage and connector failure. Chart totals come from those records, not the legacy network totals.

## 16 Financial measures and dashboard definitions

Store money as integer minor units in GBP. Use one formatter and one set of selectors for cards, documents, charts and source comparisons. Round monetary results to pence. Format percentages only for display. Baseline and outcome must use comparable quantity, period, UoM, scope and commercial inclusions.

| Measure | Definition | Gate |
| --- | --- | --- |
| Requested value | Requested quantity × comparable unit price, plus included costs | Valid quantity/UoM |
| Expected sourcing savings | Approved baseline cost minus awarded comparable cost | Valid baseline and award |
| Invoice-evidenced savings | Baseline for accepted/invoiced scope minus net invoice after credits | Invoice and scope evidence |
| Finance-validated sourcing savings | Signed supported invoice savings | HC08 satisfied |
| Net licence avoidance | Avoided seats × comparable contracted price minus administration/transfer costs | Entitlement, assignment, costs and Finance decision |
| Leakage | Excess price, quantity or omitted credit versus authorised payable amount | Match exception |
| Productivity benefit | Approved effort/cost model for work avoided | Separate noncash metric |
| Cycle time | Terminal event time minus appropriate process start | Simulated timestamps |
| No buyer touch | Completed cases with no substantive buyer review/override divided by eligible completed cases | Human-action ledger |
| Fully touchless | Cases with no substantive human decision at any role divided by eligible completed cases | Distinct from no buyer touch |

Requester submission and viewing evidence are not buyer touches. Analyst corrections, mixed-route confirmation and commercial approval are touches. A Finance savings signature does not retroactively change a PR-to-PO buyer-touch metric, but the end-to-end case is not fully touchless. Count each case once, with the metric period and denominator visible. Do not infer touchlessness merely from an empty exceptions array, as the old selector does.

For the five primary successful paths, invoice-validated sourcing savings are ST02 £4,000 + ST03 £2,400 + ST05 £400 = **£6,800**. ST04 contributes no additional cash saving. ST01 contributes **£700 validated cost avoidance**, in a separate category. ST03's £600 onboarding effort is excluded from cash savings by default. These are fixture check totals after the relevant events and signatures, not values to hardcode in cards.

For a leakage variant in ST02, an initial £47,000 invoice leaves £1,000 leakage. A supported £1,000 credit gives net £46,000 and the same £4,000 sourcing saving. Do not add recovered leakage to the £4,000 again. Partial invoices validate only their supported quantities, never the full PO before delivery. Credits allocate to invoice lines and cannot be reused across two claims.

### 16.1 Operating-model targets versus demo actuals

| Metric | Deck baseline | Deck target |
| --- | --- | --- |
| Requests with no buyer touch | Unspecified | Approximately 68% |
| Spot-buy intake to PO | Unspecified | 3–5 days |
| PR-to-PO cycle | More than 24h | Less than 8h |
| Channel compliance | Below 75% | Above 90% |
| Tail-spend share | Above 30% | Below 15% |
| Requisition to contract | More than 15 days | Less than 5 days |
| Risk assessment coverage | Below 80% | Above 95% |
| Contract compliance/data accuracy | Below 55% / below 50% | Above 95% |
| Savings validated at invoice | Unspecified | 100% |
| Three-year savings | Unspecified | Approximately £150M |

The deck's 33,453 FY25 tail transactions and the 95%/65%/20%/0% automation planning split are source planning data, separate from demo records. They imply about 67.9% touchless volume. Do not force the five stories to produce that rate. The £41M/£52M/£58M annual allocations sum to £151M, while the headline says £150M. Keep the rounded headline as a planning target and omit exact annual allocations from product charts until reconciled. Do not silently change source amounts to make them add up.

Agent health targets are override rate below 5% per pattern, audit accuracy at least 98% on a 5% sample, and at least 95% of HiTL items handled within 48h. Demo calibration is simulated evidence, not measured model accuracy. Small samples show count/denominator and an insufficient-history status where appropriate.

### 16.2 Control Tower and grounded questions

Use filters for period, site, category, organisation/role and value band. Multiple UK sites must remain distinct. Show spend by site/category, buying channel, supplier concentration, opportunity pipeline, expected versus validated value, leakage and owner/SLA workload. Each chart segment drills into its contributing records.

Reuse existing dataset-driven Q&A. Support questions such as `Which licences can we reuse?`, `Which bids need review?`, `Can our panel cover this request?`, `Which clauses block the PO?`, and `How much has Finance validated?`. Answers use the current filtered records with source links and short one-line facts. Unknown questions request a filter/reference or show a supported question choice, never invent a numeric answer.

## 17 Domain state and event contract

Separate Story ID, TOM flow, transaction case ID and work-package ID. The old eight `FlowId` values are scenario aliases only. Use `TomFlow = F0…F5`, `StoryId = ST01…ST05`, and `CaseId` for each transaction instance. A case can have several related work packages running or waiting simultaneously. Stable step IDs replace numerical indices as decision keys.

### 17.1 Required entity model

| Entity | Required fields and relationships |
| --- | --- |
| ClientProfile | Neutral display identity, currency, locale, clock and allowed sites |
| ProcurementCase | Case/story IDs, revision, requester, site, status, policy snapshot, work packages and holds |
| Request | PR ID, original source, lines, quantity/UoM, item/service, scope, dates, account assignment and budget |
| WorkPackage | ID, TOM flow, stable steps, owner, lane, state, dependencies and next permitted action |
| Opportunity | Spend snapshot, lever, evidence, scope, category approval, baseline decision and expiry |
| EntitlementPool | Application/tier, seat IDs, user roles, owner approval, snapshot time and reservations |
| Fulfilment | Internal reassignment or purchase quantities, actual events and acceptance evidence |
| RFQ and Quote | Scope version, suppliers, deadlines, bid lines, inclusions, revisions, validity and compliance |
| Award | Selected quote revision, competition/exception evidence, approval and value-record key |
| Contract | Library version, clauses/redlines, decisions, signatures, storage and effective dates |
| Supplier | Identity/group, panel scope, documents, risk state, bank verification and master sync |
| TechnicalEquivalence | Original/candidate, application, attributes, criticality, source version and technical approval |
| ApprovalTask | Domain/role, requested decision, case revision, amount, evidence, SLA and outcome |
| PurchaseOrder | Request/award/contract/supplier references, lines, sites, approval and dispatch state |
| Receipt or Acceptance | PO line, accepted quantity/scope, time and evidence |
| Invoice and Credit | PO/line references, quantities/prices, source and applied credits |
| ValueRecord | Stable award key, baseline, expected/evidenced/signed amounts, value category and evidence |
| Exception | Reason, blocked action, evidence, owner, escalation, SLA and resolution |
| AuditEvent | Who/what/when, revision, sources, rule version, recommendation, decision and override reason |
| RuleChange | Proposed/current versions, council decision, tests, effective date and rollback reference |

### 17.2 Agent handoff envelope

Use a serializable envelope for every specialist result. Domain data must not contain `ReactNode`. React document renderers consume canonical records. The following example describes ST01's mixed allocation before analyst confirmation. Values ending in `Minor` are pence.

```json
{
  "schemaVersion": "1.0",
  "caseId": "CASE-ST01-001",
  "caseRevision": 1,
  "storyId": "ST01",
  "tomFlow": "F1",
  "stepId": "F1.channel.licence-allocation",
  "agentId": "channel-decision",
  "policyVersion": "POL-DEMO-1",
  "inputRefs": ["PR-AP-1001", "SAM-2026-1007"],
  "evidenceRefs": ["OWNER-POOL-APPROVAL-01"],
  "confidence": 0.94,
  "lane": "tcs-review",
  "ruleResults": [
    {"id": "entitlement-fresh", "result": "pass"},
    {"id": "same-tier-owner-pool", "result": "pass"},
    {"id": "mixed-route-review", "result": "hold"}
  ],
  "output": {
    "requestedSeats": 20,
    "reuseSeats": 6,
    "buySeats": 14,
    "buyAmountMinor": 168000,
    "adminCostMinor": 2000,
    "netAvoidanceMinor": 70000
  },
  "nextAction": "confirm-mixed-allocation",
  "requiredRole": "buy-desk-analyst"
}
```

Validate schema, references, current revision and rule version before accepting a result. Reject unknown IDs, mismatched currency, stale evidence or outcomes from a prior case revision. A hold must include its blocked action and required role. Negative outcomes are explicit results, not missing fields or indefinite loading states.

### 17.3 Event application

All business changes pass through a shared command handler/reducer. Essential events include `request.submitted`, `request.revised`, `gate.evaluated`, `approval.decided`, `opportunity.approved`, `licence.reserved`, `licence.reassigned`, `rfq.issued`, `quote.received`, `award.approved`, `contract.signed`, `contract.stored`, `supplier.bankVerified`, `supplier.activated`, `po.dispatched`, `receipt.posted`, `invoice.received`, `credit.applied`, `value.validated`, `agent.paused` and `ruleChange.applied`.

Each command contains actor/role, case ID, expected revision and idempotency key. Evaluate gates, then atomically update records and audit. Double click and repeated mock response cannot create a second order, assignment, signature or claim. Use stable keys such as case + work package + action + revision, with unique retry attempt IDs.

Editing quantity or scope invalidates dependent quote/approval/value calculations. Changing supplier invalidates supplier/contract checks. Changing redline text invalidates related clause decisions. Downstream records stay reviewable as superseded versions. View navigation never changes business state.

Persist case progress, drafts, pending tasks, messages and audit above the login seats, alongside the shared store. Retain state across navigation and seat change. For reload resilience, use a versioned localStorage demo snapshot with explicit reset and safe migration. Never store real account data there. A browser refresh during a pending approval restores the hold, not a completed state.

## 18 Component reuse and file implementation map

Stay in `src/mro` and preserve the current visual tokens. Prefer adapting an existing component before adding a new visual system. New components must use the existing console, card, modal, icon, colour and motion conventions, with UI01–UI04 enforced centrally.

### 18.1 Changes to existing files

| File or group | Required change |
| --- | --- |
| `src/Root.tsx` | Keep shared domain store above seats; extend role/presenter context |
| `src/views/EntryLogin.tsx` | Neutral identity, buyer/supplier entries, client-neutral images |
| `src/mro/App.tsx`, `state.tsx` | Add workbench views; workspace opens by case/work-package IDs |
| `data/procurement.ts` | Replace mixed fixture data; retain useful selectors with typed currency/site data |
| `data/store.tsx` | Normalized records, reducer commands, persistent cases and gate enforcement |
| `data/intakeChannels.tsx` | Captured messages and draft creators; no replay-only submission |
| `data/flowRuns.tsx`, `runSteps.tsx` | Story registry, TOM work packages, stable step IDs and renderer references |
| `data/filterBagCase.tsx` | Convert relevant price-break evidence into supporting pooling fixture |
| `data/onboardingCase.tsx`, `offContractCase.tsx` | Reuse mechanics, replace facts, enforce three-quote/activation gates |
| `views/Workspace.tsx` | Dispatch domain commands; remove unconditional indexed advance/release |
| `ExtractionWizard.tsx` | Emit edited draft fields, validate and regenerate documents |
| `AiWorkspacePanel.tsx` | Short evidence rows, computed gate status, no generic bypass |
| `views/Cockpit.tsx`, `Requisitions.tsx`, `Exceptions.tsx` | Read shared records and roles; link actual case IDs |
| `views/InvoiceMatching.tsx` | Acceptance/receipt evidence, credits, match state and linked ValueRecord |
| `views/SupplierPortal.tsx`, `ServiceDesk.tsx` | Supplier scoping and authorised commercial responses |
| `views/ControlTower.tsx`, `data/spend.ts` | Multi-site country mapping, GBP, opportunities and signed value |
| `data/agents.ts`, `views/AgentProfile.tsx` | Updated roster, runtime health and correct lead work package |
| `lib/i18n.tsx`, `retranslate.ts`, `prDoc.ts` | New keys and identity scrub across all document languages |
| `lib/exportDoc.ts` | Export current canonical document state with neutral names |
| `DEMO-SCRIPT.md`, `docs/PRD.md` | Replace old stories and reconcile documentation after build |

### 18.2 New shared components

| Component | Existing pattern to inherit | Function |
| --- | --- | --- |
| `EqualHeightCardRow` | Existing grid and `Panel` | UI01 alignment and responsive row layout |
| `OneLineText` | Current text/token styles | UI02 fit, secondary truncation and full reader |
| `ActionButton` | Existing PillButton and motion | Shared press/hover/loading/result feedback |
| `GateSummary` | Existing `Scorecard`, `AutonomyChip` | Confidence, controls, lane and blocked action |
| `ApprovalTaskCard` | `BudgetApprovalSignable` | Role-specific decision with evidence and reason |
| `CaseTimeline` | `RunStepsRail`, `ActivityLog` | Stable case/work-package history |
| `ValueSignoffCard` | Existing matching/result panels | Finance evidence review and signature |
| `PresenterControls` | Existing modal/settings conventions | Story launch, role, clock, failure and reset |

Story-specific new components are listed beat by beat in section 13. Build them as typed data-driven compositions of these shared pieces. `LicenceEvidencePanel` must not become an unrelated SaaS dashboard. `ClauseCompareGrid` must visually relate to the existing match grid. `PanelFitCompare` and `EquivalentCandidateCard` inherit the current choice-card hierarchy. `NegotiationPositionCard` inherits short metric/evidence rows and email-draft styling. Source-document renderers keep the existing ERP-document structure.

### 18.3 Proposed module boundaries

Add `domain/types.ts`, `domain/evaluateGate.ts`, `domain/commands.ts`, `domain/reducer.ts`, `domain/selectors.ts` and `domain/value.ts`. Add `data/clientProfile.ts`, `data/masterData.ts`, `data/policies.ts`, `data/storyFixtures.ts` and `data/knowledge.ts`. Add `services/mockConnectors.ts` for deterministic replies/failures. Keep view/animation state separate from business data.

Recommended views are `OpportunityPipeline`, `SourcingWorkbench`, `ContractWorkbench`, `SupplierWorkbench`, `ValueAssurance` and `GovernanceConsole`. Do not introduce a large routing dependency just to implement these views. Existing typed view switching is adequate if history/deep-link behavior remains consistent. A reload can restore the active case from the snapshot.

## 19 Agent catalogue and bounded responsibilities

Use meaningful IDs instead of reusing an invoice ID for warranty or a vendor ID for material checks. Provide a migration map for legacy keys. Keep specialist substeps grouped in a readable roster rather than adding a separate top-level agent for every UI card.

| Agent group | Inputs and outputs | Boundaries |
| --- | --- | --- |
| Orchestrator | Case, dependencies, rule results; next work package and task | Coordinates, never substitutes for authority |
| Spend Intelligence | Spend/SAM snapshots; classification and opportunity candidates | Baseline and pipeline entry require client decisions |
| Intake and Classify | Original need/master data; draft PR, coding and gaps | No invented technical or entitlement facts |
| Channel Decision | Agreements, panels, opportunities; reuse/call-off/source route | No access change or technical approval by inference |
| Sourcing and Bid Scoring | RFQs, quotes, benchmarks; comparison and negotiation pack | Competition, award and DoA gates apply |
| Contract and Clause | Template/library/redlines; band map and draft | Red always Legal; stored contract required |
| Supplier and Risk | Panels/docs/screening; match and prepared master | Bank verification and sanctions hard stop |
| PO and Value Assurance | Approved case, receipt/invoice/baseline; PO and evidence pack | No unsigned savings validation |
| AI Ops Monitor | Audit, overrides, SLAs; pause/lane-reduction/change proposal | Council approves widening and rule updates |

Licence analysis and technical specification challenge are capabilities of the relevant groups with distinct data contracts and human owners. Warranty, inventory and duplicate checks remain optional MRO substeps. Each group has a concrete run/workbench link and reads its current case state. Static agent statistics are replaced with computed counts or clearly labelled fixture health records.

## 20 Enterprise interfaces and demo substitutes

| Enterprise capability | Needed interface | Demo substitute |
| --- | --- | --- |
| ERP/P2P | PR, budget, PO, supplier, receipt, invoice and status | Mock command/event adapter |
| Email/Teams | Capture demand and send approved replies | Seed message evidence and simulated send/receive |
| SAM/licensing | Entitlements, utilisation, role/pool and reassignment | Versioned seat dataset and allocation simulator |
| Catalogue/rate cards | Items, tiers, active prices and validity | Canonical agreement records |
| Sourcing | RFQ issue, bid ingestion, validity and revisions | Mock supplier inbox/quote events |
| Contract repository/e-sign | Template, signing authority, executed version, storage | Simulated signature and repository receipt |
| Screening | Financial/legal/cyber/sanctions results | Explicit seeded checks and timeout variants |
| Technical/quality master | Equivalence, qualification, warranty and quality | Versioned application-specific approval evidence |
| Finance value office | Baseline method, invoice evidence, sign-off | Role task and auditable ValueRecord |

Do not assume a particular production P2P vendor or integration API beyond what the supplied materials state. Future production adapters need authenticated server-side access, least-privilege roles, durable queues, idempotency, authoritative budgets, secure identity and complete audit retention. Bank callback remains a human control. Real LLM outputs must be schema-validated and cannot directly commit ERP transactions. Live tooling, credentials, model pricing and deployment are separate implementation decisions.

## 21 Build sequence and deliverables

### 21.1 Build order

1. **Foundation:** introduce neutral client profile, data/entity model, GBP formatter, mock clock and persisted store. Add gate evaluation, roles and audit. Migrate one seeded case before changing all views.
2. **UI foundation:** adapt shared cards/buttons/text/motion for UI01–UI04. Update intake to create real demo cases with editable fields. Connect workspace actions to reducer commands.
3. **ST01 and F0:** build entitlement/reuse allocation, internal fulfillment, idle-seat opportunity and renewal branch. Validate no-PO and mixed paths.
4. **ST02 and F2:** extend RFQ/quote review, line benchmarks, BAFO, competition and separate award/spend approvals.
5. **ST03 and F4:** build panel-fit decision, incumbent call-off, new supplier risk/bank/sync path.
6. **ST04 and F3:** build scope/redlines/bands, legal/delegated tasks, signing and storage. Connect ST02's held PO.
7. **ST05:** build technical attributes, equivalence/signoff, released scope and competitive award.
8. **F5 and governance:** implement invoice/credit evidence, separate value categories, Finance signatures, council changes and pause/fallback.
9. **Consistency and delivery:** connect dashboards/service desk/exports, update languages and images, run acceptance, rewrite presenter script.

This order does not authorize dropping a later story. All five stories and six flows are part of the final demo. Before altering UI, Claude should inspect the listed source files and identify the reusable component contracts. Keep unrelated O2C/Freight code out of scope unless a shared entry change requires adjustment.

### 21.2 Required repository outputs

Deliver the completed front-end, canonical fixtures, policy/rule configuration, working story/replay controls, rewritten `DEMO-SCRIPT.md`, updated `docs/PRD.md`, targeted domain tests and acceptance results. The presenter script lists exact clicks and outcomes for each story, explains its human decision, and points to the source behind each amount. Code paths, document labels and narration must agree.

## 22 Acceptance suite

Run the repository's TypeScript/build and lint checks with the project's declared dependencies. Record inherited failures separately from introduced ones. Add focused tests for financial arithmetic, gates, reservations, revisions and idempotency because these implement business controls. Use browser tests or equivalent manual UI verification for interaction, row alignment, text wrapping and motion. Do not write large tests that merely duplicate fixture markup.

| ID | Test | Required result |
| --- | --- | --- |
| AC01 | Launch active app | MRO entry and New Request open the new procurement interface |
| AC02 | Submit two identical-pattern requests | Distinct case IDs with independent progress; duplicate demand flagged where appropriate |
| AC03 | Enter unsupported free text | Clarification/draft, no invented SKU or unrelated preset result |
| AC04 | Edit quantity/terms/site | Canonical record and downstream prices/gates/documents update |
| AC05 | Navigate/export/return | State preserved; export matches current record |
| AC06 | ST01 mixed route | Six reserved/reassigned, 14 bought; £1,680 invoice; £700 avoided net |
| AC07 | ST01 full reuse | Internal fulfillment, zero PO/invoice and separate avoidance evidence |
| AC08 | Stale SAM or tier/access change | Manual/owner/security task; no silent access grant |
| AC09 | Concurrent reuse | One seat cannot fulfill two cases |
| AC10 | ST02 quote analysis/BAFO | Comparable original £50K and final £46K; line changes preserved |
| AC11 | Noncomparable quote | Excluded from valid bid count and award recommendation |
| AC12 | Two bids after extension | Award held without Category Lead competition exception |
| AC13 | Award above £30K | Human Category Lead decision plus independent spend approval |
| AC14 | ST03 incumbent fit | £36K call-off, no new supplier; £2,400 potential then signed saving |
| AC15 | ST03 capacity unavailable | New-supplier path runs; PO held until bank/risk/sync complete |
| AC16 | Sanctions or bank mismatch | Activation blocked even at 0.99; proper escalation |
| AC17 | ST04 Green/Amber/Red | Green policy route, Amber delegated, Red Legal |
| AC18 | Contract signing/storage failure | Approved draft retained, PO still blocked |
| AC19 | ST02 to ST04 handoff | Same case/award/value record, no duplicate £4,000 |
| AC20 | ST05 new equivalent | Technical signature then Buy Desk scope release before RFQ |
| AC21 | Safety-critical at 0.99 | No auto-substitution; required technical approval remains |
| AC22 | ST05 successful purchase | 200 × £22 = £4,400; supported saving £400 |
| AC23 | Finance signature missing | Expected/evidenced visible, validated cash total unchanged |
| AC24 | ST02 invoice leakage/credit | £1K leakage then £1K credit; final £4K saving counted once |
| AC25 | Complete five main successful stories | Cash savings £6,800 and avoidance £700 shown separately |
| AC26 | Value Council change absent | Proposed policy/library remains inactive |
| AC27 | Approved change fails tests | Current version remains; rollback is recorded where applicable |
| AC28 | Pause agent/pattern | Pending work falls to human queue without lost evidence or replay |
| AC29 | Retry failure and double click | Three attempts maximum; one business action, correct fallback |
| AC30 | Advance 48h/72h and flow-specific timers | Due tasks, reminders and escalation use correct owner/time |
| AC31 | UI01 peer cards | Heights within 1px at all target sizes after dynamic changes |
| AC32 | UI02 text | No wrapped UI text/buttons or paragraph walls; full evidence reachable |
| AC33 | UI03 motion | Entry/press/work/result feedback; no idle fake work or stalled animation |
| AC34 | Reduced motion/hidden tab | Correct state/feedback without missing or repeated commits |
| AC35 | UI04 copy | Factual business labels; no unsupported self-claiming capability prose |
| AC36 | Identity/currency scrub | No customer/legacy names, USD totals or old dates in primary paths/exports |
| AC37 | Supplier scoping | Only own records/bids; client-only tasks unavailable |
| AC38 | Site filter | Solihull, Halewood, Wolverhampton and Gaydon distinct under UK |
| AC39 | F0 opportunity | Category and Finance approval required; PR matches only live item |
| AC40 | Clock/reset/reload | Consistent store/progress/reservations/audit; no cross-story contamination |

The demo passes only when outcomes are backed by records and actions. Animations, attractive cards or agent descriptions do not satisfy a missing workflow. Document actual checks and known limitations in repository acceptance notes.

## 23 Requirement traceability and source references

### 23.1 TOM to build mapping

| Source physical slides | Requirement | Build area |
| --- | --- | --- |
| 1–2 | Proactive/reactive routes and retained client authority | Sections 3–4 and case work packages |
| 3 | T1 baseline, T2 front door, T3 panels, T4 sourcing, T5 clauses, T6 leakage | Five story tags and all flows |
| 4 and 12 | F0 opportunity pipeline and approvals | Opportunities, ST01 monthly licence finding |
| 5 and 13 | F1 intake, channel, approval and PO | New Request and case workspace |
| 6 and 14 | F2 competition, evaluation, BAFO and award | ST02/ST05 and renewal branch |
| 7 and 15 | F3 clause bands and repository gate | ST04 contract workbench |
| 8 and 16 | F4 panels, onboarding, bank and risk | ST03 supplier workbench |
| 9 and 17 | F5 invoice evidence, Finance and council | Value Assurance and Governance |
| 10–11 | Agent roster, confidence and value-band gates | Central decision engine |
| 18–19 | Decisions, approval ladder and escalation | Role tasks and audit |
| 20 | Ten hard constraints and friction protocol | Gate service, failure branches and AC tests |
| 21 | Measures, knowledge, case and governed learning memory | Analytics, versions and value records |

The five-story matrix maps source row 6 to ST01, 9 to ST02, 4 to ST03, 10 to ST04 and 2 to ST05. Its application/security and technical-owner controls extend the role model. The user's four explicit UI restrictions map to UI01–UI04 and AC31–AC35. Physical slide numbering takes priority over footer labels in this trace.

### 23.2 Public product evidence

- SKF product data for model 6205, including 25 mm bore, 52 mm outside diameter and 15 mm width: https://cdn.skfmediahub.skf.com/api/public/094f3ab4599ba988/pdf_preview_medium/094f3ab4599ba988_pdf_preview_medium.pdf
- Schaeffler FAG Generation C catalogue, model 6205-C dimension table on printed page 15: https://www.schaeffler.com/remotemedien/media/_shared_media/08_media_library/01_publications/schaeffler_2/tpi/downloads_8/tpi_165_de_en.pdf
- Optional 3M 6055 product identity: https://www.3m.co.uk/3M/en_GB/p/d/v000078858/
- Optional 3M 6055 four-pair pack identity: https://www.3m.co.uk/3M/en_GB/p/d/v101711020/

Product references establish designations and published attributes. They do not establish client installation, technical equivalence, negotiated pricing, supplier approval or safety suitability. Those are explicit demo evidence and approval records. The anonymous site registry does not expose customer branding.

## 24 Instructions for Claude build execution

Use this PRD as the build contract. Read the active entry, MRO store/state, intake, workspace, case files and reusable components before changing the implementation. Preserve the existing interaction and visual conventions while replacing the domain fixtures and adding missing workflows.

Implement the five stories exactly as functional cases. Connect them through six TOM flows, not five disconnected mockup pages. Keep New Request primary. ST04 must work both from ST02's award and standalone with seeded upstream evidence. Every approval and external mock event must update the same domain store used by dashboards and documents.

Reuse the section 18 components and the beat-by-beat mappings in section 13. Where a component is missing, create it using current Panel/card/modal/icon/motion tokens. Adapt reused components for equal dynamic row heights, one-line UI items, complete action/entry feedback and concise factual copy. Do not introduce explanatory prose to cover missing behavior.

Treat HC01–HC10 and UI01–UI04 as mandatory. All story values, current states, scores and outcomes derive from canonical records. Keep real manufacturer identifiers separate from illustrative prices and application approvals. Keep the actual customer's name/logo out of UI and generated artifacts. Do not call an unsigned saving validated, a scheduled payment paid, or a manually approved case fully touchless.

Build in the section 21 order. Run targeted domain checks, project build/lint and visual interaction acceptance. Deliver working code, data, story controls and the updated presenter script. Record actual verification results and unresolved limitations. Do not finish with agent profiles, placeholder workbenches, generic success notifications or benefit claims in place of implemented workflows.

## 25 Build decisions

Decisions agreed for this build that differ from, or add to, the sections above. Where they conflict, this section wins.

| Topic | Decision | Difference from PRD |
| --- | --- | --- |
| Languages | Only English and German. Chinese, Spanish and French are removed from the phrase book, language switch and legacy fixtures. Every new string ships in EN and DE and passes the one-line check in both. | §2 and §18 assume five languages. |
| Intermediate builds | Not shown externally between phases; new and legacy pages may coexist. | None. |
| Touchless path | A below-£3,000 catalogue purchase is the first New Request example (see fixture below). | Not specified by the PRD; added as a supporting fixture. |
| Suppliers | `SUP-AP-001`–`005` as specified. Additional fictional suppliers from `SUP-AP-006`. Emails use `.example`; bank details are masked. | The PRD names five suppliers only. |
| Module paths | New EN/DE copy lives in `src/mro/lib/i18n-ap.ts` (merged into `translate()`), because `lib/i18n.tsx` already occupies the `lib/i18n` module path. | Plan text named `lib/i18n/ap.ts`. |

### 25.1 Touchless catalogue fixture

`CASE-CAT-001` / `PR-AP-1000`: Halewood (`UK-HAL-01`) stores, 3M 6055 A2 filters (`MAT-PPE-3M-6055`), 10 packs × 4 pairs = 40 pairs at £12.00 per pair (£48 per pack) = **£480.00**, catalogue `CAT-AP-2026-01` with Midlands Industrial Supply (`SUP-AP-001`). Approved by policy `POL-DEMO-1` under standing mandate `SM-CATALOGUE-01`; no human signature is recorded.

The same fixture at 80 packs (£3,840.00) is the first human-authority branch: the catalogue agreement is still live, but HC02 creates a Budget Holder task. A live agreement does not remove DoA.

SKF 6205 is not used for this path because ST05 challenges that specification at Halewood.

### 25.2 Additional fictional suppliers

| ID | Name | Use |
| --- | --- | --- |
| SUP-AP-006 | Ardenfield Maintenance Group | ST02 bidder, £51,500 |
| SUP-AP-007 | Haldenbrook Plant Services | ST02 bidder, £43,000 excluding inspection (not comparable) |
| SUP-AP-008 | Trentbrook Bearing Distribution | ST05 bidder, £4,600 |
| SUP-AP-009 | Corvale Power Transmission | ST05 bidder, £4,700 |
| SUP-AP-PENDING-01 | Lymewell Calibration | ST03 requester-named supplier, £38,400; becomes `SUP-AP-010` on activation |

A web search on 7 Oct 2026 found no company trading under these names; a first candidate ("Kestrel Plant Care") was replaced because similar "Kestrel" engineering firms exist.

### 25.3 Demo policy POL-DEMO-1

Illustrative build settings, not client delegation: standing approval below £3,000; Budget Holder up to £30,000 inclusive; Category Lead up to £100,000 inclusive; Procurement Head below £250,000; £250,000 or more leaves the desk. Lanes: ≥0.90 touchless, ≥0.70 TCS review, otherwise client decision. Confidence weights `W-DEMO-1`: 0.20 / 0.15 / 0.25 / 0.15 / 0.15 / 0.10. A dimension without a score blocks unless the pattern's rule declares it inapplicable, in which case its weight is redistributed over the rest.
