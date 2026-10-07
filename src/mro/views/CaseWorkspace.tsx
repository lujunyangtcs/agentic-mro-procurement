/**
 * One Flow 1 case, live from the domain record. Steps are derived from what
 * the case has (gate evaluated, approval covering this revision, PO, supplier
 * confirmation), never from an index. Changing the quantity is a revision:
 * prior approvals stop covering it, and the gate, approval path, PO and
 * totals all follow.
 */

import * as React from "react";
import { ArrowLeft, Check, CircleAlert, Clock, Package, Truck } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { useApp } from "@/mro/state";
import { useProcurement } from "@/mro/data/store";
import { LanguageSwitch } from "@/mro/lib/i18n";
import { caseView, type StepState } from "@/mro/domain/caseView";
import { currentRevision, gateInputFor } from "@/mro/domain/selectors";
import { evaluateGate } from "@/mro/domain/evaluateGate";
import { gbp } from "@/mro/domain/money";
import { londonDateTime } from "@/mro/domain/clock";
import { idemKey } from "@/mro/domain/commands";
import { siteById, supplierById } from "@/mro/data/masterData";
import { routeCase, STANDING_MANDATE } from "@/mro/services/caseAutomation";
import { useDeskCopy } from "@/mro/components/desk/copy";
import { ActionButton, Card, Chip, KeyValue, OneLineText, type ChipTone } from "@/mro/components/desk/ui";
import { GateSummary } from "@/mro/components/desk/GateSummary";
import { ApprovalTaskCard } from "@/mro/components/desk/ApprovalTaskCard";
import { CaseTimeline } from "@/mro/components/desk/CaseTimeline";

const stepTone: Record<StepState, string> = {
  done: "bg-surface-deep text-ink-inverse",
  current: "bg-surface-mint text-surface-deep",
  waiting: "bg-surface-amber text-mark-amber",
  failed: "bg-surface-rose text-mark-red",
  todo: "bg-surface-fog text-mute",
};

function Stepper({ steps }: { steps: { key: keyof ReturnType<typeof useDeskCopy>["d"]["steps"]; state: StepState }[] }) {
  const { d } = useDeskCopy();
  return (
    <ol className="grid grid-cols-5 gap-2" aria-label="Flow 1 steps">
      {steps.map((s, i) => (
        <li key={s.key} className="flex min-w-0 items-center gap-2.5 rounded-md border border-divider bg-white px-3 py-2.5">
          <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold", stepTone[s.state])} aria-hidden>
            {s.state === "done" ? <Check size={14} strokeWidth={2.5} /> : s.state === "waiting" ? <Clock size={13} /> : s.state === "failed" ? <CircleAlert size={13} /> : i + 1}
          </span>
          <span className="min-w-0">
            <OneLineText className="text-[13px] font-bold leading-[18px] text-ink">{d.steps[s.key]}</OneLineText>
            <OneLineText className="text-[12px] leading-[16px] text-mute">{d.stepState[s.state]}</OneLineText>
          </span>
        </li>
      ))}
    </ol>
  );
}

