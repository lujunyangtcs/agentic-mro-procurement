/**
 * Source-system logos for the MRO flows — shown on the RIGHT of a source file's
 * header bar so the buyer can see which system each input came from. Brand marks
 * (SAP, Outlook) are the real logos served from /public/logos; a generic EDI/X12
 * file falls back to a tinted icon tile. Resolves the system from the source's
 * `kind` (sap/contract/policy/budget/master/invoice → SAP, email → Outlook), or
 * an explicit `system` override.
 */

import * as React from "react";
import { FileCode2 } from "lucide-react";
import type { SourceKind } from "@/mro/data/runSteps";

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

const BRAND: Partial<Record<SourceSystem, { src: string; label: string; tint: string }>> = {
  sap: { src: "/logos/sap.svg", label: "SAP", tint: "#0a6ed1" },
  outlook: { src: "/logos/outlook.svg", label: "Outlook", tint: "#0078d4" },
  gmail: { src: "/logos/gmail.svg", label: "Gmail", tint: "#ea4335" },
};

function BrandImg({ src, label, tint }: { src: string; label: string; tint: string }) {
  // If the SVG ever fails to load (cache miss, asset hiccup), fall back to a clean
  // branded text chip rather than the browser's broken-image placeholder.
  const [failed, setFailed] = React.useState(false);
  if (failed) {
    return (
      <span
        title={`Source · ${label}`}
        className="inline-flex h-5 items-center rounded-[5px] px-1.5 text-[10px] font-bold tracking-[0.03em] text-white shrink-0 select-none"
        style={{ background: tint }}
      >
        {label}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={label}
      title={`Source · ${label}`}
      draggable={false}
      onError={() => setFailed(true)}
      className="h-5 w-auto shrink-0 select-none"
    />
  );
}

/** Renders a source's system logo at a consistent ~20px height. */
export function SourceLogo({ system, kind }: { system?: SourceSystem; kind?: SourceKind }) {
  const s = system ?? (kind ? KIND_TO_SYSTEM[kind] : undefined) ?? "edi";
  const brand = BRAND[s];
  if (brand) return <BrandImg src={brand.src} label={brand.label} tint={brand.tint} />;
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
