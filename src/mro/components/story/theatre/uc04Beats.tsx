/**
 * ST03 · UC4 beats — each agent's work split into the pieces the presenter
 * asks for one at a time. A beat's lines play in the analysis popup, then its
 * card lands. Figures come from `IO` and match the source files they cite.
 */

/* eslint-disable react-refresh/only-export-components -- beat definitions: the cards are data for the theatre panel */

import type * as React from "react";
import { ClipboardList, FileCheck, FileSearch, Gauge, Landmark, ListChecks, LockKeyhole, MessageSquareQuote, Scale, ShieldCheck, Umbrella } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { IO } from "@/mro/data/stories/io";
import type { Beat, BeatCardProps, Bi } from "@/mro/components/story/theatre/script";
import { BeatFrame, Figure, Pill, Tick, type Tone } from "@/mro/components/story/theatre/BeatFrame";
import { D4, PROPOSED_CAP, PROPOSED_YEARS } from "@/mro/components/story/theatre/uc04Docs";

type Lang = "en" | "de";

const gbp = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;
const bi = (en: string, de: string): Bi => ({ en, de });
const same = (s: string): Bi => ({ en: s, de: s });
const dec = (n: number, lang: Lang) => (lang === "de" ? String(n).replace(".", ",") : String(n));

const mi = IO.uc04.supplierMatch.input;
const mo = IO.uc04.supplierMatch.output;
const oi = IO.uc04.onboarding.input;
const oo = IO.uc04.onboarding.output;
const ri = IO.uc04.riskScreening.input;
const ro = IO.uc04.riskScreening.output;

const req = mi.request;
const rec = mo.recommendation;
const [kestrel, meridian] = mi.panel;
const named = mi.named_supplier_profile;
const SUP = oi.supplier;
const split = (s: string) => {
  const [id, ...rest] = s.split(" ");
  return { id, name: rest.join(" ") };
};
const K = split(kestrel.supplier);
const MER = split(meridian.supplier);
const DAYS = rec.estimated_cost_gbp / kestrel.day_rate;
const NAMED_TOTAL = DAYS * named.day_rate_quoted;
const COMMIT = kestrel.utilisation_commitment!;
const HEADROOM = COMMIT.committed_gbp - COMMIT.used_gbp;
const AFTER = COMMIT.used_gbp + rec.estimated_cost_gbp;
const SAVING = rec.saving_vs_named_gbp;
const PCT = ((1 - kestrel.day_rate / named.day_rate_quoted) * 100).toFixed(1);
const CAPS = req.required.length;
const NEED_DE = "Prozessberater, 6 Wochen, Durchsatz Lackiererei";
const REASON_EN =
  "NovaOps brings its own proprietary paint-line simulation tool, which models booth and oven throughput before we change anything on the line. We are not aware of a panel supplier who can provide it.";
const REASON_DE =
  "NovaOps bringt ein eigenes Lackierlinien-Simulationstool mit, das den Durchsatz von Kabine und Ofen modelliert, bevor wir an der Linie etwas ändern. Uns ist kein Panel-Lieferant bekannt, der das bieten kann.";

/** How each mandatory requirement reads in the panel listing. */
type PanelEntry = (typeof mi.panel)[number];
const MEETS: ((p: PanelEntry) => boolean)[] = [(p) => p.capabilities.includes("LSS Black Belt"), (p) => p.capabilities.includes("Automotive paint"), (p) => p.region === "Midlands"];
const REQ_DE = ["Lean Six Sigma Black Belt", "Erfahrung in Automobil-Lackierereien", "Vor Ort in Solihull"];
const matched = (p: PanelEntry) => MEETS.filter((m) => m(p)).length;