function RequestCard({ caseId }: { caseId: string }) {
  const { domain, dispatch, lang } = useProcurement();
  const { d, t } = useDeskCopy();
  const c = domain.cases[caseId];
  const rev = currentRevision(domain, caseId)!;
  const req = domain.requests[c.requestId];
  const line = rev.lines[0];
  const view = caseView(domain, caseId)!;
  const [packs, setPacks] = React.useState<number>(line.entered?.quantity ?? line.quantity);
  const locked = !!view.po;
  const supplier = rev.supplierId ? supplierById[rev.supplierId] : undefined;

  const revise = () => {
    const r = dispatch({
      type: "request.revise",
      actor: { kind: "human", role: "requester", name: c.requester },
      caseId,
      expectedRevision: c.revision,
      lines: [{ material: line.material, quantity: packs, uom: line.entered?.uom ?? line.uom, neededBy: line.neededBy }],
      idempotencyKey: idemKey(caseId, "F1", `revise:${packs}`, c.revision),
    });
    if (!r.ok) return { ok: false, message: r.message };
    routeCase(dispatch, r.state, caseId);
    return { ok: true };
  };

  return (
    <Card title={d.request} right={<span className="text-[12px] text-mute">{`${c.requestId} · r${c.revision}`}</span>}>
      <blockquote className="mx-4 rounded-md border-l-2 border-surface-sage bg-surface-fog/60 px-3 py-2 text-[13.5px] leading-[20px] text-ink">
        <span className="mb-0.5 block text-[11.5px] font-bold uppercase tracking-[0.05em] text-mute">{`${d.original} · ${req.source.channel}`}</span>
        {req.source.originalText}
      </blockquote>
      <div className="grid grid-cols-2 gap-3 px-4 py-3 md:grid-cols-4">
        <KeyValue label={d.line} value={line.description} />
        <KeyValue
          label={d.qty}
          value={line.entered ? `${line.entered.quantity} ${t(`uom.${line.entered.uom}`)} · ${line.quantity} ${t(`uom.${line.uom}`)}` : `${line.quantity} ${t(`uom.${line.uom}`)}`}
        />
        <KeyValue label={d.unitPrice} value={`${gbp(line.unitPrice)} × ${line.quantity}`} />
        <KeyValue label={d.total} value={gbp(view.total)} strong />
        <KeyValue label={d.agreement} value={rev.agreementId ?? "—"} />
        <KeyValue label={d.supplier} value={supplier ? `${supplier.id} ${supplier.name}` : "—"} />
        <KeyValue label={d.steps.intake} value={`${rev.model} · ${rev.pattern}`} />
        <KeyValue label={d.field.neededBy} value={londonDateTime(line.neededBy, lang)} />
      </div>
      <div className="flex flex-wrap items-end gap-3 border-t border-divider px-4 py-3">
        <label className="flex flex-col gap-1">
          <span className="text-[12px] text-mute">{`${d.revise} (${t(`uom.${line.entered?.uom ?? line.uom}`)})`}</span>
          <input
            type="number"
            min={1}
            max={1000}
            value={packs}
            disabled={locked}
            onChange={(e) => setPacks(Math.max(1, Math.min(1000, Math.round(Number(e.target.value) || 1))))}
            className="h-9 w-28 rounded-md border border-divider bg-white px-2.5 text-[14px] tabular-nums text-ink outline-none focus:border-surface-deep disabled:bg-surface-fog"
          />
        </label>
        <ActionButton tone="ghost" disabled={locked || packs === (line.entered?.quantity ?? line.quantity)} onAction={revise}>
          {d.update}
        </ActionButton>
        <p className="min-w-0 flex-1 text-[12.5px] leading-[17px] text-mute text-pretty">{locked ? d.lockedByPo : d.reviseHint}</p>
      </div>
    </Card>
  );
}

function PoCard({ caseId }: { caseId: string }) {
  const { domain, lang } = useProcurement();
  const { d } = useDeskCopy();
  const view = caseView(domain, caseId)!;
  const po = view.po ?? view.failedPo;
  const holds = domain.cases[caseId].holds.filter((h) => !h.closedAt);

  if (!po) {
    return (
      <Card title={d.po}>
        <div className="flex items-center gap-3 px-4 pb-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-surface-fog text-mute" aria-hidden>
            <Package size={17} />
          </span>
          <p className="text-[13.5px] leading-[19px] text-ink">{view.openTasks.length > 0 || holds.length > 0 ? d.poHeld : d.poNone}</p>
        </div>
      </Card>
    );
  }

  const chase = view.followUps.find((f) => f.kind === "supplier-chase" && !f.closedAt);
  const tone: ChipTone = po.dispatch.state === "failed" ? "bad" : po.acknowledgedAt ? "ok" : chase ? "warn" : "info";
  return (
    <Card title={d.po} right={<Chip tone={tone}>{po.dispatch.state === "failed" ? d.stepState.failed : po.acknowledgedAt ? d.acked : chase ? d.chaser : d.dispatched}</Chip>}>
      <div className="grid grid-cols-2 gap-3 px-4 pb-3 md:grid-cols-4">
        <KeyValue label={d.po} value={po.id} strong />
        <KeyValue label={d.total} value={gbp(po.total)} strong />
        <KeyValue label="ERP" value={po.dispatch.erpRef ?? `${po.dispatch.attempts} attempts`} />
        <KeyValue
          label={po.approvedBy.kind === "human" ? d.approved : d.authority}
          value={po.approvedBy.kind === "human" ? po.approvedBy.name : po.approvedBy.kind === "policy" ? `${po.approvedBy.policyVersion} · ${po.approvedBy.mandateId}` : po.approvedBy.agentId}
        />
      </div>
      <div className="flex items-center gap-2 border-t border-divider px-4 py-3 text-[13px] text-ink">
        <Truck size={15} className="shrink-0 text-surface-deep" aria-hidden />
        {po.acknowledgedAt ? `${d.acked} · ${londonDateTime(po.acknowledgedAt, lang)}` : `${d.ackDue} · ${londonDateTime(po.ackDueAt, lang)}`}
      </div>
    </Card>
  );
}

