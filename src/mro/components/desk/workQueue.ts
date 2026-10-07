/**
 * One queue over both record kinds: catalogue cases on the domain and story
 * cases in the ledger. My Desk, the presenter's "Review as" counts and the
 * Control Tower all read this, so a decision anywhere moves every count.
 */

import * as React from "react";
import type { Role, SiteId } from "@/mro/domain/types";
import type { View } from "@/mro/state";
import { useProcurement } from "@/mro/data/store";
import { useLedger } from "@/mro/services/demoLedger";
import { STORY_RUNS } from "@/mro/data/stories/runModel";
import { storyStatus, type StoryStatus } from "@/mro/components/story/useStoryRun";
import { caseSummaries } from "@/mro/domain/selectors";
import { caseView } from "@/mro/domain/caseView";
import { pence } from "@/mro/domain/money";
import { personaRole } from "@/mro/components/desk/personas";

export type QueueRequest = {
  key: string;
  ref: string;
  title: string;
  site?: SiteId;
  amount: number;
  source: "catalogue" | "story";
  status: string;
  tone: "ok" | "warn" | "bad" | "info" | "mute";
  open: View;
  storyStatus?: StoryStatus;
  /** The case has closed: it leaves every in-flight count and queue. */
  closed: boolean;
};

export type QueueApproval = { key: string; ref: string; role: Role; persona: string; task: string; amount?: number; open: View; slaHours?: number };
export type QueueException = { key: string; ref: string; reason: string; role: Role; open: View };

export function useWorkQueue() {
  const { domain } = useProcurement();
  const ledger = useLedger();

  return React.useMemo(() => {
    const requests: QueueRequest[] = [];
    const approvals: QueueApproval[] = [];
    const exceptions: QueueException[] = [];

    for (const c of caseSummaries(domain)) {
      const v = caseView(domain, c.id)!;
      const waiting = v.openTasks.length > 0;
      const closed = c.status === "closed";
      requests.push({
        key: c.id,
        ref: c.id,
        title: domain.cases[c.id].title ?? c.item,
        site: domain.cases[c.id].site,
        amount: c.total,
        source: "catalogue",
        status: closed ? "done" : c.po?.acknowledgedAt ? "confirmed" : c.po ? "po-dispatched" : waiting ? "waiting" : c.status,
        tone: c.po || closed ? "ok" : waiting || c.status === "held" ? "warn" : "info",
        open: { kind: "case", caseId: c.id },
        closed,
      });
      for (const t of v.openTasks) {
        approvals.push({ key: t.id, ref: c.id, role: t.role, persona: t.role, task: t.decision, amount: t.amount, open: { kind: "case", caseId: c.id }, slaHours: 48 });
      }
      for (const h of c.openHolds) {
        if (v.openTasks.some((t) => t.role === h.requiredRole)) continue;
        exceptions.push({ key: h.id, ref: c.id, reason: `${h.blockedAction} · ${h.reason}`, role: h.requiredRole, open: { kind: "case", caseId: c.id } });
      }
      if (v.failedPo) exceptions.push({ key: `${c.id}:erp`, ref: c.id, reason: `ERP rejected ${v.failedPo.id}`, role: "buy-desk-lead", open: { kind: "case", caseId: c.id } });
    }

    for (const run of STORY_RUNS) {
      const s = ledger.runs[run.story.id];
      const st = storyStatus(run, s);
      if (st.status === "new") continue;
      requests.push({
        key: run.story.id,
        ref: run.story.caseId,
        title: run.story.title.en,
        site: run.story.site,
        amount: pence(run.request.startingCostGBP),
        source: "story",
        status: st.status,
        tone: st.status === "done" ? "ok" : st.status === "ended" ? "mute" : st.status === "waiting" ? "warn" : "info",
        open: { kind: "story", storyId: run.story.id },
        storyStatus: st.status,
        closed: st.status === "done" || st.status === "ended",
      });
      if (st.status === "waiting" && s) {
        const step = run.steps[s.reached];
        const task = step.tasks.find((t) => !s.decisions[t.id]);
        if (task) {
          approvals.push({
            key: task.id,
            ref: run.story.caseId,
            role: personaRole(task.persona),
            persona: task.persona,
            task: task.task,
            open: { kind: "story", storyId: run.story.id },
            slaHours: task.slaHours,
          });
          if (step.run.lane?.band === "HARD_CONSTRAINT") {
            exceptions.push({ key: `${task.id}:hc`, ref: run.story.caseId, reason: step.run.lane.reason, role: personaRole(task.persona), open: { kind: "story", storyId: run.story.id } });
          }
        }
      }
    }

    return { requests, approvals, exceptions };
  }, [domain, ledger]);
}
