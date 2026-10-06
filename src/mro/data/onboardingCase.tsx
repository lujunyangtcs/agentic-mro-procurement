/**
 * Finding a supplier, then letting one in.
 *
 * Two beats in one run. First the sourcing beat: a category has no approved
 * supplier at all, so a person kicks off a web search, the agent writes the
 * request for quote, drafts the emails, and the quotes come back — one fast,
 * one after a negotiation. The buyer picks the winner.
 *
 * Then the onboarding beat, which is where the real work is. The chosen
 * supplier submits its papers in Spanish; the agent reads them, translates
 * them, checks that every mandatory field is actually there, runs the
 * compliance and risk screens, and prepares the supplier master record. It
 * creates nothing: the last step is one card a person signs.
 *
 * The bank details are the point of the last check. A supplier's account
 * number is the single most attacked field in procurement, so the agent
 * verifies it against the certificate and still refuses to set it without a
 * callback on a number nobody in this conversation supplied.
 */

import type { RunStep } from "@/mro/data/runSteps";
import {
  VendorRecordDoc,
  RecordDoc,
  ApprovalRoutingDoc,
} from "@/mro/components/docs/pr/SapDocs";
import { MultilingualEmailDoc } from "@/mro/components/docs/pr/MultilingualEmail";
import { LookupSheetDoc } from "@/mro/components/docs/pr/LookupSheet";
import { DocShell, DocTitleBand, SectionBand, Field } from "@/mro/components/docs/sap/parts";

/* The one place these numbers are written down. */
const CAT = "Robotic cell calibration and certification services";
const RFQ = "RFQ-49010";
const WINNER = "Calibraciones Ibéricas de Precisión";
const RUNNER = "Nordpräzision Robotik";
const WIN_PRICE = "$38,400";
const RUN_PRICE = "$44,900";
const VENDOR_NO = "0001000411";

/* ── The sourcing beat ──────────────────────────────────────────────────── */

const rfqDoc = (
  <RecordDoc
    d={{
      tcode: "ME41N",
      tname: "Create RFQ",
      number: RFQ,
      status: "Sent · awaiting quotes",
      docType: `Request for quotation · ${CAT}`,
      system: "Purchasing · RFQ",
      createdOn: "2026-07-14 · 09:40",
      createdBy: "Sourcing & contract agent",
      sections: [
        {
          band: "RFQ header",
          rows: [
            { label: "Category", value: CAT },
            { label: "Scope", value: "Recalibrate two robotic weld cells · Riomar" },
            { label: "Window", value: "2026-09-07 → 2026-09-25 · plant shutdown" },
            { label: "Terms sought", value: "Net 30 · fixed price" },
          ],
        },
        {
          band: "Suppliers solicited",
          rows: [
            { label: WINNER, value: "Web · specialist contractor · Spain" },
            { label: RUNNER, value: "Web · specialist contractor · Germany" },
            { label: "Approved list", value: "No approved supplier in this category" },
          ],
        },
      ],
    }}
  />
);

const buildQuote = (q: {
  vendor: string;
  quoteNo: string;
  issued: string;
  validUntil: string;
  total: string;
  terms: { label: string; value: string }[];
  note: string;
}) => (
  <DocShell>
    <DocTitleBand
      number={q.quoteNo}
      status="Issued"
      docType="Vendor quotation · PDF"
      system={q.vendor}
      createdOn={q.issued}
      createdBy="Sales desk"
    />
    <SectionBand>Quotation</SectionBand>
    <div className="grid grid-cols-3 gap-x-4 gap-y-3 px-4 py-3">
      <Field label="Quote ref" value={q.quoteNo} mono />
      <Field label="In response to" value={RFQ} mono />
      <Field label="Buyer" value="Orvantec" />
      <Field label="Valid until" value={q.validUntil} mono />
      <Field label="Scope" value="Recalibrate two robotic weld cells" />
      <Field label="Total quoted" value={q.total} mono />
    </div>
    <SectionBand>Commercial terms</SectionBand>
    <div className="grid grid-cols-3 gap-x-4 gap-y-3 px-4 py-3">
      {q.terms.map((t) => (
        <Field key={t.label} label={t.label} value={t.value} mono />
      ))}
    </div>
    <div className="border-t border-divider px-4 py-3 text-[12px] leading-snug text-mute">{q.note}</div>
  </DocShell>
);

