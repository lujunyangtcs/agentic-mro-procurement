/**
 * Source-system logos — shown on the RIGHT of a source file's header bar so the
 * reviewer can see, at a glance, which system each input came from (SAP, the
 * bank lockbox, the carrier, the scale house, Outlook…).
 *
 * Brand marks (SAP, Outlook, Gmail) are the REAL logos served from /public/logos.
 * Non-brand systems (bank, carrier, scale, EDI) use a tinted icon tile. To swap a
 * brand asset, drop a new SVG/PNG into public/logos and update the path below.
 */

import { FileCode2 } from "lucide-react";
import type { SourceKind } from "@/o2c/data/runSteps";

export type SourceSystem =
  | "sap"
  | "outlook"
  | "gmail"
  | "appzen"
  | "edi"
  | "bank"
  | "carrier"
  | "scale";

/** Resolve a source's system from an explicit field, falling back to its kind. */
const KIND_TO_SYSTEM: Record<SourceKind, SourceSystem> = {
  sap: "sap",
  invoice: "sap",
  master: "sap",
  contract: "sap",
  policy: "sap",
  budget: "sap",
  external: "sap",
  kb: "sap",
  email: "outlook",
  edi: "edi",
};

export function resolveSystem(kind: SourceKind, system?: SourceSystem): SourceSystem {
  return system ?? KIND_TO_SYSTEM[kind] ?? "edi";
}

/* ── Real brand logos (served from /public/logos) ────────────────────────── */

const BRAND: Partial<Record<SourceSystem, { src: string; label: string }>> = {
  sap: { src: "/logos/sap.svg", label: "SAP" },
  outlook: { src: "/logos/outlook.svg", label: "Outlook" },
  gmail: { src: "/logos/gmail.svg", label: "Gmail" },
  carrier: { src: "/logos/ups.svg", label: "UPS" },
  scale: { src: "/logos/mettler.svg", label: "Mettler Toledo" },
  bank: { src: "/logos/wellsfargo.svg", label: "Wells Fargo" },
  // appzen: drop a /public/logos/appzen.svg and add it here to enable.
};

function BrandImg({ src, label }: { src: string; label: string }) {
  return (
    <img
      src={src}
      alt={label}
      title={`Source · ${label}`}
      draggable={false}
      className="h-5 w-auto shrink-0 select-none"
    />
  );
}

/* ── Non-brand systems (icon tiles) ──────────────────────────────────────── */

function IconTile({ Icon, bg, label }: { Icon: typeof FileCode2; bg: string; label: string }) {
  return (
    <span
      title={`Source · ${label}`}
      className="inline-flex items-center justify-center rounded-[5px] text-white shrink-0 h-5 w-5"
      style={{ background: bg }}
    >
      <Icon size={13} strokeWidth={2} />
    </span>
  );
}

/* ── Dispatcher ──────────────────────────────────────────────────────────── */

/** Renders a source's system logo at a consistent ~20px height. */
export function SourceLogo({ system, kind }: { system?: SourceSystem; kind?: SourceKind }) {
  const s = system ?? (kind ? KIND_TO_SYSTEM[kind] : undefined) ?? "edi";
  const brand = BRAND[s];
  if (brand) return <BrandImg src={brand.src} label={brand.label} />;
  // Only generic EDI / X12 sources fall through to an icon tile.
  return <IconTile Icon={FileCode2} bg="#475569" label="EDI / X12" />;
}
