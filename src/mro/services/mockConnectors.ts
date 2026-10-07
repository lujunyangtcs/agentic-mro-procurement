/**
 * Deterministic stand-ins for enterprise systems (PRD §20). No network, no
 * randomness: the same PO always gets the same ERP reference, and the
 * presenter can inject a number of failing attempts. Retries reuse the
 * command's idempotency key, so the ERP never sees two different orders.
 */

export type ErpPoReply = { ok: true; erpRef: string } | { ok: false; error: string };

export const ERP_MAX_ATTEMPTS = 3;

/** Dispatch a PO to the mock ERP. `failuresRemaining` > 0 makes this attempt fail. */
export function erpDispatchPo(poId: string, failuresRemaining: number): ErpPoReply {
  if (failuresRemaining > 0) return { ok: false, error: "ERP timeout (injected)" };
  return { ok: true, erpRef: `ERP-45${poId.replace(/\D/g, "").padStart(6, "0")}` };
}
