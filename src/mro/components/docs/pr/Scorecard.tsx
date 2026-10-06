/**
 * A validation result that reads like a finding, not a form.
 *
 * The ERP screens in these runs are copies of real documents, and they should
 * look it. A validation is not a document — it is what an agent concluded
 * after reading several. So it gets its own shape: the question it asked, the
 * evidence that answered it, and one sentence saying what that means.
 */

import { Check, X, Sparkles } from "lucide-react";
import { cn } from "@/mro/lib/utils";

export type ScorecardData = {
  number: string;
  docType: string;
  createdBy: string;
  createdOn: string;
  checks: { label: string; detail: string; ok: boolean }[];
  verdict: string;
};

export function ScorecardDoc({ d }: { d: ScorecardData }) {
  const passed = d.checks.filter((c) => c.ok).length;
  return (
    <div className="overflow-hidden rounded-md border border-divider bg-white">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-divider bg-surface-deep px-4 py-3 text-ink-inverse">
        <span className="text-[15px] font-bold">{d.number}</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.05em]",
            passed === d.checks.length
              ? "bg-surface-mint text-surface-deep"
              : "bg-surface-rose text-mark-red",
          )}
        >
          {passed} of {d.checks.length} clear
        </span>
        <span className="text-[11.5px] opacity-80">{d.docType}</span>
        <span className="ml-auto text-right text-[11px] leading-tight opacity-80">
          {d.createdOn}
          <br />
          by {d.createdBy}
        </span>
      </header>

      <ul className="divide-y divide-divider">
        {d.checks.map((c) => (
          <li key={c.label} className="flex items-start gap-3 px-4 py-3">
            <span
              className={cn(
                "mt-[1px] grid h-5 w-5 shrink-0 place-items-center rounded-full",
                c.ok ? "bg-surface-mint text-surface-deep" : "bg-surface-rose text-mark-red",
              )}
            >
              {c.ok ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-medium leading-tight text-ink">{c.label}</span>
              <span className="mt-0.5 block text-[12px] leading-[17px] text-ink">{c.detail}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-start gap-2 border-t border-divider bg-surface-mint/25 px-4 py-3">
        <Sparkles size={13} className="mt-[2px] shrink-0 text-surface-deep" />
        <p className="text-[12.5px] leading-[18px] text-ink">{d.verdict}</p>
      </div>
    </div>
  );
}
