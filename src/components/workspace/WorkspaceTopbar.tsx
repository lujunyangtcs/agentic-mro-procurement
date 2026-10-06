import { useApp } from "@/state";
import { StatusPill } from "@/components/blocks/StatusPill";

export function WorkspaceTopbar({
  title,
  sub,
  statusPill,
  statusKind = "ready",
}: {
  title: string;
  sub: string;
  statusPill: string;
  statusKind?: "ready" | "critical" | "progress";
}) {
  const { back } = useApp();
  const backLabel = "Back to cockpit";
  return (
    <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-divider">
      <div className="flex items-center gap-6 min-w-0">
        <button
          type="button"
          onClick={back}
          className="ui-pill text-[13px] text-ink hover:text-surface-deep flex items-center gap-1.5"
        >
          <span aria-hidden>←</span>
          {backLabel}
        </button>
        <span className="w-px h-5 bg-divider" />
        <div className="leading-tight min-w-0">
          <div className="text-[15px] font-bold text-ink truncate">{title}</div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-mute mt-0.5">{sub}</div>
        </div>
      </div>
      <StatusPill
        label={statusPill}
        kind={statusKind}
        pulse={statusKind !== "ready" || /Awaiting|Pick/.test(statusPill)}
      />
    </header>
  );
}
