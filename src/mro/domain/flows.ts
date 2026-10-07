/**
 * The step chains. Each step names its agent, the business record it
 * produces and — for human steps — the one role that may decide. Effects run
 * through the same reducer commands and gate as every other action; nothing
 * here grants authority because an animation finished.
 */

import type { FlowKey, Pence, Role } from "@/mro/domain/types";
import { evaluateGate } from "@/mro/domain/evaluateGate";
import { activePolicy } from "@/mro/domain/selectors";
import { gbp } from "@/mro/domain/money";
import {
  addDoc,
  agentActor,
  approveAndRelease,
  caseTotal,
  command,
  days,
  docOf,
  hours,
  log,
  poOf,
  receiveAndInvoice,
  rev,
  upsertValue,
  valueOf,
  type Bi,
  type FlowDef,
  type StepCtx,
  type StepDef,
  type StepOption,
} from "@/mro/domain/workflowKit";
import { ST01, ST02, ST02_LEAKAGE, ST03, ST04, ST05, st01Avoided, st01Buy, st01Reuse, st02Bafo, st02Saving, st03Saving, st05Award, st05Baseline, st05Saving } from "@/mro/data/storyData";

const bi = (en: string, de: string): Bi => ({ en, de });

const approve = (en: string, de: string, extra: Partial<StepOption> = {}): StepOption => ({ id: "approve", label: bi(en, de), tone: "approve", primary: true, ...extra });
const reject = (en: string, de: string, endsEn: string, endsDe: string): StepOption => ({ id: "reject", label: bi(en, de), tone: "reject", endsRun: bi(endsEn, endsDe) });

/* ── Shared steps ───────────────────────────────────────────────────────── */

const intake = (activities: Bi[]): StepDef => ({
  id: "intake",
  agent: "intake",
  group: "intake",
  kind: "agent",
  title: bi("Structure the request", "Anforderung strukturieren"),
  minutes: 2,
  activities,
  output: bi("Structured PR", "Strukturierte BANF"),
  artifact: "pr",
  tom: "F1 · 1.0",
  model: "intake-v3.1",
  confidence: 0.94,
  guardrails: ["HC10 evidence on every field", "No invented part numbers"],
  effect: (ctx) => {
    log(ctx, "step.completed", agentActor(ctx.s, "intake"), `${ctx.c.requestId} coded · ${gbp(caseTotal(ctx))}`, [ctx.c.requestId]);
    return ctx.s;
  },
});

const spendApproval = (role: Role, decisionEn: string, decisionDe: string): StepDef => ({
  id: "spend",
  agent: "approval",
  group: "orchestrator",
  kind: "human",
  role,
  title: bi("Approve the spend", "Ausgabe freigeben"),
  minutes: 0,
  activities: [bi("Open DoA task with evidence", "DoA-Aufgabe mit Nachweisen öffnen"), bi("Hold PO release", "Bestellfreigabe halten")],
  output: bi("Spend approval", "Ausgabenfreigabe"),
  artifact: "spend-approval",
  tom: "F1 · 5.0",
  decision: bi(decisionEn, decisionDe),
  blocks: bi("PO release", "Bestellfreigabe"),
  amount: (ctx) => caseTotal(ctx),
  options: [approve("Approve spend", "Ausgabe freigeben"), reject("Reject", "Ablehnen", "Spend rejected · no PO raised", "Ausgabe abgelehnt · keine Bestellung")],
});

const releasePo = (mandate: string, extra: Partial<StepDef> = {}): StepDef => ({
  id: "po",
  agent: "po",
  group: "po",
  kind: "agent",
  title: bi("Release the purchase order", "Bestellung freigeben"),
  minutes: 1,
  activities: [bi("Re-run HC01–HC03 on current revision", "HC01–HC03 auf aktueller Revision prüfen"), bi("Create PO in ERP once", "Bestellung einmalig im ERP anlegen"), bi("Send PO to supplier", "Bestellung an Lieferanten senden")],
  output: bi("Purchase order", "Bestellung"),
  artifact: "po",
  tom: "F1 · 6.0",
  guardrails: ["HC01 approved revision", "HC02 DoA", "HC03 active supplier", "Idempotent dispatch"],
  effect: (ctx) => approveAndRelease(ctx, mandate),
  ...extra,
});

function invoiceSteps(opts: { valueKey?: string; receipt: string; days: number; variance?: (ctx: StepCtx) => Pence; evidence?: (ctx: StepCtx, net: Pence) => Pence }): StepDef[] {
  const settle = (ctx: StepCtx, net: Pence, invoiceId: string, leakage: boolean) => {
    if (!opts.valueKey) return;
    const v = valueOf(ctx.s, ctx.caseId, opts.valueKey);
    if (!v) return;
    const evidenced = opts.evidence ? opts.evidence(ctx, net) : v.baseline - net;
    Object.assign(v, { evidenced, invoiceEvidenceRefs: [invoiceId], state: leakage ? "leakage-open" : "awaiting-finance" });
  };
  return [
    {
      id: "invoice",
      agent: "invoice",
      group: "value",
      kind: "agent",
      title: bi("Match receipt and invoice", "Wareneingang und Rechnung abgleichen"),
      minutes: 0,
      activities: [bi("Record receipt or service acceptance", "Wareneingang oder Abnahme erfassen"), bi("Match invoice to PO and receipt", "Rechnung mit Bestellung und Eingang abgleichen"), bi("Attach evidence to value record", "Nachweis am Werteintrag ablegen")],
      output: bi("Matched invoice", "Abgeglichene Rechnung"),
      artifact: "invoice-match",
      tom: "F5 · 1.0",
      guardrails: ["Three-way match", "No receipt before its event"],
      effect: (ctx) => {
        const variance = opts.variance?.(ctx) ?? 0;
        const r = receiveAndInvoice(ctx, { days: opts.days, receiptLabel: opts.receipt, variance });
        if ("error" in r) return r;
        const inv = docOf(ctx.s, ctx.caseId, "invoice")!;
        settle(ctx, inv.amount ?? 0, inv.id, variance > 0);
        return ctx.s;
      },
    },
    {
      id: "invoice-review",
      agent: "invoice",
      group: "value",
      kind: "human",
      role: "buy-desk-analyst",
      title: bi("Resolve the invoice variance", "Rechnungsabweichung klären"),
      minutes: 0,
      activities: [bi("Hold payment on the variance", "Zahlung der Abweichung halten"), bi("Draft credit-note request", "Gutschriftsanforderung entwerfen")],
      output: bi("Credit note", "Gutschrift"),
      artifact: "invoice-exception",
      tom: "F5 · 2.0",
      decision: bi("Recover the variance from the supplier", "Abweichung beim Lieferanten zurückfordern"),
      blocks: bi("Invoice payment", "Rechnungszahlung"),
      applies: (ctx) => docOf(ctx.s, ctx.caseId, "invoice")?.status === "held",
      amount: (ctx) => Number(docOf(ctx.s, ctx.caseId, "invoice")?.fields.variance ?? 0),
      options: [approve("Request credit note", "Gutschrift anfordern")],
      effect: (ctx) => {
        const inv = docOf(ctx.s, ctx.caseId, "invoice")!;
        const variance = Number(inv.fields.variance);
        const credit = addDoc(ctx, { kind: "credit", title: `Credit note against ${inv.id}`, status: "received", amount: variance, supplierId: inv.supplierId, refs: [inv.id], fields: { invoiceId: inv.id } });
        inv.status = "credited";
        inv.fields.creditId = credit.id;
        settle(ctx, (inv.amount ?? 0) - variance, inv.id, false);
        log(ctx, "invoice.matched", agentActor(ctx.s, "value"), `${credit.id} ${gbp(variance)} received · ${inv.id} net matches PO`, [credit.id, inv.id]);
        return ctx.s;
      },
    },
  ];
}

