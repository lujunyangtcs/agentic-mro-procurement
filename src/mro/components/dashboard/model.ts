/**
 * Everything the dashboard shows, derived in one pass from the domain record
 * and the shared work queue. No figure on the page is written in JSX: the
 * tiles, the narration, the queues and both charts all fall out of here, so a
 * decision on any case moves the whole surface.
 */

import * as React from "react";
import type { AuditEventType, BizDoc, DomainState, Pence, Role } from "@/mro/domain/types";
import { useProcurement } from "@/mro/data/store";
import { useWorkQueue, type QueueApproval, type QueueException, type QueueRequest } from "@/mro/components/desk/workQueue";
import { touchMetrics } from "@/mro/domain/selectors";
import { sumPence } from "@/mro/domain/money";

export type RequestPhase = "running" | "waiting" | "ordered" | "closed";

export type DashRequest = QueueRequest & { phase: RequestPhase };

export type DashInvoice = {
  id: string;
  caseId: string;
  caseTitle: string;
  supplier: string;
  poId: string;
  receiptId: string;
  amount: Pence;
  variance: Pence;
  status: "matched" | "held" | "credited";
};

export type HeldBar = { key: string; label: string; value: Pence; tone: "red" | "amber" | "navy" | "deep" };

export type DashAttention = {
  key: string;
  kind: "decision" | "hold";
  ref: string;
  amount?: Pence;
  line: string;
  role: Role;
  open: QueueApproval["open"];
};

const DAY = 86_400_000;
const SPARK_DAYS = 8;

/** Events of the given types per demo day, oldest first, ending today. */
function daily(state: DomainState, types: AuditEventType[]): number[] {
  const end = Date.parse(state.clock.now);
  const out = new Array<number>(SPARK_DAYS).fill(0);
  for (const e of state.audit) {
    if (!types.includes(e.type)) continue;
    const ago = Math.floor((end - Date.parse(e.at)) / DAY);
    if (ago >= 0 && ago < SPARK_DAYS) out[SPARK_DAYS - 1 - ago] += 1;
  }
  return out;
}

function phaseOf(r: QueueRequest): RequestPhase {
  if (r.closed) return "closed";
  if (r.status === "po-dispatched" || r.status === "confirmed") return "ordered";
  if (r.status === "waiting" || r.status === "held" || r.tone === "warn") return "waiting";
  return "running";
}

const phaseRank: Record<RequestPhase, number> = { waiting: 0, running: 1, ordered: 2, closed: 3 };

function invoiceOf(state: DomainState, d: BizDoc): DashInvoice {
  return {
    id: d.id,
    caseId: d.caseId,
    caseTitle: state.cases[d.caseId]?.title ?? d.caseId,
    supplier: (d.supplierId && state.suppliers[d.supplierId]?.name) || d.supplierId || "",
    poId: String(d.fields.poId ?? ""),
    receiptId: String(d.fields.receiptId ?? ""),
    amount: d.amount ?? 0,
    variance: Number(d.fields.variance ?? 0),
    status: d.status === "held" ? "held" : d.status === "credited" ? "credited" : "matched",
  };
}

export function useDashboardModel(search: string) {
  const { domain } = useProcurement();
  const queue = useWorkQueue();

  return React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const hit = (...parts: (string | undefined)[]) => !q || parts.some((p) => p?.toLowerCase().includes(q));

    const requests: DashRequest[] = queue.requests
      .map((r) => ({ ...r, phase: phaseOf(r) }))
      .sort((a, b) => phaseRank[a.phase] - phaseRank[b.phase]);
    const inFlight = requests.filter((r) => r.phase !== "closed");
    const closed = requests.filter((r) => r.phase === "closed");

    const amountOf = (a: QueueApproval) => a.amount ?? requests.find((r) => r.ref === a.ref)?.amount ?? 0;

    const attention: DashAttention[] = [
      ...queue.approvals.map((a) => ({ key: a.key, kind: "decision" as const, ref: a.ref, amount: amountOf(a), line: a.task, role: a.role, open: a.open })),
      ...queue.exceptions.map((e: QueueException) => ({ key: e.key, kind: "hold" as const, ref: e.ref, amount: requests.find((r) => r.ref === e.ref)?.amount, line: e.reason, role: e.role, open: e.open })),
    ];
    const waitingValue = sumPence(queue.approvals.map(amountOf));

    const invoices = Object.values(domain.docs)
      .filter((d) => d.kind === "invoice")
      .sort((a, b) => b.at.localeCompare(a.at))
      .map((d) => invoiceOf(domain, d));
    const heldInvoices = invoices.filter((i) => i.status === "held");
    const heldInvoiceValue = sumPence(heldInvoices.map((i) => i.variance));

    /* Held value by reason — what each blocker is sitting on, from the records. */
    const bars = new Map<string, HeldBar>();
    const addBar = (key: string, label: string, value: Pence, tone: HeldBar["tone"]) => {
      if (value <= 0) return;
      const cur = bars.get(key);
      bars.set(key, cur ? { ...cur, value: cur.value + value } : { key, label, value, tone });
    };
    /* A held invoice's own review task is the same money as the variance: count it once, under Invoice. */
    const heldInvoiceCases = new Set(heldInvoices.map((i) => i.caseId));
    for (const a of queue.approvals) if (!heldInvoiceCases.has(a.ref)) addBar(`role:${a.role}`, a.role, amountOf(a), "amber");
    if (heldInvoiceValue > 0) addBar("invoice", "invoice", heldInvoiceValue, "red");
    for (const f of Object.values(domain.followUps)) {
      if (f.closedAt || f.kind !== "supplier-chase") continue;
      addBar("chase", "chase", domain.pos[f.refId]?.total ?? 0, "navy");
    }
    for (const e of queue.exceptions) {
      if (e.key.endsWith(":erp")) addBar("erp", "erp", requests.find((r) => r.ref === e.ref)?.amount ?? 0, "red");
    }
    const heldBars = [...bars.values()].sort((a, b) => b.value - a.value).slice(0, 5);

    const statusMix = (["running", "waiting", "ordered", "closed"] as RequestPhase[]).map((p) => ({ phase: p, value: requests.filter((r) => r.phase === p).length }));

    const touch = touchMetrics(domain);
    const sites = new Set(inFlight.map((r) => r.site).filter(Boolean));

    return {
      now: domain.clock.now,
      requests,
      inFlight,
      closed,
      approvals: queue.approvals,
      attention,
      waitingValue,
      inFlightValue: sumPence(inFlight.map((r) => r.amount)),
      sites: sites.size,
      invoices,
      heldInvoices,
      heldInvoiceValue,
      heldBars,
      statusMix,
      touch,
      spark: {
        submitted: daily(domain, ["request.submitted"]),
        approvals: daily(domain, ["approval.requested"]),
        closed: daily(domain, ["case.closed"]),
        invoices: daily(domain, ["invoice.held", "invoice.matched"]),
      },
      rows: {
        requests: requests.filter((r) => hit(r.ref, r.title)),
        attention: attention.filter((a) => hit(a.ref, a.line)),
        invoices: invoices.filter((i) => hit(i.id, i.caseId, i.caseTitle, i.supplier, i.poId)),
      },
    };
  }, [domain, queue, search]);
}

export type DashboardModel = ReturnType<typeof useDashboardModel>;
