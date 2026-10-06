import * as React from "react";
import { AlertTriangle, Check } from "lucide-react";
import { useApp, type AgentOutputStatus } from "@/state";
import { cn } from "@/lib/utils";
import { DataTable, CellTag } from "@/components/blocks/DataTable";
import {
  AgentConsole,
  CardHeader,
  QueuePanel,
  CeremonyModal,
  type ConsoleConfig,
  type OutputMeta,
  type QueueItem,
} from "@/components/agents/ConsoleKit";
import type { ChatTurn } from "@/components/agents/AgentChat";

/* ──────────────────────────────────────────────────────────────────────────
 * Vendor Master & Records Agent console — supplier due-diligence (KYB).
 *
 * Standalone control surface, not a step inside a run. It owns the integrity of
 * the vendor master: screening onboarding requests and master-data changes
 * against four checks — sanctions/OFAC, duplicate/identity, bank verification
 * and tax/EIN. The live case is a bank-detail change on Apex Drive Systems that
 * is the same supplier whose invoice INV-ADS-4419 is blocked in the gearbox run.
 * Refusing the change is what keeps that fraudulent payment on hold.
 * ────────────────────────────────────────────────────────────────────────── */

const queue: QueueItem[] = [
  {
    id: "bv-ads-4419",
    primary: "Apex Drive Systems · bank-detail change",
    secondary: "New IBAN ·· 9920 · unverified · blocks payment INV-ADS-4419",
    meta: "09:14",
    readyTag: "Verify & decide",
    actionable: true,
    flagged: true,
    priority: "high",
  },
  {
    id: "dm-100482-100731",
    primary: "Duplicate · BeltPro Industrial",
    secondary: "100482 & 100731 · matching EIN, DUNS, bank · merged",
    meta: "1h",
    handledTag: "Merged",
  },
  {
    id: "ob-nordic",
    primary: "Onboarding · Nordic Belting AS",
    secondary: "New legal entity · D&B and sanctions cleared",
    meta: "3h",
    handledTag: "Approved",
  },
];

/* ── The four due-diligence checks on the live bank-change request ── */
type Check = { check: string; result: string; tone: "ok" | "flag" };
const checks: Check[] = [
  { check: "Sanctions · OFAC / EU", result: "New beneficiary screened · no match", tone: "ok" },
  { check: "Duplicate / identity", result: "Single record 201185 · no near-duplicate", tone: "ok" },
  { check: "Bank verification", result: "Callback unanswered · no signed bank letter · beneficiary name differs", tone: "flag" },
  { check: "Tax · US EIN", result: "47-2200137 · valid · matches the master", tone: "ok" },
];

type Quality = { label: string; pct: number; tone: "ok" | "warn" };
const quality: Quality[] = [
  { label: "Completeness", pct: 0.97, tone: "ok" },
  { label: "Bank details verified", pct: 0.93, tone: "ok" },
  { label: "Freshness · ≤ 90 days", pct: 0.89, tone: "ok" },
  { label: "Duplicate-free", pct: 0.71, tone: "warn" },
];

type Onb = { vendor: string; status: string; done: boolean };
const onboarding: Onb[] = [
  { vendor: "Nordic Belting AS · NO", status: "Approved", done: true },
  { vendor: "Heartland Rubber LLC · US", status: "W-9 requested", done: false },
  { vendor: "Apex Drives de México · MX", status: "Approved", done: true },
];

const outputMeta: OutputMeta = {
  none: { label: "Not reviewed yet", kind: "neutral", note: "Open the request to verify the new bank detail before it touches a payment." },
  pending: { label: "On hold", kind: "neutral", note: "Bank-change review parked — resume from the worklist." },
  approved: { label: "Master updated", kind: "active", note: "New bank detail written to vendor 201185." },
  rejected: { label: "Change refused · payment held", kind: "critical", note: "New IBAN ·· 9920 refused · INV-ADS-4419 stays on hold for the fraud desk." },
  escalated: { label: "Escalated", kind: "critical", note: "Routed to a data steward and the fraud desk." },
};

