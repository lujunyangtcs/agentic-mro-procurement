# Demo Narrative — Opening, Dashboard, UC6, UC4

Paragraph + inline click-through script. Bracketed actions `[...]` are clicks/navigation; everything else is spoken narration.

## Opening — the problem, before any clicks

Procurement at a business like Northgate runs on people checking things that computers already know. A planner emails in a part number and someone has to find the right agreement, the right price, the right supplier — by hand, every time. A programme manager names a consultant because that's who they worked with last time, with no way to see that two cheaper panel suppliers already do the exact same work. A team buys twelve new software licences because nobody has visibility into the eighteen seats already sitting idle in the pool. None of this is because people are careless — it's because the information that would stop it lives in five different systems that don't talk to each other, and checking all five by hand for every request doesn't scale past a handful a day. The cost shows up as slow cycle times, maverick spend, duplicate purchases, and risk that only gets caught after the money has moved. What you're about to see is the same procurement workflow with that checking done automatically — agents that read the documents, apply the same rules a trained buyer would, and only interrupt a person when the decision genuinely needs judgment a machine shouldn't make alone.

## Dashboard

[Open the Dashboard.] AI shows the whole procurement picture at a glance: sixteen requests in flight, six held at $37,894, two invoices holding $406. [Hover or click a KPI tile to open its breakdown.] Every number on this page is computed — nothing here is typed in. [Open the sidebar → Agent workforce.] Six agents sit behind it — each one reads specific documents, produces specific output, and stops for a person on specific conditions. [Back to Dashboard.]

## UC6 — Reuse licences before buying

[On the Dashboard, open the New tickets card → click UC6 · Reuse licences before buying.] A request for twelve CAD licences just came in — guided, so it narrates itself end to end from its own source files. [In the arrival modal, click Open the form.] The request arrives as a PDF, not a free-text message this time — a front-door form with name, cost centre, what's needed, and by when. [Click Start Intake Agent.] Watch it fetch its sources in order.

[In Step 1 · Intake Agent, open each document chip as it lands: the form, PO-7781223, and BUD-CC4471-FY27.] That's the form itself, the last price paid for this exact licence, and the cost centre's remaining budget — three different systems, read live. [Click AI · Score confidence & run guardrails.] Confidence comes back at 0.96, and all three guardrails pass: front door only, coding not TBD, budget available. [Click Hand off to Spend Intelligence Agent.] Watch the baton pass — everything it fetched travels with it.

[In Step 2 · Spend Intelligence Agent, open SAM-2026-10-06 and EA-SW-2024-017.] A utilisation report and the licence agreement itself: eighteen seats sit unassigned in the pool right now, and clause 6.2 allows reassigning them at no charge. [Click AI · Score confidence & run guardrails.] Twelve of the eighteen idle seats cover this request exactly — nothing needs to be bought. [Click Hand off to Channel Decision Agent.]

[In Step 3 · Channel Decision Agent, open APP-CV-01, then the produced SAM-ASSIGN-77120 and MAIL-118204.] That's the owner policy that pre-approves a same-tier reassignment, the assignment record the agent just wrote, and the notice it just sent the requester. [Click AI · Score confidence & run guardrails.] Application-owner approval, pre-cleared by policy — nothing left to check. [Click Close the case.]

[On the completion card, open the value record.] £14,400 avoided, zero buyer touches, eight minutes end to end — and it files its own value record, the paper trail Finance signs off on. [Return to the Dashboard.] New tickets now reads UC6 as closed: five documents read, three written, and nobody clicked anything that wasn't already theirs to decide.

## UC4 — Check the panel before onboarding

[On the Dashboard, open the New tickets card → click UC4 · Check the panel before onboarding.] A programme manager at Solihull wants a named consultant for six weeks of paint-shop work — and has named a supplier who isn't on our panel: NovaOps, at £42,000. [In the arrival modal, click Run the agent chain.] Supplier Match Agent goes first.

[In Step 1 · Supplier Match Agent, open the panel list and the named-supplier profile.] Two panel suppliers already do this work: Kestrel Operations quotes £1,150 a day against NovaOps' £1,400. [Click AI · Score confidence & run guardrails.] Confidence comes back at 0.93 — Kestrel meets every requirement, it's £7,500 cheaper, and it's already two-thirds through its £250K commitment, which pushes it toward a rebate tier. One guardrail trips: anything over £30K needs the Category Lead to confirm supplier fit before anything moves.

[At the decision, two buttons sit side by side: Confirm panel supplier — the agent's own recommendation — and Approve onboarding exception. Click Approve onboarding exception.] The Category Lead overrules the agent here: NovaOps owns a proprietary paint-line simulation tool Kestrel can't offer, and that reason gets typed in and saved against the case.

[In Step 2 · Onboarding Agent, open the document validation list.] Five documents land clean. One doesn't — professional indemnity cover is £1M against the £2M required. [Click AI · Score confidence & run guardrails.] Confidence 0.88. Note what's not checked here: bank-detail verification is never automated, by rule, not by this agent's judgement. [Click Return gap list to supplier.] It doesn't waive the insurance gap — it sends it back.

[In Step 3 · Risk Screening Agent, open sanctions, financial health, and cyber.] Clear on sanctions, clean on adverse media, filings up to date — but a 58-out-of-100 credit score and no MFA on remote access put this at medium risk. [Click AI · Score confidence & run guardrails.] Confidence 0.90 — but medium risk always goes to a person; that guardrail doesn't bend for a high confidence score. [Click Accept with conditions.] A £60,000 value cap until two years of accounts are reviewed, and MFA required before any system access — conditions, not a blank cheque.

[On the completion card, open the value record.] £7,500 identified against the named quote — banked against an approved exception, not a straight redirect, and every reason anyone typed is still attached to the case. One step still sits with a person after this: Finance calls the bank to verify the account before the supplier goes active, and the PO stays blocked until they do — the agent never touches that step. [Return to the Dashboard.] New tickets now reads UC4 as closed.
