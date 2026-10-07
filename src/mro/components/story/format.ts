import { FileText, ArrowRightLeft, Award } from "lucide-react";
import type { ChannelKind } from "@/mro/data/stories/runModel";

type Json = Record<string, unknown>;

const ACRONYMS: Record<string, string> = {
  po: "PO", rfq: "RFQ", id: "ID", gl: "GL", kpi: "KPI", sla: "SLA", pep: "PEP", cc: "CC",
  doa: "DoA", sam: "SAM", ip: "IP", vat: "VAT", pl: "PL", pi: "PI", mfa: "MFA", ppi: "PPI", yoy: "YoY",
};

/** `spend_avoided_gbp` → "Spend avoided"; the £ comes from the value. */
export function humanKey(key: string): string {
  const words = key
    .replace(/_(gbp|pct)$/, "")
    .replace(/^gbp$/, "value")
    .split("_")
    .map((w) => ACRONYMS[w] ?? w);
  const s = words.join(" ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const MONEY = /(_gbp$|^total$|^unit$|^unit_price$|price|day_rate|^gbp$)/;

export function formatValue(key: string, v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") {
    if (/_pct$/.test(key)) return `${v}%`;
    if (MONEY.test(key)) return `£${v.toLocaleString("en-GB")}`;
    return v.toLocaleString("en-GB");
  }
  if (typeof v === "string") {
    if (/^\d{4}-\d{2}-\d{2}T/.test(v)) {
      const d = new Date(v);
      const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Europe/London" });
      const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
      return `${date} ${time}`;
    }
    return v;
  }
  if (Array.isArray(v)) return v.map((x) => formatValue(key, x)).join(" · ");
  return Object.entries(v as Json)
    .map(([k, x]) => `${humanKey(k)} ${formatValue(k, x)}`)
    .join(" · ");
}

export type Tone = "ok" | "warn" | "bad" | "info" | "mute";

const TONES: Record<string, Tone> = {
  PASS: "ok", VALID: "ok", CLEAR: "ok", GREEN: "ok", Executed: "ok", TOUCHLESS: "ok", LOW: "ok",
  WARN: "warn", AMBER: "warn", GAP: "warn", MEDIUM: "warn", PENDING: "warn", HiTL: "warn",
  TRIPPED: "bad", RED: "bad", HIGH: "bad", HARD_CONSTRAINT: "bad",
  INFO: "info", RECEIVED: "info", "N/A": "mute",
};

export const toneOf = (v: string): Tone | undefined => TONES[v];

export const CHANNEL_ICON: Record<ChannelKind, typeof FileText> = {
  form: FileText,
  handoff: ArrowRightLeft,
  award: Award,
};

export const gbpWhole = (n: number) => `£${n.toLocaleString("en-GB")}`;