const winnerQuoteDoc = buildQuote({
  vendor: WINNER,
  quoteNo: "QT-IRI-2201",
  issued: "2026-07-16 · 15:20",
  validUntil: "2026-08-15",
  total: WIN_PRICE,
  terms: [
    { label: "Price basis", value: "Fixed price · both cells" },
    { label: "Payment terms", value: "Net 30" },
    { label: "Mobilisation", value: "Within the shutdown window" },
  ],
  note: "Opened at $41,200 and revised to $38,400 after we asked them to match the shutdown window without overtime.",
});

const runnerQuoteDoc = buildQuote({
  vendor: RUNNER,
  quoteNo: "QT-NSS-8830",
  issued: "2026-07-16 · 11:05",
  validUntil: "2026-09-01",
  total: RUN_PRICE,
  terms: [
    { label: "Price basis", value: "Fixed price · both cells" },
    { label: "Payment terms", value: "Net 45" },
    { label: "Mobilisation", value: "Two weeks' notice" },
  ],
  note: "Firm price, longer payment terms, and mobilisation that runs past the start of the shutdown.",
});

const quoteComparisonDoc = (
  <RecordDoc
    d={{
      tcode: "ME47",
      tname: "Maintain Quotations",
      number: RFQ,
      status: "Quotes in · comparison ready",
      docType: "RFQ quotation comparison",
      system: "Purchasing · RFQ",
      createdOn: "2026-07-16 · 15:24",
      createdBy: "Sourcing & contract agent",
      sections: [
        {
          band: "Quotes received",
          rows: [
            { label: `${WINNER} · negotiated`, value: `${WIN_PRICE} · Net 30 · fits the shutdown window` },
            { label: `${RUNNER} · firm`, value: `${RUN_PRICE} · Net 45 · mobilises two weeks out` },
            { label: "Difference", value: "$6,500 · 14% below the alternative" },
          ],
        },
      ],
      determination: {
        ok: true,
        text: `${WINNER} is $6,500 cheaper and is the only one that can mobilise inside the shutdown window. Recommended — subject to onboarding, because they are not yet a supplier of ours.`,
      },
    }}
  />
);

/* ── The papers the winner submits ──────────────────────────────────────── */

const submissionEmail = (
  <MultilingualEmailDoc
    from={`${WINNER} · Administración`}
    fromAddr="admin@calibracionesibericas.example"
    to="Supplier onboarding"
    sent="2026-07-17 · 10:05"
    sourceLang="es"
    original={{
        subject: "Documentación de alta de proveedor — Calibraciones Ibéricas",
      lines: [
        "Adjuntamos la documentación solicitada para darnos de alta como proveedor: escritura de constitución, certificado de identificación fiscal, póliza de responsabilidad civil y certificado bancario.",
        "Nuestro número de identificación fiscal es ESB87451209 y la cuenta para pagos figura en el certificado bancario adjunto.",
        "Quedamos a su disposición para cualquier documento adicional.",
      ],
    }}
    translated={{
        subject: "Supplier registration documents — Calibraciones Ibéricas",
      lines: [
        "Attached is the documentation you asked for so we can be set up as a supplier: certificate of incorporation, tax identification certificate, public liability insurance policy and bank certificate.",
        "Our tax identification number is ESB87451209 and the account for payments is shown on the attached bank certificate.",
        "We are happy to provide any further documents you need.",
      ],
    }}
  />
);