const financeSignoff = (valueKey: string, decisionEn: string, decisionDe: string): StepDef => ({
  id: "finance",
  agent: "value",
  group: "value",
  kind: "human",
  role: "finance-bp",
  title: bi("Finance validates the value", "Finance validiert den Wert"),
  minutes: 0,
  activities: [bi("Assemble baseline and invoice evidence", "Basis und Rechnungsnachweis zusammenstellen"), bi("Check HC08 before signature", "HC08 vor Unterschrift prüfen")],
  output: bi("Validated value record", "Validierter Werteintrag"),
  artifact: "value-signoff",
  tom: "F5 · 3.0",
  decision: bi(decisionEn, decisionDe),
  blocks: bi("Validated value", "Validierter Wert"),
  applies: (ctx) => !!valueOf(ctx.s, ctx.caseId, valueKey)?.evidenced,
  amount: (ctx) => valueOf(ctx.s, ctx.caseId, valueKey)?.evidenced ?? 0,
  options: [approve("Sign as validated", "Als validiert unterzeichnen"), { id: "decline", label: bi("Not claimed", "Nicht beansprucht"), tone: "reject" }],
  effect: (ctx, opt) => {
    const v = valueOf(ctx.s, ctx.caseId, valueKey)!;
    if (opt === "decline") {
      v.state = "not-claimed";
      return ctx.s;
    }
    const gate = evaluateGate({
      action: "value.validate",
      policy: activePolicy(ctx.s),
      actorKind: "human",
      actorRole: ctx.actor?.kind === "human" ? ctx.actor.role : undefined,
      amount: v.evidenced ?? 0,
      caseRevision: ctx.c.revision,
      approvals: [],
      value: { invoiceEvidence: v.invoiceEvidenceRefs.length > 0, financeSignedBy: ctx.actor?.kind === "human" ? ctx.actor.role : undefined },
      evidenceRefs: v.invoiceEvidenceRefs,
      confidence: { signals: [{ key: "evidence", score: 1, weight: 1, evidence: v.invoiceEvidenceRefs.join(", ") }], pattern: "value" },
    });
    if (!gate.allowed) return { error: gate.reason ?? "HC08 not satisfied" };
    Object.assign(v, { state: "validated", financeSignedBy: ctx.actor, signedAt: ctx.s.clock.now });
    log(ctx, "value.validated", ctx.actor!, `${v.id} validated · ${gbp(v.evidenced ?? 0)}`, [v.id, ...v.invoiceEvidenceRefs], true);
    return ctx.s;
  },
});

/* ── Catalogue call-off (Flow 1) ────────────────────────────────────────── */

const catalogue: FlowDef = {
  key: "catalogue",
  title: bi("Catalogue call-off", "Katalogabruf"),
  steps: [
    intake([bi("Read the original message", "Originalnachricht lesen"), bi("Match item to CAT-AP-2026-01", "Artikel CAT-AP-2026-01 zuordnen"), bi("Code cost centre and GL", "Kostenstelle und Sachkonto kodieren")]),
    {
      id: "policy",
      agent: "channel",
      group: "channel-decision",
      kind: "agent",
      title: bi("Check policy and channel", "Richtlinie und Kanal prüfen"),
      minutes: 1,
      activities: [bi("Confirm live catalogue line and site", "Aktive Katalogzeile und Standort bestätigen"), bi("Check standing approval envelope", "Rahmen der Daueranweisung prüfen"), bi("Score confidence W-DEMO-1", "Konfidenz nach W-DEMO-1 bewerten")],
      output: bi("Gate result", "Prüfergebnis"),
      artifact: "policy-check",
      tom: "F1 · 2.0–4.0",
      model: "channel-v2.0",
      confidence: 0.95,
      guardrails: ["HC02 standing envelope £3,000", "Category on standing list", "Live agreement"],
      effect: (ctx) => {
        const r = command(ctx, { type: "request.approve", actor: { kind: "policy", policyVersion: ctx.s.policies.active, mandateId: "SM-CATALOGUE-01" }, caseId: ctx.caseId, expectedRevision: ctx.c.revision, idempotencyKey: `${ctx.caseId}:policy:r${ctx.c.revision}` });
        if (!r.ok && r.error !== "gate-blocked") return { error: r.message };
        return ctx.s;
      },
    },
    {
      id: "approval",
      agent: "approval",
      group: "orchestrator",
      kind: "human",
      role: "budget-holder",
      reuseTask: true,
      title: bi("Budget Holder approval", "Freigabe Budgetverantwortlicher"),
      minutes: 0,
      activities: [bi("Open DoA task above £3,000", "DoA-Aufgabe über £3.000 öffnen"), bi("Hold PO release", "Bestellfreigabe halten")],
      output: bi("Spend approval", "Ausgabenfreigabe"),
      artifact: "spend-approval",
      tom: "F1 · 5.0",
      decision: bi("Approve the catalogue spend", "Katalogausgabe freigeben"),
      blocks: bi("PO release", "Bestellfreigabe"),
      applies: (ctx) => Object.values(ctx.s.tasks).some((t) => t.caseId === ctx.caseId && !t.outcome && !t.supersededAt),
      amount: (ctx) => caseTotal(ctx),
      options: [approve("Approve spend", "Ausgabe freigeben"), reject("Reject", "Ablehnen", "Spend rejected · no PO raised", "Ausgabe abgelehnt · keine Bestellung")],
      effect: (ctx, opt) => {
        const task = Object.values(ctx.s.tasks).find((t) => t.caseId === ctx.caseId && !t.outcome && !t.supersededAt);
        if (!task || !ctx.actor) return { error: "No open approval task" };
        const r = command(ctx, {
          type: "approval.decide",
          actor: ctx.actor,
          taskId: task.id,
          expectedRevision: ctx.c.revision,
          outcome: opt === "reject" ? "rejected" : "approved",
          idempotencyKey: `${ctx.caseId}:decide:${task.id}`,
        });
        if (!r.ok) return { error: r.message };
        return ctx.s;
      },
    },
    releasePo("SM-CATALOGUE-01"),
    {
      id: "confirm",
      agent: "po",
      group: "po",
      kind: "agent",
      title: bi("Collect supplier confirmation", "Lieferantenbestätigung einholen"),
      minutes: hours(2),
      activities: [bi("Wait for order acknowledgement", "Auf Auftragsbestätigung warten"), bi("Compare price and date to PO", "Preis und Termin mit Bestellung vergleichen")],
      output: bi("Order confirmation", "Auftragsbestätigung"),
      artifact: "po-ack",
      tom: "F1 · 6.1",
      guardrails: ["Chase after 48h without confirmation"],
      effect: (ctx) => {
        const po = poOf(ctx.s, ctx.caseId);
        if (!po) return { error: "No dispatched PO" };
        if (!po.acknowledgedAt) {
          const chase = Object.values(ctx.s.followUps).find((f) => f.refId === po.id && !f.closedAt);
          return { error: chase ? `No confirmation of ${po.id} after 48h · ${chase.id} chase open` : `Waiting for ${po.id} confirmation` };
        }
        return ctx.s;
      },
    },
    ...invoiceSteps({ receipt: "Goods receipt · all lines", days: 2, variance: (ctx) => (ctx.run.variant.priceVariance ? rev(ctx).lines.reduce((t, l) => t + l.quantity * 300, 0) : 0) }),
  ],
};

