/**
 * The contract-based dunning ladder for the BlueRidge overdue receivable —
 * five escalation tiers from a soft courtesy nudge to a pre-legal demand, each
 * with a drafted notice. The Payment & Collections agent reads days-past-due
 * against the customer's Net-45 terms and recommends a tier; the buyer can pick
 * any tier (each opens its draft) and edit the text before sending.
 * All values are fabricated for the demo.
 */

export type DunningTier = {
  n: number;
  name: string;
  /** Days-past-due band this tier applies to. */
  band: string;
  /** One-line description of the tone. */
  gist: string;
  /** The drafted notice for this tier (editable before send). */
  subject: string;
  lines: string[];
};

export const dunningTo = "BlueRidge Foods · ap@blueridgefoods.com";
export const dunningContract = "CTR-BRF-2024 · Net 45";
export const dunningRecommended = 4;

export const dunningTiers: DunningTier[] = [
  {
    n: 1,
    name: "Courtesy",
    band: "1–7 days",
    gist: "Friendly heads-up that the invoice is now due.",
    subject: "Reminder — invoice INV-90357 now due",
    lines: [
      "A friendly heads-up that invoice INV-90357 for $208,400.00 reached its due date of 2026-05-18 under our Net-45 terms.",
      "If payment is already on its way, please disregard this note. Otherwise a remittance at your earliest convenience is appreciated.",
    ],
  },
  {
    n: 2,
    name: "Reminder",
    band: "8–21 days",
    gist: "Polite reminder; restates amount and due date.",
    subject: "Second reminder — invoice INV-90357 past due",
    lines: [
      "Our records show invoice INV-90357 for $208,400.00, due 2026-05-18, is now past due.",
      "Please arrange payment of the outstanding balance, or reply with the expected payment date so we can update the account.",
    ],
  },
  {
    n: 3,
    name: "Firm follow-up",
    band: "22–35 days",
    gist: "Past due; asks for remittance and a date.",
    subject: "Past due — invoice INV-90357 requires your attention",
    lines: [
      "Invoice INV-90357 for $208,400.00 remains unpaid and is now significantly past its 2026-05-18 due date, despite earlier reminders.",
      "Please remit the full balance within 7 days, or contact us with a firm payment date and reference so we can hold further action.",
    ],
  },
  {
    n: 4,
    name: "Final notice",
    band: "36–60 days",
    gist: "Final notice; warns of a credit hold per contract.",
    subject: "FINAL NOTICE — invoice INV-90357 ($208,400) 47 days past due",
    lines: [
      "Our records show invoice INV-90357 for $208,400.00, due 2026-05-18 under contract CTR-BRF-2024 (Net 45), remains unpaid 47 days past due despite reminders on 25 May and 8 June.",
      "Please remit the full balance within 5 business days. Under the contract, accounts over 45 days past due move to credit hold — new orders are suspended until the balance clears.",
      "If payment is already in process, reply with the value date and reference and we will release the hold.",
    ],
  },
  {
    n: 5,
    name: "Pre-legal demand",
    band: "60+ days",
    gist: "Formal demand; collections / legal next.",
    subject: "Formal demand — invoice INV-90357 referred for collection",
    lines: [
      "Despite repeated notices, invoice INV-90357 for $208,400.00 remains unpaid and is now seriously delinquent under contract CTR-BRF-2024.",
      "This is a formal demand for payment of the full balance within 5 business days. Absent payment or a documented arrangement, the account will be referred to collections and our legal team, and the credit hold will remain in force.",
    ],
  },
];