const extractedFieldsDoc = (
  <RecordDoc
    d={{
      tcode: "BP",
      tname: "Maintain Business Partner",
      number: "DRAFT-411",
      status: "Extracted · not yet created",
      docType: "Supplier registration · extracted fields",
      system: "Business partner · onboarding",
      createdOn: "2026-07-17 · 10:11",
      createdBy: "Master Data agent",
      sections: [
        {
          band: "Company",
          rows: [
            { label: "Legal name", value: "Calibraciones Ibéricas de Precisión S.L." },
            { label: "Trading name", value: WINNER },
            { label: "Registered address", value: "Polígono Industrial Les Corts 14, Valencia, Spain" },
            { label: "Incorporated", value: "2011-04-08 · certificate of incorporation" },
          ],
        },
        {
          band: "Tax & registration",
          rows: [
            { label: "Tax ID", value: "ESB87451209 · read from the tax certificate" },
            { label: "VAT status", value: "EU VAT registered · reverse charge applies" },
            { label: "Company register", value: "Valencia · sheet V-118432" },
          ],
        },
        {
          band: "Insurance",
          rows: [
            { label: "Public liability", value: "$6,000,000 · policy IB-PL-77120" },
            { label: "Valid to", value: "2027-03-31" },
          ],
        },
      ],
      determination: {
        ok: true,
        text: "Every field the supplier master needs was found in the submitted documents and translated from Spanish. Nothing was typed by hand and nothing was inferred.",
      },
    }}
  />
);

const mandatoryCheckDoc = (
  <LookupSheetDoc
    sheets={[
      {
        file: "supplier-master-required.xlsx",
        tab: "Mandatory fields",
        columns: ["Field", "Required", "Found in", "Status"],
        usedNote: "→ every mandatory field present",
        rows: [
          { cells: ["Legal name", "Yes", "Certificate of incorporation", "Present"], matched: true },
          { cells: ["Registered address", "Yes", "Certificate of incorporation", "Present"], matched: true },
          { cells: ["Tax identification", "Yes", "Tax certificate", "Present"], matched: true },
          { cells: ["Public liability cover", "Yes", "Insurance policy", "Present"], matched: true },
          { cells: ["Bank account", "Yes", "Bank certificate", "Present · unverified"], flag: true },
        ],
      },
    ]}
    footer={
      <>
        Four of the five mandatory fields are proven by a document. The bank account is present but
        marked unverified — a document alone is never enough to set where money goes.
      </>
    }
  />
);

const complianceDoc = (
  <RecordDoc
    d={{
      tcode: "SLS",
      tname: "Supplier Screening",
      number: "SCR-49010",
      status: "Screened · one item to note",
      docType: "Compliance & risk screening",
      system: "Third-party risk",
      createdOn: "2026-07-17 · 10:18",
      createdBy: "Master Data agent",
      sections: [
        {
          band: "Screens run",
          rows: [
            { label: "Sanctions lists", value: "No match · EU, UK, US consolidated lists" },
            { label: "Adverse media", value: "No match" },
            { label: "Beneficial ownership", value: "Two owners disclosed · both named on the register extract" },
            { label: "Insolvency register", value: "No filings" },
          ],
        },
        {
          band: "Risk position",
          rows: [
            { label: "Country risk", value: "Spain · low" },
            { label: "Category concentration", value: "First supplier in this category — no concentration" },
            { label: "Financial standing", value: "Filed accounts to 2025 · no adverse indicators" },
            { label: "To note", value: "Insurance expires 2027-03-31 · renewal reminder set" },
          ],
        },
      ],
      determination: {
        ok: true,
        text: "Nothing on the screens blocks onboarding. The only open item is the insurance renewal date, which is diarised rather than escalated.",
      },
    }}
  />
);

const masterDraftDoc = (
  <VendorRecordDoc
    v={{
      number: VENDOR_NO,
      name: WINNER,
      status: "Prepared · awaiting a person",
      createdOn: "2026-07-17 · 10:24",
      createdBy: "Master Data agent",
      general: [
        { label: "Legal name", value: "Calibraciones Ibéricas de Precisión S.L." },
        { label: "Address", value: "Polígono Industrial Les Corts 14, Valencia, Spain" },
        { label: "Tax ID", value: "ESB87451209" },
        { label: "Correspondence language", value: "Español" },
      ],
      purchasing: [
        { label: "Purchasing org", value: "1000 · Orvantec Procurement" },
        { label: "Category", value: CAT },
        { label: "Payment terms", value: "Net 30 · as quoted" },
        { label: "Bank account", value: "Held back — verified by callback, never from a message" },
      ],
      approval: {
        ok: false,
        text: "Prepared, not created. A person signs this card, and the bank account is set only after the callback to the number on the company register — not the one in the email.",
      },
    }}
  />
);

