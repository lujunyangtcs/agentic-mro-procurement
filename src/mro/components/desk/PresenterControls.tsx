/**
 * Presenter drawer, opened from the "Presenter controls" label. It changes who
 * is reviewing, the demo clock and injected failures — all through domain
 * commands — and can launch or reset stories. It never decides anything.
 */

import * as React from "react";
import { X, Clock, RotateCcw, History } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { useApp, type FlowId } from "@/mro/state";
import { useProcurement } from "@/mro/data/store";
import { resetLedger } from "@/mro/services/demoLedger";
import { londonDateTime } from "@/mro/domain/clock";
import { useDeskCopy } from "@/mro/components/desk/copy";
import { REVIEW_ROLES } from "@/mro/components/desk/personas";
import { useWorkQueue } from "@/mro/components/desk/workQueue";
import type { Role } from "@/mro/domain/types";

const LEGACY: FlowId[] = ["catalogue", "bearing", "pump", "gearbox", "risk", "compliance", "onboarding", "off-catalogue"];

const STEPS: { label: string; minutes: number }[] = [
  { label: "+1h", minutes: 60 },
  { label: "+24h", minutes: 24 * 60 },
  { label: "+48h", minutes: 48 * 60 },
  { label: "+72h", minutes: 72 * 60 },
  { label: "+5d", minutes: 5 * 24 * 60 },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 border-b border-divider px-5 py-4 last:border-0">
      <h3 className="text-[12px] font-bold uppercase tracking-[0.06em] text-mute">{title}</h3>
      {children}
    </section>
  );
}

export function PresenterControls({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { go } = useApp();
  const { domain, dispatch, session, setSession, reset, lang, setLang } = useProcurement();
  const { d, role } = useDeskCopy();
  const { approvals } = useWorkQueue();
  const [confirm, setConfirm] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const pending = (r: Role) => approvals.filter((a) => a.role === r).length;
  const roles = [...REVIEW_ROLES].sort((a, b) => Number(pending(b) > 0) - Number(pending(a) > 0));
  const orchestrator = { kind: "agent" as const, agentId: "orchestrator" as const, policyVersion: domain.policies.active };

  const advance = (minutes: number) =>
    dispatch({ type: "clock.advance", actor: orchestrator, minutes, idempotencyKey: `presenter:clock:${domain.clock.now}:${minutes}` });

  const doReset = () => {
    const keep = lang;
    reset();
    resetLedger();
    setLang(keep);
    setConfirm(false);
    onClose();
    go({ kind: "cockpit" });
  };

  return (
    <div className="fixed inset-0 z-[80] flex justify-end" role="dialog" aria-modal="true" aria-labelledby="presenter-title">
      <button type="button" aria-label={d.close} onClick={onClose} className="absolute inset-0 bg-ink/30" />
      <aside className="relative flex h-full w-[400px] max-w-full flex-col overflow-y-auto bg-white shadow-xl">
        <header className="sticky top-0 z-10 flex items-start gap-3 border-b border-divider bg-white px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 id="presenter-title" className="text-[16px] font-bold text-ink">
              {d.presenter}
            </h2>
            <p className="text-[12.5px] leading-[17px] text-mute">{d.presenterLead}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={d.close} className="ui-pill grid h-8 w-8 place-items-center rounded-md text-ink hover:bg-surface-fog">
            <X size={16} />
          </button>
        </header>

        <Section title={d.reviewAs}>
          <div className="flex flex-col gap-1">
            {roles.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={session.reviewAs === r}
                onClick={() => setSession({ reviewAs: r })}
                className={cn(
                  "ui-pill flex items-center gap-2 rounded-md px-3 py-1.5 text-left text-[13px]",
                  session.reviewAs === r ? "bg-surface-mint font-medium text-surface-deep" : "text-ink hover:bg-surface-fog",
                )}
              >
                <span className="min-w-0 flex-1 truncate">{role(r)}</span>
                {pending(r) > 0 && <span className="shrink-0 bg-surface-amber px-2 py-0.5 text-[11.5px] font-bold text-mark-amber">{d.pendingFor(pending(r))}</span>}
              </button>
            ))}
          </div>
        </Section>

        <Section title={d.advance}>
          <p className="flex items-center gap-2 text-[13px] text-ink">
            <Clock size={14} className="text-surface-deep" aria-hidden />
            {londonDateTime(domain.clock.now, lang)}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {STEPS.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => advance(s.minutes)}
                className="ui-pill whitespace-nowrap rounded-md border border-divider bg-white px-3 py-1.5 text-[13px] font-medium text-ink hover:bg-surface-fog active:translate-y-px"
              >
                {s.label}
              </button>
            ))}
          </div>
        </Section>

        <Section title={d.failures}>
          <label className="flex items-center gap-2.5 text-[13px] text-ink">
            <input
              type="checkbox"
              checked={domain.failures.erpPo > 0}
              onChange={(e) => dispatch({ type: "failures.set", actor: orchestrator, erpPo: e.target.checked ? 3 : 0, idempotencyKey: `presenter:erp:${Date.now()}` })}
              className="h-4 w-4 accent-[var(--surface-deep)]"
            />
            {d.erpFail}
          </label>
          <label className="flex items-center gap-2.5 text-[13px] text-ink">
            <input
              type="checkbox"
              checked={domain.failures.supplierSilent}
              onChange={(e) => dispatch({ type: "failures.set", actor: orchestrator, supplierSilent: e.target.checked, idempotencyKey: `presenter:silent:${Date.now()}` })}
              className="h-4 w-4 accent-[var(--surface-deep)]"
            />
            {d.supplierSilent}
          </label>
        </Section>

        <Section title={d.legacy}>
          <div className="flex flex-wrap gap-1.5">
            {LEGACY.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  onClose();
                  go({ kind: "workspace", flow: f });
                }}
                className="ui-pill inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-divider px-2.5 py-1 text-[12.5px] text-mute hover:bg-surface-fog hover:text-ink"
              >
                <History size={12} aria-hidden />
                {f}
              </button>
            ))}
          </div>
        </Section>

        <Section title={d.reset}>
          {confirm ? (
            <div className="flex flex-col gap-2 rounded-md bg-surface-rose/60 p-3">
              <p className="text-[13px] text-ink">{d.resetConfirm}</p>
              <div className="flex gap-2">
                <button type="button" onClick={doReset} className="ui-pill whitespace-nowrap rounded-md bg-mark-red px-3 py-1.5 text-[13px] font-medium text-ink-inverse">
                  {d.resetYes}
                </button>
                <button type="button" onClick={() => setConfirm(false)} className="ui-pill whitespace-nowrap rounded-md border border-divider bg-white px-3 py-1.5 text-[13px] text-ink">
                  {d.cancel}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirm(true)}
              className="ui-pill inline-flex w-fit items-center gap-2 whitespace-nowrap rounded-md border border-divider px-3 py-1.5 text-[13px] font-medium text-ink hover:bg-surface-fog"
            >
              <RotateCcw size={14} aria-hidden />
              {d.reset}
            </button>
          )}
        </Section>
      </aside>
    </div>
  );
}
