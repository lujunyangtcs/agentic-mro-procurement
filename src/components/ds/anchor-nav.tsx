import { cn } from "@/lib/utils";

/**
 * AnchorNav — in-page anchor navigation row.
 * Captured pattern (§18): inline text links separated by generous gap, 16px / 400,
 * sentence case, optional underline on active. Appears below sub-page hero on
 * our-company, careers, sustainability.
 */
export function AnchorNav({
  items,
  className,
}: {
  items: { label: string; href: string; active?: boolean }[];
  className?: string;
}) {
  return (
    <nav
      className={cn(
        "bg-white border-b border-[color:var(--divider)]",
        className
      )}
    >
      <div className="mx-auto max-w-[1456px] px-6 md:px-12 py-6 flex flex-wrap items-center gap-x-10 gap-y-3 text-[16px]">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "transition-colors hover:text-[color:var(--accent-green)]",
              item.active ? "font-bold underline underline-offset-[6px] decoration-2" : "font-normal"
            )}
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
