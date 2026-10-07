/**
 * Flow 1 · 1.0 free-text intake for catalogue items. Recognises only seeded,
 * intake-enabled materials, the UK sites, a quantity with its unit and a
 * need-by date. Anything it cannot recognise is reported as missing and the
 * request cannot be submitted — the original text is always kept, and no SKU
 * is ever guessed from vague wording.
 */

import type { IsoTime, SiteId, Uom } from "@/mro/domain/types";
import type { RequestDraft } from "@/mro/domain/commands";
import { MATERIALS, SITES } from "@/mro/data/masterData";
import { AGREEMENTS } from "@/mro/data/masterData";
import { catalogueSignals, INTAKE_MODEL } from "@/mro/data/storyFixtures";
import { addHours } from "@/mro/domain/clock";

export type FieldKey = "material" | "quantity" | "site" | "neededBy";

export type ParsedField = { key: FieldKey; value?: string; state: "found" | "missing" | "assumed" };

export type ParseResult = {
  fields: ParsedField[];
  missing: FieldKey[];
  material?: (typeof MATERIALS)[number];
  quantity?: { value: number; uom: Uom };
  site?: SiteId;
  neededBy?: IsoTime;
};

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function parseDate(text: string, now: IsoTime): IsoTime | undefined {
  const m = text.match(/\b(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i);
  if (!m) return undefined;
  const day = Number(m[1]);
  const month = MONTHS.indexOf(m[2].toLowerCase());
  const year = new Date(now).getUTCFullYear();
  /* 17:00 London in October is 16:00 UTC. */
  const iso = new Date(Date.UTC(year, month, day, 16, 0, 0)).toISOString();
  return Number.isNaN(Date.parse(iso)) ? undefined : iso;
}

export function parseIntake(text: string, now: IsoTime): ParseResult {
  const lower = text.toLowerCase();

  const material = MATERIALS.find((m) => m.intake && m.aliases?.some((a) => lower.includes(a)));

  let quantity: ParseResult["quantity"];
  const q = lower.match(/\b(\d{1,5})\s*(packs?|pks?|boxes?|pairs?|prs?)\b/);
  if (q) quantity = { value: Number(q[1]), uom: /^p(air|r)/.test(q[2]) ? "PAIR" : "PACK" };

  const site = SITES.find((s) => lower.includes(s.name.toLowerCase()))?.id;
  const parsedDate = parseDate(text, now);
  const neededBy = parsedDate ?? addHours(now, 24 * 5);

  const fields: ParsedField[] = [
    { key: "material", value: material?.description, state: material ? "found" : "missing" },
    {
      key: "quantity",
      value: quantity ? `${quantity.value} ${quantity.uom === "PACK" ? "packs" : "pairs"}` : undefined,
      state: quantity ? "found" : "missing",
    },
    { key: "site", value: site ? SITES.find((s) => s.id === site)?.name : undefined, state: site ? "found" : "missing" },
    { key: "neededBy", value: neededBy, state: parsedDate ? "found" : "assumed" },
  ];

  return {
    fields,
    missing: fields.filter((f) => f.state === "missing").map((f) => f.key),
    material,
    quantity,
    site,
    neededBy,
  };
}

/** A submittable draft, only when nothing mandatory is missing. */
export function draftFromParse(text: string, p: ParseResult, channel: RequestDraft["channel"] = "form"): RequestDraft | undefined {
  if (p.missing.length > 0 || !p.material || !p.quantity || !p.site || !p.neededBy) return undefined;
  const agreement = AGREEMENTS.find((a) => a.lines.some((l) => l.material === p.material!.code && l.sites.includes(p.site!)));
  const siteRec = SITES.find((s) => s.id === p.site)!;
  return {
    requester: `${siteRec.name} stores controller`,
    channel,
    originalText: text,
    site: p.site,
    costCentre: siteRec.costCentre,
    glCode: p.material.glCode,
    purpose: "Stores replenishment, respiratory filter cartridges",
    urgency: "normal",
    agreementId: agreement?.id,
    supplierId: agreement?.supplierId,
    lines: [{ material: p.material.code, quantity: p.quantity.value, uom: p.quantity.uom, neededBy: p.neededBy }],
    pattern: agreement ? "catalogue-call-off" : "free-text",
    signals: catalogueSignals(),
    model: INTAKE_MODEL,
    budgetRef: `BUD-${siteRec.costCentre.replace(/^CC-/, "CC")}-FY27`,
  };
}
