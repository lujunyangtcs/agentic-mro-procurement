/**
 * ST03 · UC4 source files — the request and the named supplier's quotation,
 * the consulting panel, the panel supplier's scorecard and framework, the
 * approval matrix, the Category Lead's decision, the onboarding invitation and
 * the five documents the supplier uploaded, the gap e-mail, the three risk
 * screens and the Risk Analyst's decision. Figures come from `IO`; the three
 * records a person writes (decision, gap e-mail, risk decision) print what
 * that person chose, typed or changed. Addresses, policy numbers and names
 * are illustrative dressing so each page reads like the original.
 */

/* eslint-disable react-refresh/only-export-components -- a document registry: the page renderers are data for the viewer, not hot-reloaded UI */

import { IO } from "@/mro/data/stories/io";
import { useLedger } from "@/mro/services/demoLedger";
import { EmailDoc } from "@/mro/components/docs/sources";
import { Clause, Letterhead, Mark, PdfFooter, PdfSection, PdfTable, Signatures, Stamp, type SourceDoc } from "@/mro/components/story/theatre/pdf";

const gbp = (n: number, dp = 0) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;

const mi = IO.uc04.supplierMatch.input;
const mo = IO.uc04.supplierMatch.output;
const oi = IO.uc04.onboarding.input;
const oo = IO.uc04.onboarding.output;
const ri = IO.uc04.riskScreening.input;
const ro = IO.uc04.riskScreening.output;

const req = mi.request;
const rec = mo.recommendation;
const refs = mi.knowledge_refs;
const named = mi.named_supplier_profile;
const [kestrel, meridian] = mi.panel;
const splitSupplier = (s: string) => {
  const [id, ...rest] = s.split(" ");
  return { id, name: rest.join(" ") };
};
const K = splitSupplier(kestrel.supplier);
const MER = splitSupplier(meridian.supplier);
const SUP = oi.supplier;
const CASE = mo.meta.case_id;
const CLASS = mi.meta.data_classification;
const ORG = "Client";
const DAYS = rec.estimated_cost_gbp / kestrel.day_rate;
const NAMED_TOTAL = DAYS * named.day_rate_quoted;
const HEADROOM = kestrel.utilisation_commitment!.committed_gbp - kestrel.utilisation_commitment!.used_gbp;
const GAP_PCT = ((1 - kestrel.day_rate / named.day_rate_quoted) * 100).toFixed(1);
const PI_REQ = "£2,000,000";
const PI_HELD = "£1,000,000";

export const UC04_TASK = { fit: "uc04:0:0", gaps: "uc04:1:0", risk: "uc04:2:0" } as const;

export const D4 = {
  req: req.request_id,
  quote: "QUO-NOVA-26-014",
  panel: refs.panel_list,
  perf: mo.audit.evidence_ids.find((e) => e.startsWith("PERF")) ?? "PERF-40210-2026",
  agr: "AGR-CONS-40210",
  doa: refs.doa_matrix,
  decision: "SDR-104588",
  invite: oo.invitation.portal_ref,
  coi: `CH-${SUP.companies_house}`,
  vat: "VAT-GB318447126",
  ins: "INS-NOVA-2026",
  isq: "ISQ-NOVA-2026",
  bank: "BNK-NOVA-0926",
  gap: `${oo.invitation.portal_ref}-GAP1`,
  san: "SAN-104588",
  credit: `CR-${SUP.companies_house}`,
  cyber: "CYB-NOVA-2026",
  riskRec: "RSK-104588",
} as const;

export const GAP_SUBJECT = `${oo.invitation.portal_ref} · professional indemnity cover below requirement`;
export const GAP_TO = `NovaOps onboarding <${SUP.contact}>`;
export const GAP_FROM = `${ORG} Supplier Onboarding · Buy Desk <supplier-onboarding@client.example>`;

/** The gap e-mail as the Onboarding Agent drafts it; the Buy Desk Analyst may edit it before sending. */
export const GAP_DRAFT = [
  "Dear NovaOps onboarding team,",
  `Thank you for completing supplier registration ${oo.invitation.portal_ref}. We have accepted your certificate of incorporation, VAT registration and information security questionnaire. Your bank letter has been passed to our Finance team, who will verify it by telephone.`,
  `One document needs to be updated before we can continue: your insurance certificate shows professional indemnity cover of ${PI_HELD}. This engagement requires professional indemnity cover of at least ${PI_REQ}; your public liability cover of £5,000,000 already meets our requirement.`,
  "Please upload an updated certificate, or a letter from your broker confirming the increased cover, to the portal by 15 October 2026. This is review round 1 of 2.",
  "No Modern Slavery statement is needed — your turnover is below the statutory threshold.",
  "Kind regards,",
  `Buy Desk · Indirect Procurement, on behalf of ${ORG}`,
];

/* Proposed conditions as the Risk Screening Agent wrote them ("Value cap £60K until 2 years accounts reviewed"). */
const capCondition = ro.proposed_conditions[0];
export const PROPOSED_CAP = Number(capCondition.match(/£(\d+)K/)?.[1] ?? 60) * 1000;
export const PROPOSED_YEARS = Number(capCondition.match(/(\d+) years?/)?.[1] ?? 2);

