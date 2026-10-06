import * as React from "react";
import { Sparkles, CornerUpRight, Check, Mail, CalendarCheck } from "lucide-react";
import { SpringIn } from "@/components/ai/SpringIn";
import { DunningLadder } from "@/components/workspace/DunningLadder";
import { FollowUpModal } from "@/components/workspace/FollowUpModal";
import { EmailReceivedModal } from "@/components/workspace/EmailReceivedModal";
import { PaymentPostingDoc } from "@/components/docs/finance/PaymentPostingDoc";
import { EmailDoc } from "@/components/docs/sources";
import {
  dunningTiers,
  dunningTo,
  dunningContract,
  dunningRecommended,
} from "@/data/dunning";

/**
 * The Payment & Collections step body. It runs the collections decision and the
 * cash application in one place:
 *  1. the dunning ladder (AI recommends a tier; any tier can be selected),
 *  2. the editable notice for the selected tier — review, edit, send,
 *  3. on send, a centered "Email received" popup announces the customer reply,
 *  4. the reply email is revealed, then the cash receipt auto-posts — filling
 *     the complete GL journal, AR sub-ledger and balance-sheet tables and
 *     clearing the open item.
 * A follow-up calendar stays available as a button. Self-contained state.
 */

function BlockLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Sparkles size={13} className="text-surface-deep" />
      <span className="text-[11px] uppercase tracking-[0.08em] text-surface-deep font-bold">
        {children}
      </span>
    </div>
  );
}

export function PaymentCollectionsWorkspace() {
  const [tier, setTier] = React.useState(dunningRecommended);
  const active = dunningTiers.find((t) => t.n === tier)!;
  const [subject, setSubject] = React.useState(active.subject);
  const [body, setBody] = React.useState(active.lines.join("\n\n"));
  const [sent, setSent] = React.useState(false);
  // The reply round-trip: a popup announces it, then the reply + posting reveal.
  const [emailReceivedOpen, setEmailReceivedOpen] = React.useState(false);
  const [replyShown, setReplyShown] = React.useState(false);
  const [followUpOpen, setFollowUpOpen] = React.useState(false);
  const [followUp, setFollowUp] = React.useState<string | null>(null);

  const selectTier = (n: number) => {
    if (sent) return;
    const t = dunningTiers.find((x) => x.n === n);
    if (!t) return;
    setTier(n);
    setSubject(t.subject);
    setBody(t.lines.join("\n\n"));
  };

  const send = () => {
    if (sent) return;
    setSent(true);
    setEmailReceivedOpen(true);
  };

  const viewReply = () => {
    setEmailReceivedOpen(false);
    setReplyShown(true);
  };

  return (
    <div className="space-y-5">
      {/* 1 · Collections — dunning ladder */}
      <div>
        <BlockLabel>Collections · choose the escalation</BlockLabel>
        <DunningLadder
          tiers={dunningTiers}
          recommended={dunningRecommended}
          selected={tier}
          contract={dunningContract}
          onSelect={selectTier}
        />
      </div>

      {/* 2 · Editable notice for the selected tier */}
      <article className="bg-white border border-divider rounded-md overflow-hidden">
        <header className="flex items-center gap-2 px-4 py-2.5 border-b border-divider border-l-[3px] border-l-[#0a6ed1] bg-[#0a6ed1]/[0.05]">
          <Sparkles size={13} className="text-[#0a6ed1] shrink-0" />
          <span className="text-[11px] uppercase tracking-[0.07em] font-bold text-[#0a6ed1]">
            {sent ? "Notice sent by the agent" : `AI-drafted notice · Tier ${active.n} · ${active.name} · editable`}
          </span>
        </header>

        <div className="px-4 py-3 space-y-2.5">
          <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-x-2 gap-y-2 items-center text-[12.5px]">
            <span className="text-mute">To</span>
            <span className="text-ink font-medium">{dunningTo}</span>
            <span className="text-mute">Subject</span>
            {sent ? (
              <span className="text-ink font-medium">{subject}</span>
            ) : (
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded border border-[#dfe3e8] bg-[#f4f6f9] px-2.5 py-1.5 text-[12.5px] text-ink focus:outline-none focus:border-[#0a6ed1] focus:bg-white"
              />
            )}
          </div>
          <div className="border-t border-divider pt-2.5">
            {sent ? (
              <div className="space-y-2">
                {body.split("\n\n").map((p, i) => (
                  <p key={i} className="text-[12.5px] text-ink leading-relaxed">{p}</p>
                ))}
              </div>
            ) : (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                className="w-full rounded border border-[#dfe3e8] bg-[#f4f6f9] px-3 py-2 text-[12.5px] text-ink leading-relaxed resize-y focus:outline-none focus:border-[#0a6ed1] focus:bg-white"
              />
            )}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-divider flex items-center gap-3">
          {!sent ? (
            <button
              type="button"
              onClick={send}
              className="ui-pill inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold bg-[#0a6ed1] text-white hover:bg-[#085bb0]"
            >
              <CornerUpRight size={14} /> Send the {active.name.toLowerCase()}
            </button>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#107e3e]">
                <Check size={14} strokeWidth={3} /> Sent · logged to the account
              </span>
              {followUp ? (
                <span className="ml-auto inline-flex items-center gap-1.5 text-[12px] font-medium text-surface-deep">
                  <CalendarCheck size={14} /> Follow-up set · {followUp}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setFollowUpOpen(true)}
                  className="ui-pill ml-auto inline-flex items-center gap-1.5 text-[12px] font-medium text-surface-deep hover:underline"
                >
                  <CalendarCheck size={14} /> Schedule a follow-up
                </button>
              )}
            </>
          )}
        </div>
      </article>

      {/* 3 · Customer reply revealed (after the popup) → cash receipt auto-posts */}
      {replyShown && (
        <SpringIn className="space-y-4">
          <div>
            <BlockLabel>Reply received</BlockLabel>
            <div className="flex items-center gap-1.5 text-[12px] text-mute mb-2">
              <Mail size={13} className="text-[#0a6ed1]" /> BlueRidge confirmed payment scheduled for value today.
            </div>
            <EmailDoc
              from="BlueRidge Foods · AP"
              fromAddr="ap@blueridgefoods.com"
              to="Northgate Paper · Collections"
              sent="2026-06-09 · 11:02"
              subject="RE: FINAL NOTICE — INV-90357 · payment today"
              tone="inbound"
              lines={[
                "Understood — we've scheduled an ACH payment of $208,400.00 for value today, reference BRF-PAY-5571.",
                "Apologies again for the delay; please hold off on the credit suspension.",
              ]}
            />
          </div>

          <div>
            <BlockLabel>Settle &amp; post · cash receipt</BlockLabel>
            <PaymentPostingDoc />
          </div>
        </SpringIn>
      )}

      {emailReceivedOpen && <EmailReceivedModal onView={viewReply} />}

      {followUpOpen && (
        <FollowUpModal
          onSave={(label) => setFollowUp(label)}
          onClose={() => setFollowUpOpen(false)}
        />
      )}
    </div>
  );
}
