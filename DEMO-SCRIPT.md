# Northgate Industries · MRO procurement — presenter script

Three stories, ~18 minutes total. Every figure below was read off the running app,
so it can be said out loud verbatim. Sign in fresh before starting: the store
resets, and Story 2 depends on nothing having been resolved yet.

Run order matters — Story 1 sets the baseline that Story 2 breaks.

---

## Story 1 · The request nobody touched (~5 min)

**Covers:** autonomous procurement with guide · catalogue adoption · translation layer (in passing)

> **Say "catalogue data", never "catalogue screen".** Nobody shops in this demo. The
> agent matches free text to the SKU in the item master and buys at the price the
> agreement holds — that *is* a catalogue line. Do not say "he ordered from the
> catalogue" or "punch-out": there is no shopping UI on screen and the question
> will come.

| # | Where | Click | Say |
|---|---|---|---|
| 0 | Dashboard | — | "Sixteen requests in flight. Six are held at $37,894, two invoices are holding $406. Every number on this page is computed — nothing here is typed in." |
| 0b | Agent workforce | sidebar | "Six agents. Each one reads specific documents, produces specific output, and stops for a person on specific conditions." Back to Dashboard. |
| 1 | Dashboard | **+ New request** | "A planned-maintenance request from Mixing Line 1 — six bearings for the July shutdown. **This arrived as a message, not as an order.** Nobody opened a catalogue." |
| 2 | Step 1 | Validate & proceed ×3 | "It came in German — the plant writes in the language it works in, and the agent reads it. The planner gave the part number outright, so the match is exact." |
| 3 | Step 2 | rail 02 → proceed | "**Here is the catalogue, as data.** The item master has this SKU on agreement SA-MRO-07, with a standard price of $148.00 — and we last bought it at $148.00 in April. Item, supplier, price, history: that is a catalogue line. No duplicate open, zero stock anywhere, so buying is the only option." |
| 4 | Step 3 | rail 03 → proceed | "Out of warranty, no service contract. The plant pays." |
| 5 | Step 4 | rail 04 → proceed | "On agreement SA-MRO-07 at $148.00 a unit — the catalogue price, confirmed against the contract itself. No quotes to chase." |
| 6 | Step 5 | rail 05 → proceed | "$888 against the plant lead's $5,000 limit. **The rule releases it — nobody is asked to approve what the rule already covers.**" |
| 7 | Step 6 | rail 06 → proceed ×3 | "Now the invoice. Four documents side by side — invoice, order, goods receipt, contract. Watch the columns fill." Verdict: **all four agree, $888.00 at $148.00 for 6 EA, scheduled Net 30.** |
| 8 | Completion card | — | "**Six checks passed. $888 on contract. Zero people involved.**" |
| 9 | Requisitions | sidebar | "There it is — PR-48692, released." |
| 10 | Invoice matching | sidebar | "BPI-5602 — documents agree. Six invoices checked, four cleared without a person." |
| 11 | Supplier | persona toggle | "Same invoice from the supplier's side: being paid. One record, two views." |

**Landing line:** "That is the shape of the good case. Now the one that isn't."

**If someone says you never showed a catalogue purchase:**
> "The catalogue is data, not a screen somebody has to learn. The old way makes the
> engineer find the right SKU in a system in a language that isn't theirs — and
> when they can't, they send an email, and that is exactly where off-catalogue
> spend comes from. We turned it round: they write in their own words, in their own
> language, and the agent does the matching. Catalogue adoption isn't a training
> problem. It stops being a problem when you stop making people use the catalogue."

---

## Story 2 · The $4,180 that stopped (~7 min)

**Covers:** exception handling · guided buying · catalogue/off-contract insight · translation

Switch back to **Buyer**.

| # | Where | Click | Say |
|---|---|---|---|
| 0 | Dashboard | point at CRITICAL row, then the bell | "The exception card and the bell are the same record — the workforce raises it once." |
| 1 | Bell dropdown | **Open ↗** on the mechanical-seal line | "Line down, specification needs confirmation." |
| 2 | Exceptions | — | "Critical at the top. Reason, item, owner, and the three source files the agent actually read." |
| 3 | Detail rail | **Original email — German** | "The engineer wrote in German. **The agent marked the exact phrase that stopped it: 45–50 mm.** A range, no part number. That is why this one is not moving." |
| 4 | — | **Analyze with AI** | "45 or 50 — the material master only carries a 50 mm variant, and the agitator on that line takes 50." |
| 5 | Modal | expand the German draft | "It has written the confirmation back to the engineer in German. The translation layer is not a separate feature — it is just how the workforce talks." |
| 6 | — | **Apply** | — |
| 7 | Dashboard | sidebar | "One click. Held drops from six to five, the Specification bar is gone, the pie moved, spend protected went up." |
| 8 | Supplier | persona toggle | "And the supplier now sees: order on its way. Nobody emailed them." |
| 9 | Exceptions (Buyer) | duplicate row | "Same media already requested for Bead Mill 3 — merge instead of buying twice." |
| 10 | Exceptions | off-contract row | "This one is being bought outside every agreement we hold. The agent routes it back to the contracted supplier at the contracted price. **That is guided buying, and it is also where catalogue gaps show up — off-catalogue spend is visible the moment it happens, not at quarter-end.**" |
| 11 | Control tower | sidebar | "Group level: spend by country, and the red part of every bar is what was bought outside an agreement." |