function useUc4() {
  const run = useLedger().runs.ST03;
  return { decisions: run?.decisions ?? {}, inputs: run?.inputs ?? {} };
}

/* ── 1 · The request and the named supplier's quote ─────────────────────── */

function RequestForm() {
  return (
    <>
      <Letterhead
        org={ORG}
        unit="Procurement front door"
        title="Purchase request"
        number={req.request_id}
        rows={[
          ["Submitted", "07 Oct 2026 12:20 BST"],
          ["Channel", "Front door · services form"],
          ["Requester", "T. Hughes"],
          ["Role", req.requester.role],
          ["Function", req.requester.function],
          ["Site", req.requester.site],
          ["Value band", req.value_band],
          ["Requested start", "20 Oct 2026"],
        ]}
      />
      <PdfSection title="1 · What do you need?">
        <p className="text-[13px] font-bold">{req.need}</p>
        <PdfTable
          head={["Service", "Duration", "Days", "Est. cost"]}
          right={[2, 3]}
          rows={[["Process-improvement consultant · paint shop throughput", "6 weeks", String(DAYS), gbp(req.starting_cost_gbp)]]}
        />
      </PdfSection>
      <PdfSection title="2 · Mandatory requirements">
        <PdfTable head={["#", "Requirement"]} rows={req.required.map((r, i) => [String(i + 1), r])} />
      </PdfSection>
      <PdfSection title="3 · Supplier">
        <p>
          Preferred supplier: <span className="font-medium">{SUP.name}</span> — <Mark>not on the {ORG} consulting panel</Mark>. Quotation {D4.quote} attached.
        </p>
      </PdfSection>
      <PdfSection title="4 · Business justification">
        <p className="text-pretty">
          Paint shop throughput at {req.requester.site} is below plan after the colour-change programme. We need a Black Belt for a six-week line-balancing study across pretreatment, booths and ovens.{" "}
          <Mark>NovaOps brings its own proprietary paint-line simulation tool, which models booth and oven throughput before we change anything on the line. We are not aware of a panel supplier who can provide it.</Mark>
        </p>
      </PdfSection>
      <PdfSection title="5 · Declarations">
        <p>☑ The cost centre owner is aware of this request.</p>
        <p>☐ This request replaces an existing contract.</p>
      </PdfSection>
      <div className="mt-8 flex items-end justify-between">
        <p className="text-[11px] text-[#5a5a5a]">Submitted electronically by T. Hughes · 1 attachment ({D4.quote}.pdf)</p>
        <Stamp>Received · {req.request_id}</Stamp>
      </div>
      <PdfFooter left={`${req.request_id} · ${CLASS}`} />
    </>
  );
}

function NamedQuote() {
  return (
    <>
      <Letterhead
        org="NovaOps Consulting"
        unit={`Operations & process improvement · Registered in England & Wales ${SUP.companies_house}`}
        title="Quotation"
        number={D4.quote}
        rows={[
          ["Date", "02 Oct 2026"],
          ["Valid until", "31 Oct 2026"],
          ["Prepared for", `${req.requester.role}, ${ORG}`],
          ["Site", req.requester.site],
          ["Prepared by", "L. Ford, Director"],
          ["Currency", "GBP, excl. VAT"],
        ]}
      />
      <PdfSection title="Scope">
        <p className="text-pretty">
          Six-week paint shop throughput study: current-state value stream, booth and oven constraint analysis, line-balancing options and an implementation plan. Delivered on site at {req.requester.site} by a Lean Six Sigma Black Belt with automotive paint shop experience.
        </p>
      </PdfSection>
      <PdfSection title="Fees">
        <PdfTable
          head={["Item", "Days", "Day rate", "Amount"]}
          right={[1, 2, 3]}
          mark={[0]}
          rows={[
            ["Principal consultant · Lean Six Sigma Black Belt", String(DAYS), gbp(named.day_rate_quoted, 2), gbp(NAMED_TOTAL, 2)],
            ["Paint-line simulation tool · licence for the engagement", "—", "included", gbp(0, 2)],
          ]}
          foot={[
            ["", "", "Net", gbp(NAMED_TOTAL, 2)],
            ["", "", "VAT 20%", gbp(NAMED_TOTAL * 0.2, 2)],
            ["", "", "Total", gbp(NAMED_TOTAL * 1.2, 2)],
          ]}
        />
      </PdfSection>
      <PdfSection title="Terms">
        <p className="text-pretty">Payment 30 days from invoice. Travel and subsistence included. Our simulation tool and its models remain NovaOps intellectual property; outputs produced for the client are the client&apos;s.</p>
      </PdfSection>
      <Signatures parties={[{ role: "For NovaOps Consulting Ltd", name: "A. Rahman", date: "02 Oct 2026" }]} />
      <PdfFooter left={`${D4.quote} · supplier document`} />
    </>
  );
}

/* ── 2 · What the Supplier Match Agent checked ──────────────────────────── */

