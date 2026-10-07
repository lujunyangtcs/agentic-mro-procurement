/**
 * ST01 · UC6 source files — the request form, the purchase order the last
 * paid price came from, the cost-centre budget, the enterprise agreement, the
 * SAM utilisation report, the application owner policy, the assignment
 * record, the requester notice and the value record. Figures come from `IO`;
 * the surrounding print (addresses, clause wording, licence serials) is
 * illustrative dressing so each page reads like the original.
 */

import { IO } from "@/mro/data/stories/io";
import { EmailDoc } from "@/mro/components/docs/sources";
import { Clause, Letterhead, Mark, PdfFooter, PdfSection, PdfTable, Signatures, Stamp, type SourceDoc } from "@/mro/components/story/theatre/pdf";

const gbp = (n: number, dp = 0) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
const day = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const req = IO.uc06.intake.input.request;
const sr = IO.uc06.intake.output.structured_request;
const spendIn = IO.uc06.spendIntelligence.input;
const spendOut = IO.uc06.spendIntelligence.output;
const chanOut = IO.uc06.channelDecision.output;
const vr = chanOut.value_record;
const CLASS = IO.uc06.intake.input.meta.data_classification;
const UNIT = sr.starting_cost_gbp / sr.quantity;
const RESELLER = { id: "SUP-AP-005", name: "Engineering Software Services Ltd", email: "licensing@eng-software.example" };
const ORG = "Client";

/* Seats handed out from the unassigned pool; serials are illustrative. */
const ASSIGNED = Array.from({ length: spendOut.reuse_assessment.reuse_recommended_qty }, (_, i) => ({
  licence: `LIC-CV-${4101 + i * 3}`,
  user: `biw.eng${String(i + 1).padStart(2, "0")}`,
}));

function RequestForm() {
  return (
    <>
      <Letterhead
        org={ORG}
        unit="Procurement front door"
        title="Purchase request"
        number={req.request_id}
        rows={[
          ["Submitted", "07 Oct 2026 10:12 BST"],
          ["Channel", req.channel],
          ["Requester", req.requester.name],
          ["Role", req.requester.role],
          ["Function", req.requester.function],
          ["Site", req.requester.site],
          ["Cost centre", req.requester.cost_centre],
          ["Needed by", day(req.need_by)],
        ]}
      />
      <PdfSection title="1 · What do you need?">
        <p className="text-[13px] font-bold">{req.need}</p>
        <PdfTable
          head={["Item description", "Qty", "Term", "Est. cost"]}
          right={[1, 3]}
          rows={[[req.item_text, "12", "12 months", gbp(req.starting_cost_gbp)]]}
        />
      </PdfSection>
      <PdfSection title="2 · Supplier">
        <p>
          Preferred / known supplier: <span className="font-medium">{req.supplier_hint}</span>
        </p>
      </PdfSection>
      <PdfSection title="3 · Business justification">
        <p className="text-pretty">New body-in-white engineering team onboarding at Gaydon from 20 October 2026. Each engineer needs read access to CAD assemblies for design reviews; no authoring rights required.</p>
      </PdfSection>
      <PdfSection title="4 · Declarations">
        <p>☑ I confirm this request is for business use and the cost centre owner is aware.</p>
        <p>☐ This request replaces an existing contract or subscription.</p>
      </PdfSection>
      <div className="mt-8 flex items-end justify-between">
        <p className="text-[11px] text-[#5a5a5a]">Submitted electronically by {req.requester.name} · no attachments</p>
        <Stamp>Received · {req.request_id}</Stamp>
      </div>
      <PdfFooter left={`${req.request_id} · ${CLASS}`} />
    </>
  );
}

