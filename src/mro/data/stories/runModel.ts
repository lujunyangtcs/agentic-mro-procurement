/**
 * Turns each use case's I/O into a run the workspace can play: the request as
 * it arrived, the agent chain in manifest order, and the human tasks each
 * HiTL lane decision creates. Every figure is read from `IO`; the only things
 * written here are the labels for the decision buttons and which choices end
 * the run early (UC4's supplier rejection at risk screening).
 */

import type { StoryId } from "@/mro/domain/types";
import { IO, agentRun, type AgentRun, type UseCaseKey } from "@/mro/data/stories/io";
import { STORIES, storyById, type StoryDef } from "@/mro/data/stories/registry";

type Bi = { en: string; de: string };
type Json = Record<string, unknown>;

export type ChannelKind = "form" | "handoff" | "award";

export type RequestCard = {
  requestId: string;
  channel: string;
  channelKind: ChannelKind;
  requester?: { name?: string; role: string; org?: string; site?: string; function?: string; costCentre?: string };
  headline: string;
  detail: string;
  startingCostGBP: number;
  valueBand?: string;
  needBy?: string;
  receivedAt: string;
  /** The remaining request fields, exactly as they arrived. */
  fields: { label: string; value: string }[];
};

export type HumanOption = {
  id: string;
  label: Bi;
  primary?: boolean;
  /** Ends the run here with this outcome instead of handing on. */
  endsRun?: Bi;
};

export type HumanTask = {
  id: string;
  persona: string;
  org: string;
  task: string;
  slaHours?: number;
  prefilled?: boolean;
  escalateIf?: string;
  then?: string;
  options: HumanOption[];
  /** What the I/O records the person deciding, where the next agent's input carries it. */
  recorded?: { decision: string; reason: string; at: string };
};

export type RunStep = {
  index: number;
  run: AgentRun;
  input: Json;
  output: Json;
  tasks: HumanTask[];
};

export type StoryRun = {
  story: StoryDef;
  manifest: (typeof IO)[UseCaseKey]["manifest"];
  request: RequestCard;
  steps: RunStep[];
  /** Any step routes to a person. */
  needsHuman: boolean;
};

const ENVELOPE = new Set(["meta", "confidence", "guardrail_checks", "lane_decision", "audit", "knowledge_refs"]);

export function bodyOf(doc: unknown): Json {
  return Object.fromEntries(Object.entries(doc as Json).filter(([k]) => !ENVELOPE.has(k)));
}

/* ── The request as it arrived ──────────────────────────────────────────── */

function requestFor(uc: UseCaseKey): RequestCard {
  switch (uc) {
    case "uc06": {
      const i = IO.uc06.intake.input;
      const r = i.request;
      return {
        requestId: r.request_id,
        channel: r.channel,
        channelKind: "form",
        requester: { name: r.requester.name, role: r.requester.role, org: r.requester.org, site: r.requester.site, function: r.requester.function, costCentre: r.requester.cost_centre },
        headline: r.need,
        detail: r.item_text,
        startingCostGBP: r.starting_cost_gbp,
        valueBand: IO.uc06.intake.output.structured_request.value_band,
        needBy: r.need_by,
        receivedAt: i.meta.timestamp,
        fields: [
          { label: "Item text", value: r.item_text },
          { label: "Supplier hint", value: r.supplier_hint },
        ],
      };
    }
    case "uc09": {
      const i = IO.uc09.sourcing.input;
      const r = i.request;
      const firstBid = IO.uc09.bidScoring.input.bids[0] as { lines?: { desc: string }[] };
      const firstLine = firstBid.lines?.[0]?.desc ?? r.category;
      return {
        requestId: r.request_id,
        channel: i.trigger.source,
        channelKind: "handoff",
        requester: { role: r.requester.role, org: r.requester.org, site: r.requester.site },
        headline: firstLine,
        detail: `${r.category} · ${r.spec_ref}`,
        startingCostGBP: r.starting_cost_gbp,
        valueBand: r.value_band,
        needBy: r.need_by,
        receivedAt: i.meta.timestamp,
        fields: [
          { label: "Category", value: r.category },
          { label: "Specification", value: r.spec_ref },
          { label: "Panel", value: i.panel.join(" · ") },
        ],
      };
    }
    case "uc04": {
      const i = IO.uc04.supplierMatch.input;
      const r = i.request;
      return {
        requestId: r.request_id,
        channel: i.trigger.source,
        channelKind: "handoff",
        requester: { role: r.requester.role, org: r.requester.org, site: r.requester.site, function: r.requester.function },
        headline: r.need,
        detail: `Named: ${r.named_supplier}`,
        startingCostGBP: r.starting_cost_gbp,
        valueBand: r.value_band,
        receivedAt: i.meta.timestamp,
        fields: [
          { label: "Named supplier", value: r.named_supplier },
          { label: "Required", value: r.required.join(" · ") },
        ],
      };
    }
    case "uc10": {
      const i = IO.uc10.contract.input;
      const a = i.award;
      return {
        requestId: a.award_id,
        channel: i.trigger.source,
        channelKind: "award",
        headline: `Contract for ${a.supplier}`,
        detail: `${a.category} · ${a.term_months} months · ${a.jurisdiction}`,
        startingCostGBP: a.value_gbp,
        receivedAt: i.meta.timestamp,
        fields: [
          { label: "Award", value: a.award_id },
          { label: "Term", value: `${a.term_months} months` },
          { label: "Data access", value: a.data_access },
          { label: "IP created", value: a.ip_created ? "Yes" : "No" },
        ],
      };
    }
    case "uc02": {
      const i = IO.uc02.intake.input;
      const r = i.request;
      return {
        requestId: r.request_id,
        channel: i.trigger.source,
        channelKind: "form",
        requester: { role: r.requester.role, org: r.requester.org, site: r.requester.site },
        headline: r.item_text,
        detail: r.application,
        startingCostGBP: r.starting_cost_gbp,
        valueBand: IO.uc02.intake.output.structured_request.value_band,
        receivedAt: i.meta.timestamp,
        fields: [
          { label: "Named part", value: r.named_part },
          { label: "Quantity", value: String(r.qty) },
          { label: "Last paid", value: `£${r.unit_price_last_paid} each` },
          { label: "Application", value: r.application },
        ],
      };
    }
  }
}

