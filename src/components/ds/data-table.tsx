import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * DataTable — captured pattern from Historical share price / Recent trades (§17).
 * White rows / black text / fog header / 1px row dividers / right-align numerics.
 */

export type Column<T> = {
  key: string;
  header: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  className?: string;
  width?: string;
  numeric?: boolean;
};

export function DataTable<T extends { id?: string | number }>({
  rows,
  columns,
  className,
}: {
  rows: T[];
  columns: Column<T>[];
  className?: string;
}) {
  return (
    <div className={cn("border border-[color:var(--divider)] bg-white overflow-x-auto", className)}>
      <table className="w-full border-collapse text-[14px]">
        <thead>
          <tr className="bg-[color:var(--surface-fog)] border-b border-[color:var(--divider)]">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  "px-4 py-3 text-left text-[14px] font-bold",
                  c.numeric && "text-right",
                  c.className
                )}
                style={c.width ? { width: c.width } : undefined}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id ?? i}
              className="border-b border-[color:var(--divider)] last:border-0"
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    "px-4 py-3",
                    c.numeric && "text-right tabular-nums",
                    c.className
                  )}
                >
                  {c.render
                    ? c.render(row)
                    : (row as Record<string, React.ReactNode>)[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