function PanelList() {
  return (
    <>
      <Letterhead
        org={ORG}
        unit="Indirect procurement · Category management"
        title="Approved panel"
        number={D4.panel}
        rows={[
          ["Category", "Consulting · operations & process improvement"],
          ["Effective", "01 Jul 2026 – 30 Sep 2026, rolled to Q4"],
          ["Category Lead", "Manufacturing Services"],
          ["Suppliers", String(mi.panel.length)],
        ]}
      />
      <PdfSection title="Panel suppliers">
        <PdfTable
          head={["Supplier", "Capabilities", "Region", "Day rate", "Score", "Next availability"]}
          right={[3, 4]}
          mark={[0]}
          rows={[
            [`${K.id} ${K.name}`, kestrel.capabilities.join(", "), kestrel.region, gbp(kestrel.day_rate), kestrel.performance_score.toFixed(1), "20 Oct 2026"],
            [`${MER.id} ${MER.name}`, meridian.capabilities.join(", "), meridian.region, gbp(meridian.day_rate), meridian.performance_score.toFixed(1), "03 Nov 2026"],
          ]}
        />
        <p className="text-[11px] text-[#5a5a5a]">Not listed: {SUP.name}.</p>
      </PdfSection>
      <PdfSection title="Rules">
        <Clause n="2.1" title="Panels first" mark>
          Requests in this category are placed with a panel supplier where one meets the mandatory requirements. A non-panel supplier may be used only with a Category Lead exception and a recorded reason.
        </Clause>
        <Clause n="2.2" title="Supplier records">Panel suppliers are active in the supplier master. Using them creates no new vendor record and needs no onboarding.</Clause>
        <Clause n="2.3" title="Rates">Day rates are fixed under each supplier&apos;s framework agreement for its term.</Clause>
      </PdfSection>
      <PdfFooter left={`${D4.panel} · ${CLASS}`} />
    </>
  );
}

function Scorecard() {
  return (
    <>
      <Letterhead
        org={ORG}
        unit="Supplier performance management"
        title="Supplier scorecard"
        number={D4.perf}
        rows={[
          ["Supplier", `${K.id} ${K.name}`],
          ["Period", "Oct 2025 – Sep 2026"],
          ["Engagements", "9"],
          ["Overall", `${kestrel.performance_score.toFixed(1)} / 5`],
        ]}
      />
      <PdfSection title="Score by dimension">
        <PdfTable
          head={["Dimension", "Score", "Basis"]}
          right={[1]}
          rows={[
            ["Quality of output", "4.5", "Sponsor rating at close"],
            ["Delivery to plan", "4.4", "Milestones met on time"],
            ["Commercial", "4.2", "Invoices matched first time"],
            ["Safety & conduct on site", "4.5", "Site HSE feedback"],
          ]}
          foot={[["Overall", kestrel.performance_score.toFixed(1), ""]]}
        />
      </PdfSection>
      <PdfSection title="Recent engagements (5 of 9)">
        <PdfTable
          head={["Closed", "Site", "Engagement", "Score"]}
          right={[3]}
          mark={[0]}
          rows={[
            ["Aug 2026", "Solihull", "Paint shop sealer line balancing", "4.6"],
            ["Jun 2026", "Halewood", "Body shop flow study", "4.4"],
            ["Apr 2026", "Wolverhampton", "Kaizen facilitation, propulsion line", "4.3"],
            ["Feb 2026", "Solihull", "Paint defect Pareto & DOE", "4.5"],
            ["Dec 2025", "Halewood", "Stores replenishment redesign", "4.2"],
          ]}
        />
      </PdfSection>
      <PdfFooter left={`${D4.perf} · ${CLASS}`} />
    </>
  );
}

function Framework() {
  const c = kestrel.utilisation_commitment!;
  return (
    <>
      <Letterhead
        org={ORG}
        unit="Framework call-off agreement · Consulting"
        title="Framework agreement"
        number={D4.agr}
        rows={[
          ["Supplier", `${K.name} (${K.id})`],
          ["Term", "01 Jan 2026 – 31 Dec 2027"],
          ["Committed spend", gbp(c.committed_gbp)],
          ["Call-offs to date", `${gbp(c.used_gbp)} (06 Oct 2026)`],
          ["Headroom", gbp(HEADROOM)],
          ["Panel", D4.panel],
        ]}
      />
      <PdfSection title="Extract — clauses relied on">
        <Clause n="3.1" title="Rates">Senior consultant (Lean Six Sigma Black Belt): {gbp(kestrel.day_rate)} per day, fixed for the term, inclusive of travel within the Midlands.</Clause>
        <Clause n="4.1" title="Call-offs">Call-offs are placed by purchase order quoting this agreement. No further tender is required within the committed value.</Clause>
        <Clause n="5.2" title="Volume rebate" mark>
          When cumulative call-offs within the term reach {gbp(c.committed_gbp)}, the Supplier shall credit a rebate of 2% of all call-off value placed under this agreement.
        </Clause>
      </PdfSection>
      <PdfSection title="Commitment position">
        <PdfTable
          head={["Committed", "Called off", "Headroom", "Rebate tier"]}
          right={[0, 1, 2]}
          mark={[0]}
          rows={[[gbp(c.committed_gbp), gbp(c.used_gbp), <Mark key="h">{gbp(HEADROOM)}</Mark>, `2% at ${gbp(c.committed_gbp)}`]]}
        />
      </PdfSection>
      <Signatures
        parties={[
          { role: `For ${ORG}`, name: "M. Okafor", date: "15 Dec 2025" },
          { role: `For ${K.name}`, name: "P. Lindqvist", date: "17 Dec 2025" },
        ]}
      />
      <PdfFooter left={`${D4.agr} · extract · ${CLASS}`} right="Page 1 of 9" />
    </>
  );
}

