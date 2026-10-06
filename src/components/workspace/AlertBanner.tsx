import { AIDot } from "@/components/ai/AIDot";

export function AlertBanner({ title, sub }: { title: string; sub: string }) {
  return (
    <section className="bg-surface-deep text-ink-inverse rounded-md px-5 py-4 flex items-start gap-3">
      <AIDot size={8} tone="mint" pulse className="mt-1" />
      <div className="leading-tight">
        <div className="text-[15px] font-bold text-ink-inverse">{title}</div>
        <div className="text-[13px] text-surface-mint mt-1">{sub}</div>
      </div>
    </section>
  );
}
