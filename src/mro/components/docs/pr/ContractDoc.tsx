/**
 * The agreement itself — the paper, not the ERP record of it.
 *
 * An ME33K screen tells you an agreement exists and what its header says. It
 * does not tell you what was signed. When an agent claims a price break is
 * available, or that a volume was committed, the honest thing to show is the
 * clause that says so — numbered, on the page it appears on, with the schedule
 * underneath and the signatures at the end.
 *
 * `mark` highlights the clauses and schedule rows the agent actually relied on,
 * so a reader can see which part of a fourteen-clause agreement the
 * recommendation rests on.
 */

import { cn } from "@/mro/lib/utils";

export type ContractData = {
  reference: string;
  title: string;
  /** "Orvantec" and the supplier, with the capacity each signs in. */
  parties: { role: string; name: string; detail: string }[];
  effective: string;
  expires: string;
  /** Numbered clauses, in the order they appear on the page. */
  clauses: { n: string; heading: string; body: string; mark?: boolean }[];
  schedules: {
    label: string;
    title: string;
    columns: string[];
    rows: { cells: string[]; mark?: boolean }[];
    note?: string;
  }[];
  signatures: { forParty: string; name: string; title: string; signedOn: string }[];
};

export function ContractDoc({ d }: { d: ContractData }) {
  return (
    <div className="mx-auto max-w-[760px] rounded-[3px] border border-[#d8d8d0] bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)]">
      {/* Letterhead */}
      <div className="border-b-2 border-ink px-10 pb-5 pt-8">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-[13px] font-bold uppercase tracking-[0.18em] text-ink">Orvantec</span>
          <span className="text-[11px] uppercase tracking-[0.1em] text-mute">
            {d.reference}
          </span>
        </div>
        <h1 className="mt-4 text-[19px] font-bold leading-tight tracking-[-0.01em] text-ink">
          {d.title}
        </h1>
        <p className="mt-1 text-[12px] text-ink">
          Effective {d.effective} · expiring {d.expires}
        </p>
      </div>

      <div className="px-10 py-7 text-ink">
        {/* The parties */}
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-mute">Between</p>
        <div className="mt-2 space-y-2.5">
          {d.parties.map((p) => (
            <div key={p.role} className="text-[12.5px] leading-[18px]">
              <span className="font-bold">{p.name}</span>
              <span className="text-mute"> · {p.role}</span>
              <br />
              <span>{p.detail}</span>
            </div>
          ))}
        </div>

        {/* The clauses */}
        <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.12em] text-mute">
          Terms of agreement
        </p>
        <ol className="mt-2.5 space-y-3">
          {d.clauses.map((c) => (
            <li
              key={c.n}
              className={cn(
                "flex gap-3 rounded-[2px] px-2 py-1.5 -mx-2",
                c.mark && "bg-[#fdf3cf]",
              )}
            >
              <span className="w-8 shrink-0 text-[12px] font-bold tabular-nums text-ink">{c.n}</span>
              <span className="min-w-0">
                <span className="text-[12.5px] font-bold text-ink">{c.heading}. </span>
                <span className="text-[12.5px] leading-[19px] text-ink">{c.body}</span>
              </span>
            </li>
          ))}
        </ol>

        {/* The schedules the clauses point at */}
        {d.schedules.map((s) => (
          <div key={s.label} className="mt-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-mute">
              {s.label} — {s.title}
            </p>
            <table className="mt-2 w-full border-collapse text-[12px]">
              <thead>
                <tr>
                  {s.columns.map((c) => (
                    <th
                      key={c}
                      className="border-b border-ink px-2 py-1.5 text-left font-bold text-ink"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.rows.map((r, i) => (
                  <tr key={i} className={cn(r.mark && "bg-[#fdf3cf]")}>
                    {r.cells.map((cell, j) => (
                      <td
                        key={j}
                        className={cn(
                          "border-b border-[#e4e4dc] px-2 py-1.5 text-ink",
                          j > 0 && "tabular-nums",
                          r.mark && "font-bold",
                        )}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {s.note && <p className="mt-1.5 text-[11.5px] leading-snug text-mute">{s.note}</p>}
          </div>
        ))}

        {/* Executed by */}
        <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.12em] text-mute">
          Executed by the parties
        </p>
        <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {d.signatures.map((sig) => (
            <div key={sig.forParty}>
              <div
                className="h-9 border-b border-ink pb-1 text-[17px] leading-9 text-ink"
                style={{ fontFamily: "'Snell Roundhand', 'Apple Chancery', cursive" }}
              >
                {sig.name}
              </div>
              <p className="mt-1.5 text-[11.5px] leading-tight text-ink">
                <span className="font-bold">{sig.name}</span>
                <br />
                {sig.title}
                <br />
                <span className="text-mute">
                  for {sig.forParty} · {sig.signedOn}
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