function PurchaseOrder() {
  const qty = 30;
  const net = qty * UNIT;
  return (
    <>
      <Letterhead
        org={ORG}
        unit="Purchasing · Indirect · Software"
        title="Purchase order"
        number="PO-7781223"
        rows={[
          ["PO date", "14 Oct 2025"],
          ["Supplier", `${RESELLER.name} (${RESELLER.id})`],
          ["Buyer", "Indirect procurement · AP-UK"],
          ["Contract ref.", spendIn.data_sources.enterprise_agreement],
          ["Cost centre", "CC-4402"],
          ["GL account", sr.gl],
          ["Payment terms", "60 days net"],
          ["Currency", "GBP"],
        ]}
      />
      <PdfSection title="Deliver to">
        <p>{ORG} Engineering IT · Gaydon engineering centre, Warwickshire · Licences delivered electronically to the SAM tool.</p>
      </PdfSection>
      <PdfSection title="Order lines">
        <PdfTable
          head={["Ln", "Material / description", "Qty", "UoM", "Unit price", "Net value"]}
          right={[2, 4, 5]}
          mark={[0]}
          rows={[["10", `CAD viewer pro – named user, 12-month term (${sr.category.code})`, String(qty), "LIC-YR", gbp(UNIT, 2), gbp(net, 2)]]}
          foot={[
            ["", "", "", "", "Net", gbp(net, 2)],
            ["", "", "", "", "VAT 20%", gbp(net * 0.2, 2)],
            ["", "", "", "", "Total", gbp(net * 1.2, 2)],
          ]}
        />
        <p className="text-[11px] text-[#5a5a5a]">
          Unit price per {spendIn.data_sources.enterprise_agreement} Schedule 2 — <Mark>{gbp(UNIT)} per licence per year</Mark>.
        </p>
      </PdfSection>
      <PdfSection title="Terms">
        <p className="text-pretty">This order is placed under and governed by the enterprise agreement referenced above. Invoices must quote the PO number. Licences are entitlements of {ORG} Engineering IT and may be reassigned internally under clause 6.2 of that agreement.</p>
      </PdfSection>
      <Signatures
        parties={[
          { role: "Approved for the buyer", name: "M. Okafor", date: "14 Oct 2025" },
          { role: "Acknowledged by supplier", name: "S. Patel", date: "15 Oct 2025" },
        ]}
      />
      <PdfFooter left={`PO-7781223 · ${CLASS}`} />
    </>
  );
}

function Budget() {
  return (
    <>
      <Letterhead
        org={ORG}
        unit="Finance · Cost centre reporting"
        title="Budget statement"
        number="BUD-CC4471-FY27"
        rows={[
          ["Cost centre", req.requester.cost_centre],
          ["Owner", `${req.requester.name} · ${req.requester.function}`],
          ["Fiscal year", "FY27 (Apr 2026 – Mar 2027)"],
          ["Run date", "07 Oct 2026 06:00 BST"],
        ]}
      />
      <PdfSection title="Position by GL">
        <PdfTable
          head={["GL", "Description", "Budget", "Actuals", "Committed", "Remaining"]}
          right={[2, 3, 4, 5]}
          mark={[1]}
          rows={[
            ["620100", "Contract labour", "£120,000", "£61,800", "£22,000", "£36,200"],
            [sr.gl, "Software licences – engineering", "£60,000", "£31,400", "£6,000", "£22,600"],
            ["630400", "Test equipment & consumables", "£45,000", "£19,900", "£7,200", "£17,900"],
            ["650900", "Travel & subsistence", "£15,000", "£5,500", "£0", "£9,500"],
          ]}
          foot={[["", "Cost centre total", "£240,000", "£118,600", "£35,200", "£86,200"]]}
        />
      </PdfSection>
      <p className="mt-4 text-[11.5px]">
        <Mark>Remaining available to commit: £86,200</Mark> · Budget check: PASS for requests up to the remaining balance.
      </p>
      <PdfFooter left={`BUD-CC4471-FY27 · ${CLASS}`} />
    </>
  );
}

function Agreement() {
  const ea = spendIn.data_sources.enterprise_agreement;
  return (
    <>
      <Letterhead
        org={ORG}
        unit="Enterprise software licence agreement"
        title="Licence agreement"
        number={ea}
        rows={[
          ["Customer", `${ORG} (incl. Group companies)`],
          ["Licensor / reseller", RESELLER.name],
          ["Product", `${spendIn.query.product} (named user)`],
          ["Entitlement owner", spendIn.query.entitlement_owner],
          ["Term", `01 Jan 2024 – ${day(spendIn.data_sources.renewal_date)}`],
          ["Entitlements", `${spendIn.pool.total_entitlements} licences`],
        ]}
      />
      <PdfSection title="Extract — clauses relied on">
        <Clause n="4.1" title="Grant">The Licensor grants the Customer a non-exclusive, non-transferable licence for the number of Named User Licences in Schedule 1, for internal business purposes only.</Clause>
        <Clause n="5.1" title="Fees">Licence fees are {gbp(UNIT)} per Named User Licence per year, invoiced annually in advance (Schedule 2).</Clause>
        <Clause n="6.1" title="Assignment">Neither party may assign this Agreement to a third party without prior written consent.</Clause>
        <Clause n="6.2" title="Internal reassignment" mark>
          The Customer may reassign any Licence internally between Authorised Users within the Customer Group at no additional charge, provided the licence tier and access level are unchanged. Reassignment shall be recorded in the Customer's software asset management system.
        </Clause>
        <Clause n="6.3" title="Records">The Customer shall keep accurate records of Licence allocation and make them available on reasonable request.</Clause>
        <Clause n="9.2" title="True-down at renewal">At each renewal the Customer may reduce the number of Licences by notice given no later than 30 days before the renewal date.</Clause>
      </PdfSection>
      <PdfSection title="Schedule 1 — entitlements">
        <PdfTable head={["Product", "Tier", "Licences", "Unit / yr"]} right={[2, 3]} rows={[[spendIn.query.product, "Pro · viewer", String(spendIn.pool.total_entitlements), gbp(UNIT)]]} />
      </PdfSection>
      <Signatures
        parties={[
          { role: `For ${ORG}`, name: "J. Whitmore", date: "18 Dec 2023" },
          { role: `For ${RESELLER.name}`, name: "R. Ahmed", date: "19 Dec 2023" },
        ]}
      />
      <PdfFooter left={`${ea} · extract · ${CLASS}`} right="Page 1 of 14" />
    </>
  );
}