export function CaseWorkspace({ caseId }: { caseId: string }) {
  const { go } = useApp();
  const { domain, lang } = useProcurement();
  const { d, t, role } = useDeskCopy();
  const c = domain.cases[caseId];

  if (!c) {
    return (
      <div className="p-8 text-[14px] text-mute">
        {caseId} —{" "}
        <button type="button" className="underline" onClick={() => go({ kind: "cockpit" })}>
          {d.backDesk}
        </button>
      </div>
    );
  }

  const view = caseView(domain, caseId)!;
  const rev = currentRevision(domain, caseId)!;
  const gate = evaluateGate(gateInputFor(domain, caseId, "request.approve", STANDING_MANDATE));
  const events = domain.audit.filter((e) => e.caseId === caseId);
  const tasks = [...view.openTasks, ...view.decidedTasks.filter((x) => !view.openTasks.includes(x))];
  const holds = c.holds.filter((h) => !h.closedAt && !view.openTasks.some((t) => t.role === h.requiredRole));

  return (
    <div className="min-h-screen bg-[color-mix(in_srgb,var(--surface-mint)_18%,var(--surface-fog))]">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-divider bg-white px-5 py-3">
        <button
          type="button"
          onClick={() => go({ kind: "cockpit" })}
          className="ui-pill inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[13px] font-medium text-ink hover:bg-surface-fog"
        >
          <ArrowLeft size={15} aria-hidden /> {d.backDesk}
        </button>
        <div className="min-w-0 flex-1 border-l border-divider pl-3">
          <h1 className="truncate text-[16px] font-bold leading-[21px] text-ink">{`${c.id} · ${rev.lines[0]?.description}`}</h1>
          <p className="truncate text-[12px] leading-[16px] text-mute">
            {`${siteById[c.site]?.name} · ${d.catalogue} · Flow 1 · ${c.policyVersion} · ${d.clock} ${londonDateTime(domain.clock.now, lang)}`}
          </p>
        </div>
        <Chip tone={c.status === "po-dispatched" ? "ok" : c.status === "held" ? "warn" : "info"}>{t(`caseStatus.${c.status}`)}</Chip>
        <LanguageSwitch />
      </header>

      <div className="flex flex-col gap-3 px-5 pb-10 pt-4">
        <Stepper steps={view.steps} />

        {c.possibleDuplicateOf && (
          <p className="rounded-md border border-divider bg-surface-amber/50 px-4 py-2.5 text-[13px] text-ink">{d.duplicateOf(c.possibleDuplicateOf)}</p>
        )}

        <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-3">
            <RequestCard key={`${caseId}:${c.revision}`} caseId={caseId} />
            <GateSummary gate={gate} />
            {holds.map((h) => (
              <p key={h.id} className="flex items-center gap-2 rounded-md border border-divider bg-white px-4 py-2.5 text-[13px] text-ink">
                <Chip tone="warn">{d.holdOpen}</Chip>
                <span className="min-w-0 flex-1 truncate">{`${h.blockedAction} · ${h.reason}`}</span>
                <span className="shrink-0 text-mute">{role(h.requiredRole)}</span>
              </p>
            ))}
            {tasks.map((task) => (
              <ApprovalTaskCard key={task.id} task={task} />
            ))}
            <PoCard caseId={caseId} />
          </div>
          <aside className="flex flex-col gap-3">
            <CaseTimeline events={events} />
          </aside>
        </div>
      </div>
    </div>
  );
}
