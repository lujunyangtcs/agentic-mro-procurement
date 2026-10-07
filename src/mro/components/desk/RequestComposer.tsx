/**
 * Flow 1 · 1.0 front door for free text. The parse preview shows exactly what
 * intake recognised; a missing field blocks submission and is named. A
 * submit always creates a case — submitting the same text again creates a
 * second case flagged as a possible duplicate, never a silent merge.
 */

import * as React from "react";
import { Send, Check, CircleHelp, Clock3 } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { useApp } from "@/mro/state";
import { useProcurement } from "@/mro/data/store";
import { draftFromParse, parseIntake, type FieldKey } from "@/mro/domain/intakeParser";
import { londonDateTime } from "@/mro/domain/clock";
import { gbp, lineTotal } from "@/mro/domain/money";
import { AGREEMENTS } from "@/mro/data/masterData";
import { submitRequest } from "@/mro/services/caseAutomation";
import { STANDING_MANDATE_ID } from "@/mro/domain/reducer";
import { useDeskCopy } from "@/mro/components/desk/copy";
import { ActionButton, Chip } from "@/mro/components/desk/ui";

const EXAMPLES = {
  ten: "Need 10 packs of 3M 6055 A2 filters for Halewood stores by 12 Oct.",
  big: "Need 120 packs of 3M 6055 A2 filters for Halewood stores by 12 Oct.",
  vague: "need some stuff for line 3",
};

export function RequestComposer() {
  const { go } = useApp();
  const { domain, dispatch, lang } = useProcurement();
  const { d, role } = useDeskCopy();
  const [text, setText] = React.useState(EXAMPLES.ten);
  const parsed = React.useMemo(() => parseIntake(text, domain.clock.now), [text, domain.clock.now]);
  const draft = draftFromParse(text, parsed);

  const agreement = parsed.material && AGREEMENTS.find((a) => a.lines.some((l) => l.material === parsed.material!.code));
  const unit = agreement?.lines.find((l) => l.material === parsed.material?.code)?.unitPrice ?? 0;
  const units = parsed.quantity ? (parsed.quantity.uom === "PACK" ? parsed.quantity.value * (parsed.material?.pack?.unitsPerPack ?? 1) : parsed.quantity.value) : 0;
  const estimate = lineTotal(unit, units);

  const submit = () => {
    if (!draft) return { ok: false, message: d.missingBlock(parsed.missing.map((m) => d.field[m]).join(", ")) };
    const r = submitRequest(dispatch, draft);
    if (!r.ok || !r.caseId) return { ok: false, message: r.ok ? "No case" : r.message };
    window.setTimeout(() => go({ kind: "case", caseId: r.caseId! }), 500);
    return { ok: true };
  };

  const value = (k: FieldKey, v?: string) => (k === "neededBy" && v ? londonDateTime(v, lang) : v);

  return (
    <section className="flex flex-col rounded-md border border-divider bg-white" aria-labelledby="compose-title">
      <header className="flex items-center gap-2 px-5 pb-2 pt-3.5">
        <h2 id="compose-title" className="text-[15px] font-bold leading-tight text-ink">
          {d.composeTitle}
        </h2>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="text-[12px] text-mute">{d.examples}</span>
          {(
            [
              ["ten", d.exTen],
              ["big", d.exBig],
              ["vague", d.exVague],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setText(EXAMPLES[k])}
              aria-pressed={text === EXAMPLES[k]}
              className={cn(
                "ui-pill whitespace-nowrap rounded-full border px-2.5 py-1 text-[12px] font-medium",
                text === EXAMPLES[k] ? "border-surface-deep bg-surface-mint text-surface-deep" : "border-divider bg-white text-ink hover:bg-surface-fog",
              )}
            >
              {label}
            </button>
          ))}
        </span>
      </header>
      <div className="grid grid-cols-1 gap-4 px-5 pb-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <label className="flex flex-col gap-1.5">
          <span className="sr-only">{d.composeTitle}</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder={d.composePlaceholder}
            className="min-h-[112px] resize-none rounded-md border border-divider bg-white px-3 py-2.5 text-[14px] leading-[21px] text-ink outline-none focus:border-surface-deep"
          />
        </label>
        <div className="flex flex-col gap-2 rounded-md bg-surface-fog/60 p-3">
          <h3 className="text-[12px] font-bold uppercase tracking-[0.05em] text-mute">{d.understood}</h3>
          <ul className="grid grid-cols-2 gap-2">
            {parsed.fields.map((f) => (
              <li key={f.key} className="flex min-w-0 items-start gap-2">
                <span
                  className={cn(
                    "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full",
                    f.state === "found" ? "bg-surface-mint text-surface-deep" : f.state === "assumed" ? "bg-surface-fog text-mute" : "bg-surface-amber text-mark-amber",
                  )}
                  aria-hidden
                >
                  {f.state === "found" ? <Check size={12} strokeWidth={3} /> : f.state === "assumed" ? <Clock3 size={12} /> : <CircleHelp size={12} />}
                </span>
                <span className="min-w-0">
                  <span className="block text-[12px] leading-[16px] text-mute">{d.field[f.key]}</span>
                  <span className={cn("block truncate text-[13px] font-medium leading-[18px]", f.state === "missing" ? "text-mark-amber" : "text-ink")}>
                    {f.state === "missing" ? d.missing : `${value(f.key, f.value)}${f.state === "assumed" ? ` · ${d.assumed}` : ""}`}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="border-t border-divider pt-2 text-[12.5px] leading-[17px] text-ink">
            {agreement && parsed.quantity ? (
              <>
                {d.catalogueMatch(agreement.id, `${gbp(unit * (parsed.material?.pack?.unitsPerPack ?? 1))} / pack`)}
                {" · "}
                <span className="font-bold tabular-nums">{gbp(estimate)}</span>
              </>
            ) : (
              <span className="text-mute">{d.noCatalogue}</span>
            )}
          </p>
        </div>
      </div>
      <footer className="flex flex-wrap items-center gap-3 border-t border-divider px-5 py-3">
        <p className="min-w-0 flex-1 text-[12.5px] leading-[17px] text-mute text-pretty">
          {draft ? (
            <>
              <Chip tone={estimate > domain.policies.versions[domain.policies.active].autoApproveLimit ? "warn" : "ok"}>
                {estimate > domain.policies.versions[domain.policies.active].autoApproveLimit ? role("budget-holder") : d.standing(STANDING_MANDATE_ID)}
              </Chip>{" "}
              {`${domain.policies.active} · auto-approve ≤ ${gbp(domain.policies.versions[domain.policies.active].autoApproveLimit)}`}
            </>
          ) : (
            d.missingBlock(parsed.missing.map((m) => d.field[m]).join(", "))
          )}
        </p>
        <ActionButton disabled={!draft} onAction={submit} icon={<Send size={14} aria-hidden />}>
          {d.submit}
        </ActionButton>
      </footer>
    </section>
  );
}
