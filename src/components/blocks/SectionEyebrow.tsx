import { cn } from "@/lib/utils";
import { AIDot } from "@/components/ai/AIDot";

type Props = {
  title: string;
  sub?: string;
  rightBadge?: React.ReactNode;
  className?: string;
};

/**
 * Caps section divider used between major content blocks on the dashboard
 * and inside workspaces. Mirrors the procurement reference's section style.
 */
export function SectionEyebrow({ title, sub, rightBadge, className }: Props) {
  return (
    <div className={cn("flex items-center justify-between gap-4 pt-2", className)}>
      <div className="flex items-center gap-2.5">
        <AIDot size={6} tone="deep" />
        <span className="text-[12px] font-medium tracking-[0.08em] uppercase text-surface-deep">
          {title}
        </span>
        {sub && <span className="text-[13px] text-mute ml-2">{sub}</span>}
      </div>
      {rightBadge}
    </div>
  );
}