function SamReport() {
  const s = spendIn.data_sources.sam_snapshot;
  const p = spendIn.pool;
  return (
    <>
      <Letterhead
        org={ORG}
        unit="Engineering IT · Software asset management"
        title="Utilisation report"
        number={s.id}
        rows={[
          ["Product", spendIn.query.product],
          ["Entitlement owner", spendIn.query.entitlement_owner],
          ["Snapshot as of", "06 Oct 2026 23:00 UTC"],
          ["Agreement", spendIn.data_sources.enterprise_agreement],
        ]}
      />
      <PdfSection title="Pool summary">
        <PdfTable
          head={["Entitlements", "Assigned", "Unassigned", "Inactive > 90 days"]}
          right={[0, 1, 2, 3]}
          mark={[0]}
          rows={[[String(p.total_entitlements), String(p.assigned), <Mark key="u">{p.unassigned}</Mark>, String(p.inactive_90d.length)]]}
        />
      </PdfSection>
      <PdfSection title="Assigned licences with no use in 90 days">
        <PdfTable head={["Licence", "Last used", "Assigned cost centre"]} rows={p.inactive_90d.map((x) => [x.licence_id, day(x.last_used), x.assigned_to_cc])} />
      </PdfSection>
      <p className="mt-4 text-[11px] text-[#5a5a5a]">Inactive = no application launch recorded by the usage agent for 90 consecutive days. Renewal due {day(spendIn.data_sources.renewal_date)}.</p>
      <PdfFooter left={`${s.id} · generated automatically · ${CLASS}`} />
    </>
  );
}

function OwnerPolicy() {
  return (
    <>
      <Letterhead
        org={ORG}
        unit="Engineering IT · Application governance"
        title="Owner policy"
        number="APP-CV-01"
        rows={[
          ["Application", spendIn.query.product],
          ["Application owner", spendIn.query.entitlement_owner],
          ["Version", "2.1 · effective 01 Apr 2026"],
          ["Review cycle", "Annual"],
        ]}
      />
      <PdfSection title="3 · Pre-approved changes">
        <Clause n="3.1" title="Same-tier reassignment" mark>
          Reassigning an unassigned or reclaimed licence of the same tier to a user within the Client Group is pre-approved by the application owner and may be executed automatically, provided no administrative rights are granted.
        </Clause>
        <Clause n="3.2" title="Tier change">Moving a user to a higher tier (e.g. viewer to author) requires explicit owner approval.</Clause>
        <Clause n="3.3" title="Removal">Licences inactive for more than 90 days may be reclaimed after notice to the cost-centre owner.</Clause>
      </PdfSection>
      <Signatures parties={[{ role: "Application owner", name: "D. Kaur", date: "28 Mar 2026" }, { role: "IT governance", name: "L. Brennan", date: "30 Mar 2026" }]} />
      <PdfFooter left={`APP-CV-01 · ${CLASS}`} />
    </>
  );
}

function Assignment() {
  return (
    <>
      <Letterhead
        org={ORG}
        unit="Engineering IT · SAM tool"
        title="Assignment record"
        number="SAM-ASSIGN-77120"
        rows={[
          ["Executed", "07 Oct 2026 10:12 BST"],
          ["Executed by", `Channel Decision Agent (${chanOut.audit.model_version})`],
          ["Authority", "APP-CV-01 §3.1 · EA clause 6.2"],
          ["Case", chanOut.meta.case_id],
          ["Source", spendOut.reuse_assessment.source],
          ["Assigned to", req.requester.cost_centre],
        ]}
      />
      <PdfSection title={`Licences assigned · ${ASSIGNED.length}`}>
        <PdfTable head={["#", "Licence", "User", "Tier", "Status"]} rows={ASSIGNED.map((a, i) => [String(i + 1), a.licence, a.user, "Pro · viewer", "Active"])} />
      </PdfSection>
      <p className="mt-4 text-[11.5px]">
        Pool after assignment: {spendIn.pool.assigned + ASSIGNED.length} assigned · {spendIn.pool.unassigned - ASSIGNED.length} unassigned · <Mark>no purchase order raised</Mark>.
      </p>
      <PdfFooter left={`SAM-ASSIGN-77120 · ${CLASS}`} />
    </>
  );
}