/* ── Human tasks from HiTL lane decisions ───────────────────────────────── */

const approve: HumanOption = { id: "approve", primary: true, label: { en: "Approve and hand on", de: "Freigeben und weitergeben" } };

/** Decision labels where the generic approve does not say what the person actually chooses. */
const OPTIONS: Record<string, HumanOption[]> = {
  "uc09:1:0": [
    { id: "negotiate", primary: true, label: { en: "Comparable · negotiate at target", de: "Vergleichbar · zum Zielpreis verhandeln" } },
  ],
  "uc04:0:0": [{ id: "exception", primary: true, label: { en: "Approve onboarding exception", de: "Onboarding-Ausnahme freigeben" } }],
  "uc04:1:0": [
    { id: "return", primary: true, label: { en: "Return gap list to supplier", de: "Lückenliste an Lieferanten senden" } },
  ],
  "uc04:2:0": [
    { id: "accept", primary: true, label: { en: "Accept with conditions", de: "Mit Auflagen akzeptieren" } },
    {
      id: "reject",
      label: { en: "Reject supplier", de: "Lieferant ablehnen" },
      endsRun: { en: "Supplier rejected at risk screening · PO stays blocked", de: "Lieferant in der Risikoprüfung abgelehnt · Bestellung bleibt gesperrt" },
    },
  ],
  "uc10:1:0": [{ id: "pack", primary: true, label: { en: "Send recommendation pack", de: "Empfehlungspaket senden" } }],
  "uc10:1:1": [{ id: "amber", primary: true, label: { en: "Accept Amber fallbacks", de: "Amber-Rückfallpositionen annehmen" } }],
  "uc10:1:2": [{ id: "red", primary: true, label: { en: "Counter Red at 45 days", de: "Rot mit 45 Tagen kontern" } }],
};

type RouteTask = { persona: string; org: string; task: string; sla_hours?: number; prefilled?: boolean; escalate_if?: string; then?: string };

function tasksFor(uc: UseCaseKey, index: number, run: AgentRun, nextInput?: Json): HumanTask[] {
  if (run.lane?.lane !== "HiTL") return [];
  const route = run.lane.routeTo as { steps?: RouteTask[] } & Partial<RouteTask>;
  const list: RouteTask[] = route.steps ?? (route.persona ? [route as RouteTask] : []);
  const recorded = nextInput?.human_decision as { decision: string; reason: string; timestamp: string } | undefined;
  return list.map((t, n) => ({
    id: `${uc}:${index}:${n}`,
    persona: t.persona,
    org: t.org,
    task: t.task,
    slaHours: t.sla_hours,
    prefilled: t.prefilled,
    escalateIf: t.escalate_if,
    then: t.then,
    options: OPTIONS[`${uc}:${index}:${n}`] ?? [approve],
    recorded: recorded && n === 0 ? { decision: recorded.decision, reason: recorded.reason, at: recorded.timestamp } : undefined,
  }));
}

/* ── Assemble ───────────────────────────────────────────────────────────── */

function buildRun(story: StoryDef): StoryRun {
  const { manifest, ...pairs } = IO[story.uc];
  const list = Object.values(pairs) as { input: unknown; output: unknown }[];
  const steps: RunStep[] = list.map((p, index) => {
    const run = agentRun(p);
    const nextInput = list[index + 1] ? bodyOf(list[index + 1].input) : undefined;
    return { index, run, input: bodyOf(p.input), output: bodyOf(p.output), tasks: tasksFor(story.uc, index, run, nextInput) };
  });
  return { story, manifest, request: requestFor(story.uc), steps, needsHuman: steps.some((s) => s.tasks.length > 0) };
}

export const STORY_RUNS: StoryRun[] = STORIES.map(buildRun);

export const storyRunById = Object.fromEntries(STORY_RUNS.map((r) => [r.story.id, r])) as Record<StoryId, StoryRun>;

export { storyById };
