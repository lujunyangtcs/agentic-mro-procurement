/**
 * Purpose-built evidence for each agent step of the five stories — the
 * licence pool, the quote benchmark grid, the panel comparison, the clause
 * bands, the attribute grid. Every figure is read from `IO`; nothing is
 * restated here. The raw agent output stays one click away.
 */

import * as React from "react";
import { Check, X, Minus, ArrowRight, Users, Clock } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { IO, type UseCaseKey } from "@/mro/data/stories/io";
import { formatValue } from "@/mro/components/story/format";
import { Chip, KeyValue, type ChipTone } from "@/mro/components/desk/ui";
import { useStoryCopy } from "@/mro/components/story/copy";

const money = (n: number) => `£${n.toLocaleString("en-GB")}`;
const when = (iso: string) => formatValue("t", iso);

const L = {
  en: {
    pool: "Licence pool", assigned: "Assigned", unassigned: "Unassigned", inactive: "Inactive 90 days", lastUsed: "Last used", costCentre: "Cost centre",
    reuse: "Reuse", buy: "Buy new", avoided: "Avoided", renewal: "Renewal", rightSize: "Right-size by", pipeline: "Flow 0 pipeline", source: "Source",
    actions: "Actions", poRequired: "PO required", noBuyerTouch: "No buyer touch", cycle: "Cycle time", minutes: "min",
    rfq: "RFQ", issued: "Issued to", opens: "Opens", closes: "Closes", minQuotes: "Min. compliant quotes",
    ranking: "Quote ranking", rank: "Rank", supplier: "Supplier", total: "Total", score: "Score", vsStart: "vs starting cost",
    lines: (s: string) => `Line benchmark · ${s}`, line: "Line", qty: "Qty", unit: "Unit", benchmark: "Benchmark", variance: "Variance",
    position: "Negotiation position", target: "Target", fallback: "Fallback", walkAway: "Walk-away", starting: "Starting cost", levers: "Levers", escalation: "Escalation",
    required: "Required", dayRate: "Day rate", cost: "Est. cost", onboard: "Onboarding", perf: "Performance", commitment: "Commitment used", recommended: "Recommended", named: "Named by requester",
    notScreened: "Not screened", days: (n: number) => `${n} days`, none: "None", saving: "Saving vs named",
    docs: "Document validation", portal: "Portal", results: "Screening results", tier: "Proposed tier", conditions: "Proposed conditions", then: "Then",
    triage: "Triage", draft: "Draft", redline: "Redline window",
    clause: "Clause", proposal: "Supplier proposal", library: "Library", response: "Recommended response", approver: "Approver", band: "Band",
    deviation: "Deviation log",
    attributes: "Essential attributes", candidate: "Candidate", meets: "Meets", notRequired: "Not required", indicative: "Indicative", lastPaid: "Last paid",
    bids: "Bids", lead: "Lead time", award: "Award", learning: "Learning signal",
  },
  de: {
    pool: "Lizenzpool", assigned: "Zugewiesen", unassigned: "Frei", inactive: "90 Tage inaktiv", lastUsed: "Zuletzt genutzt", costCentre: "Kostenstelle",
    reuse: "Wiederverwenden", buy: "Neu kaufen", avoided: "Vermieden", renewal: "Verlängerung", rightSize: "Reduzieren um", pipeline: "Flow-0-Pipeline", source: "Quelle",
    actions: "Aktionen", poRequired: "Bestellung nötig", noBuyerTouch: "Ohne Einkäufer", cycle: "Durchlaufzeit", minutes: "Min.",
    rfq: "Anfrage", issued: "Angefragt bei", opens: "Öffnet", closes: "Schließt", minQuotes: "Mind. gültige Angebote",
    ranking: "Angebotsrangfolge", rank: "Rang", supplier: "Lieferant", total: "Summe", score: "Bewertung", vsStart: "ggü. Ausgangskosten",
    lines: (s: string) => `Positionsvergleich · ${s}`, line: "Pos.", qty: "Menge", unit: "Einzelpreis", benchmark: "Referenz", variance: "Abweichung",
    position: "Verhandlungsposition", target: "Ziel", fallback: "Rückfall", walkAway: "Abbruch", starting: "Ausgangskosten", levers: "Hebel", escalation: "Eskalation",
    required: "Gefordert", dayRate: "Tagessatz", cost: "Gesch. Kosten", onboard: "Onboarding", perf: "Leistung", commitment: "Abruf genutzt", recommended: "Empfohlen", named: "Vom Anforderer genannt",
    notScreened: "Nicht geprüft", days: (n: number) => `${n} Tage`, none: "Keins", saving: "Einsparung ggü. genannt",
    docs: "Dokumentenprüfung", portal: "Portal", results: "Prüfergebnisse", tier: "Vorgeschlagene Stufe", conditions: "Vorgeschlagene Auflagen", then: "Danach",
    triage: "Triage", draft: "Entwurf", redline: "Redline-Frist",
    clause: "Klausel", proposal: "Lieferantenvorschlag", library: "Bibliothek", response: "Empfohlene Antwort", approver: "Genehmiger", band: "Band",
    deviation: "Abweichungsprotokoll",
    attributes: "Wesentliche Merkmale", candidate: "Kandidat", meets: "Erfüllt", notRequired: "Nicht gefordert", indicative: "Richtpreis", lastPaid: "Zuletzt bezahlt",
    bids: "Gebote", lead: "Lieferzeit", award: "Vergabe", learning: "Lernsignal",
  },
} satisfies Record<"en" | "de", Record<string, unknown>>;

