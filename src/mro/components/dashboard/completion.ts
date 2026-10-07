/**
 * Builds the close card from the records a case left behind. Catalogue cases
 * read the domain (human ledger, PO, receipt, invoice, credit, value record);
 * stories read their run state (decisions taken, agents run, value record).
 * Nothing here is a fixed claim — every tile is a count or an amount.
 */

import type { DomainState, IsoTime, Role } from "@/mro/domain/types";
import type { StoryRun } from "@/mro/data/stories/runModel";
import type { RunState } from "@/mro/services/demoLedger";
import { gbp, pence } from "@/mro/domain/money";
import { londonDateTime } from "@/mro/domain/clock";
import { currentRevision, humanLedger } from "@/mro/domain/selectors";
import { caseView } from "@/mro/domain/caseView";
import type { DashCopy } from "@/mro/components/dashboard/copy";
import type { CompletionDoc, CompletionSummary } from "@/mro/components/dashboard/CaseCompleteModal";

type Lang = "en" | "de";

function cycle(from: IsoTime, to: IsoTime): string {
  const minutes = Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / 60_000));
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  const m = minutes % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const humanise = (key: string) => key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

/**
 * A case with a workflow run is complete when the run closes it. A Flow 1
 * case without a run ends at the last step it has: the supplier's confirmation.
 */
export function catalogueComplete(state: DomainState, caseId: string): boolean {
  const c = state.cases[caseId];
  if (!c) return false;
  if (c.status === "closed") return true;
  const hasRun = Object.values(state.runs).some((r) => r.caseId === caseId);
  return !hasRun && !!caseView(state, caseId)?.po?.acknowledgedAt;
}

export function catalogueCompletion(state: DomainState, caseId: string, k: DashCopy, lang: Lang, role: (r: Role) => string): CompletionSummary {
  const c = state.cases[caseId];
  const rev = currentRevision(state, caseId)!;
  const line = rev.lines[0];
  const view = caseView(state, caseId)!;
  const po = view.po;
  const humans = humanLedger(state, caseId).length;
  const supplier = po ? state.suppliers[po.supplierId]?.name ?? po.supplierId : undefined;
  const end = c.closedAt ?? po?.acknowledgedAt ?? state.clock.now;

  const docs: CompletionDoc[] = [{ key: "pr", label: k.pr(c.requestId), meta: `r${c.revision} · ${line.entered ? `${line.entered.quantity} ${line.entered.uom}` : `${line.quantity} ${line.uom}`}`, settled: false }];
  for (const t of view.decidedTasks.filter((x) => x.outcome === "approved" && x.decidedBy?.kind === "human")) {
    const by = t.decidedBy as { name: string; role: Role };
    docs.push({ key: t.id, label: k.approval(role(by.role)), meta: `${gbp(t.amount)} · ${t.decidedAt ? londonDateTime(t.decidedAt, lang) : by.name}`, settled: true });
  }
  if (po) docs.push({ key: po.id, label: k.po(po.id), meta: `${supplier} · ${gbp(po.total)}`, settled: true });
  if (po?.acknowledgedAt) docs.push({ key: "ack", label: k.supplierAck, meta: londonDateTime(po.acknowledgedAt, lang), settled: true });
  for (const d of Object.values(state.docs).filter((x) => x.caseId === caseId).sort((a, b) => a.at.localeCompare(b.at))) {
    docs.push({ key: d.id, label: `${k.docKind[d.kind] ?? humanise(d.kind)} ${d.id}`, meta: [d.status, d.amount !== undefined ? gbp(d.amount) : undefined].filter(Boolean).join(" · "), settled: d.status !== "held" });
  }
  for (const v of Object.values(state.valueRecords).filter((x) => x.caseId === caseId)) {
    docs.push({ key: v.id, label: k.valueRecord(v.id), meta: `${v.state} · ${gbp(v.evidenced ?? v.expected)}`, settled: v.state === "validated" });
  }

  return {
    tone: "complete",
    eyebrow: k.complete,
    title: `${c.id} · ${humans === 0 ? k.closedTouchless : k.closedAfter(humans)}`,
    metrics: [
      { value: String(humans), label: k.manualTouch },
      { value: po ? gbp(po.total) : gbp(view.total), label: k.poValue },
      { value: cycle(c.createdAt, end), label: k.cycle },
      { value: humans === 0 ? k.touchless : k.humanReviewed, label: k.processing },
    ],
    caption: [c.title ?? line.description, rev.agreementId, supplier].filter(Boolean).join(" · "),
    docs,
  };
}

type ValueRecordIo = { value_record_id?: string; baseline_gbp?: number; avoided_gbp?: number; award_gbp?: number };

export function storyCompletion(run: StoryRun, s: RunState, k: DashCopy, lang: Lang): CompletionSummary {
  const humans = Object.keys(s.decisions).length;
  const ended = !!s.endedBy;
  const ran = run.steps.slice(0, s.reached + 1);
  const vr = [...ran].reverse().map((x) => x.output.value_record as ValueRecordIo | undefined).find(Boolean);

  const valueTile = vr?.avoided_gbp
    ? { value: gbp(pence(vr.avoided_gbp)), label: k.costAvoided }
    : vr?.award_gbp !== undefined && vr.baseline_gbp !== undefined
      ? { value: gbp(pence(vr.baseline_gbp - vr.award_gbp)), label: k.expectedSaving }
      : { value: humans === 0 ? k.touchless : k.humanReviewed, label: k.processing };

  const docs: CompletionDoc[] = ran.map((step) => {
    const body = Object.keys(step.output).filter((key) => !["meta", "confidence", "guardrail_checks", "lane_decision", "audit", "knowledge_refs"].includes(key));
    const decided = step.tasks
      .map((t) => t.options.find((o) => o.id === s.decisions[t.id])?.label[lang])
      .filter(Boolean)
      .join(" · ");
    return {
      key: `${step.index}`,
      label: step.run.agent,
      meta: decided || (body[0] ? humanise(body[0]) : step.run.flowStep),
      settled: true,
    };
  });
  if (vr?.value_record_id) docs.push({ key: "vr", label: k.valueRecord(vr.value_record_id), meta: vr.baseline_gbp !== undefined ? `baseline ${gbp(pence(vr.baseline_gbp))}` : undefined, settled: false });

  return {
    tone: ended ? "ended" : "complete",
    eyebrow: `${run.story.id} · ${ended ? k.endedEarly : k.complete}`,
    title: `${run.story.caseId} · ${ended ? k.closedEnded : humans === 0 ? k.closedTouchless : k.closedAfter(humans)}`,
    metrics: [
      { value: String(humans), label: k.manualTouch },
      { value: `${ran.length} / ${run.steps.length}`, label: k.agentsRan },
      { value: gbp(pence(run.request.startingCostGBP)), label: k.requestValue },
      valueTile,
    ],
    caption: ended ? s.endedBy![lang] : run.story.title[lang],
    docs,
  };
}