const chatScript: ChatTurn[] = [
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "I'm the Vendor Master & Records Agent — I screen onboarding and master-data changes before they reach a payment. The live one is a bank-detail change on Apex Drive Systems. Ask me about it.",
        children: (
          <div className="text-[12.5px] text-ink leading-[19px]">
            <div className="text-mute mb-1">For example —</div>
            <ul className="space-y-0.5">
              <li>· Why is the change flagged</li>
              <li>· What did the checks find</li>
              <li>· What happens to the payment</li>
            </ul>
          </div>
        ),
      },
    ],
    chips: ["Why is the change flagged?", "What did the checks find?", "What happens to the payment?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "An email asked us to redirect Apex's payments to a new account, IBAN ·· 9920. A mid-stream bank change on a supplier with an open invoice is exactly the fraud pattern I screen for, so I held it before any write-back.",
      },
    ],
    chips: ["What did the checks find?", "What happens to the payment?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "OFAC, identity and tax all clear — but bank verification fails: my callback to the AR contact on file went unanswered, there's no signed bank-change letter, and the beneficiary name differs from the master. The account of record is still IBAN ·· 4471.",
      },
    ],
    chips: ["What happens to the payment?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "fog",
        text: "Refusing the change keeps invoice INV-ADS-4419 ($72,000) on hold in the gearbox run — the Invoice agent already blocked it at fraud score 0.86. Nothing pays out until a verified bank letter clears.",
      },
    ],
  },
];

const config: ConsoleConfig = {
  id: "vendor",
  statLabel: "Records cleaned",
  artifactLabel: "Bank-change review · Apex Drive Systems",
  outputMeta,
  chatName: "Vendor agent",
  chatScript,
  runTitle: "This bank change is blocking a payment in the gearbox run",
  runRole: "Invoice INV-ADS-4419 ($72,000) is held until this bank-change request is verified or refused.",
  openRunLabel: "Open the payment hold",
  standalone: true,
};