function DoaMatrix() {
  return (
    <>
      <Letterhead
        org={ORG}
        unit="Group finance · Delegation of authority"
        title="DoA matrix"
        number={D4.doa}
        rows={[
          ["Effective", "01 Jul 2026"],
          ["Applies to", "Indirect spend · UK sites"],
          ["Channel rules", refs.channel_rules],
          ["Confidence policy", refs.confidence_policy],
        ]}
      />
      <PdfSection title="Approval by value band">
        <PdfTable
          head={["Value band", "Spend approval", "Supplier fit / exception", "Channel"]}
          mark={[2]}
          rows={[
            ["< £3K", "Policy (automatic)", "Catalogue or panel only", "Touchless"],
            ["£3K – £30K", "Budget Holder", "Buy Desk", "Buy Desk"],
            ["£30K – £100K", "Budget Holder + Category Lead", "Category Lead", "Category-managed"],
            ["£100K – £250K", "Head of Procurement", "Category Lead + Head of Procurement", "Strategic sourcing"],
            ["> £250K", "CPO + CFO", "Sourcing board", "Strategic sourcing"],
          ]}
        />
      </PdfSection>
      <PdfSection title="4 · Suppliers">
        <Clause n="4.2" title="Non-panel suppliers" mark>
          A request above £30K that names a supplier outside the approved panel requires the Category Lead to confirm supplier fit or approve an onboarding exception with a recorded reason. The requester may not approve their own supplier.
        </Clause>
        <Clause n="4.3" title="Bank details">Supplier bank details are verified only by Finance, by call-back on an independently sourced number. No system or agent may verify or change them.</Clause>
      </PdfSection>
      <PdfFooter left={`${D4.doa} · extract · ${CLASS}`} right="Page 3 of 11" />
    </>
  );
}

/* ── 3 · The Category Lead's decision (written by a person) ─────────────── */

function SupplierDecision() {
  const { decisions, inputs } = useUc4();
  const redirect = decisions[UC04_TASK.fit] === "redirect";
  const reason = String(inputs[UC04_TASK.fit]?.reason ?? oi.human_decision.reason);
  return (
    <>
      <Letterhead
        org={ORG}
        unit="Indirect procurement · Category management"
        title="Supplier decision"
        number={D4.decision}
        rows={[
          ["Case", CASE],
          ["Request", req.request_id],
          ["Decided by", oi.human_decision.by],
          ["Decided", "08 Oct 2026 14:55 BST"],
          ["Authority", `${D4.doa} §4.2 · £30K–£100K`],
          ["Agent view", `${rec.decision} · confidence ${mo.confidence.score.toFixed(2)}`],
        ]}
      />
      <PdfSection title="Options compared">
        <PdfTable
          head={["", "Panel supplier", "Named supplier"]}
          mark={[5]}
          rows={[
            ["Supplier", `${K.name} (${K.id})`, SUP.name],
            ["Panel status", `On ${D4.panel}`, "Not on panel"],
            ["Mandatory capabilities", `${req.required.length} of ${req.required.length}`, `${req.required.length} of ${req.required.length} + own simulation tool`],
            ["Day rate", gbp(kestrel.day_rate), gbp(named.day_rate_quoted)],
            ["Days", String(DAYS), String(DAYS)],
            ["Total", gbp(rec.estimated_cost_gbp), gbp(NAMED_TOTAL)],
            ["Onboarding", "None — active supplier", `${named.onboarding_effort_days} days · new-supplier checks`],
            ["Risk", "Screened · active", named.risk],
          ]}
        />
        <p className="text-[11.5px]">
          Price gap: <Mark>{gbp(rec.saving_vs_named_gbp)} ({GAP_PCT}%)</Mark> in favour of the panel supplier.
        </p>
      </PdfSection>
      <PdfSection title="Decision">
        {redirect ? (
          <>
            <p className="text-[13px] font-bold">Redirected to panel supplier {K.name} — no onboarding</p>
            <p>
              Call-off under {D4.agr} at {gbp(rec.estimated_cost_gbp)}. Saving against the named quote: <Mark>{gbp(rec.saving_vs_named_gbp)}</Mark>.
            </p>
          </>
        ) : (
          <>
            <p className="text-[13px] font-bold">Onboarding exception approved — proceed with {SUP.name}</p>
            <p className="text-pretty">
              Reason recorded: <Mark>“{reason}”</Mark>
            </p>
            <p className="text-pretty">Premium accepted: {gbp(rec.saving_vs_named_gbp)} against the panel offer. The Kestrel offer stays on file as the fallback if onboarding fails.</p>
          </>
        )}
      </PdfSection>
      <PdfSection title="Next steps">
        <PdfTable
          head={["Step", "Owner", "Status"]}
          rows={
            redirect
              ? [
                  ["Call-off purchase order", "Buy Desk", "Ready"],
                  ["Requester notice", "Procurement Assistant", "Sent"],
                ]
              : [
                  ["Supplier onboarding", "Onboarding Agent", "Started"],
                  ["Risk screening", "Risk Screening Agent", "Queued"],
                  ["Bank call-back", `${ORG} Finance`, "Pending"],
                  ["Purchase order", "ERP", "Blocked until supplier active"],
                ]
          }
        />
      </PdfSection>
      <Signatures parties={[{ role: oi.human_decision.by, name: "K. Adeyemi", date: "08 Oct 2026" }]} />
      <PdfFooter left={`${D4.decision} · ${CASE} · ${CLASS}`} />
    </>
  );
}

