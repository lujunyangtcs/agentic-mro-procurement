import { Check, X, Minus } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import type { GateResult } from "@/mro/domain/evaluateGate";
import { useDeskCopy } from "@/mro/components/desk/copy";
import { Card, Chip, KeyValue, type ChipTone } from "@/mro/components/desk/ui";
import { STANDING_MANDATE_ID } from "@/mro/domain/reducer";

const CONTROL: Record<string, { en: string; de: string }> = {
  HC01: { en: "Approved current revision", de: "Aktuelle Revision freigegeben" },
  HC02: { en: "Within spend authority", de: "Innerhalb der Ausgabebefugnis" },
  HC03: { en: "Supplier active and cleared", de: "Lieferant aktiv und geprüft" },
  HC04: { en: "Three valid quotes", de: "Drei gültige Angebote" },
  HC05: { en: "Clauses inside the library", de: "Klauseln in der Bibliothek" },
  HC06: { en: "No sanctions match", de: "Kein Sanktionstreffer" },
  HC07: { en: "Bank verified by Finance", de: "Bank von Finance verifiziert" },
  HC08: { en: "Invoice evidence and Finance signature", de: "Rechnungsnachweis und Finance-Freigabe" },
  HC09: { en: "Value Council approval", de: "Freigabe Wertgremium" },
  HC10: { en: "Evidence attached", de: "Belege vorhanden" },
  "TOM-CONTRACT-STORED": { en: "Contract stored", de: "Vertrag abgelegt" },
};

const laneTone: Record<GateResult["lane"], ChipTone> = { touchless: "ok", "tcs-review": "warn", "client-decision": "bad" };

export function GateSummary({ gate }: { gate: GateResult }) {
  const { d, lang, t, role } = useDeskCopy();
  const applicable = gate.controls.filter((c) => c.result !== "na");

  return (
    <Card title={d.gate} right={<Chip tone={gate.allowed ? "ok" : "warn"}>{gate.allowed ? "PASS" : gate.failedStage?.toUpperCase()}</Chip>}>
      <p className="px-4 text-[12.5px] leading-[18px] text-mute">{d.gateLead}</p>
      <div className="grid grid-cols-3 gap-3 px-4 py-3">
        <KeyValue label={d.laneLabel} value={<Chip tone={laneTone[gate.lane]}>{t(`lane.${gate.lane}`)}</Chip>} />
        <KeyValue label={d.confidence} value={`${gate.confidence.score.toFixed(2)} · ${gate.confidence.policyVersion}`} strong />
        <KeyValue
          label={d.authority}
          value={
            gate.authority.standing
              ? d.standing(STANDING_MANDATE_ID)
              : gate.authority.requiredRole
                ? gate.authority.result === "pass"
                  ? `${d.approved} · ${role(gate.authority.requiredRole)}`
                  : d.needsRole(role(gate.authority.requiredRole))
                : "—"
          }
        />
      </div>
      <div className="border-t border-divider px-4 py-3">
        <h3 className="mb-2 text-[12px] font-bold uppercase tracking-[0.05em] text-mute">{d.controls}</h3>
        <ul className="grid grid-cols-1 gap-x-4 gap-y-1.5 md:grid-cols-2">
          {applicable.map((c) => (
            <li key={c.id} className="flex min-w-0 items-center gap-2 text-[13px] leading-[18px]">
              <span
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-full",
                  c.result === "pass" ? "bg-surface-mint text-surface-deep" : c.result === "fail" ? "bg-surface-amber text-mark-amber" : "bg-surface-fog text-mute",
                )}
                aria-hidden
              >
                {c.result === "pass" ? <Check size={12} strokeWidth={3} /> : c.result === "fail" ? <X size={12} strokeWidth={3} /> : <Minus size={12} />}
              </span>
              <span className="shrink-0 font-bold text-ink">{c.id}</span>
              <span className="min-w-0 truncate text-ink" title={c.reason}>
                {c.result === "fail" && c.reason ? c.reason : CONTROL[c.id]?.[lang]}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