/* ── ST01 · Reuse licences before buying ────────────────────────────────── */

const RESERVED = ST01.inactiveSeats.map((x) => x.seat);

const st01: FlowDef = {
  key: "ST01",
  title: bi("Reuse licences before buying", "Lizenzen vor dem Kauf wiederverwenden"),
  steps: [
    intake([bi("Read the portal request", "Portalanfrage lesen"), bi("Code 20 seats to SW-EVIEW-STD-ANNUAL", "20 Plätze SW-EVIEW-STD-ANNUAL zuordnen"), bi("Price at £120 per seat-year", "Preis £120 je Platz und Jahr")]),
    {
      id: "entitlements",
      agent: "licences",
      group: "spend-intelligence",
      kind: "agent",
      title: bi("Read the licence pool", "Lizenzpool auslesen"),
      minutes: 3,
      activities: [bi("Load SAM-2026-1007 snapshot", "SAM-2026-1007 laden"), bi("Find inactive same-tier seats", "Inaktive Plätze gleicher Stufe finden"), bi("Check pool owner approval", "Freigabe des Poolverantwortlichen prüfen")],
      output: bi("Entitlement extract", "Berechtigungsauszug"),
      artifact: "licence-pool",
      tom: "F0 · 3.0",
      model: "sam-reader-v1.4",
      confidence: 0.96,
      guardrails: ["Snapshot under 24h", "Same tier only", "Owner-approved pool"],
      effect: (ctx) => {
        log(ctx, "step.completed", agentActor(ctx.s, "spend-intelligence"), `${ST01.snapshot.id}: ${st01Reuse} inactive seats in ${ST01.pool.id}`, [ST01.snapshot.id]);
        return ctx.s;
      },
    },
    {
      id: "split",
      agent: "channel",
      group: "channel-decision",
      kind: "agent",
      title: bi("Split reuse and buy", "Wiederverwendung und Kauf aufteilen"),
      minutes: 1,
      activities: [bi("Allocate 6 seats from the pool", "6 Plätze aus dem Pool zuordnen"), bi("Price 14 seats to buy", "14 Plätze zum Kauf bepreisen"), bi("Open avoidance value record", "Vermeidungs-Werteintrag anlegen")],
      output: bi("Reuse / buy split", "Aufteilung Wiederverwendung / Kauf"),
      artifact: "reuse-buy",
      tom: "F1 · 4.0",
      confidence: 0.92,
      guardrails: ["Mixed route needs Buy Desk review", "Available seats ≠ access permission"],
      effect: (ctx) => {
        upsertValue(ctx, "licence-avoidance", { category: "cost-avoidance", basis: `${st01Reuse} seats × £120 − £20 admin`, baseline: ST01.unitPrice * ST01.requested, expected: st01Avoided, state: "expected" });
        return ctx.s;
      },
    },
    {
      id: "confirm-route",
      agent: "approval",
      group: "orchestrator",
      kind: "human",
      role: "buy-desk-analyst",
      title: bi("Confirm the mixed route", "Gemischten Weg bestätigen"),
      minutes: 0,
      activities: [bi("Hold seat reservation", "Platzreservierung halten"), bi("Show reuse and buy evidence", "Nachweise zu Wiederverwendung und Kauf zeigen")],
      output: bi("Seat reservation", "Platzreservierung"),
      artifact: "allocation-confirm",
      tom: "F1 · 3.1",
      decision: bi("Confirm 6 reused + 14 bought seats", "6 wiederverwendete + 14 gekaufte Plätze bestätigen"),
      blocks: bi("Seat reservation and PO", "Reservierung und Bestellung"),
      amount: () => ST01.unitPrice * st01Buy,
      options: [approve("Confirm 6 reuse + 14 buy", "6 wiederverwenden + 14 kaufen"), reject("Return to requester", "An Anforderer zurück", "Returned to requester · no seats reserved", "An Anforderer zurück · keine Reservierung")],
      effect: (ctx) => {
        const clash = Object.values(ctx.s.docs).find((d) => d.kind === "reservation" && d.caseId !== ctx.caseId && d.status !== "released" && RESERVED.some((seat) => String(d.fields.seats).includes(seat)));
        if (clash) return { error: `Seats already reserved by ${clash.caseId}` };
        addDoc(ctx, { kind: "reservation", title: `${st01Reuse} seats reserved in ${ST01.pool.id}`, status: "reserved", refs: [ST01.snapshot.id], fields: { seats: RESERVED.join(" · "), pool: ST01.pool.id } });
        const r = rev(ctx);
        const res = command(ctx, {
          type: "request.revise",
          actor: ctx.actor!,
          caseId: ctx.caseId,
          expectedRevision: ctx.c.revision,
          lines: r.lines.map((l) => ({ material: l.material, quantity: st01Buy, uom: l.uom, neededBy: l.neededBy })),
          idempotencyKey: `${ctx.caseId}:revise:split`,
        });
        if (!res.ok) return { error: res.message };
        return ctx.s;
      },
    },
    {
      id: "assign",
      agent: "licences",
      group: "spend-intelligence",
      kind: "agent",
      title: bi("Reassign six seats", "Sechs Plätze neu zuweisen"),
      minutes: 6,
      activities: [bi("Revoke inactive assignments", "Inaktive Zuweisungen entziehen"), bi("Assign seats to ENG-BIW-01–06", "Plätze ENG-BIW-01–06 zuweisen"), bi("Record assignment receipt", "Zuweisungsbeleg erfassen")],
      output: bi("Assignment receipt", "Zuweisungsbeleg"),
      artifact: "assignment-receipt",
      tom: "F1 · 4.1",
      guardrails: ["Same tier · unchanged rights", "Atomic reservation"],
      effect: (ctx) => {
        const res = docOf(ctx.s, ctx.caseId, "reservation")!;
        res.status = "fulfilled";
        addDoc(ctx, { id: "ASN-AP-1001", kind: "assignment", title: `${st01Reuse} seats reassigned`, status: "assigned", refs: [res.id], fields: { seats: RESERVED.join(" · "), users: "ENG-BIW-01 → ENG-BIW-06" } });
        return ctx.s;
      },
    },
    releasePo("SM-SOFTWARE-01"),
    ...invoiceSteps({ valueKey: "licence-avoidance", receipt: "Access verified · 20 of 20 users", days: 2, evidence: () => st01Avoided }),
    financeSignoff("licence-avoidance", "Validate £700 licence cost avoidance", "£700 Lizenzkostenvermeidung validieren"),
  ],
};

/* ── ST02 · Negotiate from quote evidence ───────────────────────────────── */