const when = (iso: string, lang: Lang) =>
  new Date(iso).toLocaleString(lang === "de" ? "de-DE" : "en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });

/* ── Card parts ─────────────────────────────────────────────────────────── */

type Align = "left" | "right" | "center";

function Table({ head, rows, align = [] }: { head: string[]; rows: React.ReactNode[][]; align?: Align[] }) {
  const cls = (i: number) => (align[i] === "right" ? "text-right tabular-nums" : align[i] === "center" ? "text-center" : "text-left");
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-[12.5px] leading-[18px]">
        <thead>
          <tr className="border-b border-divider text-mute">
            {head.map((h, i) => (
              <th key={h} scope="col" className={cn("px-2 py-1.5 font-normal first:pl-0 last:pr-0", cls(i))}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, n) => (
            <tr key={n} className="border-b border-divider last:border-b-0">
              {r.map((c, i) => (
                <td key={i} className={cn("px-2 py-2 align-middle text-ink first:pl-0 last:pr-0", cls(i))}>
                  <span className={cn(align[i] === "center" && "inline-flex justify-center")}>{c}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const FILL: Record<Tone, string> = { ok: "bg-surface-deep", warn: "bg-mark-amber", bad: "bg-mark-red", info: "bg-surface-navy", mute: "bg-steel" };

function Bar({ label, note, value, max, tone }: { label: string; note: string; value: number; max: number; tone: Tone }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-[12.5px] leading-[18px]">
        <span className="min-w-0 truncate text-ink">{label}</span>
        <span className="shrink-0 font-bold tabular-nums text-ink">{note}</span>
      </div>
      <div className="h-2 w-full bg-surface-fog" aria-hidden>
        <div className={cn("theatre-grow h-full", FILL[tone])} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
      </div>
    </div>
  );
}

function Note({ tone = "info", children }: { tone?: "info" | "warn"; children: React.ReactNode }) {
  return <p className={cn("text-pretty px-3 py-2.5 text-[12.5px] leading-[18px] text-ink", tone === "warn" ? "bg-surface-amber" : "bg-surface-fog")}>{children}</p>;
}

const Row3 = ({ children }: { children: React.ReactNode }) => <div className="grid grid-cols-1 gap-2 @md/agent:grid-cols-3">{children}</div>;
const Row4 = ({ children }: { children: React.ReactNode }) => <div className="grid grid-cols-2 gap-2 @2xl/agent:grid-cols-4">{children}</div>;

/* ── 1 · Supplier Match Agent ───────────────────────────────────────────── */

function NamedCard({ lang, docs, onOpenDoc }: BeatCardProps) {
  const en = lang === "en";
  return (
    <BeatFrame
      icon={FileSearch}
      eyebrow={en ? "Named supplier" : "Genannter Lieferant"}
      title={en ? `${SUP.name} is not on the consulting panel` : `${SUP.name} ist nicht im Beratungs-Panel`}
      aside={<Pill tone="warn">{en ? "Off panel" : "Nicht im Panel"}</Pill>}
      files={[docs[D4.req], docs[D4.quote], docs[D4.panel]]}
      onOpenDoc={onOpenDoc}
    >
      <p className="text-pretty text-[13.5px] leading-[20px] text-ink">
        {en ? req.need : NEED_DE} · {req.requester.site}
      </p>
      <Row3>
        <Figure label={en ? "Quoted fee" : "Angebot"} value={gbp(NAMED_TOTAL)} note={`${DAYS} × ${gbp(named.day_rate_quoted)}`} />
        <Figure label="Onboarding" value={en ? `${named.onboarding_effort_days} days` : `${named.onboarding_effort_days} Tage`} note={en ? "New vendor record and checks" : "Neuer Kreditor und Prüfungen"} tone="warn" />
        <Figure label={en ? "Supplier risk" : "Lieferantenrisiko"} value={en ? "Unknown" : "Unbekannt"} note={en ? "Not screened · no history" : "Nicht geprüft · keine Historie"} tone="warn" />
      </Row3>
    </BeatFrame>
  );
}

function CapabilityCard({ lang, docs, onOpenDoc }: BeatCardProps) {
  const en = lang === "en";
  const claimed = en ? "Claimed, not verified" : "Behauptet, ungeprüft";
  return (
    <BeatFrame
      icon={ListChecks}
      eyebrow={en ? "Capability match" : "Anforderungsabgleich"}
      title={en ? `${K.name} meets all ${CAPS} mandatory capabilities` : `${K.name} erfüllt alle ${CAPS} Pflichtanforderungen`}
      aside={<Pill tone="ok">{`${K.name} ${matched(kestrel)}/${CAPS}`}</Pill>}
      files={[docs[D4.panel], docs[D4.perf], docs[D4.quote]]}
      onOpenDoc={onOpenDoc}
    >
      <Table
        head={[en ? "Requirement" : "Anforderung", K.name, MER.name, "NovaOps"]}
        align={["left", "center", "center", "center"]}
        rows={[
          ...req.required.map((r, i) => [
            en ? r : REQ_DE[i],
            <Tick key="k" v={MEETS[i](kestrel)} label={MEETS[i](kestrel) ? "Meets" : "Does not meet"} />,
            <Tick key="m" v={MEETS[i](meridian)} label={MEETS[i](meridian) ? "Meets" : "Does not meet"} />,
            <Tick key="n" v={undefined} label={claimed} />,
          ]),
          [
            <span key="l" className="font-bold">
              {en ? "Met" : "Erfüllt"}
            </span>,
            <span key="k" className="font-bold tabular-nums">{`${matched(kestrel)} / ${CAPS}`}</span>,
            <span key="m" className="font-bold tabular-nums">{`${matched(meridian)} / ${CAPS}`}</span>,
            <span key="n" className="text-mute">
              {en ? "Unverified" : "Ungeprüft"}
            </span>,
          ],
        ]}
      />
      <Row3>
        <Figure label={en ? `${K.name} scorecard` : `Scorecard ${K.name}`} value={`${dec(kestrel.performance_score, lang)} / 5`} note={en ? "9 engagements in 12 months" : "9 Einsätze in 12 Monaten"} tone="ok" />
        <Figure label={en ? "Latest at Solihull" : "Zuletzt in Solihull"} value="4.6" note={en ? "Paint shop sealer line · Aug 2026" : "Abdichtlinie Lackiererei · Aug. 2026"} />
        <Figure label={en ? "Consultant free" : "Berater verfügbar"} value={en ? "20 Oct" : "20. Okt."} note={en ? "Panel listing, Q4 2026" : "Panel-Liste, Q4 2026"} />
      </Row3>
    </BeatFrame>
  );
}

function CostCard({ lang, docs, onOpenDoc }: BeatCardProps) {
  const en = lang === "en";
  return (
    <BeatFrame
      icon={Scale}
      eyebrow={en ? "Cost & commitment" : "Kosten & Rahmenvolumen"}
      title={en ? `${K.name} is ${gbp(SAVING)} cheaper over ${DAYS} days` : `${K.name} ist über ${DAYS} Tage ${gbp(SAVING)} günstiger`}
      aside={<Pill tone="ok">{`−${PCT.replace(".", en ? "." : ",")}%`}</Pill>}
      files={[docs[D4.agr], docs[D4.quote], docs[D4.panel]]}
      onOpenDoc={onOpenDoc}
    >
      <div className="flex flex-col gap-3">
        <Bar label={`${K.name} · ${gbp(kestrel.day_rate)} ${en ? "a day" : "pro Tag"}`} note={gbp(rec.estimated_cost_gbp)} value={rec.estimated_cost_gbp} max={NAMED_TOTAL} tone="ok" />
        <Bar label={`NovaOps · ${gbp(named.day_rate_quoted)} ${en ? "a day" : "pro Tag"}`} note={gbp(NAMED_TOTAL)} value={NAMED_TOTAL} max={NAMED_TOTAL} tone="mute" />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3 text-[12.5px] leading-[18px]">
          <span className="text-ink">{en ? `Framework ${D4.agr} · rebate tier` : `Rahmenvertrag ${D4.agr} · Rabattstufe`}</span>
          <span className="shrink-0 font-bold tabular-nums text-ink">{gbp(COMMIT.committed_gbp)}</span>
        </div>
        <div className="flex h-2 w-full bg-surface-fog" aria-hidden>
          <div className="theatre-grow h-full bg-steel" style={{ width: `${(COMMIT.used_gbp / COMMIT.committed_gbp) * 100}%` }} />
          <div className="theatre-grow h-full bg-surface-deep" style={{ width: `${(rec.estimated_cost_gbp / COMMIT.committed_gbp) * 100}%` }} />
        </div>
        <p className="text-[11.5px] leading-[16px] text-mute">
          {en
            ? `${gbp(COMMIT.used_gbp)} used · this call-off ${gbp(rec.estimated_cost_gbp)} · ${gbp(COMMIT.committed_gbp - AFTER)} left to the tier`
            : `${gbp(COMMIT.used_gbp)} genutzt · dieser Abruf ${gbp(rec.estimated_cost_gbp)} · noch ${gbp(COMMIT.committed_gbp - AFTER)} bis zur Stufe`}
        </p>
      </div>
      <Row3>
        <Figure label={en ? "Saving vs named" : "Einsparung ggü. Angebot"} value={gbp(SAVING)} note={`${DAYS} × ${gbp(named.day_rate_quoted - kestrel.day_rate)}`} tone="ok" />
        <Figure label={en ? "Headroom today" : "Restvolumen heute"} value={gbp(HEADROOM)} note={en ? "Before this call-off" : "Vor diesem Abruf"} />
        <Figure label={en ? "Onboarding" : "Onboarding"} value={en ? "None" : "Keins"} note={en ? "Active supplier" : "Aktiver Lieferant"} />
      </Row3>
    </BeatFrame>
  );
}

function JustificationCard({ lang, docs, onOpenDoc }: BeatCardProps) {
  const en = lang === "en";
  const offers = en
    ? ["Paint-line simulation tool, included in the fee", `Not in ${K.name}'s listing or framework`]
    : ["Lackierlinien-Simulationstool, im Honorar enthalten", `Nicht in Listung oder Rahmenvertrag von ${K.name}`];
  const costs = en
    ? [`${gbp(SAVING)} more than ${K.name}`, `${named.onboarding_effort_days} days of onboarding`, "Sanctions, credit and cyber screening", "PO blocked until the supplier is active"]
    : [`${gbp(SAVING)} mehr als ${K.name}`, `${named.onboarding_effort_days} Tage Onboarding`, "Sanktions-, Bonitäts- und Cyberprüfung", "Bestellung gesperrt bis Lieferant aktiv"];
  return (
    <BeatFrame
      icon={MessageSquareQuote}
      eyebrow={en ? `Request ${req.request_id} §4` : `Anforderung ${req.request_id} §4`}
      title={en ? "The request depends on a tool only NovaOps offers" : "Die Anforderung braucht ein Tool, das nur NovaOps bietet"}
      aside={<Pill tone="info">{en ? "Category Lead decides" : "Category Lead entscheidet"}</Pill>}
      files={[docs[D4.req], docs[D4.quote], docs[D4.doa]]}
      onOpenDoc={onOpenDoc}
    >
      <blockquote className="text-pretty border-l-2 border-ink pl-3 text-[13.5px] italic leading-[20px] text-ink">{en ? REASON_EN : REASON_DE}</blockquote>
      <div className="grid grid-cols-1 gap-3 @lg/agent:grid-cols-2">
        <div className="flex flex-col gap-1.5 bg-surface-fog/60 px-3 py-2.5">
          <p className="text-[11.5px] text-mute">{en ? "What only NovaOps offers" : "Was nur NovaOps bietet"}</p>
          <ul className="flex flex-col gap-1">
            {offers.map((o) => (
              <li key={o} className="text-pretty text-[13px] leading-[19px] text-ink">
                {o}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-1.5 bg-surface-amber px-3 py-2.5">
          <p className="text-[11.5px] text-mute">{en ? "What the exception costs" : "Was die Ausnahme kostet"}</p>
          <ul className="flex flex-col gap-1">
            {costs.map((o) => (
              <li key={o} className="text-pretty text-[13px] leading-[19px] text-ink">
                {o}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </BeatFrame>
  );
}

const MATCH_BEATS: Beat[] = [
  {
    key: "named",
    cta: bi("AI · Read the named supplier's offer", "KI · Angebot des genannten Lieferanten lesen"),
    short: bi("AI · Read offer", "KI · Angebot lesen"),
    note: bi(`${D4.quote} against request ${req.request_id}`, `${D4.quote} gegen Anforderung ${req.request_id}`),
    title: bi("Reading the named supplier's offer", "Angebot des genannten Lieferanten wird gelesen"),
    docLabel: bi("named-supplier summary", "Zusammenfassung genannter Lieferant"),
    lines: [
      { label: bi("Requested service", "Angeforderte Leistung"), detail: bi(`${req.need} · ${req.requester.site}`, `${NEED_DE} · ${req.requester.site}`), value: bi(`${DAYS} days`, `${DAYS} Tage`), doc: D4.req },
      {
        label: bi("Quoted fee", "Angebotenes Honorar"),
        detail: bi(`${DAYS} days × ${gbp(named.day_rate_quoted)} · simulation tool included`, `${DAYS} Tage × ${gbp(named.day_rate_quoted)} · Simulationstool inklusive`),
        value: same(gbp(NAMED_TOTAL)),
        doc: D4.quote,
      },
      { label: bi("Panel status", "Panel-Status"), detail: bi(`${SUP.name} is not listed on ${D4.panel}`, `${SUP.name} ist nicht in ${D4.panel} gelistet`), value: bi("Off panel", "Nicht im Panel"), doc: D4.panel, flag: true },
      {
        label: bi("Supplier master", "Lieferantenstamm"),
        detail: bi("No vendor record — new-supplier onboarding before any PO", "Kein Kreditor — Neulieferanten-Onboarding vor jeder Bestellung"),
        value: bi(`${named.onboarding_effort_days} days`, `${named.onboarding_effort_days} Tage`),
        flag: true,
      },
      { label: bi("Supplier risk", "Lieferantenrisiko"), detail: bi("Not screened · no history with Client", "Nicht geprüft · keine Historie beim Client"), value: bi("Unknown", "Unbekannt"), flag: true },
    ],
    result: bi(`Off panel · ${gbp(NAMED_TOTAL)} · ${named.onboarding_effort_days} days onboarding`, `Nicht im Panel · ${gbp(NAMED_TOTAL)} · ${named.onboarding_effort_days} Tage Onboarding`),
    card: (p) => <NamedCard {...p} />,
  },
  {
    key: "capability",
    cta: bi("AI · Match capabilities across the panel", "KI · Anforderungen im Panel abgleichen"),
    short: bi("AI · Match panel", "KI · Panel abgleichen"),
    note: bi(`${CAPS} mandatory capabilities × ${mi.panel.length + 1} suppliers`, `${CAPS} Pflichtanforderungen × ${mi.panel.length + 1} Lieferanten`),
    title: bi("Matching mandatory capabilities", "Pflichtanforderungen werden abgeglichen"),
    docLabel: bi("capability matrix", "Anforderungsmatrix"),
    lines: [
      { label: same(K.name), detail: same(`${kestrel.capabilities.join(" · ")} · ${kestrel.region}`), value: same(`${matched(kestrel)} / ${CAPS}`), doc: D4.panel },
      {
        label: same(MER.name),
        detail: bi(`${meridian.capabilities.join(" · ")} · ${meridian.region} — no automotive paint, not Midlands-based`, `${meridian.capabilities.join(" · ")} · ${meridian.region} — keine Lackiererei-Erfahrung, nicht in den Midlands`),
        value: same(`${matched(meridian)} / ${CAPS}`),
        doc: D4.panel,
        flag: true,
      },
      { label: same(SUP.name), detail: bi("All three claimed in the quotation · not verified", "Alle drei laut Angebot · nicht geprüft"), value: bi("Claimed", "Behauptet"), doc: D4.quote, flag: true },
      {
        label: bi(`${K.name} scorecard`, `Scorecard ${K.name}`),
        detail: bi(`9 engagements · latest: paint shop sealer line, Solihull, Aug 2026 (4.6)`, `9 Einsätze · zuletzt: Abdichtlinie Lackiererei, Solihull, Aug. 2026 (4,6)`),
        value: bi(`${kestrel.performance_score} / 5`, `${dec(kestrel.performance_score, "de")} / 5`),
        doc: D4.perf,
      },
    ],
    result: bi(`${K.name} ${matched(kestrel)}/${CAPS} · ${MER.name} ${matched(meridian)}/${CAPS} · NovaOps unverified`, `${K.name} ${matched(kestrel)}/${CAPS} · ${MER.name} ${matched(meridian)}/${CAPS} · NovaOps ungeprüft`),
    card: (p) => <CapabilityCard {...p} />,
  },
  {
    key: "cost",
    cta: bi("AI · Compare cost and commitment", "KI · Kosten und Rahmenvolumen vergleichen"),
    short: bi("AI · Compare cost", "KI · Kosten vergleichen"),
    note: bi(`${gbp(kestrel.day_rate)} against ${gbp(named.day_rate_quoted)} a day · ${D4.agr}`, `${gbp(kestrel.day_rate)} gegen ${gbp(named.day_rate_quoted)} pro Tag · ${D4.agr}`),
    title: bi("Comparing cost and commitment", "Kosten und Rahmenvolumen werden verglichen"),
    docLabel: bi("commercial comparison", "kaufmännischer Vergleich"),
    lines: [
      { label: bi(`${K.name} day rate`, `Tagessatz ${K.name}`), detail: bi(`Fixed under ${D4.agr} for its term`, `Für die Laufzeit in ${D4.agr} fixiert`), value: same(gbp(kestrel.day_rate)), doc: D4.agr },
      { label: bi("NovaOps day rate", "Tagessatz NovaOps"), detail: bi(`Quotation ${D4.quote}, valid to 31 Oct 2026`, `Angebot ${D4.quote}, gültig bis 31.10.2026`), value: same(gbp(named.day_rate_quoted)), doc: D4.quote },
      {
        label: bi(`Cost over ${DAYS} days`, `Kosten über ${DAYS} Tage`),
        detail: bi(`${gbp(rec.estimated_cost_gbp)} against ${gbp(NAMED_TOTAL)} (−${PCT}%)`, `${gbp(rec.estimated_cost_gbp)} gegen ${gbp(NAMED_TOTAL)} (−${PCT.replace(".", ",")} %)`),
        value: same(`−${gbp(SAVING)}`),
      },
      {
        label: bi("Commitment headroom", "Restvolumen Rahmenvertrag"),
        detail: bi(`${gbp(COMMIT.used_gbp)} of ${gbp(COMMIT.committed_gbp)} used · this call-off takes it to ${gbp(AFTER)}`, `${gbp(COMMIT.used_gbp)} von ${gbp(COMMIT.committed_gbp)} genutzt · dieser Abruf bringt es auf ${gbp(AFTER)}`),
        value: same(gbp(HEADROOM)),
        doc: D4.agr,
      },
      { label: bi("Availability", "Verfügbarkeit"), detail: bi(`${K.name} consultant free from 20 Oct 2026`, `Berater von ${K.name} ab 20.10.2026 frei`), value: bi("20 Oct", "20. Okt."), doc: D4.panel },
    ],
    result: bi(`${K.name} ${gbp(SAVING)} (${PCT}%) cheaper · on existing commitment`, `${K.name} ${gbp(SAVING)} (${PCT.replace(".", ",")} %) günstiger · im bestehenden Rahmen`),
    card: (p) => <CostCard {...p} />,
  },
  {
    key: "justification",
    cta: bi("AI · Read the requester's justification", "KI · Begründung des Anforderers lesen"),
    short: bi("AI · Read reason", "KI · Begründung lesen"),
    note: bi(`Why the requester named NovaOps · ${req.request_id} §4`, `Warum NovaOps genannt wurde · ${req.request_id} §4`),
    title: bi("Reading the requester's justification", "Begründung des Anforderers wird gelesen"),
    docLabel: bi("exception brief", "Ausnahme-Vorlage"),
    lines: [
      {
        label: bi("Reason given", "Genannter Grund"),
        detail: bi("Proprietary paint-line simulation tool to model booth and oven throughput", "Proprietäres Simulationstool für den Durchsatz von Kabine und Ofen"),
        value: bi("Cited", "Genannt"),
        doc: D4.req,
      },
      { label: bi("NovaOps quotation", "NovaOps-Angebot"), detail: bi("Tool licensed for the engagement, included in the fee", "Tool-Lizenz für den Einsatz, im Honorar enthalten"), value: bi("Included", "Enthalten"), doc: D4.quote },
      { label: same(K.name), detail: bi("No simulation tool in the panel listing or the framework", "Kein Simulationstool in Panel-Listung oder Rahmenvertrag"), value: bi("Not offered", "Nicht angeboten"), doc: D4.panel, flag: true },
      {
        label: bi("Approval band", "Freigabeband"),
        detail: bi(`${gbp(req.starting_cost_gbp)} is in ${req.value_band} · supplier choice reserved for the Category Lead (${D4.doa} §4.2)`, `${gbp(req.starting_cost_gbp)} liegt im Band ${req.value_band} · Lieferantenwahl liegt bei der Category Lead (${D4.doa} §4.2)`),
        value: same("Category Lead"),
        doc: D4.doa,
      },
    ],
    result: bi("Exception has a stated reason · Category Lead decides", "Ausnahme ist begründet · Category Lead entscheidet"),
    card: (p) => <JustificationCard {...p} />,
  },
];

/* ── 2 · Onboarding Agent ───────────────────────────────────────────────── */

const DOC_DE = ["Gründungsurkunde", "USt-Registrierung", "Bankbestätigung", "Versicherung (PI £2M, PL £5M)", "Informationssicherheits-Fragebogen", "Modern-Slavery-Erklärung"];
const DOC_ID: (string | undefined)[] = [D4.coi, D4.vat, D4.bank, D4.ins, D4.isq, undefined];
const DOC_BY: Bi[] = [
  bi("Agent · Companies House", "Agent · Companies House"),
  bi("Agent · VAT registry", "Agent · USt-Register"),
  bi("Client Finance · call-back", "Client Finance · Rückruf"),
  bi("Agent · cover limits", "Agent · Deckungssummen"),
  bi("Agent · answers", "Agent · Antworten"),
  bi("Not needed", "Nicht nötig"),
];
const status = oo.document_validation.map((d) => d.status);
const needed = status.filter((s) => s !== "N/A").length;
const received = status.filter((s) => s !== "N/A" && s !== "MISSING").length;

function ChecklistCard({ lang, docs, onOpenDoc }: BeatCardProps) {
  const en = lang === "en";
  return (
    <BeatFrame
      icon={ClipboardList}
      eyebrow={en ? `Supplier registration ${D4.invite}` : `Lieferantenregistrierung ${D4.invite}`}
      title={en ? `NovaOps uploaded all ${received} documents it needs` : `NovaOps hat alle ${received} nötigen Dokumente hochgeladen`}
      aside={<Pill tone="ok">{en ? `${received} of ${oi.required_documents.length} in` : `${received} von ${oi.required_documents.length} da`}</Pill>}
      files={[docs[D4.decision], docs[D4.invite]]}
      onOpenDoc={onOpenDoc}
    >
      <Row3>
        <Figure label={en ? "Invitation sent" : "Einladung gesendet"} value={when(oo.invitation.sent, lang)} note={D4.invite} />
        <Figure label={en ? "Uploads" : "Uploads"} value={`${received} / ${needed}`} note={en ? "1 document not needed" : "1 Dokument nicht nötig"} tone="ok" />
        <Figure label={en ? "Chasers" : "Erinnerungen"} value={String(oo.invitation.chasers.length)} note={`${en ? "Complete" : "Vollständig"} ${when(oo.meta.timestamp, lang)}`} />
      </Row3>
      <Table
        head={[en ? "Document" : "Dokument", en ? "Checked by" : "Geprüft von", "Status"]}
        align={["left", "left", "right"]}
        rows={oi.required_documents.map((d, i) => [
          en ? d : DOC_DE[i],
          <span key="b" className="text-mute">
            {DOC_BY[i][lang]}
          </span>,
          status[i] === "N/A" ? (
            <Pill key="s" tone="mute">
              {en ? "Not needed" : "Nicht nötig"}
            </Pill>
          ) : (
            <Pill key="s" tone="info">
              {en ? "Received" : "Eingegangen"}
            </Pill>
          ),
        ])}
      />
    </BeatFrame>
  );
}

const VALID_ROWS: { i: number; check: Bi; result: Bi; tone: Tone }[] = [
  { i: 0, check: bi(`Company ${SUP.companies_house} active since 12 Mar 2019 · 2 directors match`, `Firma ${SUP.companies_house} aktiv seit 12.03.2019 · 2 Geschäftsführer stimmen`), result: bi("Valid", "Gültig"), tone: "ok" },
  { i: 1, check: bi("GB 318 4471 26 matches the VAT registry", "GB 318 4471 26 stimmt mit dem USt-Register überein"), result: bi("Valid", "Gültig"), tone: "ok" },
  { i: 4, check: bi("Complete and signed · Cyber Essentials 2026 · disks encrypted", "Vollständig und unterschrieben · Cyber Essentials 2026 · Festplatten verschlüsselt"), result: bi("Valid", "Gültig"), tone: "ok" },
  { i: 5, check: bi("Turnover about £2.1M, below the £36M statutory threshold", "Umsatz ca. £2,1M, unter der gesetzlichen Schwelle von £36M"), result: bi("Not needed", "Nicht nötig"), tone: "mute" },
  { i: 2, check: bi("Account in the supplier's name · not verified by the agent", "Konto auf den Lieferanten · vom Agenten nicht geprüft"), result: bi("To Finance", "An Finance"), tone: "warn" },
];

function ValidateCard({ lang, docs, onOpenDoc }: BeatCardProps) {
  const en = lang === "en";
  const valid = status.filter((s) => s === "VALID").length;
  return (
    <BeatFrame
      icon={FileCheck}
      eyebrow={en ? "Document validation" : "Dokumentprüfung"}
      title={en ? `${valid} documents valid · bank letter routed to Finance` : `${valid} Dokumente gültig · Bankbestätigung an Finance`}
      aside={<Pill tone="ok">{en ? `${valid} valid` : `${valid} gültig`}</Pill>}
      files={[docs[D4.coi], docs[D4.vat], docs[D4.isq], docs[D4.bank]]}
      onOpenDoc={onOpenDoc}
    >
      <Table
        head={[en ? "Document" : "Dokument", en ? "What the agent checked" : "Was der Agent geprüft hat", en ? "Result" : "Ergebnis"]}
        align={["left", "left", "right"]}
        rows={VALID_ROWS.map((r) => [
          en ? oi.required_documents[r.i] : DOC_DE[r.i],
          <span key="c" className="text-mute">
            {r.check[lang]}
          </span>,
          <Pill key="r" tone={r.tone}>
            {r.result[lang]}
          </Pill>,
        ])}
      />
      <Note>
        {en
          ? `Bank details are verified only by Client Finance, by call-back on an independently sourced number (${D4.doa} §4.3). The agent passes the letter on and does not verify it.`
          : `Bankdaten prüft nur Client Finance per Rückruf unter einer unabhängig ermittelten Nummer (${D4.doa} §4.3). Der Agent leitet die Bestätigung weiter und prüft sie nicht.`}
      </Note>
    </BeatFrame>
  );
}

const COVER = [
  { label: bi("Professional indemnity", "Berufshaftpflicht"), held: 1_000_000, need: 2_000_000 },
  { label: bi("Public liability", "Betriebshaftpflicht"), held: 5_000_000, need: 5_000_000 },
  { label: bi("Employers' liability", "Arbeitgeberhaftpflicht"), held: 10_000_000, need: 5_000_000 },
];
const PI_GAP = COVER[0].need - COVER[0].held;

function InsuranceCard({ lang, docs, onOpenDoc }: BeatCardProps) {
  const en = lang === "en";
  return (
    <BeatFrame
      icon={Umbrella}
      eyebrow={en ? "Insurance cover" : "Versicherungsschutz"}
      title={en ? `Professional indemnity is ${gbp(PI_GAP)} short of the requirement` : `Berufshaftpflicht liegt ${gbp(PI_GAP)} unter der Anforderung`}
      aside={<Pill tone="bad">{en ? "1 gap" : "1 Lücke"}</Pill>}
      files={[docs[D4.ins]]}
      onOpenDoc={onOpenDoc}
    >
      <div className="flex flex-col gap-3">
        {COVER.map((c) => (
          <Bar
            key={c.label.en}
            label={c.label[lang]}
            note={`${gbp(c.held)} / ${gbp(c.need)}`}
            value={c.held}
            max={c.need}
            tone={c.held >= c.need ? "ok" : "bad"}
          />
        ))}
      </div>
      <Row3>
        <Figure label={en ? "Shortfall" : "Fehlbetrag"} value={gbp(PI_GAP)} note={en ? "Professional indemnity" : "Berufshaftpflicht"} tone="bad" />
        <Figure label={en ? "Review round" : "Prüfrunde"} value={en ? "1 of 2" : "1 von 2"} note={en ? "Gap list back to the supplier" : "Lückenliste an den Lieferanten"} />
        <Figure label={en ? "Reply by" : "Antwort bis"} value={en ? "15 Oct" : "15. Okt."} note={en ? "Policy in force to 31 Mar 2027" : "Police gültig bis 31.03.2027"} />
      </Row3>
    </BeatFrame>
  );
}

const ONBOARD_BEATS: Beat[] = [
  {
    key: "checklist",
    cta: bi("AI · Build the document checklist", "KI · Dokumentenliste erstellen"),
    short: bi("AI · Checklist", "KI · Checkliste"),
    note: bi(`${oi.required_documents.length} documents for a ${req.value_band} consulting supplier`, `${oi.required_documents.length} Dokumente für einen Beratungslieferanten im Band ${req.value_band}`),
    title: bi("Building the onboarding checklist", "Onboarding-Checkliste wird erstellt"),
    docLabel: bi("document checklist", "Dokumentenliste"),
    lines: oi.required_documents.map((d, i) => ({
      label: bi(d, DOC_DE[i]),
      detail: DOC_BY[i],
      value: status[i] === "N/A" ? bi("Not needed", "Nicht nötig") : bi("Received", "Eingegangen"),
      doc: DOC_ID[i],
    })),
    result: bi(`${received} of ${oi.required_documents.length} uploaded · 1 not needed · ${D4.invite}`, `${received} von ${oi.required_documents.length} hochgeladen · 1 nicht nötig · ${D4.invite}`),
    card: (p) => <ChecklistCard {...p} />,
  },
  {
    key: "validate",
    cta: bi("AI · Validate the documents", "KI · Dokumente prüfen"),
    short: bi("AI · Validate", "KI · Prüfen"),
    note: bi("Registry checks on incorporation and VAT, then the questionnaire", "Registerprüfung von Gründung und USt, dann der Fragebogen"),
    title: bi("Validating the uploaded documents", "Hochgeladene Dokumente werden geprüft"),
    docLabel: bi("validation results", "Prüfergebnisse"),
    lines: VALID_ROWS.map((r) => ({ label: bi(oi.required_documents[r.i], DOC_DE[r.i]), detail: r.check, value: r.result, doc: DOC_ID[r.i], flag: r.tone === "warn" })),
    result: bi("3 valid · 1 not needed · bank letter to Finance", "3 gültig · 1 nicht nötig · Bankbestätigung an Finance"),
    card: (p) => <ValidateCard {...p} />,
  },
  {
    key: "insurance",
    cta: bi("AI · Check insurance cover", "KI · Versicherungsschutz prüfen"),
    short: bi("AI · Insurance", "KI · Versicherung"),
    note: bi("Cover limits against PI £2M · PL £5M", "Deckungssummen gegen PI £2M · PL £5M"),
    title: bi("Checking insurance cover", "Versicherungsschutz wird geprüft"),
    docLabel: bi("insurance check", "Versicherungsprüfung"),
    lines: [
      ...COVER.map((c) => ({
        label: c.label,
        detail: bi(`${gbp(c.held)} held against ${gbp(c.need)} required`, `${gbp(c.held)} vorhanden, ${gbp(c.need)} gefordert`),
        value: c.held >= c.need ? bi("Meets", "Erfüllt") : bi("Gap", "Lücke"),
        doc: D4.ins,
        flag: c.held < c.need,
      })),
      { label: bi("Policy period", "Laufzeit"), detail: bi("01 Apr 2026 – 31 Mar 2027 · covers the 6-week engagement", "01.04.2026 – 31.03.2027 · deckt den 6-wöchigen Einsatz"), value: bi("In force", "Gültig"), doc: D4.ins },
      { label: bi("Review loop", "Prüfschleife"), detail: bi("Gap goes back to the supplier · Buy Desk sends", "Lücke geht an den Lieferanten · Buy Desk sendet"), value: bi("Round 1 of 2", "Runde 1 von 2") },
    ],
    result: bi(`PI ${gbp(COVER[0].held)} below ${gbp(COVER[0].need)} · back to supplier, round 1 of 2`, `PI ${gbp(COVER[0].held)} unter ${gbp(COVER[0].need)} · zurück an den Lieferanten, Runde 1 von 2`),
    card: (p) => <InsuranceCard {...p} />,
  },
];

/* ── 3 · Risk Screening Agent ───────────────────────────────────────────── */

const res = ro.results;
const credit = res.financial_health;
const cyber = res.cyber;
const PARTIES = [{ name: SUP.name, type: bi("Company", "Firma") }, ...ri.supplier.directors.map((d) => ({ name: d, type: bi("Director", "Geschäftsführer") }))];
const LISTS = ["UK (OFSI)", "EU", "US (OFAC)", "PEP"];
const TURNOVER = 2_100_000;
const NET_WORTH = 212_000;

function SanctionsCard({ lang, docs, onOpenDoc }: BeatCardProps) {
  const en = lang === "en";
  return (
    <BeatFrame
      icon={ShieldCheck}
      eyebrow={en ? "Sanctions, PEP & media" : "Sanktionen, PEP & Presse"}
      title={en ? `NovaOps and ${ri.supplier.directors.length} directors are clear on every list` : `NovaOps und ${ri.supplier.directors.length} Geschäftsführer sind auf allen Listen unauffällig`}
      aside={<Pill tone="ok">{en ? "Clear" : "Unauffällig"}</Pill>}
      files={[docs[D4.san], docs[D4.coi]]}
      onOpenDoc={onOpenDoc}
    >
      <Table
        head={[en ? "Party" : "Beteiligte", ...LISTS]}
        align={["left", "center", "center", "center", "center"]}
        rows={PARTIES.map((p) => [
          <span key="n">
            {p.name} <span className="text-mute">· {p.type[lang]}</span>
          </span>,
          ...LISTS.map((l) => <Tick key={l} v label={en ? `${l}: no match` : `${l}: kein Treffer`} />),
        ])}
      />
      <Note>{en ? `Adverse media: ${res.adverse_media.toLowerCase()} — 24-month lookback across news and regulatory sources.` : "Negativpresse: keine gefunden — 24 Monate Rückblick über Nachrichten- und Aufsichtsquellen."}</Note>
    </BeatFrame>
  );
}

function FinancialCard({ lang, docs, onOpenDoc }: BeatCardProps) {
  const en = lang === "en";
  return (
    <BeatFrame
      icon={Landmark}
      eyebrow={en ? `Credit report ${D4.credit}` : `Kreditauskunft ${D4.credit}`}
      title={en ? `Credit score ${credit.score}/100 — limited by abridged accounts` : `Bonität ${credit.score}/100 — begrenzt durch verkürzte Abschlüsse`}
      aside={<Pill tone="warn">{`${credit.tier} · ${credit.score}/100`}</Pill>}
      files={[docs[D4.credit], docs[D4.coi]]}
      onOpenDoc={onOpenDoc}
    >
      <div className="flex flex-col gap-1.5">
        <div className="relative h-2 w-full bg-surface-fog" aria-hidden>
          <div className="theatre-grow h-full bg-mark-amber" style={{ width: `${credit.score}%` }} />
        </div>
        <div className="flex justify-between text-[11.5px] tabular-nums text-mute">
          <span>0</span>
          <span>{en ? `${credit.score} · moderate risk` : `${credit.score} · mittleres Risiko`}</span>
          <span>100</span>
        </div>
      </div>
      <Row4>
        <Figure label={en ? "Turnover (est.)" : "Umsatz (geschätzt)"} value="£2.1M" />
        <Figure label={en ? "Net worth" : "Eigenkapital"} value={gbp(NET_WORTH)} />
        <Figure label={en ? "Cash at bank" : "Bankguthaben"} value="£96,000" />
        <Figure label={en ? "Pays late by" : "Zahlungsverzug"} value={en ? "9 days" : "9 Tage"} tone="warn" />
      </Row4>
      <Note tone="warn">
        {en
          ? `This engagement (${gbp(req.starting_cost_gbp)}) is ${Math.round((req.starting_cost_gbp / TURNOVER) * 100)}% of turnover and ${Math.round((req.starting_cost_gbp / NET_WORTH) * 100)}% of net worth. Filings are up to date; no county court judgments.`
          : `Dieser Einsatz (${gbp(req.starting_cost_gbp)}) entspricht ${Math.round((req.starting_cost_gbp / TURNOVER) * 100)} % des Umsatzes und ${Math.round((req.starting_cost_gbp / NET_WORTH) * 100)} % des Eigenkapitals. Einreichungen aktuell; keine Gerichtsurteile.`}
      </Note>
    </BeatFrame>
  );
}

const CYBER_ROWS: { area: Bi; grade: string; finding: Bi }[] = [
  { area: bi("Remote access", "Fernzugriff"), grade: "C", finding: bi("VPN portal exposed · no MFA evidence", "VPN-Portal offen · kein MFA-Nachweis") },
  { area: bi("Patching cadence", "Patch-Rhythmus"), grade: "B", finding: bi("2 internet-facing hosts 30+ days behind", "2 Hosts im Internet über 30 Tage zurück") },
  { area: bi("E-mail security", "E-Mail-Sicherheit"), grade: "A", finding: bi("SPF, DKIM and DMARC enforced", "SPF, DKIM und DMARC durchgesetzt") },
  { area: bi("TLS configuration", "TLS-Konfiguration"), grade: "A", finding: bi("Modern protocols only", "Nur moderne Protokolle") },
  { area: bi("Leaked credentials", "Geleakte Zugangsdaten"), grade: "B", finding: bi("1 historic exposure (2024), reset", "1 alter Vorfall (2024), zurückgesetzt") },
];
const gradeTone = (g: string): Tone => (g === "A" ? "ok" : g === "B" ? "warn" : "bad");

function CyberCard({ lang, docs, onOpenDoc }: BeatCardProps) {
  const en = lang === "en";
  return (
    <BeatFrame
      icon={LockKeyhole}
      eyebrow={en ? "Cyber posture" : "Cyber-Lage"}
      title={en ? `Rated ${cyber.rating} — remote access has no MFA` : `Bewertung ${cyber.rating} — Fernzugriff ohne MFA`}
      aside={<Pill tone={gradeTone(cyber.rating)}>{en ? `Rating ${cyber.rating}` : `Rating ${cyber.rating}`}</Pill>}
      files={[docs[D4.cyber], docs[D4.isq]]}
      onOpenDoc={onOpenDoc}
    >
      <Table
        head={[en ? "Area" : "Bereich", en ? "Grade" : "Note", en ? "Finding" : "Befund"]}
        align={["left", "center", "left"]}
        rows={CYBER_ROWS.map((r) => [
          r.area[lang],
          <Pill key="g" tone={gradeTone(r.grade)}>
            {r.grade}
          </Pill>,
          <span key="f" className="text-mute">
            {r.finding[lang]}
          </span>,
        ])}
      />
      <Note tone="warn">
        {en
          ? "The questionnaire confirms it: MFA on remote access is in progress, target Q1 2027. The consultant would get shared-drive access after activation."
          : "Der Fragebogen bestätigt es: MFA für den Fernzugriff ist in Arbeit, Ziel Q1 2027. Der Berater bekäme nach der Aktivierung Zugriff auf das Laufwerk."}
      </Note>
    </BeatFrame>
  );
}

const SCREENS: { label: Bi; value: Bi; tone: Tone }[] = [
  { label: bi("Sanctions & PEP", "Sanktionen & PEP"), value: bi("Clear", "Unauffällig"), tone: "ok" },
  { label: bi("Financial health", "Finanzlage"), value: same(`${credit.tier} · ${credit.score}`), tone: "warn" },
  { label: bi("Adverse media", "Negativpresse"), value: bi("None", "Keine"), tone: "ok" },
  { label: bi("Cyber posture", "Cyber-Lage"), value: same(cyber.rating), tone: "warn" },
  { label: bi("Filings", "Einreichungen"), value: bi("Up to date", "Aktuell"), tone: "ok" },
];

function TierCard({ lang, docs, onOpenDoc }: BeatCardProps) {
  const en = lang === "en";
  const conditions = [
    {
      what: en ? `Value cap ${gbp(PROPOSED_CAP)} until ${PROPOSED_YEARS} years of full accounts are reviewed` : `Wertgrenze ${gbp(PROPOSED_CAP)}, bis ${PROPOSED_YEARS} Jahre vollständige Abschlüsse geprüft sind`,
      why: en ? "Limits exposure while only abridged accounts are filed" : "Begrenzt das Risiko, solange nur verkürzte Abschlüsse vorliegen",
    },
    {
      what: en ? "MFA evidence before any system access" : "MFA-Nachweis vor jedem Systemzugang",
      why: en ? "Closes the remote-access finding before shared-drive access" : "Schließt den Fernzugriffs-Befund vor dem Laufwerkszugang",
    },
  ];
  return (
    <BeatFrame
      icon={Gauge}
      eyebrow={en ? "Risk proposal" : "Risikovorschlag"}
      title={en ? `Proposed tier ${ro.proposed_risk_tier} with ${conditions.length} conditions` : `Vorgeschlagene Stufe ${ro.proposed_risk_tier} mit ${conditions.length} Auflagen`}
      aside={<Pill tone="warn">{ro.proposed_risk_tier}</Pill>}
      files={[docs[D4.san], docs[D4.credit], docs[D4.cyber]]}
      onOpenDoc={onOpenDoc}
    >
      <ul className="flex flex-wrap gap-1.5">
        {SCREENS.map((s) => (
          <li key={s.label.en} className="inline-flex items-center gap-1.5 border border-divider px-2 py-1 text-[12px] text-ink">
            {s.label[lang]}
            <Pill tone={s.tone}>{s.value[lang]}</Pill>
          </li>
        ))}
      </ul>
      <ol className="flex flex-col divide-y divide-divider border-y border-divider">
        {conditions.map((c, i) => (
          <li key={c.what} className="flex items-start gap-3 py-2.5">
            <span className="grid h-5 w-5 shrink-0 place-items-center bg-ink text-[11px] font-bold text-ink-inverse">{i + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-pretty text-[13.5px] font-bold leading-[19px] text-ink">{c.what}</span>
              <span className="block text-pretty text-[12px] leading-[17px] text-mute">{c.why}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="text-pretty text-[12px] leading-[17px] text-mute">
        {en ? "High risk or a sanctions hit would go to the Risk Committee instead. Medium risk is the Risk Analyst's call." : "Hohes Risiko oder ein Sanktionstreffer ginge an das Risk Committee. Mittleres Risiko entscheidet die Risikoanalyse."}
      </p>
    </BeatFrame>
  );
}

const RISK_BEATS: Beat[] = [
  {
    key: "sanctions",
    cta: bi("AI · Screen sanctions, PEP and media", "KI · Sanktionen, PEP und Presse prüfen"),
    short: bi("AI · Screen", "KI · Screening"),
    note: bi(`${PARTIES.length} parties × UK, EU and US lists`, `${PARTIES.length} Beteiligte × UK-, EU- und US-Listen`),
    title: bi("Screening sanctions, PEP and adverse media", "Sanktionen, PEP und Negativpresse werden geprüft"),
    docLabel: bi("screening results", "Screening-Ergebnis"),
    lines: [
      ...PARTIES.map((p) => ({ label: same(p.name), detail: bi("No match on UK (OFSI), EU or US (OFAC) lists · not a PEP", "Kein Treffer auf UK- (OFSI), EU- oder US-Listen (OFAC) · keine PEP"), value: bi("Clear", "Unauffällig"), doc: D4.san })),
      { label: bi("Adverse media", "Negativpresse"), detail: bi("24-month lookback · news and regulatory sources", "24 Monate Rückblick · Nachrichten und Aufsicht"), value: bi("None", "Keine"), doc: D4.san },
    ],
    result: bi(`Clear on all lists · ${res.adverse_media.toLowerCase()}`, "Auf allen Listen unauffällig · keine Negativpresse"),
    card: (p) => <SanctionsCard {...p} />,
  },
  {
    key: "financial",
    cta: bi("AI · Assess financial health", "KI · Finanzlage bewerten"),
    short: bi("AI · Financials", "KI · Finanzen"),
    note: bi(`Credit report ${D4.credit} and the filing history`, `Kreditauskunft ${D4.credit} und Einreichungen`),
    title: bi("Assessing financial health", "Finanzlage wird bewertet"),
    docLabel: bi("financial assessment", "Finanzbewertung"),
    lines: [
      { label: bi("Credit score", "Bonität"), detail: bi("Moderate — limited by thin financial disclosure", "Mittel — begrenzt durch geringe Offenlegung"), value: same(`${credit.score} / 100`), doc: D4.credit, flag: true },
      { label: bi("Turnover (estimated)", "Umsatz (geschätzt)"), detail: bi("Small company · abridged accounts only", "Kleine Gesellschaft · nur verkürzte Abschlüsse"), value: bi("£2.1M", "£2,1M"), doc: D4.credit },
      { label: bi("Net worth · cash", "Eigenkapital · Bank"), detail: bi(`Net worth ${gbp(NET_WORTH)} · cash at bank £96,000`, `Eigenkapital ${gbp(NET_WORTH)} · Bankguthaben £96,000`), value: same(gbp(NET_WORTH)), doc: D4.credit },
      { label: bi("Payment performance", "Zahlungsverhalten"), detail: bi("9 days beyond terms on average · no county court judgments", "Im Schnitt 9 Tage über Ziel · keine Gerichtsurteile"), value: bi("+9 days", "+9 Tage"), doc: D4.credit, flag: true },
      { label: bi("Companies House filings", "Einreichungen Companies House"), detail: bi("Accounts filed on time in 2025 and 2026", "Abschlüsse 2025 und 2026 fristgerecht"), value: bi("Up to date", "Aktuell"), doc: D4.coi },
      {
        label: bi("Exposure", "Exposition"),
        detail: bi(`${gbp(req.starting_cost_gbp)} is ${Math.round((req.starting_cost_gbp / NET_WORTH) * 100)}% of net worth`, `${gbp(req.starting_cost_gbp)} sind ${Math.round((req.starting_cost_gbp / NET_WORTH) * 100)} % des Eigenkapitals`),
        value: same(`${Math.round((req.starting_cost_gbp / NET_WORTH) * 100)}%`),
        flag: true,
      },
    ],
    result: bi(`Financial tier ${credit.tier} · ${credit.score}/100`, `Finanzstufe ${credit.tier} · ${credit.score}/100`),
    card: (p) => <FinancialCard {...p} />,
  },
  {
    key: "cyber",
    cta: bi("AI · Rate cyber posture", "KI · Cyber-Lage bewerten"),
    short: bi("AI · Cyber", "KI · Cyber"),
    note: bi("External rating against the security questionnaire", "Externes Rating gegen den Sicherheitsfragebogen"),
    title: bi("Rating cyber posture", "Cyber-Lage wird bewertet"),
    docLabel: bi("cyber assessment", "Cyber-Bewertung"),
    lines: [
      ...CYBER_ROWS.filter((r) => r.grade !== "A").map((r) => ({ label: r.area, detail: r.finding, value: same(r.grade), doc: D4.cyber, flag: r.grade === "C" })),
      { label: bi("E-mail and TLS", "E-Mail und TLS"), detail: bi("SPF, DKIM, DMARC enforced · modern TLS only", "SPF, DKIM, DMARC aktiv · nur modernes TLS"), value: same("A"), doc: D4.cyber },
      { label: bi("Security questionnaire", "Sicherheitsfragebogen"), detail: bi("MFA on remote access in progress — target Q1 2027", "MFA für Fernzugriff in Arbeit — Ziel Q1 2027"), value: bi("Confirms gap", "Bestätigt Lücke"), doc: D4.isq, flag: true },
    ],
    result: bi(`Cyber rating ${cyber.rating} · no MFA on remote access`, `Cyber-Rating ${cyber.rating} · kein MFA für Fernzugriff`),
    card: (p) => <CyberCard {...p} />,
  },
  {
    key: "tier",
    cta: bi("AI · Propose risk tier and conditions", "KI · Risikostufe und Auflagen vorschlagen"),
    short: bi("AI · Propose tier", "KI · Stufe vorschlagen"),
    note: bi(`${ri.screens_requested.length} screens into one tier and its conditions`, `${ri.screens_requested.length} Prüfungen zu einer Stufe mit Auflagen`),
    title: bi("Proposing a risk tier and conditions", "Risikostufe und Auflagen werden vorgeschlagen"),
    docLabel: bi("risk proposal", "Risikovorschlag"),
    lines: [
      ...SCREENS.map((s) => ({ label: s.label, detail: s.tone === "ok" ? bi("No finding", "Kein Befund") : bi("Finding to mitigate", "Befund mit Auflage"), value: s.value, flag: s.tone !== "ok" })),
      {
        label: bi("Condition 1", "Auflage 1"),
        detail: bi(ro.proposed_conditions[0], `Wertgrenze ${gbp(PROPOSED_CAP)}, bis ${PROPOSED_YEARS} Jahresabschlüsse geprüft sind`),
        value: same(gbp(PROPOSED_CAP)),
      },
      { label: bi("Condition 2", "Auflage 2"), detail: bi(ro.proposed_conditions[1], "MFA-Nachweis vor Systemzugang"), value: bi("Required", "Erforderlich") },
    ],
    result: bi(`Tier ${ro.proposed_risk_tier} · ${ro.proposed_conditions.length} conditions · Risk Analyst decides`, `Stufe ${ro.proposed_risk_tier} · ${ro.proposed_conditions.length} Auflagen · Risikoanalyse entscheidet`),
    card: (p) => <TierCard {...p} />,
  },
];

/** Beats per agent, in run order. */
export const UC04_BEATS: Beat[][] = [MATCH_BEATS, ONBOARD_BEATS, RISK_BEATS];