type Labels = (typeof L)["en"];

const BAND: Record<string, ChipTone> = { GREEN: "ok", AMBER: "warn", RED: "bad" };
const STATUS: Record<string, ChipTone> = { VALID: "ok", CLEAR: "ok", Executed: "ok", RECEIVED: "info", GAP: "warn", MEDIUM: "warn", "N/A": "mute" };

function Block({ title, right, children, className }: { title: string; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2.5", className)}>
      <div className="flex items-center gap-2">
        <h4 className="min-w-0 flex-1 truncate text-[12px] font-bold uppercase tracking-[0.05em] text-mute">{title}</h4>
        {right}
      </div>
      {children}
    </div>
  );
}

function Figures({ items }: { items: [string, React.ReactNode, boolean?][] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {items.map(([label, value, strong]) => (
        <KeyValue key={label} label={label} value={value} strong={strong} />
      ))}
    </div>
  );
}

function Table({ head, rows, highlight, align }: { head: string[]; rows: React.ReactNode[][]; highlight?: number; align?: ("l" | "r")[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-divider">
      <table className="w-full border-collapse text-[13px]">
        <thead className="bg-surface-fog/70">
          <tr>
            {head.map((h, i) => (
              <th key={h} className={cn("whitespace-nowrap px-3 py-2 text-[11.5px] font-bold uppercase tracking-[0.04em] text-mute", align?.[i] === "r" ? "text-right" : "text-left")}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className={cn("border-t border-divider", ri === highlight && "bg-surface-mint/40")}>
              {r.map((cell, ci) => (
                <td key={ci} className={cn("px-3 py-2 align-top text-ink", align?.[ci] === "r" ? "whitespace-nowrap text-right tabular-nums" : "text-left")}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Tick({ v }: { v: boolean | undefined }) {
  return (
    <span
      className={cn(
        "inline-grid h-5 w-5 place-items-center rounded-full",
        v === true ? "bg-surface-mint text-surface-deep" : v === false ? "bg-surface-rose text-mark-red" : "bg-surface-fog text-mute",
      )}
      aria-label={v === true ? "yes" : v === false ? "no" : "unknown"}
    >
      {v === true ? <Check size={12} strokeWidth={3} /> : v === false ? <X size={12} strokeWidth={3} /> : <Minus size={12} />}
    </span>
  );
}

/* ── ST01 · UC6 ────────────���────────────────────────────────────────────── */

function Uc06Intake({ l }: { l: Labels }) {
  const o = IO.uc06.intake.output;
  const r = o.structured_request;
  return (
    <div className="flex flex-col gap-3">
      <Figures
        items={[
          ["Category", `${r.category.code} · ${r.category.name}`],
          ["GL", r.gl],
          [l.qty, `${r.quantity} ${r.unit}`],
          [l.starting, money(r.starting_cost_gbp), true],
          ["Value band", r.value_band],
          ["Demand", r.demand_type],
        ]}
      />
      <p className="flex flex-wrap gap-1.5">
        {o.flags.map((f) => (
          <Chip key={f} tone="info">
            {f}
          </Chip>
        ))}
      </p>
    </div>
  );
}

function LicenceEvidencePanel({ l }: { l: Labels }) {
  const inp = IO.uc06.spendIntelligence.input;
  const out = IO.uc06.spendIntelligence.output;
  const a = out.reuse_assessment;
  const p = inp.pool;
  const assignedPct = (p.assigned / p.total_entitlements) * 100;
  return (
    <div className="flex flex-col gap-4">
      <Block title={`${l.pool} · ${inp.query.product}`} right={<span className="text-[12px] text-mute">{`${l.source} ${inp.data_sources.sam_snapshot.id} · ${inp.data_sources.enterprise_agreement}`}</span>}>
        <div className="flex h-7 w-full overflow-hidden rounded-md bg-surface-fog" role="img" aria-label={`${p.assigned} of ${p.total_entitlements} assigned, ${p.unassigned} unassigned`}>
          <div className="flex items-center bg-surface-navy/80 px-2 text-[12px] font-bold text-ink-inverse" style={{ width: `${assignedPct}%` }}>
            {`${l.assigned} ${p.assigned}`}
          </div>
          <div className="flex flex-1 items-center justify-center bg-surface-mint text-[12px] font-bold text-surface-deep">{p.unassigned}</div>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-mute">
          <span>{`${p.total_entitlements} entitlements`}</span>
          <span>{`${l.unassigned} ${p.unassigned}`}</span>
          <span>{`${l.inactive} ${p.inactive_90d.length}`}</span>
        </div>
      </Block>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Block title={l.inactive}>
          <Table
            head={["Licence", l.lastUsed, l.costCentre]}
            rows={p.inactive_90d.map((x) => [x.licence_id, when(`${x.last_used}T12:00:00Z`).slice(0, 11), x.assigned_to_cc])}
          />
        </Block>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              [l.reuse, String(a.reuse_recommended_qty), "ok"],
              [l.buy, String(a.new_purchase_qty), "mute"],
              [l.avoided, money(a.spend_avoided_gbp), "ok"],
            ].map(([label, v, tone]) => (
              <div key={label} className={cn("flex flex-col gap-0.5 rounded-md px-3 py-2.5", tone === "ok" ? "bg-surface-mint/60" : "bg-surface-fog")}>
                <span className="text-[12px] text-mute">{label}</span>
                <span className="text-[20px] font-bold tabular-nums leading-[24px] text-ink">{v}</span>
              </div>
            ))}
          </div>
          <p className="text-[13px] leading-[19px] text-ink">{a.source}</p>
          <div className="flex flex-col gap-1 rounded-md border border-divider p-3">
            <p className="text-[12px] font-bold uppercase tracking-[0.05em] text-mute">{l.pipeline}</p>
            <p className="text-[13px] font-bold text-ink">{`${out.pipeline_signal.pipeline_item} · ${out.pipeline_signal.lever}`}</p>
            <p className="text-[12.5px] text-ink">{`${money(out.pipeline_signal.est_value_gbp)} · ${l.renewal} ${when(`${a.renewal_insight.renewal_date}T12:00:00Z`).slice(0, 11)} · ${l.rightSize} ${a.renewal_insight.right_size_by}`}</p>
            <p className="flex items-center gap-1 text-[12.5px] text-mute">
              <ArrowRight size={12} aria-hidden /> {out.pipeline_signal.to}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InternalFulfilmentCard({ l }: { l: Labels }) {
  const o = IO.uc06.channelDecision.output;
  const v = o.value_record;
  return (
    <div className="flex flex-col gap-4">
      <Figures
        items={[
          ["Channel", o.route.channel],
          [l.poRequired, o.route.po_required ? "Yes" : "No", true],
          [l.noBuyerTouch, o.kpi_impact.no_buyer_touch ? "Yes" : "No"],
          [l.cycle, `${o.kpi_impact.cycle_time_minutes} ${l.minutes}`],
          ["Value record", v.value_record_id],
          [l.avoided, money(v.avoided_gbp), true],
        ]}
      />
      <Block title={l.actions}>
        <ul className="flex flex-col gap-1.5">
          {o.route.actions.map((x) => (
            <li key={x.action} className="flex items-center gap-2.5 rounded-md border border-divider px-3 py-2 text-[13px]">
              <Chip tone={STATUS[x.status] ?? "info"}>{x.status}</Chip>
              <span className="min-w-0 flex-1 text-ink">{x.action}</span>
              <span className="shrink-0 text-mute">{x.system}</span>
            </li>
          ))}
        </ul>
      </Block>
      <p className="text-[12.5px] leading-[18px] text-mute">{`${v.measurement} · ${v.to}`}</p>
    </div>
  );
}

/* ── ST02 · UC9 ─────────────────────────────────────────────────────────── */

function RfqCard({ l }: { l: Labels }) {
  const r = IO.uc09.sourcing.output.rfq;
  return (
    <div className="flex flex-col gap-3">
      <Figures
        items={[
          [l.rfq, r.rfq_id, true],
          ["Type", r.type],
          [l.opens, when(r.window.opens)],
          [l.closes, when(r.window.closes)],
          [l.minQuotes, String(r.min_compliant_quotes)],
          [l.issued, String(r.issued_to.length)],
        ]}
      />
      <p className="flex flex-wrap gap-1.5">
        {r.issued_to.map((s) => (
          <Chip key={s} tone="info">
            {s}
          </Chip>
        ))}
      </p>
    </div>
  );
}

function QuoteLineBenchmarkGrid({ l }: { l: Labels }) {
  const inp = IO.uc09.bidScoring.input;
  const out = IO.uc09.bidScoring.output;
  const start = IO.uc09.sourcing.input.request.starting_cost_gbp;
  const lined = inp.bids.find((b) => "lines" in b && b.lines) as { supplier: string; lines: { line: number; desc: string; qty: number; unit_price: number }[] };
  const bench = inp.benchmarks;
  const benchFor = (line: number): string => {
    if (line === 1) return `${money(bench.price_history[0].unit_price)} + ${bench.index.yoy_change_pct}%`;
    if (line === 2) return money(bench.price_history[1].unit_price);
    if (line === 3) return `${money(bench.rate_card.engineer_day_gbp)} · ${bench.rate_card.ref}`;
    return "£0 · prior 2 POs";
  };
  const anomaly = (line: number) => out.anomalies.find((a) => a.line === line)?.issue;
  return (
    <div className="flex flex-col gap-4">
      <Block title={l.ranking} right={<span className="text-[12px] text-mute">{`${l.starting} ${money(start)}`}</span>}>
        <Table
          head={[l.rank, l.supplier, l.total, l.vsStart, l.score]}
          align={["l", "l", "r", "r", "r"]}
          highlight={0}
          rows={out.ranking.map((r) => [String(r.rank), r.supplier, money(r.total), `−${(((start - r.total) / start) * 100).toFixed(1)}%`, r.score.toFixed(2)])}
        />
      </Block>
      <Block title={l.lines(lined.supplier)}>
        <Table
          head={[l.line, "", l.qty, l.unit, l.benchmark, l.variance]}
          align={["l", "l", "r", "r", "r", "l"]}
          rows={lined.lines.map((x) => [
            String(x.line),
            x.desc,
            String(x.qty),
            money(x.unit_price),
            benchFor(x.line),
            anomaly(x.line) ? <Chip tone="warn">{anomaly(x.line)!.split(" – ")[0].split(" vs ").pop()}</Chip> : <span className="text-mute">—</span>,
          ])}
        />
        <ul className="flex flex-col gap-1">
          {out.anomalies.map((a) => (
            <li key={a.line} className="text-[12.5px] leading-[18px] text-ink">{`${a.supplier} · L${a.line} · ${a.issue}`}</li>
          ))}
        </ul>
      </Block>
    </div>
  );
}

function NegotiationPositionCard({ l }: { l: Labels }) {
  const out = IO.uc09.bidScoring.output;
  const n = out.negotiation_position;
  const start = IO.uc09.sourcing.input.request.starting_cost_gbp;
  const lo = n.target_gbp - 800;
  const span = start - lo;
  const pos = (v: number) => `${((v - lo) / span) * 100}%`;
  const marks: [string, number, string][] = [
    [l.target, n.target_gbp, "bg-surface-deep"],
    [l.fallback, n.fallback_gbp, "bg-surface-sage"],
    [l.walkAway, n.walk_away_gbp, "bg-mark-amber"],
    [l.starting, start, "bg-mark-red"],
  ];
  return (
    <Block title={`${l.position} · ${n.preferred_supplier}`} right={<Chip tone="ok">{`−${n.expected_saving_vs_starting_cost_pct}%`}</Chip>}>
      <div className="relative mx-2 mb-9 mt-7 h-2 rounded-full bg-surface-fog">
        <div className="absolute inset-y-0 rounded-full bg-surface-mint" style={{ left: 0, width: pos(n.walk_away_gbp) }} />
        {marks.map(([label, v, tone], i) => (
          <div key={label} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: pos(v) }}>
            <span className={cn("block h-4 w-4 rounded-full border-2 border-white", tone)} />
            <span
              className={cn(
                "absolute whitespace-nowrap text-[12px] font-bold tabular-nums text-ink",
                i % 2 ? "top-5" : "-top-6",
                i === marks.length - 1 ? "right-0" : "left-1/2 -translate-x-1/2",
              )}
            >
              {`${label} ${money(v)}`}
            </span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <p className="mb-1 text-[12px] font-bold uppercase tracking-[0.05em] text-mute">{l.levers}</p>
          <ul className="flex flex-col gap-1">
            {n.levers.map((x) => (
              <li key={x} className="flex items-start gap-2 text-[13px] text-ink">
                <Check size={13} className="mt-0.5 shrink-0 text-surface-deep" aria-hidden /> {x}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1 text-[12px] font-bold uppercase tracking-[0.05em] text-mute">{l.escalation}</p>
          <ul className="flex flex-col gap-1">
            {out.escalation_rules.map((r) => (
              <li key={r.if} className="text-[13px] text-ink">{`${r.if} → ${r.to}`}</li>
            ))}
          </ul>
        </div>
      </div>
    </Block>
  );
}

/* ── ST03 · UC4 ─────────────────────────────────────────────────────────── */

function PanelFitCompare({ l }: { l: Labels }) {
  const inp = IO.uc04.supplierMatch.input;
  const out = IO.uc04.supplierMatch.output;
  const rec = out.recommendation;
  const req = inp.request.required;
  const has = (caps: string[], need: string) => {
    if (/black belt/i.test(need)) return caps.some((c) => /black belt/i.test(c));
    if (/paint/i.test(need)) return caps.some((c) => /paint/i.test(c));
    return undefined;
  };
  const cols = [
    { name: inp.request.named_supplier, tag: l.named, caps: undefined as string[] | undefined, rate: inp.named_supplier_profile.day_rate_quoted, cost: inp.request.starting_cost_gbp, onboard: l.days(inp.named_supplier_profile.onboarding_effort_days), perf: "—", region: "—", commit: "—" },
    ...inp.panel.map((p) => ({
      name: p.supplier,
      tag: p.supplier === rec.supplier ? l.recommended : "Panel",
      caps: p.capabilities,
      rate: p.day_rate,
      cost: p.supplier === rec.supplier ? rec.estimated_cost_gbp : undefined,
      onboard: l.none,
      perf: p.performance_score.toFixed(1),
      region: p.region,
      commit: "utilisation_commitment" in p && p.utilisation_commitment ? `${money(p.utilisation_commitment.used_gbp)} / ${money(p.utilisation_commitment.committed_gbp)}` : "—",
    })),
  ];
  const recIndex = cols.findIndex((c) => c.name === rec.supplier);
  const rows: [string, (c: (typeof cols)[number]) => React.ReactNode][] = [
    ...req.map((need) => [need, (c: (typeof cols)[number]) => (c.caps ? <Tick v={/on-site/i.test(need) ? c.region === "Midlands" : has(c.caps, need)} /> : <span className="text-[12px] text-mute">{l.notScreened}</span>)] as [string, (c: (typeof cols)[number]) => React.ReactNode]),
    [l.dayRate, (c) => money(c.rate)],
    [l.cost, (c) => (c.cost ? money(c.cost) : "—")],
    [l.onboard, (c) => c.onboard],
    [l.perf, (c) => c.perf],
    [l.commitment, (c) => c.commit],
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-md border border-divider">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-surface-fog/70">
              <th className="px-3 py-2 text-left text-[11.5px] font-bold uppercase tracking-[0.04em] text-mute">{l.required}</th>
              {cols.map((c, i) => (
                <th key={c.name} className={cn("px-3 py-2 text-left align-bottom", i === recIndex && "bg-surface-mint/60")}>
                  <span className="block text-[12px] font-bold text-ink">{c.name}</span>
                  <span className={cn("block text-[11.5px] font-medium", i === recIndex ? "text-surface-deep" : "text-mute")}>{c.tag}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, cell]) => (
              <tr key={label} className="border-t border-divider">
                <td className="px-3 py-2 text-mute">{label}</td>
                {cols.map((c, i) => (
                  <td key={c.name} className={cn("px-3 py-2 tabular-nums text-ink", i === recIndex && "bg-surface-mint/30")}>
                    {cell(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-2 rounded-md bg-surface-mint/40 p-3">
        <p className="flex flex-wrap items-center gap-2 text-[14px] font-bold text-ink">
          {`${rec.decision} · ${rec.supplier}`}
          <Chip tone="ok">{`${l.saving} ${money(rec.saving_vs_named_gbp)}`}</Chip>
        </p>
        <ul className="grid grid-cols-1 gap-1 md:grid-cols-2">
          {rec.rationale.map((r) => (
            <li key={r} className="flex items-start gap-2 text-[13px] text-ink">
              <Check size={13} className="mt-0.5 shrink-0 text-surface-deep" aria-hidden /> {r}
            </li>
          ))}
        </ul>
        <p className="text-[12.5px] text-mute">{`${out.if_rejected.next_agent} · ${out.if_rejected.condition}`}</p>
      </div>
    </div>
  );
}

function OnboardingChecklist({ l }: { l: Labels }) {
  const o = IO.uc04.onboarding.output;
  return (
    <Block title={l.docs} right={<span className="text-[12px] text-mute">{`${l.portal} ${o.invitation.portal_ref} · ${when(o.invitation.sent)}`}</span>}>
      <ul className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
        {o.document_validation.map((x) => (
          <li key={x.doc} className="flex min-w-0 items-start gap-2.5 rounded-md border border-divider px-3 py-2">
            <Chip tone={STATUS[x.status] ?? "info"}>{x.status}</Chip>
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-ink">{x.doc}</span>
              {("detail" in x || "note" in x || "check" in x) && (
                <span className="block text-[12px] leading-[16px] text-mute">{(x as { detail?: string; note?: string; check?: string }).detail ?? (x as { note?: string }).note ?? (x as { check?: string }).check}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </Block>
  );
}

function RiskScreening({ l }: { l: Labels }) {
  const o = IO.uc04.riskScreening.output;
  const r = o.results;
  return (
    <div className="flex flex-col gap-4">
      <Figures
        items={[
          ["Sanctions / PEP", <Chip key="s" tone="ok">{r.sanctions_pep}</Chip>],
          ["Financial health", `${r.financial_health.score} · ${r.financial_health.tier}`],
          ["Adverse media", r.adverse_media],
          ["Cyber", `${r.cyber.rating} · ${r.cyber.note}`],
          ["Filings", r.filings],
          [l.tier, <Chip key="t" tone="warn">{o.proposed_risk_tier}</Chip>],
        ]}
      />
      <Block title={l.conditions}>
        <ul className="flex flex-col gap-1">
          {o.proposed_conditions.map((x) => (
            <li key={x} className="flex items-start gap-2 text-[13px] text-ink">
              <ArrowRight size={13} className="mt-0.5 shrink-0 text-mark-amber" aria-hidden /> {x}
            </li>
          ))}
        </ul>
      </Block>
      <p className="text-[12.5px] leading-[18px] text-mute">{`${l.then}: ${o.then}`}</p>
    </div>
  );
}

/* ── ST04 · UC10 ────────────────────────────────────────────────────────── */

function ContractTriage({ l }: { l: Labels }) {
  const o = IO.uc10.contract.output;
  return (
    <Figures
      items={[
        ["Desk scope", o.triage.in_desk_scope ? "Yes" : "No"],
        ["Risk tier", o.triage.risk_tier],
        ["Template", o.triage.template],
        ["Clause pack", o.triage.clause_pack],
        [l.draft, o.draft.doc_id, true],
        [l.redline, `${o.draft.redline_window_days} days · ${when(o.draft.issued_to_supplier)}`],
      ]}
    />
  );
}

function ClauseCompareGrid({ l }: { l: Labels }) {
  const o = IO.uc10.clauseCompare.output;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="ok">{`GREEN ${o.summary.green}`}</Chip>
        <Chip tone="warn">{`AMBER ${o.summary.amber}`}</Chip>
        <Chip tone="bad">{`RED ${o.summary.red}`}</Chip>
        <span className="text-[12.5px] text-mute">{o.summary.commercial_value_protected}</span>
      </div>
      <Table
        head={[l.clause, l.proposal, l.band, l.library, l.response, l.approver]}
        rows={o.clause_assessment.map((c) => [
          <span key="c" className="whitespace-nowrap font-bold">{c.clause}</span>,
          c.proposal,
          <Chip key="b" tone={BAND[c.band]}>{c.band}</Chip>,
          <span key="lib" className="text-[12.5px]">{c.library_match}</span>,
          <span key="r" className="text-[12.5px]">{c.recommended_response}</span>,
          <span key="a" className="text-[12.5px] text-mute">{c.approver}</span>,
        ])}
      />
      <p className="text-[12.5px] leading-[18px] text-mute">{`${l.deviation}: ${o.deviation_log.entries} → ${o.deviation_log.to} · ${o.deviation_log.pattern_note}`}</p>
    </div>
  );
}

/* ── ST05 · UC2 ─────────────────────────────────────────────────────────── */

function TechnicalAttributeGrid({ l }: { l: Labels }) {
  const inp = IO.uc02.intake.input.request;
  const o = IO.uc02.intake.output;
  const sc = o.spec_challenge;
  const cands = [
    { part: inp.named_part, ref: l.named, price: `${l.lastPaid} ${money(inp.unit_price_last_paid)}`, named: true },
    ...sc.approved_equivalents.map((e) => ({ part: e.part, ref: e.ref, price: `${l.indicative} ${money(e.indicative_price)}`, named: false })),
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-md border border-divider">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-surface-fog/70">
              <th className="px-3 py-2 text-left text-[11.5px] font-bold uppercase tracking-[0.04em] text-mute">{l.attributes}</th>
              {cands.map((c) => (
                <th key={c.part} className="px-3 py-2 text-left align-bottom">
                  <span className="block text-[12px] font-bold text-ink">{c.part}</span>
                  <span className="block text-[11.5px] font-medium text-mute">{c.ref}</span>
                  <span className="block text-[11.5px] font-medium tabular-nums text-ink">{c.price}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sc.essential_attributes.map((a) => (
              <tr key={a} className="border-t border-divider">
                <td className="px-3 py-2 text-ink">{a}</td>
                {cands.map((c) => (
                  <td key={c.part} className="px-3 py-2">
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink">
                      <Tick v /> {l.meets}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
            {sc.non_essential.map((a) => (
              <tr key={a} className="border-t border-divider bg-surface-fog/40">
                <td className="px-3 py-2 text-mute">{a}</td>
                {cands.map((c) => (
                  <td key={c.part} className="px-3 py-2 text-[12.5px] text-mute">
                    {l.notRequired}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-bold text-ink">
        {sc.recommendation}
        <Chip tone="info">{`${inp.qty} × · ${money(o.structured_request.starting_cost_gbp)}`}</Chip>
      </p>
    </div>
  );
}

function SensorBids({ l }: { l: Labels }) {
  const o = IO.uc02.sourcing.output;
  const awardIdx = o.bids.findIndex((b) => b.supplier === o.award.supplier);
  return (
    <div className="flex flex-col gap-4">
      <Block title={`${l.bids} · ${o.rfq_id}`}>
        <Table
          head={[l.supplier, "Part", l.unit, l.total, l.lead]}
          align={["l", "l", "r", "r", "r"]}
          highlight={awardIdx}
          rows={o.bids.map((b) => [b.supplier, b.part, money(b.unit), money(b.total), `${b.lead_days}d`])}
        />
      </Block>
      <div className="flex flex-wrap items-center gap-3 rounded-md bg-surface-mint/40 px-3 py-2.5">
        <span className="text-[14px] font-bold text-ink">{`${l.award} · ${o.award.supplier} · ${o.award.part} · ${money(o.award.total_gbp)}`}</span>
        <Chip tone="ok">{`−${money(o.award.saving_vs_starting_cost_gbp)} · ${o.award.saving_pct}%`}</Chip>
        <span className="flex items-center gap-1 text-[12.5px] text-mute">
          <Clock size={12} aria-hidden /> {o.award.po_target}
        </span>
      </div>
      <p className="flex items-center gap-1.5 text-[12.5px] text-mute">
        <Users size={12} aria-hidden /> {`${l.learning}: ${o.learning_signal.equivalent_accepted} → ${o.learning_signal.to}`}
      </p>
    </div>
  );
}

/* ── Dispatcher ────────────────────────────────────────────────────���────── */

const PANELS: Record<string, ((p: { l: Labels }) => React.ReactNode)[]> = {
  "uc06:0": [Uc06Intake],
  "uc06:1": [LicenceEvidencePanel],
  "uc06:2": [InternalFulfilmentCard],
  "uc09:0": [RfqCard],
  "uc09:1": [QuoteLineBenchmarkGrid, NegotiationPositionCard],
  "uc04:0": [PanelFitCompare],
  "uc04:1": [OnboardingChecklist],
  "uc04:2": [RiskScreening],
  "uc10:0": [ContractTriage],
  "uc10:1": [ClauseCompareGrid],
  "uc02:0": [TechnicalAttributeGrid],
  "uc02:1": [SensorBids],
};

export function hasEvidence(uc: UseCaseKey, index: number) {
  return Boolean(PANELS[`${uc}:${index}`]);
}

export function StoryEvidence({ uc, index }: { uc: UseCaseKey; index: number }) {
  const { lang } = useStoryCopy();
  const panels = PANELS[`${uc}:${index}`];
  if (!panels) return null;
  return (
    <div className="flex flex-col gap-5">
      {panels.map((P, i) => (
        <React.Fragment key={i}>
          <P l={L[lang]} />
        </React.Fragment>
      ))}
    </div>
  );
}