const validQuotes = (ctx: StepCtx) => Object.values(ctx.s.docs).filter((d) => d.caseId === ctx.caseId && d.kind === "quote" && d.fields.comparable === true).length;

const st02: FlowDef = {
  key: "ST02",
  title: bi("Negotiate from quote evidence", "Auf Basis von Angebotsdaten verhandeln"),
  steps: [
    intake([bi("Read the supplier quote email", "Angebots-E-Mail lesen"), bi("Code scope SVC-PM-SOL-01", "Leistung SVC-PM-SOL-01 kodieren"), bi("Set £50,000 as starting cost", "£50.000 als Ausgangskosten setzen")]),
    {
      id: "rfq",
      agent: "sourcing",
      group: "sourcing",
      kind: "agent",
      title: bi("Run a comparable RFQ", "Vergleichbare Anfrage durchführen"),
      minutes: days(2),
      activities: [bi("Issue RFQ-AP-2002 to four panel suppliers", "RFQ-AP-2002 an vier Panel-Lieferanten"), bi("Collect quotes on the same scope", "Angebote zum gleichen Umfang sammeln"), bi("Exclude quotes missing inspection", "Angebote ohne Prüfung ausschließen")],
      output: bi("Quote comparison", "Angebotsvergleich"),
      artifact: "quote-matrix",
      tom: "F2 · 2.0",
      model: "sourcing-v2.2",
      confidence: 0.91,
      guardrails: ["Same scope, dates and inclusions", "HC04 three valid quotes"],
      effect: (ctx) => {
        addDoc(ctx, { id: ST02.rfq, kind: "rfq", title: `${ST02.rfq} · planned maintenance, Solihull`, status: "closed", refs: [ctx.c.requestId], fields: { issued: ST02.quotes.length } });
        ST02.quotes.forEach((q, i) => {
          const excluded = ctx.run.variant.twoBids && q.supplierId === "SUP-AP-006";
          addDoc(ctx, {
            id: `QTE-AP-2002-${i + 1}`,
            kind: "quote",
            title: `${ctx.s.suppliers[q.supplierId].name}`,
            status: excluded ? "withdrawn" : q.comparable ? "valid" : "not comparable",
            amount: q.total,
            supplierId: q.supplierId,
            refs: [ST02.rfq],
            fields: { comparable: q.comparable && !excluded, note: excluded ? "Withdrawn by supplier" : q.note },
          });
        });
        return ctx.s;
      },
    },
    {
      id: "benchmark",
      agent: "sourcing",
      group: "bid-scoring",
      kind: "agent",
      title: bi("Benchmark the cost lines", "Kostenpositionen benchmarken"),
      minutes: 4,
      activities: [bi("Split the preferred quote into lines", "Bevorzugtes Angebot in Positionen zerlegen"), bi("Compare to rate cards and history", "Mit Tarifen und Historie vergleichen"), bi("Flag overtime and mobilisation", "Überstunden und Mobilisierung markieren")],
      output: bi("Line benchmark", "Positions-Benchmark"),
      artifact: "line-benchmark",
      tom: "F2 · 3.0",
      confidence: 0.9,
      guardrails: ["Benchmark £45K–£48K", "Thin history drops to review"],
    },
    {
      id: "position",
      agent: "sourcing",
      group: "bid-scoring",
      kind: "agent",
      title: bi("Prepare the negotiation", "Verhandlung vorbereiten"),
      minutes: 3,
      activities: [bi("Set target £46K and fallback £48K", "Ziel £46K und Rückfall £48K setzen"), bi("Anchor walk-away at next quote £49.2K", "Abbruch beim nächsten Angebot £49,2K"), bi("Draft BAFO request", "BAFO-Anfrage entwerfen")],
      output: bi("Negotiation pack", "Verhandlungspaket"),
      artifact: "negotiation-position",
      tom: "F2 · 4.0",
      guardrails: ["No commercial commitment by the agent"],
    },
    {
      id: "send",
      agent: "approval",
      group: "orchestrator",
      kind: "human",
      role: "buy-desk-analyst",
      title: bi("Approve the negotiation draft", "Verhandlungsentwurf freigeben"),
      minutes: 0,
      activities: [bi("Hold the draft until reviewed", "Entwurf bis zur Prüfung halten")],
      output: bi("BAFO request sent", "BAFO-Anfrage gesendet"),
      artifact: "negotiation-draft",
      tom: "F2 · 4.1",
      decision: bi("Send the BAFO request to Precision Maintenance Partners", "BAFO-Anfrage an Precision Maintenance Partners senden"),
      blocks: bi("Supplier contact", "Lieferantenkontakt"),
      amount: () => ST02.target,
      options: [approve("Send BAFO request", "BAFO-Anfrage senden"), reject("Withdraw", "Zurückziehen", "Negotiation withdrawn · original quote stands", "Verhandlung zurückgezogen · Originalangebot gilt")],
    },
    {
      id: "bafo",
      agent: "sourcing",
      group: "sourcing",
      kind: "agent",
      title: bi("Receive the supplier BAFO", "BAFO des Lieferanten erhalten"),
      minutes: days(1),
      activities: [bi("Read the supplier reply", "Antwort des Lieferanten lesen"), bi("Compare revised lines to original", "Revidierte Positionen mit Original vergleichen"), bi("Confirm scope unchanged", "Unveränderten Umfang bestätigen")],
      output: bi("BAFO revision 1", "BAFO-Revision 1"),
      artifact: "bafo-compare",
      tom: "F2 · 5.0",
      guardrails: ["Round 1 of 2", "Original quote preserved"],
      effect: (ctx) => {
        addDoc(ctx, {
          id: "BAFO-AP-2002-R1",
          kind: "bafo",
          title: "BAFO round 1 · Precision Maintenance Partners",
          status: "received",
          amount: st02Bafo,
          supplierId: "SUP-AP-002",
          refs: ["QTE-AP-2002-1"],
          fields: { round: 1, overtime: ST02.lines[1].bafo, mobilisation: ST02.lines[2].bafo, scope: "Unchanged · inspection included" },
        });
        return ctx.s;
      },
    },
    {
      id: "award",
      agent: "approval",
      group: "award",
      kind: "human",
      role: "category-lead",
      title: bi("Award the contract", "Zuschlag erteilen"),
      minutes: 0,
      activities: [bi("Assemble competition evidence", "Wettbewerbsnachweise zusammenstellen"), bi("Hold award above £30K", "Zuschlag über £30K halten")],
      output: bi("Award record", "Zuschlagsdatensatz"),
      artifact: "award-decision",
      tom: "F2 · 6.0",
      decision: bi("Award £46,000 BAFO to Precision Maintenance Partners", "Zuschlag £46.000 an Precision Maintenance Partners"),
      blocks: bi("Award and spend approval", "Zuschlag und Ausgabenfreigabe"),
      amount: () => st02Bafo,
      options: [
        approve("Award £46,000", "Zuschlag £46.000", {
          unavailable: (ctx) => (validQuotes(ctx) < 3 ? bi("HC04 · only two valid quotes", "HC04 · nur zwei gültige Angebote") : undefined),
        }),
        reject("Return to evaluation", "Zur Bewertung zurück", "Award declined · evaluation reopened", "Zuschlag abgelehnt · Bewertung wieder offen"),
      ],
      effect: (ctx) => {
        const gate = evaluateGate({
          action: "award.approve",
          policy: activePolicy(ctx.s),
          actorKind: "human",
          actorRole: "category-lead",
          amount: st02Bafo,
          caseRevision: ctx.c.revision,
          approvals: [],
          supplier: { status: "active", cleared: true, sanctionsOpen: false, bankVerified: true },
          competition: { competitive: true, validQuotes: validQuotes(ctx) },
          evidenceRefs: [ST02.rfq, "BAFO-AP-2002-R1"],
          confidence: { signals: [{ key: "competition", score: 0.92, weight: 1, evidence: ST02.rfq }], pattern: "competitive-award" },
        });
        if (!gate.allowed) return { error: gate.reason ?? "Award gate failed" };
        addDoc(ctx, { id: "AWD-AP-2002", kind: "award", title: "Award · Precision Maintenance Partners", status: "awarded", amount: st02Bafo, supplierId: "SUP-AP-002", refs: [ST02.rfq, "BAFO-AP-2002-R1"], fields: { basis: "BAFO round 1 · lowest comparable", validQuotes: validQuotes(ctx) } });
        const r = rev(ctx);
        const res = command(ctx, { type: "request.revise", actor: ctx.actor!, caseId: ctx.caseId, expectedRevision: ctx.c.revision, supplierId: "SUP-AP-002", lines: r.lines.map((l) => ({ material: l.material, quantity: l.quantity, uom: l.uom, neededBy: l.neededBy, unitPrice: st02Bafo })), idempotencyKey: `${ctx.caseId}:revise:award` });
        if (!res.ok) return { error: res.message };
        upsertValue(ctx, "sourcing", { category: "sourcing-saving", basis: "Initial £50,000 − BAFO £46,000 · same scope", baseline: ST02.baseline, expected: st02Saving, state: "expected" });
        return ctx.s;
      },
    },
    spendApproval("category-lead", "Approve £46,000 spend commitment", "£46.000 Ausgabe freigeben"),
    {
      id: "contract",
      agent: "contracts",
      group: "contract",
      kind: "agent",
      title: bi("Open the contract work", "Vertragsarbeit eröffnen"),
      minutes: 2,
      activities: [bi("Draft CTR-AP-4004 from TPL-SVC-STD", "CTR-AP-4004 aus TPL-SVC-STD entwerfen"), bi("Send draft to supplier for redlines", "Entwurf zur Prüfung an Lieferanten"), bi("Hold PO until contract is stored", "Bestellung bis zur Ablage halten")],
      output: bi("Contract draft", "Vertragsentwurf"),
      artifact: "contract-link",
      tom: "F3 · 1.0",
      effect: (ctx) => {
        if (!docOf(ctx.s, ctx.caseId, "contract")) {
          addDoc(ctx, { id: ST02.contract, kind: "contract", title: `${ST02.contract} · Precision Maintenance Partners`, status: "drafting", amount: st02Bafo, supplierId: "SUP-AP-002", refs: ["AWD-AP-2002"], fields: { requiredForPo: true, version: 1, template: ST04.template } });
        }
        ctx.spawn = ["ST04"];
        return ctx.s;
      },
    },
    releasePo("SM-SERVICES-01", {
      waitsFor: (ctx) => (docOf(ctx.s, ctx.caseId, "contract")?.status === "stored" ? undefined : `${ST02.contract} not stored · contract work open`),
      blockedOwner: "contract-analyst",
    }),
    ...invoiceSteps({ valueKey: "sourcing", receipt: "Service acceptance SA-AP-2002 · inspection done", days: 10, variance: (ctx) => (ctx.run.variant.leakage ? ST02_LEAKAGE : 0) }),
    financeSignoff("sourcing", "Validate £4,000 sourcing saving", "£4.000 Einsparung validieren"),
  ],
};

