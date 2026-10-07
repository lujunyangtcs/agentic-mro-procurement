/**
 * Guided playback scripts. A script says, per agent, what it fetches while
 * it works, which source file backs each confidence signal and guardrail,
 * what it hands to the next agent, and how the close card states the
 * business impact. Figures are read from `IO`; a story without a script
 * keeps the standard run panel.
 */

import { IO, type UseCaseKey } from "@/mro/data/stories/io";
import type { SourceDoc } from "@/mro/components/story/theatre/pdf";
import { UC06_DOCS } from "@/mro/components/story/theatre/uc06Docs";

type Bi = { en: string; de: string };

export type FetchLine = { label: Bi; doc?: string };

export type TheatreStep = {
  fetch: FetchLine[];
  /** Confidence signal key → source file id. */
  signalDocs?: Record<string, string>;
  /** Guardrail rule → source file id. */
  guardDocs?: Record<string, string>;
  /** Files this agent writes, opened from its output card. */
  produces?: string[];
  /** What travels to the next owner. */
  handover: Bi[];
  /** Who receives it after the last agent. */
  finalOwner?: Bi;
};

export type TheatreScript = {
  docs: SourceDoc[];
  arrival: { title: Bi; doc: string };
  steps: TheatreStep[];
  completion: (lang: "en" | "de") => { hero: { value: string; label: string }; metrics: { value: string; label: string }[]; impact: string[] };
};

const FETCH_MS = 720;

/** How long an agent works on screen: one beat per fetched source plus a short settle. */
export function fetchMs(step: TheatreStep | undefined) {
  return step ? step.fetch.length * FETCH_MS + 700 : 1600;
}
export const FETCH_LINE_MS = FETCH_MS;

const gbp = (n: number) => `£${n.toLocaleString("en-GB")}`;

const u6 = IO.uc06;
const req = u6.intake.input.request;
const reuse = u6.spendIntelligence.output.reuse_assessment;
const pipe = u6.spendIntelligence.output.pipeline_signal;
const vr = u6.channelDecision.output.value_record;
const kpi = u6.channelDecision.output.kpi_impact;
const sam = u6.spendIntelligence.input.data_sources.sam_snapshot.id;
const ea = u6.spendIntelligence.input.data_sources.enterprise_agreement;