/* ── 4 · Onboarding: invitation, the supplier's documents, the gap e-mail ─ */

function Invitation() {
  return (
    <EmailDoc
      from={`${ORG} Supplier Onboarding`}
      fromAddr="supplier-onboarding@client.example"
      to={GAP_TO}
      sent="Thu 08/10/2026 15:03"
      subject={`Supplier registration ${oo.invitation.portal_ref} — documents requested`}
      tone="outbound"
      highlight="Insurance (PI £2M, PL £5M)"
      lines={[
        "Dear NovaOps team,",
        `${ORG} has approved an onboarding exception so that ${SUP.name} can be set up as a supplier for request ${req.request_id}.`,
        `Please register on the supplier portal with reference ${oo.invitation.portal_ref} and upload the following:`,
        ...oi.required_documents.map((d) => `• ${d}`),
        "Bank details are verified separately by our Finance team by telephone. We will never ask you to change bank details by e-mail.",
        "Supplier Onboarding · Indirect Procurement",
      ]}
    />
  );
}

function Incorporation() {
  return (
    <>
      <div className="flex flex-col items-center gap-1 border-b-2 border-[#1c1c1c] pb-5 text-center">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#5a5a5a]">Companies House</p>
        <p className="mt-2 text-[20px] font-bold">Certificate of Incorporation</p>
        <p className="text-[13px]">of a Private Limited Company</p>
        <p className="mt-3 text-[13px]">
          Company number <span className="font-bold tabular-nums">{SUP.companies_house}</span>
        </p>
      </div>
      <p className="mt-6 text-pretty text-[13px] leading-[21px]">
        The Registrar of Companies for England and Wales hereby certifies that <span className="font-bold">{SUP.name.toUpperCase()}</span> is this day incorporated under the Companies Act 2006 as a private company, that the company is limited by shares, and that the situation of its registered office is in England and Wales.
      </p>
      <p className="mt-3 text-[13px]">Given at Companies House, Cardiff, on 12th March 2019.</p>
      <PdfSection title="Filing history · retrieved 09 Oct 2026">
        <PdfTable
          head={["Date", "Type", "Description", "Status"]}
          mark={[0, 2]}
          rows={[
            ["18 Sep 2026", "AA", "Abridged accounts made up to 31 Mar 2026", "Filed on time"],
            ["14 Mar 2026", "CS01", "Confirmation statement made on 12 Mar 2026", "Filed"],
            ["22 Sep 2025", "AA", "Abridged accounts made up to 31 Mar 2025", "Filed on time"],
            ["13 Mar 2025", "CS01", "Confirmation statement made on 12 Mar 2025", "Filed"],
          ]}
        />
      </PdfSection>
      <PdfSection title="Officers">
        <PdfTable head={["Name", "Role", "Appointed"]} rows={ri.supplier.directors.map((d, i) => [d, "Director", i === 0 ? "12 Mar 2019" : "01 Jun 2021"])} />
      </PdfSection>
      <PdfFooter left={`${D4.coi} · uploaded via ${oo.invitation.portal_ref}`} right="Page 1 of 2" />
    </>
  );
}

function VatCertificate() {
  return (
    <>
      <Letterhead
        org="HM Revenue & Customs"
        unit="VAT registration"
        title="VAT certificate"
        number="GB 318 4471 26"
        rows={[
          ["Business name", SUP.name],
          ["Company number", SUP.companies_house],
          ["Effective date", "01 Jun 2019"],
          ["Issued", "04 Jun 2019"],
          ["Trade class", "70229 · management consultancy"],
          ["VAT return periods", "Quarterly"],
        ]}
      />
      <PdfSection title="Registration">
        <p className="text-pretty">
          This certificate confirms that the business named above is registered for VAT. VAT registration number: <Mark>GB 318 4471 26</Mark>. Show this number on every VAT invoice you issue.
        </p>
      </PdfSection>
      <PdfFooter left={`${D4.vat} · uploaded via ${oo.invitation.portal_ref}`} />
    </>
  );
}