/* ── ST04 · Resolve contract deviations (runs on the ST02 case) ─────────── */

const clauseDecided = (ctx: StepCtx, stepId: string) => ctx.run.steps[stepId]?.decision?.optionId;

const st04: FlowDef = {
  key: "ST04",
  title: bi("Resolve contract deviations", "Vertragsabweichungen klären"),
  steps: [
    {
      id: "triage",
      agent: "contracts",
      group: "contract",
      kind: "agent",
      title: bi("Triage the contract scope", "Vertragsumfang einordnen"),
      minutes: 3,
      activities: [bi("Confirm £46K services within desk scope", "£46K Leistung im Desk-Umfang bestätigen"), bi("Load library CL-LIB-2026.2", "Bibliothek CL-LIB-2026.2 laden"), bi("Read supplier redlines", "Änderungen des Lieferanten lesen")],
      output: bi("Contract scope", "Vertragsumfang"),
      artifact: "contract-scope",
      tom: "F3 · 1.0",
      model: "contract-v1.8",
      confidence: 0.93,
      effect: (ctx) => {
        const c = docOf(ctx.s, ctx.caseId, "contract");
        if (c) c.status = "in review";
        return ctx.s;
      },
    },
    {
      id: "compare",
      agent: "contracts",
      group: "clause-compare",
      kind: "agent",
      title: bi("Compare the redlines", "Änderungen vergleichen"),
      minutes: 5,
      activities: [bi("Map each redline to a library clause", "Jede Änderung einer Bibliotheksklausel zuordnen"), bi("Band clauses Green, Amber, Red", "Klauseln Grün, Gelb, Rot einstufen"), bi("Route each band to its owner", "Jede Stufe an den Verantwortlichen")],
      output: bi("Clause band map", "Klauselübersicht"),
      artifact: "clause-matrix",
      tom: "F3 · 2.0",
      confidence: 0.9,
      guardrails: ["Unknown text treated as Red", "Highest band routes the contract"],
    },
    {
      id: "green",
      agent: "contracts",
      group: "clause-compare",
      kind: "agent",
      title: bi("Retain the Green terms", "Grüne Klauseln übernehmen"),
      minutes: 1,
      activities: [bi("Keep library payment and insurance text", "Bibliothekstext Zahlung und Versicherung behalten"), bi("Record under signing mandate SM-SIGN-01", "Unter Zeichnungsmandat SM-SIGN-01 erfassen")],
      output: bi("Green clauses settled", "Grüne Klauseln erledigt"),
      artifact: "clause-green",
      tom: "F3 · 2.1",
    },
    {
      id: "amber",
      agent: "approval",
      group: "orchestrator",
      kind: "human",
      role: "delegated-approver",
      title: bi("Decide the warranty deviation", "Gewährleistungsabweichung entscheiden"),
      minutes: 0,
      activities: [bi("Show proposal against library range", "Vorschlag gegen Bibliotheksspanne zeigen")],
      output: bi("Warranty decision", "Gewährleistungsentscheidung"),
      artifact: "clause-amber",
      tom: "F3 · 2.2",
      decision: bi("Warranty proposed at 6 months · library 12", "Gewährleistung 6 Monate vorgeschlagen · Bibliothek 12"),
      blocks: bi("Contract finalisation", "Vertragsabschluss"),
      amount: () => st02Bafo,
      options: [
        approve("Counter at 12 months", "Mit 12 Monaten kontern"),
        { id: "accept6", label: bi("Accept 6 months", "6 Monate akzeptieren"), tone: "alt" },
      ],
    },
    {
      id: "red",
      agent: "approval",
      group: "orchestrator",
      kind: "human",
      role: "legal",
      title: bi("Legal reviews liability", "Rechtsprüfung der Haftung"),
      minutes: 0,
      activities: [bi("Hold the contract on the Red clause", "Vertrag wegen roter Klausel halten")],
      output: bi("Liability decision", "Haftungsentscheidung"),
      artifact: "clause-red",
      tom: "F3 · 2.3",
      decision: bi("Uncapped client liability proposed", "Unbegrenzte Haftung des Auftraggebers vorgeschlagen"),
      blocks: bi("Contract and dependent PO", "Vertrag und abhängige Bestellung"),
      amount: () => st02Bafo,
      options: [approve("Counter with cap at £46,000", "Mit Deckel bei £46.000 kontern"), reject("Reject the contract", "Vertrag ablehnen", "Contract rejected by Legal · PO stays held", "Vertrag von Legal abgelehnt · Bestellung bleibt gesperrt")],
    },
    {
      id: "revise",
      agent: "contracts",
      group: "contract",
      kind: "agent",
      title: bi("Issue the revised contract", "Überarbeiteten Vertrag senden"),
      minutes: days(1),
      activities: [bi("Apply approved wording as version 2", "Freigegebenen Text als Version 2 übernehmen"), bi("Send countertext to supplier", "Gegentext an Lieferanten senden"), bi("Receive supplier acceptance", "Annahme des Lieferanten erhalten")],
      output: bi("Contract version 2", "Vertragsversion 2"),
      artifact: "revised-contract",
      tom: "F3 · 3.0",
      effect: (ctx) => {
        const c = docOf(ctx.s, ctx.caseId, "contract")!;
        Object.assign(c, { status: "agreed" });
        c.fields.version = 2;
        c.fields.warranty = clauseDecided(ctx, "amber") === "accept6" ? "6 months" : "12 months";
        c.fields.liability = "Capped at £46,000";
        return ctx.s;
      },
    },
    {
      id: "sign",
      agent: "contracts",
      group: "contract",
      kind: "agent",
      title: bi("Collect signatures", "Unterschriften einholen"),
      minutes: hours(4),
      activities: [bi("Route to supplier signatory", "An Zeichnungsberechtigten des Lieferanten"), bi("Sign under mandate SM-SIGN-01", "Unter Mandat SM-SIGN-01 zeichnen")],
      output: bi("Executed contract", "Unterzeichneter Vertrag"),
      artifact: "signature",
      tom: "F3 · 3.1",
      effect: (ctx) => {
        docOf(ctx.s, ctx.caseId, "contract")!.status = "signed";
        return ctx.s;
      },
    },
    {
      id: "store",
      agent: "contracts",
      group: "contract",
      kind: "agent",
      title: bi("Store the executed contract", "Vertrag ablegen"),
      minutes: 2,
      activities: [bi("File version 2 in the repository", "Version 2 im Repository ablegen"), bi("Record protected terms", "Geschützte Bedingungen erfassen"), bi("Release the held PO", "Gehaltene Bestellung freigeben")],
      output: bi("Repository receipt", "Ablagebeleg"),
      artifact: "repository-receipt",
      tom: "F3 · 3.2",
      effect: (ctx) => {
        const c = docOf(ctx.s, ctx.caseId, "contract")!;
        c.status = "stored";
        c.fields.repository = "REP-CTR-AP-4004-V2";
        addDoc(ctx, { kind: "protected-terms", title: `${c.id} protected terms`, status: "recorded", refs: [c.id], fields: { warranty: String(c.fields.warranty), liability: String(c.fields.liability), cash: 0 } });
        log(ctx, "step.completed", agentActor(ctx.s, "contract"), `${c.id} stored as REP-CTR-AP-4004-V2 · PO hold can clear`, [c.id]);
        return ctx.s;
      },
    },
  ],
};