**Landing line:** "Each of those carried its own evidence. Nothing was released, merged or paid without someone clicking."

---

## Story 3 · The supplier conversation (~6 min)

**Covers:** AI service desk with translation · supplier onboarding & risk · analytics Q&A

| # | Where | Click | Say |
|---|---|---|---|
| 0 | Supplier | persona toggle → language switch → **简体中文** | "Same portal, supplier's chair. They pick their language — and the whole page follows, including the menu." |
| 1 | — | AI button bottom-right → chip **发票 BPI-5581 为何少付?** | "A factual question. The assistant answers it in Chinese, from the live records: $130 held because it was billed at $845 against the $780 we agreed." |
| 2 | — | chip **能否缩短付款账期?** then **下季度我们需要涨价** | "These two change a commercial term. **It refuses to answer — and says so, in their language.** Note the tile: two questions now with a specialist." |
| 3 | Buyer → bell → Service desk | — | "Our side of the same conversation. **Shown in the language it happened in, with an English summary under every single line** — supplier's words, the assistant's reply, and what we sent." |
| 4 | Rail | **Hold the agreed terms** on the payment-terms case | "The suggestion card sits level with the question it answers — the arrow points at where the reply lands." |
| 5 | Rail | **By email** on the price case | "Same reply, other channel. Watch it write the email — you send it." |
| 6 | Supplier | persona toggle | "Both answers arrived, in Chinese. We never typed Chinese." |
| 7 | Buyer → Master data → **Open the run** | — | "Different problem: Westport needs two vessels relined, and **we have no approved supplier for that work at all.**" |
| 8 | Step 1 | **Web search for vendors** → **Send 2 RFQs** | "A person starts the search. The agent writes the request for quote and drafts the emails. Quotes come back — one negotiated down from €41,200 to **€38,400**, the other **€44,900**." |
| 9 | — | Continue → approve | "€6,500 cheaper and the only one that can mobilise inside the shutdown." |
| 10 | Steps 2–5 | rail, proceed through | "Their registration pack arrived in Spanish. Read, translated, every mandatory field checked against the document that proves it. Sanctions, ownership, solvency — all clear." |
| 11 | Step 5 detail | point at the bank row | "**The bank account is deliberately left blank.** It is the most attacked field in procurement, so it is set by callback to the number on the company register — never from an email." |
| 12 | Completion card | — | "**Two quotes compared. €6,500 below the alternative. Zero fields typed by hand.** One signature left." |
| 13 | Control tower | robot bottom-right → **Who are we most exposed to?** | Answer: "ZirCore $415,000 with no qualified alternative is the real exposure; Apex is larger at $1,021,500 but we hold alternatives." |
| 14 | Dashboard | sidebar, point at the black bar | "**The agents only recommend. Nothing is released, merged, claimed or paid without your approval — full audit trail on every decision.**" |

---

## Numbers you may be asked

| Figure | Where it comes from |
|---|---|
| $888.00 | 6 EA × $148.00, the SA-MRO-07 contract price |
| $4,180 | the mechanical seal, one unit, contract price |
| $37,894 / 6 held | sum of held requisitions — falls to 5 when the seal resolves |
| $406 recoverable | $130 (BPI-5581, price) + $276 (BPI-5588, quantity) |
| €38,400 vs €44,900 | the two quotes; €6,500 is the difference |
| 50% touchless | released without a person ÷ finished requests |
| $2,810,200 spend | control tower = annual network spend, a different metric from requisitions in flight |

## Before you present

- Sign in fresh — the store resets and Story 2 needs the seal unresolved.
- Keep the browser tab in the foreground; charts and typing animations are gated on visibility.
- If the run rail stops responding, click the next numbered step directly — the run advances by rail click, not by a Next button.
