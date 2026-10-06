# Product requirements — Agentic MRO Procurement demo

Source: client PRD table (five demos), plus the follow-up asks recorded below.
This file is the reference for what the demo must show. Everything on screen is
fictional; the operating entity is **Northgate Industries**, a specialty
coatings and resins manufacturer. No real client name, brand or plant is ever
rendered.

## The five capabilities

| # | Demo / tool | What it showcases | Translation-enabled delivery | Business value | Status |
|---|---|---|---|---|---|
| 1 | **Autonomous procurement with guide** | AI-led buying assistance, requisition validation, policy checks, multilingual buying support | Users raise requests in their own language while requirements, supplier details and policy guidance are translated into standard procurement language | Improves buying compliance, reduces requisition errors, accelerates approvals, improves the experience across multilingual sites | Partial — extend what exists |
| 2 | **AI procurement service desk with translation** | AI query handling, ticket triage, knowledge search, multilingual response generation | Supports queries in multiple languages and returns translated responses, reducing dependence on language-specific support teams | Improves resolution speed, reduces service-desk workload, gives consistent support across regions | **Net new** |
| 3 | **Procurement control tower & spend analytics** | Spend visibility, supplier insights, indicator tracking, risk indicators, performance dashboards | Translates multi-country procurement data, supplier names, category descriptions and comments into one reporting structure | Improves spend visibility, enables faster decisions, supports governance across global procurement | **Net new** |
| 4 | **AI catalogue enhancer** | Catalogue gap analysis, buying-channel insights, off-catalogue spend detection, content improvement | Converts local-language item descriptions and buying patterns into standardised catalogue insights | Increases catalogue adoption, reduces uncontrolled spend, improves channel compliance, supports supplier consolidation | **Net new** |
| 5 | **Translation layer across all use** | Common multilingual enablement across processes, tools and interactions | The bridge between local users, global policies, supplier content and analytics | Scalable global operations, fewer language barriers, better compliance | Runs through everything — **no separate demo** |

## Languages

English · German · Spanish · French · Simplified Chinese.
English is the working language; the switch sits top-right and changes the
whole workspace. Incoming requests arrive in the local language and are
translated for whoever is reading.

## Service desk — the required flow (capability 2)

Spans two personas: the **supplier** and the **MRO buyer / procurement specialist**.

1. Supplier self-service — the supplier asks a question in their own language.
2. **Simple question** → the AI agent answers directly.
3. **Strategic question** → the AI agent categorises it as strategic.
4. The supplier is shown that the question is pending.
5. It is staged for human review.
6. The procurement specialist picks from AI-recommended responses.
7. The response is sent to the supplier — in the same portal or by email.

## Control tower — the required content (capability 3)

Replaces the inherited freight analytics. Must show:
spend visibility · supplier insights · indicator tracking · risk indicators ·
performance dashboards, cut by **country** and by **persona**, using **bar and
pie charts**, plus a **conversational question-and-answer** surface.

## Standing rules

1. Every step shows a faithful reproduction of its source document.
2. Anything entered for the first time animates; AI work reads as AI work.
3. No number is written into a component — all values come from
   `src/mro/data/procurement.ts` and are computed. State updates on every action.
4. Options are put to the reviewer before new functionality is added.
5. Plain business language. No jargon, no small text, no button wrapping to two
   lines, no one-line content split across two.