/* ── ST03 · Check the panel before onboarding ───────────────────────────── */

const newSupplier = (ctx: StepCtx) => !!ctx.run.variant.newSupplier;

/** Signals a Category Lead supplier decision resolves. */
const SUPPLIER_SIGNALS = ["supplier_status", "match_strength", "price_benchmark"];

const st03: FlowDef = {
  key: "ST03",
  title: bi("Check the panel before onboarding", "Vor dem Onboarding das Panel prüfen"),
  steps: [
    intake([bi("Read the portal request", "Portalanfrage lesen"), bi("Keep Lymewell Calibration as preference", "Lymewell Calibration als Präferenz behalten"), bi("Code scope SVC-CAL-WOL-02", "Leistung SVC-CAL-WOL-02 kodieren")]),
    {
      id: "panel",
      agent: "suppliers",
      group: "supplier-match",
      kind: "agent",
      title: bi("Check the preferred panel", "Bevorzugtes Panel prüfen"),
      minutes: 4,
      activities: [bi("Match scope to AGR-CAL-2026-01", "Umfang mit AGR-CAL-2026-01 abgleichen"), bi("Compare capability, capacity, distance", "Fähigkeit, Kapazität, Entfernung vergleichen"), bi("Price both routes", "Beide Wege bepreisen")],
      output: bi("Panel match PM-3003", "Panel-Abgleich PM-3003"),
      artifact: "panel-fit",
      tom: "F4 · 1.0",
      model: "supplier-match-v1.6",
      confidence: 0.92,
      guardrails: ["Panel membership alone ≠ fit", "Named supplier kept as preference"],
      effect: (ctx) => {
        addDoc(ctx, { id: ST03.panelMatch, kind: "panel-match", title: `${ST03.panelMatch} · calibration, Wolverhampton`, status: "matched", refs: [ST03.incumbent.agreement], fields: { incumbent: ST03.incumbent.supplierId, requested: ST03.requested.supplierId, capacity: ctx.run.variant.noCapacity ? "unavailable" : "available" } });
        return ctx.s;
      },
    },
    {
      id: "route",
      agent: "approval",
      group: "orchestrator",
      kind: "human",
      role: "category-lead",
      title: bi("Choose the supplier route", "Lieferantenweg wählen"),
      minutes: 0,
      activities: [bi("Hold onboarding until decided", "Onboarding bis zur Entscheidung halten")],
      output: bi("Route decision", "Wegentscheidung"),
      artifact: "supplier-choice",
      tom: "F4 · 1.1",
      decision: bi("Use the incumbent or onboard the named supplier", "Bestandslieferant nutzen oder genannten Lieferanten aufnehmen"),
      blocks: bi("Supplier onboarding and PO", "Onboarding und Bestellung"),
      amount: () => ST03.incumbent.price,
      options: [
        {
          id: "incumbent",
          label: bi("Use West Midlands Calibration", "West Midlands Calibration nutzen"),
          tone: "approve",
          primary: true,
          variant: { incumbent: true },
          unavailable: (ctx) => (ctx.run.variant.noCapacity ? bi("Incumbent has no shutdown capacity", "Keine Kapazität beim Bestandslieferanten") : undefined),
        },
        { id: "onboard", label: bi("Onboard Lymewell Calibration", "Lymewell Calibration aufnehmen"), tone: "alt", variant: { newSupplier: true } },
      ],
      effect: (ctx, opt) => {
        if (opt !== "incumbent") return ctx.s;
        const r = rev(ctx);
        const res = command(ctx, { type: "request.revise", actor: ctx.actor!, caseId: ctx.caseId, expectedRevision: ctx.c.revision, supplierId: ST03.incumbent.supplierId, agreementId: ST03.incumbent.agreement, lines: r.lines.map((l) => ({ material: l.material, quantity: l.quantity, uom: l.uom, neededBy: l.neededBy })), resolvedSignals: SUPPLIER_SIGNALS, idempotencyKey: `${ctx.caseId}:revise:route` });
        if (!res.ok) return { error: res.message };
        upsertValue(ctx, "sourcing", { category: "sourcing-saving", basis: "Named £38,400 − incumbent £36,000 · same scope", baseline: ST03.requested.price, expected: st03Saving, state: "expected" });
        upsertValue(ctx, "onboarding-effort", { category: "productivity", basis: "One onboarding avoided · illustrative effort", baseline: ST03.onboardingEffort, expected: ST03.onboardingEffort, state: "expected" });
        return ctx.s;
      },
    },
    {
      id: "onboard-docs",
      agent: "suppliers",
      group: "onboarding",
      kind: "agent",
      title: bi("Collect registration documents", "Registrierungsunterlagen sammeln"),
      minutes: days(1),
      activities: [bi("Read registration, VAT, insurance", "Registrierung, USt, Versicherung lesen"), bi("Read ownership declaration", "Eigentümererklärung lesen"), bi("Check completeness", "Vollständigkeit prüfen")],
      output: bi("Onboarding pack", "Onboarding-Paket"),
      artifact: "onboarding-checks",
      tom: "F4 · 2.0",
      applies: newSupplier,
      effect: (ctx) => {
        addDoc(ctx, { id: "ONB-AP-3003", kind: "onboarding", title: "Lymewell Calibration onboarding", status: "documents complete", supplierId: ST03.requested.supplierId, refs: [ST03.panelMatch], fields: { registration: "Companies House 14882031", vat: "GB 402 1187 63", insurance: "£5M PL to Aug 2027" } });
        return ctx.s;
      },
    },
    {
      id: "screening",
      agent: "risk",
      group: "risk-screening",
      kind: "agent",
      title: bi("Screen and de-duplicate", "Prüfen und Dubletten ausschließen"),
      minutes: 8,
      activities: [bi("Search supplier master for duplicates", "Lieferantenstamm auf Dubletten prüfen"), bi("Run sanctions and adverse-media screen", "Sanktions- und Medienprüfung"), bi("Score financial risk", "Finanzrisiko bewerten")],
      output: bi("Screening result", "Prüfergebnis"),
      artifact: "risk-screening",
      tom: "F4 · 3.0",
      applies: newSupplier,
      guardrails: ["HC06 sanctions hit blocks at any score"],
      waitsFor: (ctx) => (ctx.run.variant.sanctions ? "HC06 · open sanctions match · Risk Committee" : undefined),
      blockedOwner: "risk-committee",
      effect: (ctx) => {
        const o = docOf(ctx.s, ctx.caseId, "onboarding");
        if (o) Object.assign(o.fields, { duplicates: "None", sanctions: "Clear", risk: "Low" });
        return ctx.s;
      },
    },
    {
      id: "bank",
      agent: "approval",
      group: "orchestrator",
      kind: "human",
      role: "finance-bp",
      title: bi("Finance bank callback", "Bankrückruf durch Finance"),
      minutes: 0,
      activities: [bi("Hold activation until callback", "Aktivierung bis zum Rückruf halten")],
      output: bi("Verified bank details", "Verifizierte Bankdaten"),
      artifact: "bank-callback",
      tom: "F4 · 4.0",
      applies: newSupplier,
      decision: bi("Confirm bank details by callback", "Bankdaten per Rückruf bestätigen"),
      blocks: bi("Supplier activation", "Lieferantenaktivierung"),
      amount: () => ST03.requested.price,
      options: [approve("Callback matches", "Rückruf stimmt"), reject("Details do not match", "Daten stimmen nicht", "Bank mismatch · routed to Finance Controller", "Bankabweichung · an Finance Controller")],
      effect: (ctx, opt) => {
        if (opt === "approve") Object.assign(ctx.s.suppliers[ST03.requested.supplierId], { bankVerified: true, bankMasked: "•••• 6031" });
        return ctx.s;
      },
    },
    {
      id: "activate",
      agent: "suppliers",
      group: "master-data",
      kind: "agent",
      title: bi("Activate the supplier", "Lieferanten aktivieren"),
      minutes: 3,
      activities: [bi("Gate HC06 and HC07", "HC06 und HC07 prüfen"), bi("Sync master data as SUP-AP-010", "Stammdaten als SUP-AP-010 synchronisieren"), bi("Point the PR at the new supplier", "BANF auf neuen Lieferanten setzen")],
      output: bi("Active supplier SUP-AP-010", "Aktiver Lieferant SUP-AP-010"),
      artifact: "supplier-activation",
      tom: "F4 · 5.0",
      applies: newSupplier,
      effect: (ctx) => {
        const pending = ctx.s.suppliers[ST03.requested.supplierId];
        const gate = evaluateGate({
          action: "supplier.activate",
          policy: activePolicy(ctx.s),
          actorKind: "agent",
          amount: 0,
          caseRevision: ctx.c.revision,
          approvals: [],
          supplier: { status: pending.status, cleared: true, sanctionsOpen: pending.sanctionsOpen, bankVerified: pending.bankVerified, bankVerifiedBy: pending.bankVerified ? "finance-bp" : undefined },
          evidenceRefs: ["ONB-AP-3003"],
          confidence: { signals: [{ key: "screening", score: 0.97, weight: 1, evidence: "ONB-AP-3003" }], pattern: "supplier-activation" },
        });
        if (!gate.allowed) return { error: gate.reason ?? "Activation gate failed" };
        if (!ctx.s.suppliers["SUP-AP-010"]) {
          ctx.s.suppliers["SUP-AP-010"] = { ...pending, id: "SUP-AP-010", status: "active", cleared: true, panelScope: ["calibration-services"] };
          pending.status = "inactive";
        }
        const r = rev(ctx);
        const res = command(ctx, { type: "request.revise", actor: agentActor(ctx.s, "master-data"), caseId: ctx.caseId, expectedRevision: ctx.c.revision, supplierId: "SUP-AP-010", agreementId: null, lines: r.lines.map((l) => ({ material: l.material, quantity: l.quantity, uom: l.uom, neededBy: l.neededBy, unitPrice: ST03.requested.price })), resolvedSignals: SUPPLIER_SIGNALS, idempotencyKey: `${ctx.caseId}:revise:activate` });
        if (!res.ok) return { error: res.message };
        return ctx.s;
      },
    },
    spendApproval("category-lead", "Approve the calibration spend", "Kalibrierausgabe freigeben"),
    releasePo("SM-SERVICES-01"),
    ...invoiceSteps({ valueKey: "sourcing", receipt: "Service acceptance SA-AP-3003 · two cells calibrated", days: 12 }),
    financeSignoff("sourcing", "Validate £2,400 sourcing saving", "£2.400 Einsparung validieren"),
  ],
};