const onboardingApprovalDoc = (
  <ApprovalRoutingDoc
    r={{
      number: "WF-49010-VEN",
      status: "Awaiting one signature",
      createdOn: "2026-07-17 · 10:26",
      createdBy: "Master Data agent",
      summary: [
        { label: "Supplier", value: WINNER },
        { label: "Category", value: CAT },
        { label: "First order", value: `${RFQ} · ${WIN_PRICE}` },
      ],
      chain: [
        { level: "L1", approver: "Category manager", role: "Procurement", limit: "New supplier", status: "pending", when: "Awaiting" },
        { level: "L2", approver: "Compliance", role: "Risk", limit: "Screened clear", status: "approved", when: "Auto · screens clear" },
      ],
      validation: {
        ok: true,
        text: "Everything is prepared and evidenced. One signature creates the supplier; the bank account stays blank until the callback is done.",
      },
    }}
  />
);

/* ── The run ────────────────────────────────────────────────────────────── */

export const onboardingSteps: RunStep[] = [
  {
    id: "sourcing",
    agentName: "Sourcing & contract agent",
    n: 1,
    title: "Find suppliers & get quotes",
    sub: "Searches the market, writes the RFQ, collects the quotes",
    aiThought:
      "Riomar needs two robotic weld cells recalibrated during the September shutdown, and we have no approved supplier for robotic calibration at all. There is nothing to compare against, so let me search the market and put a proper request for quote out.",
    reasoning: [
      "No approved supplier in this category — the buy cannot be routed to anyone",
      "Searching the market for specialist robotic calibration contractors",
      "Writing the request for quote from the shutdown scope",
      "Drafting the emails for you to send",
      "Collecting the quotes as they come back",
    ],
    docLabel: `${RFQ} · quotation comparison`,
    document: quoteComparisonDoc,
    sources: [
      { id: "onb-rfq", label: RFQ, meta: "ME41N · request for quote", kind: "sap", body: rfqDoc },
      { id: "onb-compare", label: `${RFQ} · quotes`, meta: "ME47 · comparison", kind: "sap", body: quoteComparisonDoc },
    ],
    recommendation: `Two quotes in. ${WINNER} at ${WIN_PRICE} is $6,500 below the alternative and is the only one that mobilises inside the shutdown. Recommended — but they are not a supplier of ours yet, so onboarding comes first.`,
    rfq: {
      fields: [
        { label: "Category", value: CAT },
        { label: "Scope", value: "Recalibrate two robotic weld cells · Riomar" },
        { label: "Window", value: "2026-09-07 → 2026-09-25 · plant shutdown" },
        { label: "Terms sought", value: "Net 30 · fixed price" },
        { label: "Approved suppliers", value: "None in this category" },
        { label: "Suppliers to solicit", value: "2 · found on the web" },
      ],
      search: {
        query: "robotic cell calibration and certification contractors · Spain and Germany",
        results: [
          { name: WINNER, via: "web · specialist contractor", note: "Valencia · robot calibration" },
          { name: RUNNER, via: "web · specialist contractor", note: "Hamburg · calibration services" },
          { name: "Apex Industrial Supply", via: "supplier master", note: "parts only — does not do this work" },
        ],
      },
      rfqDoc,
      vendors: [
        {
          id: "iberica",
          name: WINNER,
          via: "specialist contractor · web",
          draft: {
            subject: `${RFQ} — robotic cell recalibration, Riomar · request for quote`,
            lines: [
              "Please quote for recalibrating two robotic weld cells during our September shutdown (7–25 September), fixed price, Net 30.",
            ],
          },
          negotiating: true,
          quote: {
            headline: `${WIN_PRICE} · fits the shutdown window`,
            lines: ["Opened at $41,200 · revised to $38,400 · Net 30."],
          },
          reply: {
            from: `${WINNER} · Comercial`,
            fromAddr: "comercial@calibracionesibericas.example",
            receivedMeta: "Outlook · 2026-07-16 · 15:20",
            subject: `RE: ${RFQ} — our quotation`,
            lines: [
              "Thank you for the enquiry — our quotation for recalibrating both cells is attached.",
              "We opened at $41,200 and have revised to $38,400 after arranging the crew so the work fits inside your shutdown without overtime. Payment terms Net 30.",
              "We are not currently registered as your supplier; we can send our registration documents straight away.",
            ],
            attachment: winnerQuoteDoc,
            attachmentLabel: "QT-IRI-2201 · quotation",
            headline: `${WINNER} sent their quote`,
            previewNote: "PDF · click to preview the quotation",
            cta: "Back to the quotes",
          },
        },
        {
          id: "nordprecision",
          name: RUNNER,
          via: "specialist contractor · web",
          draft: {
            subject: `${RFQ} — robotic cell recalibration, Riomar · request for quote`,
            lines: [
              "Please quote for recalibrating two robotic weld cells during our September shutdown (7–25 September), fixed price, Net 30.",
            ],
          },
          quote: {
            headline: `${RUN_PRICE} · mobilises two weeks out`,
            lines: ["Firm price · Net 45 · start date runs past the shutdown."],
          },
          reply: {
            from: `${RUNNER} · Sales`,
            fromAddr: "sales@nordpraezisionrobotik.example",
            receivedMeta: "Outlook · 2026-07-16 · 11:05",
            subject: `RE: ${RFQ} — quotation`,
            lines: [
              "Please find our quotation attached for the two cells.",
              "Firm price $44,900, payment terms Net 45. We would need two weeks' notice to mobilise, which puts our start after the seventh.",
              "Quote valid until 1 September.",
            ],
            attachment: runnerQuoteDoc,
            attachmentLabel: "QT-NSS-8830 · quotation",
            headline: `${RUNNER} sent their quote`,
            previewNote: "PDF · click to preview the quotation",
            cta: "Back to the quotes",
          },
        },
      ],
    },
  },
  {
    id: "vendor",
    agentName: "Master Data agent",
    n: 2,
    title: "Read the submitted documents",
    sub: "Reads the supplier's papers and translates them",
    aiThought:
      "The winning contractor has sent their registration pack — in Spanish, as four separate documents. Let me read them and pull out the fields the supplier master actually needs.",
    reasoning: [
      "Reading the registration email and its four attachments",
      "Translating from Español",
      "Certificate of incorporation → legal name, address, incorporation date",
      "Tax certificate → tax identification and VAT status",
      "Insurance policy → cover and expiry",
    ],
    docLabel: "DRAFT-411 · extracted fields",
    document: extractedFieldsDoc,
    sources: [
      { id: "onb-email", label: "Registration pack", meta: "submitted in Español · 10:05", kind: "email", body: submissionEmail },
      { id: "onb-extract", label: "DRAFT-411", meta: "extracted fields", kind: "master", body: extractedFieldsDoc },
    ],
    recommendation:
      "Every field the supplier master needs was found in the documents themselves and translated. Nothing was typed by hand, so there is nothing to mistype.",
    stages: [
      {
        sourceId: "onb-email",
        reasoning: "Reading the submission and translating it",
        title: "The submission",
        fields: [
          { label: "Received", value: "2026-07-17 · 10:05" },
          { label: "Written in", value: "Español · translated on read" },
          { label: "Documents", value: "Incorporation · tax · insurance · bank" },
          { label: "Tax ID stated", value: "ESB87451209" },
        ],
      },
      {
        sourceId: "onb-extract",
        reasoning: "Pulling the supplier-master fields out of the documents",
        title: "Extracted fields",
        fields: [
          { label: "Legal name", value: "Calibraciones Ibéricas de Precisión S.L." },
          { label: "Registered address", value: "Polígono Industrial Les Corts 14, Valencia" },
          { label: "Tax ID", value: "ESB87451209" },
          { label: "Public liability", value: "$6,000,000 · to 2027-03-31" },
        ],
      },
    ],
  },
  {
    id: "vendor",
    agentName: "Master Data agent",
    n: 3,
    title: "Check nothing is missing",
    sub: "Tests every mandatory field against the documents",
    aiThought:
      "A supplier record that is missing a field fails later, usually when someone is trying to pay them. Let me check each mandatory field against the document that proves it.",
    reasoning: [
      "Reading the mandatory-field list for a supplier master",
      "Matching each field to the document that evidences it",
      "Four of five proven by a document",
      "Bank account present but not verifiable from paper alone",
    ],
    docLabel: "Mandatory-field check",
    document: mandatoryCheckDoc,
    sources: [
      { id: "onb-mandatory", label: "Mandatory fields", meta: "supplier-master-required.xlsx", kind: "master", body: mandatoryCheckDoc },
    ],
    recommendation:
      "Nothing is missing. The bank account is flagged as unverified on purpose — it is set by callback, never from a document or a message.",
    stages: [
      {
        sourceId: "onb-mandatory",
        reasoning: "Testing each mandatory field against its evidence",
        title: "Mandatory fields",
        fields: [
          { label: "Legal name", value: "Present · certificate of incorporation" },
          { label: "Registered address", value: "Present · certificate of incorporation" },
          { label: "Tax identification", value: "Present · tax certificate" },
          { label: "Public liability cover", value: "Present · insurance policy" },
          { label: "Bank account", value: "Present · unverified until callback" },
        ],
      },
    ],
  },
  {
    id: "vendor",
    agentName: "Master Data agent",
    n: 4,
    title: "Compliance & risk screening",
    sub: "Sanctions, ownership, standing and category risk",
    aiThought:
      "Before this supplier can be paid anything, they have to pass the screens. Sanctions, who actually owns them, whether they are solvent, and what taking them on does to our risk position.",
    reasoning: [
      "Sanctions screening against the consolidated lists",
      "Adverse-media search",
      "Beneficial ownership against the register extract",
      "Insolvency and filed accounts",
      "Category concentration — first supplier here, so none",
    ],
    docLabel: "SCR-49010 · screening",
    document: complianceDoc,
    sources: [
      { id: "onb-screen", label: "SCR-49010", meta: "third-party risk screening", kind: "policy", body: complianceDoc },
    ],
    recommendation:
      "Clear on every screen. One thing diarised rather than escalated: the liability insurance expires 2027-03-31, so a renewal reminder is set against the record.",
    stages: [
      {
        sourceId: "onb-screen",
        reasoning: "Running the screens and reading the results",
        title: "Screening result",
        fields: [
          { label: "Sanctions", value: "No match" },
          { label: "Adverse media", value: "No match" },
          { label: "Beneficial ownership", value: "Two owners · both on the register" },
          { label: "Insolvency", value: "No filings" },
          { label: "Insurance expiry", value: "2027-03-31 · reminder set" },
        ],
      },
    ],
  },
  {
    id: "vendor",
    agentName: "Master Data agent",
    n: 5,
    title: "Prepare the supplier record",
    sub: "Fills the master record and leaves the bank details blank",
    aiThought:
      "Everything checks out, so I can prepare the supplier master. I will fill every field I can evidence — and deliberately leave the bank account empty, because that one is set by callback, not by a document.",
    reasoning: [
      "Filling the supplier master from the extracted fields",
      "Setting purchasing org, category and the quoted payment terms",
      "Leaving the bank account blank — callback required",
      "Preparing one approval card for a person",
    ],
    docLabel: `${VENDOR_NO} · prepared record`,
    document: masterDraftDoc,
    sources: [
      { id: "onb-master", label: VENDOR_NO, meta: "supplier master · prepared", kind: "master", body: masterDraftDoc },
      { id: "onb-approval", label: "WF-49010-VEN", meta: "one signature", kind: "policy", body: onboardingApprovalDoc },
    ],
    recommendation: `Prepared, not created. One signature sets ${WINNER} up as a supplier and releases the ${WIN_PRICE} order; the bank account is set separately, after a callback to the number on the company register rather than the one in the email.`,
    stages: [
      {
        sourceId: "onb-master",
        reasoning: "Filling every field that a document proves",
        title: "Supplier master · prepared",
        fields: [
          { label: "Supplier", value: WINNER },
          { label: "Number", value: `${VENDOR_NO} · reserved` },
          { label: "Payment terms", value: "Net 30 · as quoted" },
          { label: "Bank account", value: "Left blank — callback required" },
        ],
      },
      {
        sourceId: "onb-approval",
        reasoning: "Putting one card in front of a person",
        title: "Approval · WF-49010-VEN",
        fields: [
          { label: "To sign", value: "Category manager" },
          { label: "Compliance", value: "Screens clear" },
          { label: "Creates", value: "Supplier record + first order" },
          { label: "Does not set", value: "Bank details" },
        ],
      },
    ],
  },
];