function ValueRecord() {
  return (
    <>
      <Letterhead
        org={ORG}
        unit="Value assurance · Flow 5"
        title="Value record"
        number={vr.value_record_id}
        rows={[
          ["Case", chanOut.meta.case_id],
          ["Request", req.request_id],
          ["Saving type", vr.saving_type],
          ["Recorded", "07 Oct 2026 10:12 BST"],
        ]}
      />
      <PdfSection title="Measurement">
        <PdfTable
          head={["Baseline", "Actual", "Avoided", "Method"]}
          right={[0, 1, 2]}
          mark={[0]}
          rows={[[gbp(vr.baseline_gbp), gbp(vr.actual_gbp), gbp(vr.avoided_gbp), vr.measurement]]}
        />
        <p className="text-[11px] text-[#5a5a5a]">
          Baseline = {sr.quantity} × {gbp(UNIT)} last paid unit price (PO-7781223).
        </p>
      </PdfSection>
      <PdfSection title="Related pipeline">
        <p>
          {spendOut.pipeline_signal.pipeline_item} · {spendOut.pipeline_signal.lever} · est. {gbp(spendOut.pipeline_signal.est_value_gbp)} → {spendOut.pipeline_signal.to}
        </p>
      </PdfSection>
      <PdfSection title="Sign-off">
        <PdfTable head={["Step", "Owner", "Status"]} rows={[["Value Agent", "Flow 5 · 1.0", "Recorded"], ["Finance BP sign-off", `${ORG} Finance`, "Awaiting"]]} />
      </PdfSection>
      <PdfFooter left={`${vr.value_record_id} · ${CLASS}`} />
    </>
  );
}

function Notice() {
  return (
    <EmailDoc
      from="Procurement Assistant"
      fromAddr="procurement-assistant@client.example"
      to={`${req.requester.name} <priya.natarajan@client.example>`}
      sent="Wed 07/10/2026 10:12"
      subject={`${req.request_id} fulfilled — 12 CAD viewer pro licences assigned`}
      tone="outbound"
      highlight="no purchase order was needed"
      lines={[
        `Hi Priya,`,
        `Your request ${req.request_id} for ${sr.quantity} CAD viewer pro licences has been fulfilled from the existing ${ORG} licence pool, so no purchase order was needed.`,
        `The licences are assigned to ${req.requester.cost_centre} under record SAM-ASSIGN-77120. Your team can sign in with their usual ${ORG} accounts from today.`,
        `Licence keys: ${ASSIGNED.slice(0, 3).map((a) => a.licence).join(", ")} … (12 in total, listed in the attached record).`,
        `No action is needed from you. Reply to this message if anyone has trouble signing in.`,
        `Procurement Assistant · on behalf of Indirect Procurement`,
      ]}
    />
  );
}

export const UC06_DOCS: SourceDoc[] = [
  { id: req.request_id, title: "Purchase request form", system: "Front door", kind: "pdf", file: `${req.request_id}_purchase-request.pdf`, render: RequestForm },
  { id: "PO-7781223", title: "Purchase order (last paid)", system: "ERP", kind: "pdf", file: "PO-7781223.pdf", render: PurchaseOrder },
  { id: "BUD-CC4471-FY27", title: "Cost-centre budget", system: "Finance", kind: "pdf", file: "BUD-CC4471-FY27.pdf", render: Budget },
  { id: spendIn.data_sources.sam_snapshot.id, title: "Licence utilisation report", system: "SAM tool", kind: "pdf", file: `${spendIn.data_sources.sam_snapshot.id}_utilisation.pdf`, render: SamReport },
  { id: spendIn.data_sources.enterprise_agreement, title: "Licence agreement", system: "Contracts", kind: "pdf", file: `${spendIn.data_sources.enterprise_agreement}_licence-agreement.pdf`, pages: 14, render: Agreement },
  { id: "APP-CV-01", title: "Application owner policy", system: "IT governance", kind: "pdf", file: "APP-CV-01_owner-policy.pdf", render: OwnerPolicy },
  { id: "SAM-ASSIGN-77120", title: "Licence assignment record", system: "SAM tool", kind: "pdf", file: "SAM-ASSIGN-77120.pdf", render: Assignment },
  { id: "MAIL-118204", title: "Requester notice", system: "Teams / e-mail", kind: "mail", file: `${req.request_id} fulfilled.msg`, render: Notice },
  { id: vr.value_record_id, title: "Value record", system: "Value assurance", kind: "pdf", file: `${vr.value_record_id}.pdf`, render: ValueRecord },
];
