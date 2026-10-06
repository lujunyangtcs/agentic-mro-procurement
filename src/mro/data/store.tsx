/**
 * Live state for the MRO procurement workspace.
 *
 * `procurement.ts` holds the facts and the arithmetic; this file makes them
 * MOVE. Every page reads the same arrays from here, so resolving an exception
 * on the exception board immediately changes the requisition worklist, the
 * dashboard tiles and the lane counts — there is no second copy to update.
 *
 * It also carries the working language, because translation is a property of
 * the workspace rather than of any one screen.
 */

import * as React from "react";
import {
  requisitions as seedRequisitions,
  invoiceTieouts as seedTieouts,
  type Requisition,
  type InvoiceTieout,
  type ExceptionType,
  type Lang,
  lineValue,
  tieoutGap,
} from "@/mro/data/procurement";

/** An entry in the audit trail — one line per human decision. */
export type AuditEntry = {
  id: string;
  at: string;
  actor: string;
  action: string;
  reference: string;
  /** Money the decision protected, when it protected any. */
  value?: number;
};

/**
 * A question a supplier has asked.
 *
 * `answered`       — the agent had the facts and replied on the spot.
 * `pending-review` — the agent judged it strategic and staged it for a person.
 * `responded`      — a procurement specialist chose a reply and sent it.
 *
 * The same record is what the supplier sees in their portal and what the
 * specialist sees in their queue, so neither side can be looking at a
 * different version of the conversation.
 */
export type CaseStatus = "answered" | "pending-review" | "responded";

export type SupplierCase = {
  id: string;
  questionId: string;
  /** Exactly what the supplier wrote, in their own language. */
  asked: string;
  askedLang: Lang;
  kind: "direct" | "strategic";
  status: CaseStatus;
  raisedAt: string;
  /** The agent's own answer, for the factual ones. */
  answer?: string;
  /** Why a person is needed, for the strategic ones. */
  reason?: string;
  /** What the specialist chose to send. */
  response?: string;
  /** Which drafted option it was — lets either side read it in any language. */
  responseRef?: { questionId: string; index: number };
  respondedBy?: string;
  respondedAt?: string;
  channel?: "portal" | "email";
};

/** A free chat line outside the question flow — both personas see it. */
export type ChatNote = {
  id: string;
  who: "supplier" | "assistant" | "specialist";
  text: string;
  /** The language the line was written in. */
  lang: Lang;
  at: string;
};

type StoreState = {
  requisitions: Requisition[];
  tieouts: InvoiceTieout[];
  audit: AuditEntry[];
  /** Supplier questions — shared by the supplier portal and the buyer's queue. */
  cases: SupplierCase[];
  /** Free conversation lines, appended after the structured turns. */
  notes: ChatNote[];
  /** The language the whole workspace renders in. */
  lang: Lang;
  /** Language chosen for the next agent at a handover, keyed by run. */
  handoverLang: Record<string, Lang>;
};

type StoreActions = {
  /**
   * Close one exception with a named action. The exception is not deleted — it
   * moves onto the requisition's resolution record, so the board can show what
   * was done. When the last open exception closes, the requisition is released.
   * `avoided` is the money THIS action protected; when omitted nothing is
   * counted (never the whole requisition's figure — that double-counts).
   */
  resolveException: (prId: string, type: ExceptionType, action?: string, avoided?: number) => void;
  /** Hand one exception to a named person; it stays open, with them. */
  assignException: (prId: string, type: ExceptionType, to: string) => void;
  /** Release a held requisition outright — the buyer's own call. */
  releaseRequisition: (prId: string) => void;
  /** Raise a claim for a billing variance, holding payment until it settles. */
  raiseClaim: (tieoutId: string) => void;
  setLang: (lang: Lang) => void;
  /** Record the language the next agent should work in for this run. */
  setHandoverLang: (runId: string, lang: Lang) => void;
  /**
   * A supplier asks something. Factual questions are answered on the spot from
   * the records; anything that would move a commercial term is marked strategic
   * and waits for a person.
   */
  askQuestion: (input: {
    questionId: string;
    asked: string;
    askedLang: Lang;
    kind: "direct" | "strategic";
    answer?: string;
    reason?: string;
  }) => string;
  /** The specialist picks a drafted reply and sends it to the supplier. */
  respondToCase: (
    caseId: string,
    response: string,
    channel: "portal" | "email",
    responseRef?: { questionId: string; index: number },
  ) => void;
  /** A free-typed chat line from either end of the desk. */
  addNote: (who: ChatNote["who"], text: string, lang?: Lang) => void;
  reset: () => void;
};

const freshState = (): StoreState => ({
  requisitions: seedRequisitions.map((r) => ({ ...r })),
  tieouts: seedTieouts.map((t) => ({ ...t })),
  audit: [],
  cases: [],
  notes: [],
  lang: "en",
  handoverLang: {},
});

const Ctx = React.createContext<(StoreState & StoreActions) | null>(null);

/** Sequential case numbering, so ids read like a real queue rather than hashes. */
let caseCounter = 0;
const caseSeq = () => (caseCounter += 1);

