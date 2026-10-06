import { cn } from "@/lib/utils";
import { AIDot } from "@/components/ai/AIDot";

type Props = {
  searchPlaceholder?: string;
  breadcrumb: { label: string; chip?: string };
  className?: string;
};

/**
 * Search bar + breadcrumb that sits above the cockpit canvas. Search is
 * inline with content rather than in a separate topbar.
 */
export function TopRow({
  searchPlaceholder = "Search requisitions, orders, suppliers…",
  breadcrumb,
  className,
}: Props) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="px-4 py-2 rounded-full bg-white border border-divider text-[14px] text-mute w-[420px] max-w-full">
        <span className="mr-2">🔍</span>
        {searchPlaceholder}
      </div>
      <div className="flex items-center gap-3 text-[13px]">
        <span className="text-mute">{breadcrumb.label}</span>
        {breadcrumb.chip && (
          <>
            <span className="w-px h-4 bg-divider" />
            <span className="px-2.5 py-1 rounded-full bg-surface-fog text-ink text-[11px] font-medium tracking-[0.08em] uppercase">
              {breadcrumb.chip}
            </span>
          </>
        )}
        <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-divider">
          <AIDot size={6} tone="green" pulse />
          <span className="text-[12px] text-ink">6 agents live</span>
        </span>
      </div>
    </div>
  );
}