function Insurance() {
  return (
    <>
      <Letterhead
        org="Calder & Wey Underwriting"
        unit="Commercial lines · Professional & liability"
        title="Certificate of insurance"
        number="CWU/PI/2026/55817"
        rows={[
          ["Insured", SUP.name],
          ["Company number", SUP.companies_house],
          ["Period", "01 Apr 2026 – 31 Mar 2027"],
          ["Business", "Management consultancy"],
        ]}
      />
      <PdfSection title="Cover in force">
        <PdfTable
          head={["Section", "Limit of indemnity", "Basis", "Excess"]}
          right={[1, 3]}
          mark={[0]}
          rows={[
            ["Professional indemnity", <Mark key="pi">{PI_HELD}</Mark>, "any one claim", "£2,500"],
            ["Public liability", "£5,000,000", "any one occurrence", "£250"],
            ["Employers' liability", "£10,000,000", "any one occurrence", "Nil"],
          ]}
        />
      </PdfSection>
      <p className="mt-4 text-pretty text-[11px] text-[#5a5a5a]">This certificate is evidence of cover only and is subject to the terms, conditions and exclusions of the policy. It does not amend, extend or alter the cover provided.</p>
      <Signatures parties={[{ role: "For Calder & Wey Underwriting", name: "H. Moreno", date: "28 Mar 2026" }]} />
      <PdfFooter left={`${D4.ins} · uploaded via ${oo.invitation.portal_ref}`} />
    </>
  );
}

function SecurityQuestionnaire() {
  return (
    <>
      <Letterhead
        org={ORG}
        unit="Information security · Third-party assurance"
        title="Security questionnaire"
        number={D4.isq}
        rows={[
          ["Supplier", SUP.name],
          ["Completed by", "L. Ford, Director"],
          ["Submitted", "09 Oct 2026"],
          ["Expected access", "Shared drive (read) after activation"],
        ]}
      />
      <PdfSection title="Answers">
        <PdfTable
          head={["#", "Question", "Answer"]}
          mark={[2]}
          rows={[
            ["1", "Certified to ISO/IEC 27001?", "No"],
            ["2", "Cyber Essentials certification?", "Yes — Cyber Essentials, 2026"],
            ["3", "Multi-factor authentication enforced on remote access?", "In progress — target Q1 2027"],
            ["4", "Laptops encrypted?", "Yes — full-disk encryption"],
            ["5", "Security incidents in the last 24 months?", "None"],
            ["6", "Named security contact", "L. Ford"],
          ]}
        />
      </PdfSection>
      <p className="mt-4 text-[11.5px]">☑ I confirm the answers above are accurate. Signed electronically by L. Ford, 09 Oct 2026.</p>
      <PdfFooter left={`${D4.isq} · uploaded via ${oo.invitation.portal_ref}`} />
    </>
  );
}

function BankLetter() {
  return (
    <>
      <Letterhead
        org="Midshire Bank"
        unit="Business banking · Coventry"
        title="Bank confirmation"
        number="BC/0926/1187"
        rows={[
          ["Date", "07 Oct 2026"],
          ["Account name", SUP.name.toUpperCase()],
          ["Sort code", "••-••-47"],
          ["Account number", "••••5521"],
        ]}
      />
      <PdfSection title="Confirmation">
        <p className="text-pretty">To whom it may concern — we confirm that the account above is held with us in the name shown and has been open since June 2019. This letter is provided at our customer&apos;s request and without liability on the part of the bank.</p>
      </PdfSection>
      <div className="mt-8 border-l-[3px] border-[#e0b400] bg-[#fff8d2] px-3 py-2 text-[11.5px]">
        <span className="font-bold">{ORG} handling note.</span> Bank details are verified only by {ORG} Finance, by call-back on an independently sourced number ({D4.doa} §4.3). Not verified by the Onboarding Agent.
      </div>
      <PdfFooter left={`${D4.bank} · uploaded via ${oo.invitation.portal_ref} · account details masked`} />
    </>
  );
}

function GapMail() {
  const { inputs } = useUc4();
  const body = String(inputs[UC04_TASK.gaps]?.body ?? GAP_DRAFT.join("\n\n"));
  return (
    <EmailDoc
      from={`${ORG} Supplier Onboarding · Buy Desk`}
      fromAddr="supplier-onboarding@client.example"
      to={GAP_TO}
      sent="Sat 10/10/2026 10:41"
      subject={GAP_SUBJECT}
      tone="outbound"
      highlight={PI_REQ}
      lines={body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)}
    />
  );
}

/* ── 5 · Risk screening and the Risk Analyst's decision ─────────────────── */

function Sanctions() {
  const parties = [{ name: SUP.name, type: "Company" }, ...ri.supplier.directors.map((d) => ({ name: d, type: "Director" }))];
  return (
    <>
      <Letterhead
        org={ORG}
        unit="Third-party risk · Screening"
        title="Screening report"
        number={D4.san}
        rows={[
          ["Subject", `${SUP.name} (${SUP.companies_house})`],
          ["Country", ri.supplier.country],
          ["Run", "10 Oct 2026 10:31 BST"],
          ["Provider", ro.audit.providers[0]],
        ]}
      />
      <PdfSection title="Sanctions & PEP">
        <PdfTable
          head={["Name", "Type", "UK (OFSI)", "EU", "US (OFAC)", "PEP"]}
          rows={parties.map((p) => [p.name, p.type, "No match", "No match", "No match", "No match"])}
        />
      </PdfSection>
      <PdfSection title="Adverse media">
        <p>
          {ro.results.adverse_media} — 24-month lookback, English-language news and regulatory sources.
        </p>
      </PdfSection>
      <div className="mt-8 flex justify-end">
        <Stamp>{ro.results.sanctions_pep}</Stamp>
      </div>
      <PdfFooter left={`${D4.san} · ${CASE} · ${CLASS}`} />
    </>
  );
}

