/**
 * Faithful order-to-cash evidence documents — the machine files and signed
 * paperwork the O2C agents actually read on a deduction dispute. Built on the
 * same SAP doc chrome (DocShell · DocTitleBand · SectionBand · Field) as the rest
 * of the pipeline, with real X12 segment shapes (820 BPR/RMR/ADX, 214/856) and a
 * signed proof-of-delivery so a controller trusts the recovery. Presentational only.
 */

import { DocShell, DocTitleBand, SectionBand, Field } from "../sap/parts";

/* ── EDI 820 · Payment Order / Remittance Advice ──────────────────────────────
 * The raw remittance the bank passes to cash application — BPR payment header,
 * RMR open-item reference, and the ADX adjustment loop that carries the $208,400
 * shortage deduction (reason code SC). The agent parses this to apply the cash.
 */
export function Edi820Doc() {
  const segments = [
    "ST*820*0001",
    "BPR*C*1142600.00*C*ACH*CTX*01*021000021*DA*4471882*1842736*PR*01*031201360*DA*0000610248*20260609",
    "TRN*1*BRF-REM-4471",
    "REF*EV*BLUERIDGE-AP-GATEWAY",
    "DTM*097*20260609",
    "N1*PR*BLUERIDGE FOODS CO*92*0000610248",
    "N1*PE*NORTHGATE PAPER CO*92*NG01",
    "ENT*1",
    "RMR*IV*9100488*PO*1142600.00*1351000.00",
    "REF*PO*55-22418",
    "DTM*003*20260418",
    "ADX*-208400.00*SC*CR*BRF-CB-2218",
    "SE*13*0001",
  ];
  return (
    <DocShell>
      <DocTitleBand
        number="820 · BRF-REM-4471"
        status="Received"
        docType="Payment order / remittance advice"
        system="EDI · X12 820 · 004010"
        createdOn="2026-06-09 · 08:12"
        createdBy="Wells Fargo lockbox"
      />
      <SectionBand>Extracted · payment & adjustment</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Payment method" value="ACH · CTX (BPR04)" mono />
        <Field label="Amount paid" value="$1,142,600.00 (BPR02)" mono />
        <Field label="Trace / TRN" value="BRF-REM-4471" mono />
        <Field label="Payer (N1·PR)" value="BlueRidge Foods · 0000610248" />
        <Field label="Open item (RMR)" value="9100488 · gross $1,351,000.00" mono />
        <Field label="Adjustment (ADX)" value="−$208,400.00 · reason SC" mono />
      </div>
      <SectionBand>Raw segments · X12 820</SectionBand>
      <pre className="px-4 py-3 text-[11px] leading-[1.75] text-ink tabular-nums overflow-x-auto whitespace-pre bg-[#fbfcfd]">
        {segments.join("\n")}
      </pre>
      <div className="px-4 py-2 border-t border-divider text-[10.5px] text-[#5b6b7b]">
        ADX*-208400.00*<span className="font-bold text-mark-red">SC</span>*CR — claim adjustment, reason{" "}
        <span className="font-bold">SC = item shortage</span>; chargeback ref BRF-CB-2218.
      </div>
    </DocShell>
  );
}

/* ── Proof of delivery · signed receipt (EDI 214 source) ──────────────────────
 * The pivot of the dispute: a signed delivery receipt confirming the full 8,200
 * units were received, which refutes the customer's shortage claim.
 */
