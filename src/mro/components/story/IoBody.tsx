/**
 * Renders an agent's I/O body as readable records instead of raw JSON:
 * scalars become label/value rows, lists of records become tables, status
 * words become coloured chips. Keys are humanised from the I/O itself, so a
 * new field in the samples shows up without a code change.
 */

import { cn } from "@/mro/lib/utils";
import { humanKey, formatValue, toneOf, type Tone } from "@/mro/components/story/format";

type Json = Record<string, unknown>;

const TONE_CLASS: Record<Tone, string> = {
  ok: "bg-surface-mint text-surface-deep",
  warn: "bg-surface-amber text-mark-amber",
  bad: "bg-surface-red text-mark-red",
  info: "bg-[color-mix(in_srgb,var(--accent-navy)_10%,white)] text-surface-navy",
  mute: "bg-surface-fog text-mute",
};

export function ToneChip({ value, tone, className }: { value: string; tone?: Tone; className?: string }) {
  const t = tone ?? toneOf(value) ?? "mute";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-bold uppercase tracking-[0.04em]",
        TONE_CLASS[t],
        className,
      )}
    >
      {value}
    </span>
  );
}

function Value({ k, v }: { k: string; v: unknown }) {
  if (typeof v === "string" && toneOf(v)) return <ToneChip value={v} />;
  if (Array.isArray(v) && v.every((x) => typeof x !== "object" || x === null)) {
    if (v.length === 0) return <span className="text-mute">None</span>;
    const short = v.every((x) => String(x).length <= 34);
    return short ? (
      <span className="flex flex-wrap gap-1.5">
        {v.map((x) => (
          <span key={String(x)} className="rounded-md bg-surface-fog px-2 py-0.5 text-[12.5px] leading-[18px] text-ink">
            {formatValue(k, x)}
          </span>
        ))}
      </span>
    ) : (
      <ul className="flex flex-col gap-1">
        {v.map((x) => (
          <li key={String(x)} className="text-[13px] leading-[19px] text-ink">
            {formatValue(k, x)}
          </li>
        ))}
      </ul>
    );
  }
  return <span className="text-[13px] leading-[19px] text-ink text-pretty">{formatValue(k, v)}</span>;
}

const isRecordList = (v: unknown): v is Json[] =>
  Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "object" && x !== null && !Array.isArray(x));

const isPlainObject = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);

function RecordTable({ rows }: { rows: Json[] }) {
  const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  return (
    <div className="overflow-x-auto rounded-md border border-divider">
      <table className="w-full min-w-[480px] border-collapse text-left">
        <thead>
          <tr className="bg-surface-fog">
            {cols.map((c) => (
              <th key={c} scope="col" className="whitespace-nowrap px-3 py-2 text-[11.5px] font-bold uppercase tracking-[0.05em] text-mute">
                {humanKey(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-divider align-top">
              {cols.map((c) => (
                <td key={c} className="px-3 py-2">
                  {c in r ? <Value k={c} v={r[c]} /> : <span className="text-mute">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Rows({ obj }: { obj: Json }) {
  const scalars = Object.entries(obj).filter(([, v]) => !isRecordList(v) && !isPlainObject(v));
  const nested = Object.entries(obj).filter(([, v]) => isRecordList(v) || isPlainObject(v));
  return (
    <div className="flex flex-col gap-3">
      {scalars.length > 0 && (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {scalars.map(([k, v]) => (
            <div key={k} className="flex min-w-0 flex-col gap-0.5">
              <dt className="text-[12px] leading-[16px] text-mute">{humanKey(k)}</dt>
              <dd className="min-w-0">
                <Value k={k} v={v} />
              </dd>
            </div>
          ))}
        </dl>
      )}
      {nested.map(([k, v]) => (
        <div key={k} className="flex flex-col gap-2 rounded-md bg-surface-fog/60 p-3">
          <h5 className="text-[12px] font-bold uppercase tracking-[0.05em] text-mute">{humanKey(k)}</h5>
          {isRecordList(v) ? <RecordTable rows={v} /> : <Rows obj={v as Json} />}
        </div>
      ))}
    </div>
  );
}

/** One top-level section per key of the body. */
export function IoBody({ body, className }: { body: Json; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {Object.entries(body).map(([k, v]) => (
        <section key={k} className="flex flex-col gap-2">
          <h4 className="text-[13px] font-bold leading-[18px] text-ink">{humanKey(k)}</h4>
          {isRecordList(v) ? <RecordTable rows={v} /> : isPlainObject(v) ? <Rows obj={v} /> : <Value k={k} v={v} />}
        </section>
      ))}
    </div>
  );
}
