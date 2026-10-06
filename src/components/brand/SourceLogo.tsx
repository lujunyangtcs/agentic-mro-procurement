/**
 * Source-system logos for the Procure-to-Pay flow — shown on the RIGHT of a
 * source file's header bar so the buyer can see which system each input came
 * from. Brand marks (SAP, Outlook) are the real logos served from /public/logos;
 * a generic EDI/X12 file falls back to a tinted icon tile. Resolves the system
 * from the source's `kind` (sap/contract/policy/budget/master/invoice → SAP,
 * email → Outlook), or an explicit `system` override.
 */

import { FileCode2 } from "lucide-react";
import type { SourceKind } from "@/data/runSteps";

export type SourceSystem = "sap" | "outlook" | "gmail" | "edi";

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

const BRAND: Partial<Record<SourceSystem, { src: string; label: string }>> = {
  sap: { src: "/logos/sap.svg", label: "SAP" },
  outlook: { src: "/logos/outlook.svg", label: "Outlook" },
  gmail: { src: "/logos/gmail.svg", label: "Gmail" },
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

/** Renders a source's system logo at a consistent ~20px height. */
export function SourceLogo({ system, kind }: { system?: SourceSystem; kind?: SourceKind }) {
  const s = system ?? (kind ? KIND_TO_SYSTEM[kind] : undefined) ?? "edi";
  const brand = BRAND[s];
  if (brand) return <BrandImg src={brand.src} label={brand.label} />;
  return (
    <span
      title="Source · EDI / X12"
      className="inline-flex h-5 w-5 items-center justify-center rounded-[5px] text-white shrink-0"
      style={{ background: "#475569" }}
    >
      <FileCode2 size={13} strokeWidth={2} />
    </span>
  );
}