export function PodDoc() {
  return (
    <DocShell>
      <DocTitleBand
        number="POD 80017734"
        status="Delivered · signed"
        docType="Proof of delivery · signed receipt"
        system="UPS · EDI 214"
        createdOn="2026-05-12 · 14:20"
        createdBy="Carrier ePOD"
      />
      <SectionBand>Shipment</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Ship-to" value="BlueRidge Foods · Greensboro DC" />
        <Field label="Bill of lading" value="BOL 4471-22418" mono />
        <Field label="Sales order" value="SO 55-22418 · item 10" mono />
        <Field label="Material" value="Corrugated · bulk · 32 ECT" />
        <Field label="Ordered" value="8,200 EA · 205 pallets" mono />
        <Field label="Carrier / PRO" value="UPS · 4471" mono />
      </div>
      <SectionBand>Delivery confirmation</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Delivered (214)" value="8,200 EA · in full" mono />
        <Field label="Delivered on" value="2026-05-12 · 14:20" mono />
        <Field label="Pieces / pallets" value="8,200 EA · 205 pallets" mono />
        <Field label="Seal intact" value="Yes · seal 0099421" mono />
        <Field label="Lading exception" value="None reported" />
        <Field label="OS&D noted" value="None · clean receipt" />
      </div>

      {/* Signature box — received in full, signed at the dock */}
      <SectionBand>Receiver acknowledgement</SectionBand>
      <div className="px-4 py-4">
        <div className="rounded-md border border-[#cfd6de] bg-[#fbfcfd] overflow-hidden">
          <div className="px-4 pt-3 pb-1 text-[12px] text-ink">
            Received in good order — <span className="font-semibold">full count, no shortage or damage</span>.
          </div>
          <div className="grid grid-cols-[1fr_auto] items-end gap-4 px-4 pb-3 pt-2">
            <div>
              <div
                className="text-[30px] leading-none text-[#1f3a5f] pl-1 pb-1"
                style={{ fontFamily: "'Snell Roundhand','Brush Script MT','Segoe Script',cursive" }}
              >
                Marcus&nbsp;Carrow
              </div>
              <div className="border-t border-[#9aa6b2] pt-1 flex items-center justify-between">
                <span className="text-[10.5px] uppercase tracking-[0.06em] text-[#5b6b7b]">
                  Receiver signature
                </span>
                <span className="text-[11px] text-ink">
                  M. Carrow · Receiving Lead · Greensboro DC
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="w-[92px] h-[58px] rounded border border-dashed border-[#b6bfc9] grid place-items-center text-[9px] uppercase tracking-[0.08em] text-[#8a96a2] leading-tight text-center">
                Dock<br />stamp<br />05·12
              </div>
            </div>
          </div>
        </div>
      </div>
    </DocShell>
  );
}

/* ── Certified scale / weight ticket ──────────────────────────────────────────
 * Independent corroboration: the truck scale ticket nets to the full tonnage,
 * so the shipment that left was the full 8,200 units — the shortage can't be ours.
 */
export function WeightTicketDoc() {
  return (
    <DocShell>
      <DocTitleBand
        number="WT-44712"
        status="Certified"
        docType="Scale ticket · certified weighmaster"
        system="Greensboro DC · Scale 2"
        createdOn="2026-05-12 · 06:48"
        createdBy="Weighmaster · cert NC-2207"
      />
      <SectionBand>Vehicle & load</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Carrier" value="UPS" />
        <Field label="Tractor / trailer" value="IRF-1184 / VAN-5520" mono />
        <Field label="Bill of lading" value="BOL 4471-22418" mono />
        <Field label="Product" value="Corrugated · bulk" />
        <Field label="Pieces" value="8,200 EA · 205 pallets" mono />
        <Field label="Sales order" value="SO 55-22418" mono />
      </div>
      <SectionBand>Certified weights</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Gross weight" value="62,400 lb" mono />
        <Field label="Tare weight" value="20,580 lb" mono />
        <Field label="Net weight" value="41,820 lb" mono />
        <Field label="Expected net" value="41,820 lb · ±0.3%" mono />
        <Field label="Variance" value="0 lb · matches manifest" mono />
        <Field label="Weighed at" value="2026-05-12 · 06:48" mono />
      </div>
      <div className="px-4 py-2.5 border-t border-divider flex items-center justify-between">
        <span className="text-[10.5px] uppercase tracking-[0.06em] text-[#5b6b7b]">
          Certified weighmaster
        </span>
        <span
          className="text-[20px] text-[#1f3a5f] leading-none"
          style={{ fontFamily: "'Snell Roundhand','Brush Script MT','Segoe Script',cursive" }}
        >
          D. Pruitt
        </span>
      </div>
    </DocShell>
  );
}
