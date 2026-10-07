import { ArrowRight } from "lucide-react";
import { useApp } from "@/mro/state";
import { useDeskCopy } from "@/mro/components/desk/copy";
import { useWorkQueue } from "@/mro/components/desk/workQueue";
import { Chip } from "@/mro/components/desk/ui";

/** Holds on live domain and story cases, shown above the legacy exception board. */
export function LiveHoldsPanel() {
  const { go } = useApp();
  const { d, role } = useDeskCopy();
  const { exceptions, approvals } = useWorkQueue();
  const rows = [
    ...exceptions.map((e) => ({ key: e.key, ref: e.ref, text: e.reason, role: e.role, open: e.open })),
    ...approvals.map((a) => ({ key: a.key, ref: a.ref, text: a.task, role: a.role, open: a.open })),
  ];
  return (
    <section className="overflow-hidden rounded-md border border-divider bg-white">
      <header className="flex items-center gap-2 px-4 pb-2.5 pt-3.5">
        <h2 className="min-w-0 flex-1 text-[15px] font-bold text-ink">{d.qExceptions}</h2>
        <span className="rounded-full bg-surface-fog px-2 py-0.5 text-[12px] font-bold text-ink">{rows.length}</span>
      </header>
      {rows.length === 0 ? (
        <p className="border-t border-divider px-4 py-5 text-center text-[13px] text-mute">{d.qEmptyExceptions}</p>
      ) : (
        <ul className="divide-y divide-divider border-t border-divider">
          {rows.map((r) => (
            <li key={r.key}>
              <button type="button" onClick={() => go(r.open)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-fog">
                <span className="w-[150px] shrink-0 text-[13px] font-bold text-ink">{r.ref}</span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-ink" title={r.text}>
                  {r.text}
                </span>
                <Chip tone="warn">{role(r.role)}</Chip>
                <ArrowRight size={13} className="shrink-0 text-mute" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