function CreditReport() {
  const f = ro.results.financial_health;
  return (
    <>
      <Letterhead
        org="Business credit report"
        unit={`Supplied by ${ro.audit.providers[1]}`}
        title="Credit report"
        number={D4.credit}
        rows={[
          ["Company", SUP.name],
          ["Incorporated", "12 Mar 2019"],
          ["Report date", "10 Oct 2026"],
          ["Accounts type", "Small company · abridged"],
        ]}
      />
      <div className="mt-6 flex items-center gap-6 border border-[#c9c9c9] px-5 py-4">
        <div>
          <p className="text-[10.5px] uppercase tracking-[0.12em] text-[#5a5a5a]">Credit score</p>
          <p className="text-[30px] font-bold leading-none tabular-nums">
            <Mark>{f.score}</Mark>
            <span className="text-[15px] font-normal text-[#5a5a5a]"> / 100</span>
          </p>
        </div>
        <div className="border-l border-[#c9c9c9] pl-6">
          <p className="text-[10.5px] uppercase tracking-[0.12em] text-[#5a5a5a]">Risk band</p>
          <p className="text-[16px] font-bold">{f.tier} · moderate risk</p>
        </div>
      </div>
      <PdfSection title="Key indicators">
        <PdfTable
          head={["Indicator", "Value"]}
          right={[1]}
          rows={[
            ["Turnover (estimated)", "£2.1M"],
            ["Net worth", "£212,000"],
            ["Cash at bank", "£96,000"],
            ["Payment performance", "9 days beyond terms on average"],
            ["County court judgments", "None"],
          ]}
        />
      </PdfSection>
      <PdfSection title="Commentary">
        <p className="text-pretty">Score is limited by thin financial disclosure — only abridged accounts are filed, so profit and loss are not published — and by moderate payment behaviour. No insolvency indicators.</p>
      </PdfSection>
      <PdfFooter left={`${D4.credit} · ${CLASS}`} />
    </>
  );
}

function CyberRating() {
  const c = ro.results.cyber;
  return (
    <>
      <Letterhead
        org="External cyber rating"
        unit={`Supplied by ${ro.audit.providers[2]}`}
        title="Cyber rating"
        number={D4.cyber}
        rows={[
          ["Organisation", SUP.name],
          ["Domain", "novaops.example"],
          ["Assessed", "09 Oct 2026"],
          ["Overall rating", c.rating],
        ]}
      />
      <PdfSection title="Findings">
        <PdfTable
          head={["Area", "Grade", "Finding"]}
          mark={[0]}
          rows={[
            ["Remote access", "C", `VPN portal exposed to the internet · ${c.note.toLowerCase()}`],
            ["Patching cadence", "B", "2 internet-facing hosts more than 30 days behind"],
            ["E-mail security", "A", "SPF, DKIM and DMARC enforced"],
            ["TLS configuration", "A", "Modern protocols and ciphers only"],
            ["Leaked credentials", "B", "1 historic exposure (2024), since reset"],
          ]}
        />
      </PdfSection>
      <p className="mt-4 text-[11px] text-[#5a5a5a]">Outside-in assessment of internet-facing assets only. It does not test internal controls.</p>
      <PdfFooter left={`${D4.cyber} · ${CLASS}`} />
    </>
  );
}

