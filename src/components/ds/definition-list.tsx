import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * DefinitionList — 2-col label/value grid (§17, "ISIN | CH1216478797" pattern).
 */
export function DefinitionList({
  items,
  columns = 1,
  className,
}: {
  items: { label: React.ReactNode; value: React.ReactNode; valueClassName?: string }[];
  columns?: 1 | 2;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "border border-[color:var(--divider)] bg-white divide-y divide-[color:var(--divider)]",
        columns === 2 && "md:grid md:grid-cols-2 md:divide-y-0 md:divide-x",
        className
      )}
    >
      {items.map((item, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_1fr] gap-4 px-4 py-3 border-b border-[color:var(--divider)] last:border-0"
        >
          <dt className="text-[14px] font-normal">{item.label}</dt>
          <dd className={cn("text-[14px] font-normal text-right tabular-nums", item.valueClassName)}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