/* ── The produced KYB artifact, shown in the ceremony ──────────────────── */
function BankChangeVerification() {
  return (
    <div className="rounded-md border border-divider overflow-hidden bg-white text-[12.5px]">
      <div className="px-4 py-2.5 border-b border-divider bg-surface-fog/60">
        <div className="text-[11px] tracking-[0.06em] uppercase text-surface-deep font-bold">
          Bank-change verification · Apex Drive Systems
        </div>
        <div className="text-[11px] text-mute mt-0.5">Vendor 201185 · request received 2026-06-03 09:12</div>
      </div>

      <div className="px-4 py-3 grid grid-cols-2 gap-3">
        <div className="rounded-md border border-[#cfe0f5] bg-[#eaf2fb] px-3 py-2.5">
          <div className="text-[10px] tracking-[0.06em] uppercase text-[#0a6ed1] font-bold">Account of record</div>
          <div className="text-[13px] font-bold text-ink mt-0.5 tabular-nums">IBAN ·· 4471</div>
          <div className="text-[11px] text-mute">Verified · on file since 2024</div>
        </div>
        <div className="rounded-md border border-surface-rose bg-surface-rose/30 px-3 py-2.5">
          <div className="text-[10px] tracking-[0.06em] uppercase text-mark-red font-bold">Requested account</div>
          <div className="text-[13px] font-bold text-ink mt-0.5 tabular-nums">IBAN ·· 9920</div>
          <div className="text-[11px] text-mark-red">Unverified · new beneficiary</div>
        </div>
      </div>

      <div className="px-4 pb-3 space-y-1.5">
        {checks.map((c) => (
          <div key={c.check} className="flex items-start gap-2">
            {c.tone === "ok" ? (
              <Check size={14} className="text-surface-deep mt-[1px] shrink-0" strokeWidth={3} />
            ) : (
              <AlertTriangle size={14} className="text-mark-red mt-[1px] shrink-0" />
            )}
            <span className="text-mute w-40 shrink-0">{c.check}</span>
            <span className={cn("flex-1", c.tone === "flag" ? "text-mark-red font-medium" : "text-ink")}>{c.result}</span>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-divider bg-surface-rose/20">
        <div className="text-[11px] tracking-[0.06em] uppercase text-mark-red font-bold">Recommendation</div>
        <p className="text-[12.5px] text-ink leading-snug mt-1">
          Do not update the master. Keep payment <span className="font-bold">INV-ADS-4419</span> on hold — fraud score{" "}
          <span className="font-bold tabular-nums">0.86</span>. Release only against a verified bank-change letter and a
          successful callback to the contact of record.
        </p>
      </div>
    </div>
  );
}

function ChecksPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Due-diligence checks · bank change" right={<span className="text-[11px] text-mute">vendor 201185</span>} />
      <div className="mt-4">
        <DataTable
          rows={checks}
          rowKey={(c) => c.check}
          highlight={(c) => c.tone === "flag"}
          openDoc={(c) => (c.tone === "flag" ? <BankChangeVerification /> : null)}
          openTitle={() => "Bank-change verification · Apex Drive Systems"}
          columns={[
            { header: "Check", className: "w-52", cell: (c) => <span className="font-semibold">{c.check}</span> },
            { header: "Result", cell: (c) => c.result },
            {
              header: "",
              align: "right",
              className: "w-20",
              cell: (c) => <CellTag tone={c.tone === "ok" ? "sage" : "red"}>{c.tone === "ok" ? "Clear" : "Flag"}</CellTag>,
            },
          ]}
        />
      </div>
    </article>
  );
}

function QualityPanel() {
  const barTone = { ok: "bg-surface-deep", warn: "bg-surface-sage" };
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Master-data quality" right={<span className="text-[11px] text-mute">1,204 cleaned</span>} />
      <div className="mt-4 space-y-3">
        {quality.map((q) => (
          <div key={q.label}>
            <div className="flex items-center justify-between text-[11.5px] mb-1">
              <span className={cn(q.tone === "warn" ? "text-surface-deep font-medium" : "text-ink")}>{q.label}</span>
              <span className="tabular-nums text-mute">{Math.round(q.pct * 100)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-surface-fog overflow-hidden">
              <div className={cn("h-full rounded-full", barTone[q.tone])} style={{ width: `${q.pct * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-mute leading-snug mt-3 pt-3 border-t border-divider">
        post-merger integration runs ~30–40% duplicate vendors — clearing them unlocks part of the $117M synergy slice.
      </p>
    </article>
  );
}

function OnboardingPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Onboarding requests" />
      <div className="mt-4">
        <DataTable
          rows={onboarding}
          rowKey={(o) => o.vendor}
          columns={[
            { header: "Vendor", cell: (o) => <span className="font-semibold">{o.vendor}</span> },
            {
              header: "Status",
              align: "right",
              cell: (o) => <CellTag tone={o.done ? "sage" : "neutral"}>{o.status}</CellTag>,
            },
          ]}
        />
      </div>
    </article>
  );
}

function BankChangeContext() {
  return (
    <div className="rounded-md border border-divider bg-surface-fog/60 px-4 py-3">
      <div className="text-[11px] tracking-[0.05em] uppercase text-surface-deep font-bold">Master-data change</div>
      <div className="text-[13px] font-bold text-ink mt-1">Apex Drive Systems · vendor 201185 · bank-detail change</div>
      <p className="text-[12.5px] text-ink leading-snug mt-1">
        An email from “Apex AR” asks to remit invoice ADS-4419 to a new account, IBAN ·· 9920. The supplier has an open
        $72,000 invoice in the gearbox run — a mid-stream bank change here is the classic redirection-fraud pattern.
      </p>
    </div>
  );
}

export function VendorConsole() {
  const { setAgentOutput, go } = useApp();
  const [open, setOpen] = React.useState(false);

  const decide = (status: AgentOutputStatus) => {
    setAgentOutput("vendor", status);
    setOpen(false);
  };

  return (
    <>
      <AgentConsole config={config} onOpenRun={() => go({ kind: "workspace", flow: "gearbox" })}>
        <QueuePanel title="Supplier due-diligence · onboarding & changes" badge="1 to verify" items={queue} onOpen={() => setOpen(true)} />
        <ChecksPanel />
        <QualityPanel />
        <OnboardingPanel />
      </AgentConsole>

      {open && (
        <CeremonyModal
          title="Apex Drive Systems · bank-detail change"
          subtitle="Vendor 201185 · new IBAN ·· 9920 · blocks INV-ADS-4419"
          flagged
          context={<BankChangeContext />}
          ceremony={{
            agentLabel: "Vendor agent · verifying the bank change",
            steps: [
              "Reading the bank-change request from Apex AR",
              "Calling back the AR contact on the master record",
              "Screening the new beneficiary against OFAC / EU",
              "Confirming identity, duplicate and tax (EIN)",
              "Comparing the new account to the account of record",
            ],
            doneSummary: (
              <>
                New account <span className="font-bold">IBAN ·· 9920</span> could not be verified — callback unanswered,
                no signed bank letter, beneficiary name differs. Account of record stays{" "}
                <span className="font-bold">IBAN ·· 4471</span>.
              </>
            ),
            document: <BankChangeVerification />,
            footerIntro: "The agent will call back the contact of record, screen the beneficiary and compare to the master.",
            approveLabel: "Update the master",
            decidePrompt: "Decide on the bank change",
          }}
          onClose={() => setOpen(false)}
          onDecide={decide}
        />
      )}
    </>
  );
}