/** Sequential, deterministic clock so the audit trail never looks random. */
let auditSeq = 0;
const stamp = () => {
  auditSeq += 1;
  const minute = 40 + auditSeq;
  const hh = 11 + Math.floor(minute / 60);
  const mm = minute % 60;
  return `2026-06-20 · ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};

export function ProcurementStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<StoreState>(freshState);

  const resolveException = React.useCallback(
    (prId: string, type: ExceptionType, action?: string, avoided?: number) =>
      setState((s) => {
        const target = s.requisitions.find((r) => r.id === prId);
        if (!target || !target.exceptions.includes(type)) return s;

        const remaining = target.exceptions.filter((e) => e !== type);
        const at = stamp();

        return {
          ...s,
          requisitions: s.requisitions.map((r) =>
            r.id !== prId
              ? r
              : {
                  ...r,
                  exceptions: remaining,
                  resolutions: [
                    ...(r.resolutions ?? []),
                    { type, action: action ?? "Recommendation accepted", at },
                  ],
                  assigned: r.assigned?.filter((a) => a.type !== type),
                  status: remaining.length === 0 ? "released" : r.status,
                },
          ),
          audit: [
            ...s.audit,
            {
              id: `AUD-${s.audit.length + 1}`,
              at,
              actor: "MRO buyer",
              action:
                (action ?? "Accepted the recommendation") +
                (remaining.length === 0 ? " · requisition released" : ""),
              reference: prId,
              /* Only what THIS action protected — an omitted figure counts 0,
                 never the requisition's whole avoidedSpend (double-counting). */
              value: avoided || undefined,
            },
          ],
        };
      }),
    [],
  );

  const assignException = React.useCallback(
    (prId: string, type: ExceptionType, to: string) =>
      setState((s) => {
        const target = s.requisitions.find((r) => r.id === prId);
        if (!target || !target.exceptions.includes(type)) return s;
        return {
          ...s,
          requisitions: s.requisitions.map((r) =>
            r.id !== prId
              ? r
              : {
                  ...r,
                  assigned: [
                    ...(r.assigned ?? []).filter((a) => a.type !== type),
                    { type, to },
                  ],
                },
          ),
          audit: [
            ...s.audit,
            {
              id: `AUD-${s.audit.length + 1}`,
              at: stamp(),
              actor: "MRO buyer",
              action: `Handed the exception to the ${to.toLowerCase()}`,
              reference: prId,
            },
          ],
        };
      }),
    [],
  );

  const releaseRequisition = React.useCallback(
    (prId: string) =>
      setState((s) => {
        const target = s.requisitions.find((r) => r.id === prId);
        if (!target) return s;
        return {
          ...s,
          requisitions: s.requisitions.map((r) =>
            r.id !== prId ? r : { ...r, exceptions: [], status: "released" },
          ),
          audit: [
            ...s.audit,
            {
              id: `AUD-${s.audit.length + 1}`,
              at: stamp(),
              actor: "MRO buyer",
              action: "Released the requisition",
              reference: prId,
              value: lineValue(target),
            },
          ],
        };
      }),
    [],
  );

  const raiseClaim = React.useCallback(
    (tieoutId: string) =>
      setState((s) => {
        const target = s.tieouts.find((t) => t.id === tieoutId);
        if (!target) return s;
        return {
          ...s,
          audit: [
            ...s.audit,
            {
              id: `AUD-${s.audit.length + 1}`,
              at: stamp(),
              actor: "MRO buyer",
              action: "Raised a claim with the supplier and held back payment",
              reference: tieoutId,
              value: tieoutGap(target),
            },
          ],
        };
      }),
    [],
  );

  const setLang = React.useCallback(
    (lang: Lang) => setState((s) => ({ ...s, lang })),
    [],
  );

  const setHandoverLang = React.useCallback(
    (runId: string, lang: Lang) =>
      setState((s) => ({ ...s, handoverLang: { ...s.handoverLang, [runId]: lang } })),
    [],
  );

  const askQuestion = React.useCallback<StoreActions["askQuestion"]>(
    (input) => {
      const id = `CASE-${String(caseSeq()).padStart(3, "0")}`;
      setState((s) => ({
        ...s,
        cases: [
          ...s.cases,
          {
            id,
            questionId: input.questionId,
            asked: input.asked,
            askedLang: input.askedLang,
            kind: input.kind,
            status: input.kind === "direct" ? "answered" : "pending-review",
            raisedAt: stamp(),
            answer: input.answer,
            reason: input.reason,
          },
        ],
      }));
      return id;
    },
    [],
  );

  const respondToCase = React.useCallback<StoreActions["respondToCase"]>(
    (caseId, response, channel, responseRef) =>
      setState((s) => ({
        ...s,
        cases: s.cases.map((c) =>
          c.id !== caseId
            ? c
            : {
                ...c,
                status: "responded",
                response,
                responseRef,
                channel,
                respondedBy: "Procurement specialist",
                respondedAt: stamp(),
              },
        ),
        audit: [
          ...s.audit,
          {
            id: `AUD-${s.audit.length + 1}`,
            at: stamp(),
            actor: "Procurement specialist",
            action:
              channel === "email"
                ? "Answered a supplier question by email"
                : "Answered a supplier question in the portal",
            reference: caseId,
          },
        ],
      })),
    [],
  );

  const addNote = React.useCallback<StoreActions["addNote"]>(
    (who, text, lang = "en") =>
      setState((s) => ({
        ...s,
        notes: [...s.notes, { id: `NOTE-${s.notes.length + 1}`, who, text, lang, at: stamp() }],
      })),
    [],
  );

  const reset = React.useCallback(() => setState(freshState()), []);

  return (
    <Ctx.Provider
      value={{
        ...state,
        resolveException,
        releaseRequisition,
        raiseClaim,
        assignException,
        setLang,
        setHandoverLang,
        askQuestion,
        respondToCase,
        addNote,
        reset,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useProcurement() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useProcurement must be inside <ProcurementStoreProvider>");
  return ctx;
}