/* ── ST05 · Challenge a named specification ─────────────────────────────── */

const st05: FlowDef = {
  key: "ST05",
  title: bi("Challenge a named specification", "Markenvorgabe hinterfragen"),
  steps: [
    intake([bi("Read the work order", "Arbeitsauftrag lesen"), bi("Keep SKF 6205 as named part", "SKF 6205 als genanntes Teil behalten"), bi("Price 200 × £24 baseline", "200 × £24 als Basis bepreisen")]),
    {
      id: "attributes",
      agent: "spec",
      group: "sourcing",
      kind: "agent",
      title: bi("Compare essential attributes", "Wesentliche Merkmale vergleichen"),
      minutes: 6,
      activities: [bi("Read manufacturer data sheets", "Herstellerdatenblätter lesen"), bi("Compare 11 essential attributes", "11 wesentliche Merkmale vergleichen"), bi("Mark unverified fields", "Nicht verifizierte Felder markieren")],
      output: bi("Equivalence record EQ-AP-5005", "Äquivalenzdatensatz EQ-AP-5005"),
      artifact: "attribute-matrix",
      tom: "F1 · 2.2",
      model: "spec-compare-v1.2",
      confidence: 0.88,
      guardrails: ["Equal dimensions ≠ equivalence", "Missing attribute = unverified"],
      effect: (ctx) => {
        addDoc(ctx, { id: ST05.equivalence, kind: "equivalence", title: `${ST05.equivalence} · SKF 6205 ↔ FAG 6205-C`, status: "awaiting technical sign-off", refs: [ctx.c.requestId], fields: { application: ST05.application, verified: 10, missing: 1 } });
        return ctx.s;
      },
    },
    {
      id: "tech",
      agent: "approval",
      group: "orchestrator",
      kind: "human",
      role: "technical-owner",
      title: bi("Technical Owner sign-off", "Freigabe technisch Verantwortlicher"),
      minutes: 0,
      activities: [bi("Hold RFQ scope until signed", "Anfrageumfang bis zur Freigabe halten")],
      output: bi("Signed equivalence", "Freigegebene Äquivalenz"),
      artifact: "tech-signoff",
      tom: "F1 · 3.2",
      decision: bi("Approve FAG 6205-C for CV-HAL-07 only", "FAG 6205-C nur für CV-HAL-07 freigeben"),
      blocks: bi("RFQ scope release", "Freigabe Anfrageumfang"),
      amount: () => st05Baseline,
      options: [approve("Approve for this application", "Für diese Anwendung freigeben"), reject("Reject equivalent", "Äquivalent ablehnen", "Equivalent rejected · SKF 6205 stays the specification", "Äquivalent abgelehnt · SKF 6205 bleibt Vorgabe")],
      effect: (ctx) => {
        const e = docOf(ctx.s, ctx.caseId, "equivalence")!;
        e.status = "approved v1";
        e.fields.missing = 0;
        e.fields.verified = 11;
        return ctx.s;
      },
    },
    {
      id: "scope",
      agent: "approval",
      group: "orchestrator",
      kind: "human",
      role: "buy-desk-analyst",
      title: bi("Release the RFQ scope", "Anfrageumfang freigeben"),
      minutes: 0,
      activities: [bi("Draft supplier-facing wording", "Text für Lieferanten entwerfen")],
      output: bi("RFQ wording", "Anfragetext"),
      artifact: "spec-release",
      tom: "F2 · 1.0",
      decision: bi("Release RFQ for SKF 6205 or FAG 6205-C", "Anfrage für SKF 6205 oder FAG 6205-C freigeben"),
      blocks: bi("Supplier RFQ", "Lieferantenanfrage"),
      amount: () => st05Baseline,
      options: [approve("Release RFQ wording", "Anfragetext freigeben")],
    },
    {
      id: "bids",
      agent: "sourcing",
      group: "bid-scoring",
      kind: "agent",
      title: bi("Collect compliant bids", "Konforme Angebote sammeln"),
      minutes: days(2),
      activities: [bi("Issue RFQ-AP-2005 to three suppliers", "RFQ-AP-2005 an drei Lieferanten"), bi("Check each bid against EQ-AP-5005", "Jedes Angebot gegen EQ-AP-5005 prüfen"), bi("Auto-award under Flow 2 rules", "Zuschlag nach Flow-2-Regeln")],
      output: bi("Award AWD-AP-2005", "Zuschlag AWD-AP-2005"),
      artifact: "bid-compare",
      tom: "F2 · 6.0",
      confidence: 0.93,
      guardrails: ["≤ £30K", "Three valid bids", "Confidence ≥ 0.90"],
      effect: (ctx) => {
        addDoc(ctx, { id: ST05.rfq, kind: "rfq", title: `${ST05.rfq} · 200 bearings, Halewood`, status: "closed", refs: [ST05.equivalence], fields: { issued: ST05.bids.length } });
        ST05.bids.forEach((b, i) => addDoc(ctx, { id: `QTE-AP-2005-${i + 1}`, kind: "quote", title: ctx.s.suppliers[b.supplierId].name, status: "valid", amount: b.total, supplierId: b.supplierId, refs: [ST05.rfq], fields: { comparable: true, part: b.part, note: `${b.part} · £${(b.unit / 100).toFixed(2)} each` } }));
        addDoc(ctx, { id: "AWD-AP-2005", kind: "award", title: "Award · Midlands Industrial Supply", status: "awarded", amount: st05Award, supplierId: "SUP-AP-001", refs: [ST05.rfq, ST05.equivalence], fields: { basis: "Lowest compliant bid · policy auto-award", validQuotes: 3 } });
        const r = rev(ctx);
        const res = command(ctx, { type: "request.revise", actor: agentActor(ctx.s, "award"), caseId: ctx.caseId, expectedRevision: ctx.c.revision, supplierId: "SUP-AP-001", agreementId: null, lines: r.lines.map((l) => ({ material: "MAT-BRG-FAG-6205C", quantity: l.quantity, uom: l.uom, neededBy: l.neededBy, unitPrice: ST05.candidate.unit })), idempotencyKey: `${ctx.caseId}:revise:award` });
        if (!res.ok) return { error: res.message };
        upsertValue(ctx, "sourcing", { category: "sourcing-saving", basis: "200 × (£24 − £22) · same scope", baseline: st05Baseline, expected: st05Saving, state: "expected" });
        return ctx.s;
      },
    },
    spendApproval("budget-holder", "Approve £4,400 bearing spend", "£4.400 Lagerausgabe freigeben"),
    releasePo("SM-MRO-01"),
    ...invoiceSteps({ valueKey: "sourcing", receipt: "Goods receipt GR-AP-5005 · 200 EA", days: 4 }),
    financeSignoff("sourcing", "Validate £400 sourcing saving", "£400 Einsparung validieren"),
  ],
};

export const FLOWS: Record<FlowKey, FlowDef> = { catalogue, ST01: st01, ST02: st02, ST03: st03, ST04: st04, ST05: st05 };

export function stepDef(flow: FlowKey, stepId: string): StepDef | undefined {
  return FLOWS[flow].steps.find((s) => s.id === stepId);
}

export { poOf };