const UC06: TheatreScript = {
  docs: UC06_DOCS,
  arrival: { title: { en: "Request for licences received", de: "Lizenzanforderung eingegangen" }, doc: req.request_id },
  steps: [
    {
      fetch: [
        { label: { en: `Reading front-door form ${req.request_id}`, de: `Lese Formular ${req.request_id}` }, doc: req.request_id },
        { label: { en: "Classifying against UNSPSC-Client v3", de: "Klassifiziere nach UNSPSC-Client v3" } },
        { label: { en: "Looking up the last paid unit price", de: "Suche den zuletzt bezahlten Preis" }, doc: "PO-7781223" },
        { label: { en: `Checking budget on ${req.requester.cost_centre}`, de: `Prüfe Budget auf ${req.requester.cost_centre}` }, doc: "BUD-CC4471-FY27" },
        { label: { en: "Searching open requests for duplicates", de: "Suche offene Anforderungen nach Dubletten" } },
      ],
      signalDocs: { data_completeness: req.request_id, starting_cost: "PO-7781223", classification_certainty: req.request_id },
      guardDocs: { "Front door only": req.request_id, "Budget available": "BUD-CC4471-FY27" },
      handover: [
        { en: `Structured request ${req.request_id} · ${u6.intake.output.structured_request.quantity} licence-years`, de: `Strukturierte Anforderung ${req.request_id} · 12 Lizenzjahre` },
        { en: `Category ${u6.intake.output.structured_request.category.code} · GL ${u6.intake.output.structured_request.gl}`, de: `Kategorie ${u6.intake.output.structured_request.category.code} · Sachkonto ${u6.intake.output.structured_request.gl}` },
        { en: "Flag: a licence pool exists for this product", de: "Hinweis: Für dieses Produkt existiert ein Lizenzpool" },
      ],
    },
    {
      fetch: [
        { label: { en: `Pulling SAM snapshot ${sam}`, de: `Lade SAM-Snapshot ${sam}` }, doc: sam },
        { label: { en: `Reading licence agreement ${ea}`, de: `Lese Lizenzvertrag ${ea}` }, doc: ea },
        { label: { en: "Scanning 420 entitlements for CAD viewer pro", de: "Prüfe 420 Berechtigungen für CAD viewer pro" } },
        { label: { en: "Flagging licences inactive for 90 days", de: "Markiere seit 90 Tagen inaktive Lizenzen" } },
        { label: { en: "Checking renewal date and true-down terms", de: "Prüfe Verlängerung und Reduzierungsklausel" }, doc: ea },
      ],
      signalDocs: { data_freshness: sam, tier_match: sam, utilisation_evidence: sam, ea_terms: ea },
      guardDocs: { "Enterprise agreement terms": ea, "No access-level change": sam },
      handover: [
        { en: `Reuse ${reuse.reuse_recommended_qty} from the unassigned pool · buy ${reuse.new_purchase_qty}`, de: `${reuse.reuse_recommended_qty} aus dem freien Pool · ${reuse.new_purchase_qty} neu kaufen` },
        { en: `${gbp(reuse.spend_avoided_gbp)} spend avoided`, de: `${gbp(reuse.spend_avoided_gbp)} Ausgaben vermieden` },
        { en: `${pipe.pipeline_item} raised for renewal right-sizing`, de: `${pipe.pipeline_item} für Reduzierung bei Verlängerung angelegt` },
      ],
    },
    {
      fetch: [
        { label: { en: "Weighing 4 routing options", de: "Wäge 4 Beschaffungswege ab" } },
        { label: { en: "Checking DoA matrix DOA-2026.2", de: "Prüfe Freigabematrix DOA-2026.2" } },
        { label: { en: "Reading application owner policy APP-CV-01", de: "Lese Owner-Richtlinie APP-CV-01" }, doc: "APP-CV-01" },
        { label: { en: "Assigning 12 licences in the SAM tool", de: "Weise 12 Lizenzen im SAM-Tool zu" }, doc: "SAM-ASSIGN-77120" },
        { label: { en: `Notifying ${req.requester.name}`, de: `Benachrichtige ${req.requester.name}` }, doc: "MAIL-118204" },
      ],
      signalDocs: { match_strength: sam },
      guardDocs: { "Application Owner approval": "APP-CV-01" },
      produces: ["SAM-ASSIGN-77120", "MAIL-118204", vr.value_record_id],
      handover: [
        { en: `Value record ${vr.value_record_id} · ${gbp(vr.avoided_gbp)} avoided`, de: `Werteintrag ${vr.value_record_id} · ${gbp(vr.avoided_gbp)} vermieden` },
        { en: "Assignment SAM-ASSIGN-77120 · no PO", de: "Zuweisung SAM-ASSIGN-77120 · keine Bestellung" },
        { en: "Finance BP sign-off queued in Flow 5", de: "Finance-BP-Freigabe in Flow 5 eingereiht" },
      ],
      finalOwner: { en: "Value Agent · Flow 5", de: "Value Agent · Flow 5" },
    },
  ],
  completion: (lang) => {
    const en = lang === "en";
    return {
      hero: { value: gbp(vr.avoided_gbp), label: en ? "spend avoided — nothing bought" : "Ausgaben vermieden — nichts gekauft" },
      metrics: [
        { value: "0", label: en ? "Buyer touches" : "Einkäufer-Eingriffe" },
        { value: `${kpi.cycle_time_minutes} min`, label: en ? "Request to licences" : "Anforderung bis Lizenz" },
        { value: gbp(pipe.est_value_gbp), label: en ? "Renewal pipeline" : "Pipeline Verlängerung" },
        { value: en ? "None" : "Keine", label: en ? "PO raised" : "Bestellung" },
      ],
      impact: en
        ? [
            `${reuse.reuse_recommended_qty} idle licences put to work instead of buying ${reuse.reuse_recommended_qty} new at £1,200 each.`,
            `${reuse.renewal_insight.right_size_by} licences unused for 90+ days flagged before the ${new Date(reuse.renewal_insight.renewal_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} renewal — ${gbp(pipe.est_value_gbp)} more to take out.`,
            `${req.requester.name}'s team has access the same morning; no PO, invoice or three-way match to process.`,
          ]
        : [
            `${reuse.reuse_recommended_qty} ungenutzte Lizenzen eingesetzt statt ${reuse.reuse_recommended_qty} neue zu je £1.200 zu kaufen.`,
            `${reuse.renewal_insight.right_size_by} seit über 90 Tagen ungenutzte Lizenzen vor der Verlängerung markiert — weitere ${gbp(pipe.est_value_gbp)} Potenzial.`,
            `Das Team von ${req.requester.name} hat noch am selben Morgen Zugriff; keine Bestellung, Rechnung oder Abgleich nötig.`,
          ],
    };
  },
};

export const THEATRE: Partial<Record<UseCaseKey, TheatreScript>> = { uc06: UC06 };