function RiskDecision() {
  const { decisions, inputs } = useUc4();
  const rejected = decisions[UC04_TASK.risk] === "reject";
  const inp = inputs[UC04_TASK.risk];
  const cap = Number(inp?.cap ?? PROPOSED_CAP);
  const years = Number(inp?.years ?? PROPOSED_YEARS);
  const mfa = inp?.mfa ?? true;
  const r = ro.results;
  const conditions: [string, string, string, boolean][] = [
    ["Value cap", `${gbp(cap)} until ${years} years of full accounts are reviewed`, `${gbp(PROPOSED_CAP)} · ${PROPOSED_YEARS} years`, cap !== PROPOSED_CAP || years !== PROPOSED_YEARS],
    ...(mfa ? ([["System access", "MFA evidence before any system access", "Required", false]] as [string, string, string, boolean][]) : []),
  ];
  return (
    <>
      <Letterhead
        org={ORG}
        unit="Third-party risk"
        title="Risk decision"
        number={D4.riskRec}
        rows={[
          ["Case", CASE],
          ["Supplier", `${SUP.name} (${SUP.companies_house})`],
          ["Proposed tier", ro.proposed_risk_tier],
          ["Decided by", "Risk Analyst"],
          ["Decided", "10 Oct 2026 11:05 BST"],
          ["Agent", `${ro.audit.model_version} · confidence ${ro.confidence.score.toFixed(2)}`],
        ]}
      />
      <PdfSection title="Screening summary">
        <PdfTable
          head={["Screen", "Result", "Source"]}
          mark={[1]}
          rows={[
            ["Sanctions & PEP", r.sanctions_pep, D4.san],
            ["Financial health", `${r.financial_health.score}/100 · ${r.financial_health.tier}`, D4.credit],
            ["Adverse media", r.adverse_media, D4.san],
            ["Cyber posture", `${r.cyber.rating} · ${r.cyber.note}`, D4.cyber],
            ["Companies House filings", r.filings, D4.coi],
          ]}
        />
      </PdfSection>
      <PdfSection title="Decision">
        {rejected ? (
          <p className="text-[13px] font-bold">Rejected — supplier not activated; the purchase order stays blocked.</p>
        ) : (
          <>
            <p className="text-[13px] font-bold">Accepted at {ro.proposed_risk_tier} risk with conditions</p>
            <PdfTable
              head={["Condition", "As set", "Agent proposed"]}
              mark={conditions.map((c, i) => (c[3] ? i : -1)).filter((i) => i >= 0)}
              rows={conditions.map(([k, v, p]) => [k, v, p])}
            />
            {!mfa && <p className="text-[11.5px]">MFA condition removed by the Risk Analyst.</p>}
          </>
        )}
      </PdfSection>
      {!rejected && (
        <PdfSection title="Next steps">
          <PdfTable
            head={["Step", "Owner", "Status"]}
            rows={[
              ["Create vendor record", "Master Data Agent", "Queued"],
              ["Bank details call-back", `${ORG} Finance`, "Pending · person only"],
              ["Purchase order", "ERP", "Blocked until supplier active"],
            ]}
          />
        </PdfSection>
      )}
      <Signatures parties={[{ role: "Risk Analyst", name: "E. Novak", date: "10 Oct 2026" }]} />
      <PdfFooter left={`${D4.riskRec} · ${CASE} · ${CLASS}`} />
    </>
  );
}

export const UC04_DOCS: SourceDoc[] = [
  { id: D4.req, title: "Purchase request form", system: "Front door", kind: "pdf", file: `${D4.req}_purchase-request.pdf`, render: RequestForm },
  { id: D4.quote, title: "Named supplier quotation", system: "Request attachment", kind: "pdf", file: `${D4.quote}_NovaOps-quotation.pdf`, render: NamedQuote },
  { id: D4.panel, title: "Consulting panel list", system: "Category management", kind: "pdf", file: `${D4.panel}.pdf`, render: PanelList },
  { id: D4.perf, title: "Panel supplier scorecard", system: "Supplier performance", kind: "pdf", file: `${D4.perf}_scorecard.pdf`, render: Scorecard },
  { id: D4.agr, title: "Framework agreement", system: "Contracts", kind: "pdf", file: `${D4.agr}_framework.pdf`, pages: 9, render: Framework },
  { id: D4.doa, title: "Delegation of authority", system: "Group finance", kind: "pdf", file: `${D4.doa}_DoA-matrix.pdf`, pages: 11, render: DoaMatrix },
  { id: D4.decision, title: "Category Lead supplier decision", system: "Case record", kind: "pdf", file: `${D4.decision}_supplier-decision.pdf`, render: () => <SupplierDecision /> },
  { id: D4.invite, title: "Onboarding invitation", system: "Supplier portal", kind: "mail", file: `${D4.invite} documents requested.msg`, render: Invitation },
  { id: D4.coi, title: "Certificate of incorporation", system: "Supplier upload", kind: "pdf", file: `${D4.coi}_incorporation.pdf`, pages: 2, render: Incorporation },
  { id: D4.vat, title: "VAT registration certificate", system: "Supplier upload", kind: "pdf", file: `${D4.vat}.pdf`, render: VatCertificate },
  { id: D4.ins, title: "Insurance certificate", system: "Supplier upload", kind: "pdf", file: `${D4.ins}_insurance.pdf`, render: Insurance },
  { id: D4.isq, title: "Security questionnaire", system: "Supplier upload", kind: "pdf", file: `${D4.isq}.pdf`, render: SecurityQuestionnaire },
  { id: D4.bank, title: "Bank confirmation letter", system: "Supplier upload", kind: "pdf", file: `${D4.bank}_bank-letter.pdf`, render: BankLetter },
  { id: D4.gap, title: "Gap list to supplier", system: "Supplier portal", kind: "mail", file: `${D4.invite} PI cover below requirement.msg`, render: () => <GapMail /> },
  { id: D4.san, title: "Sanctions & PEP screening", system: "Screening", kind: "pdf", file: `${D4.san}_screening.pdf`, render: Sanctions },
  { id: D4.credit, title: "Credit report", system: "Credit bureau", kind: "pdf", file: `${D4.credit}_credit-report.pdf`, render: CreditReport },
  { id: D4.cyber, title: "Cyber rating report", system: "Cyber rating", kind: "pdf", file: `${D4.cyber}_cyber-rating.pdf`, render: CyberRating },
  { id: D4.riskRec, title: "Risk decision", system: "Case record", kind: "pdf", file: `${D4.riskRec}_risk-decision.pdf`, render: () => <RiskDecision /> },
];
