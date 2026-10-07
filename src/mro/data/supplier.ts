/**
 * The supplier side of the desk.
 *
 * A supplier asks about their orders and their money. Most of what they ask has
 * a factual answer already sitting in `procurement.ts` — whether an invoice
 * cleared, what was withheld and why, when payment is due — so the agent answers
 * those itself, from the same records the buyer sees on the invoice-matching
 * page. Nothing is restated: if the buyer's screen says $130 was held back, the
 * supplier's answer says $130 too, because both read the same field.
 *
 * Anything that would change a commercial term — price, payment terms, bank
 * details — is not the agent's to answer. Those are marked strategic, shown to
 * the supplier as pending, and staged for a procurement specialist, who picks
 * from drafted responses before anything is sent.
 *
 * Everything the conversation can say exists in all five languages: the
 * supplier writes and reads in whichever language they have chosen, the buyer
 * reads the original with an English summary underneath. The numbers inside
 * every sentence are computed, never retyped, so the languages can never
 * disagree about a figure.
 */

import {
  invoiceTieouts,
  tieoutAgrees,
  tieoutGap,
  invoiceAmount,
  receivedAmount,
  priceVariance,
  qtyVariance,
  usd,
  type Lang,
  type InvoiceTieout,
} from "@/mro/data/procurement";

/* ── Who is asking ──────────────────────────────────────────────────────── */

export type Supplier = {
  id: string;
  name: string;
  contact: string;
  email: string;
  /** The language this supplier writes in by default. */
  lang: Lang;
  agreement: string;
  terms: string;
  since: string;
};

export const supplier: Supplier = {
  id: "0001000207",
  name: "Apex Industrial Supply",
  contact: "Accounts receivable",
  email: "ar@apexindustrial.example",
  lang: "en",
  agreement: "SA-MRO-07",
  terms: "Net 30",
  since: "2022-05-18",
};

/* ── What they can ask ──────────────────────────────────────────────────── */

/**
 * `direct` — the agent has the facts and answers straight away.
 * `strategic` — it would change a commercial term, so a person decides.
 */
export type QuestionKind = "direct" | "strategic";

export type SupplierQuestion = {
  id: string;
  kind: QuestionKind;
  /** What the supplier asked, in every language they might write in. */
  asked: Record<Lang, string>;
  /** Short label for the chip the supplier taps. */
  chip: Record<Lang, string>;
  /** Which invoice the question is about, when it is about one. */
  tieoutId?: string;
  /** Why it needs a person — shown on the specialist's queue. */
  strategicReason?: string;
  /**
   * What the specialist can choose from. First is the agent's pick. The label
   * and tone are for the buyer's screen (English); the body exists in every
   * language so the supplier reads the reply in their own.
   */
  recommended?: { label: string; body: Record<Lang, string>; tone: "hold" | "concede" | "offer" }[];
};

export const supplierQuestions: SupplierQuestion[] = [
  {
    id: "Q-PAY-5581",
    kind: "direct",
    tieoutId: "BPI-5581",
    chip: {
      en: "Why is invoice BPI-5581 short paid?",
      de: "Warum wurde Rechnung BPI-5581 gekürzt?",
    },
    asked: {
      en: "We have not received the full amount for invoice BPI-5581. Why is part of it missing?",
      de: "Wir haben den vollen Betrag für Rechnung BPI-5581 nicht erhalten. Warum fehlt ein Teil?",
    },
  },
  {
    id: "Q-PAY-5588",
    kind: "direct",
    tieoutId: "BPI-5588",
    chip: {
      en: "Why has the money for BPI-5588 not arrived?",
      de: "Warum ist das Geld für BPI-5588 nicht eingegangen?",
    },
    asked: {
      en: "The money for invoice BPI-5588 has not arrived. Can you tell me what is holding it up?",
      de: "Das Geld für Rechnung BPI-5588 ist nicht eingegangen. Können Sie mir sagen, woran es liegt?",
    },
  },
  {
    id: "Q-PAY-5567",
    kind: "direct",
    tieoutId: "BPI-5567",
    chip: {
      en: "When will invoice BPI-5567 be paid?",
      de: "Wann wird Rechnung BPI-5567 bezahlt?",
    },
    asked: {
      en: "Could you confirm when invoice BPI-5567 will be paid?",
      de: "Können Sie bestätigen, wann Rechnung BPI-5567 bezahlt wird?",
    },
  },
  {
    id: "Q-TERMS",
    kind: "strategic",
    chip: {
      en: "Can we move to shorter payment terms?",
      de: "Können wir kürzere Zahlungsziele vereinbaren?",
    },
    asked: {
      en: "Our costs have risen this year. Could we move from Net 30 to Net 15 payment terms?",
      de: "Unsere Kosten sind dieses Jahr gestiegen. Könnten wir von 30 auf 15 Tage Zahlungsziel wechseln?",
    },
    strategicReason:
      "Changes an agreed commercial term and affects working capital across every order with this supplier.",
    recommended: [
      {
        label: "Hold the agreed terms",
        tone: "hold",
        body: {
          en: "Thank you for raising this. Our payment terms of Net 30 are set in sourcing agreement SA-MRO-07, which runs to the end of this year. We are not able to change them mid-term, but we are happy to review terms together at the annual renewal.",
          de: "Vielen Dank für Ihre Anfrage. Unser Zahlungsziel von 30 Tagen ist in der Beschaffungsvereinbarung SA-MRO-07 festgelegt, die bis Jahresende läuft. Eine Änderung während der Laufzeit ist nicht möglich, aber wir besprechen die Konditionen gern gemeinsam bei der jährlichen Verlängerung.",
        },
      },
      {
        label: "Offer early settlement for a discount",
        tone: "offer",
        body: {
          en: "Thank you for raising this. We cannot change the agreed terms mid-contract, but we can offer early settlement at Net 15 in exchange for a 1.5% early-payment discount. If that works for you, we will document it as an addendum to SA-MRO-07.",
          de: "Vielen Dank für Ihre Anfrage. Die vereinbarten Zahlungsziele können wir während der Vertragslaufzeit nicht ändern, bieten aber eine frühere Zahlung nach 15 Tagen gegen 1,5% Skonto an. Wenn das für Sie passt, halten wir es als Nachtrag zur Vereinbarung SA-MRO-07 fest.",
        },
      },
      {
        label: "Agree to shorter terms",
        tone: "concede",
        body: {
          en: "Thank you for raising this. We have reviewed your request and can move to Net 15 from the start of next quarter. We will issue an addendum to SA-MRO-07 for signature.",
          de: "Vielen Dank für Ihre Anfrage. Wir haben Ihren Wunsch geprüft und können ab Beginn des nächsten Quartals auf ein Zahlungsziel von 15 Tagen umstellen. Wir erstellen einen Nachtrag zur Vereinbarung SA-MRO-07 zur Unterschrift.",
        },
      },
    ],
  },
  {
    id: "Q-PRICE",
    kind: "strategic",
    chip: {
      en: "We need to raise prices next quarter",
      de: "Wir müssen die Preise im nächsten Quartal erhöhen",
    },
    asked: {
      en: "Raw material costs have increased. We need to raise prices by 6% from next quarter.",
      de: "Die Rohstoffkosten sind gestiegen. Wir müssen die Preise ab dem nächsten Quartal um 6% erhöhen.",
    },
    strategicReason:
      "A price change against a live sourcing agreement — it needs category review before any commitment is made.",
    recommended: [
      {
        label: "Ask for the cost evidence first",
        tone: "hold",
        body: {
          en: "Thank you for the notice. Prices are fixed under sourcing agreement SA-MRO-07 for the current term. Before we can consider any change, please send the underlying cost movement — index or supporting quotes — and we will review it with our category team.",
          de: "Vielen Dank für die Mitteilung. Die Preise sind für die laufende Vertragsperiode in der Vereinbarung SA-MRO-07 festgeschrieben. Bevor wir eine Änderung prüfen können, senden Sie uns bitte die zugrunde liegende Kostenentwicklung — Index oder Belegangebote — und wir prüfen sie mit unserem Einkaufsteam.",
        },
      },
      {
        label: "Hold prices to the agreement",
        tone: "hold",
        body: {
          en: "Thank you for the notice. Our agreement SA-MRO-07 fixes prices for the current term, so we are not able to accept an increase before renewal. We will include your cost position in the renewal discussion.",
          de: "Vielen Dank für die Mitteilung. Unsere Vereinbarung SA-MRO-07 schreibt die Preise für die laufende Periode fest, daher können wir vor der Verlängerung keine Erhöhung akzeptieren. Ihre Kostensituation nehmen wir in die Verlängerungsgespräche mit.",
        },
      },
      {
        label: "Accept a partial increase",
        tone: "concede",
        body: {
          en: "Thank you for the notice. We have reviewed your cost position and can accept a 3% increase from the start of next quarter, applied to the milling and media lines only. We will issue an addendum to SA-MRO-07.",
          de: "Vielen Dank für die Mitteilung. Wir haben Ihre Kostensituation geprüft und können ab Beginn des nächsten Quartals eine Erhöhung um 3% akzeptieren, begrenzt auf die Mahl- und Mahlkörperlinien. Wir erstellen einen Nachtrag zur Vereinbarung SA-MRO-07.",
        },
      },
    ],
  },
  {
    id: "Q-BANK",
    kind: "strategic",
    chip: {
      en: "We need to change our bank details",
      de: "Wir müssen unsere Bankverbindung ändern",
    },
    asked: {
      en: "We have changed banks. Please update the account we are paid into.",
      de: "Wir haben die Bank gewechselt. Bitte aktualisieren Sie das Konto, auf das wir bezahlt werden.",
    },
    strategicReason:
      "Bank-detail changes are the most common route for payment fraud. Never actioned from a message — it goes through verified channels.",
    recommended: [
      {
        label: "Route through verified change control",
        tone: "hold",
        body: {
          en: "Thank you for letting us know. For everyone's protection we never change bank details from a portal message or an email. Our supplier management team will contact you on the phone number already held on file to verify the change, and will send the formal change form. Payments continue to the existing account until that is complete.",
          de: "Danke für die Information. Zum Schutz aller Beteiligten ändern wir Bankverbindungen nie aufgrund einer Portal-Nachricht oder E-Mail. Unser Lieferantenmanagement kontaktiert Sie über die bereits hinterlegte Telefonnummer, um die Änderung zu verifizieren, und sendet Ihnen das offizielle Änderungsformular. Bis dahin gehen Zahlungen weiter auf das bestehende Konto.",
        },
      },
      {
        label: "Request signed confirmation",
        tone: "hold",
        body: {
          en: "Thank you for letting us know. Please have the change confirmed on company letterhead, signed by a director, and we will verify it by callback on the number held on file before anything is updated.",
          de: "Danke für die Information. Bitte lassen Sie die Änderung auf Firmenbriefpapier bestätigen, von einem Geschäftsführer unterschrieben. Wir verifizieren sie per Rückruf über die hinterlegte Nummer, bevor etwas aktualisiert wird.",
        },
      },
    ],
  },
];

/* ── Answering the factual ones from the record, in any language ────────── */

/** Sentence templates for the computed answers. `{x}` slots are filled below. */
const ANSWER_CLEAR: Record<Lang, string> = {
  en: "Invoice {id} for {amt} matched your order, the goods we received and our agreement, so it cleared without anyone needing to review it. It is scheduled for payment on {terms} terms from {on}. Nothing is being held back.",
  de: "Rechnung {id} über {amt} stimmte mit Ihrer Bestellung, dem Wareneingang und unserer Vereinbarung überein und wurde daher ohne manuelle Prüfung freigegeben. Die Zahlung ist mit Ziel {terms} ab dem {on} eingeplant. Es wird nichts zurückgehalten.",
};

const ANSWER_PARTIAL: Record<Lang, string> = {
  en: "Invoice {id} has been paid in part. We have released {rel}, which covers what was delivered at the agreed price. {gap} is on hold because {parts}. As soon as that is settled — a credit note, or the remaining delivery — the balance is released on {terms} terms.",
  de: "Rechnung {id} wurde teilweise bezahlt. Wir haben {rel} freigegeben — das deckt die gelieferte Menge zum vereinbarten Preis. {gap} ist zurückgestellt, weil {parts}. Sobald das geklärt ist — per Gutschrift oder Restlieferung — wird der Rest mit Ziel {terms} freigegeben.",
};

const CLAUSE_PRICE: Record<Lang, string> = {
  en: "it was billed at {p1} per unit against the {p2} we have agreed in {ref}",
  de: "pro Einheit {p1} berechnet wurden statt der in {ref} vereinbarten {p2}",
};

const CLAUSE_QTY: Record<Lang, string> = {
  en: "it was billed for {q1} but our goods receipt {gref} records {q2} delivered",
  de: "{q1} berechnet wurden, unser Wareneingang {gref} aber {q2} verzeichnet",
};

const CLAUSE_JOIN: Record<Lang, string> = {
  en: ", and ", de: " und ",
};

const fill = (tpl: string, vars: Record<string, string | number>) =>
  tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));

/**
 * The agent's answer to a question about an invoice, in the language the
 * conversation is happening in. Every figure is computed from the shared
 * records, so the supplier and the buyer are always quoted the same number.
 */
export function answerFor(q: SupplierQuestion, lang: Lang = "en"): string | null {
  if (q.kind !== "direct" || !q.tieoutId) return null;
  const t = invoiceTieouts.find((x) => x.id === q.tieoutId);
  if (!t) return null;

  if (tieoutAgrees(t)) {
    return fill(ANSWER_CLEAR[lang], {
      id: t.id, amt: usd(invoiceAmount(t)), terms: t.terms, on: t.receivedOn,
    });
  }

  const price = priceVariance(t);
  const qty = qtyVariance(t);
  const parts: string[] = [];
  if (price !== 0) {
    parts.push(fill(CLAUSE_PRICE[lang], {
      p1: usd(t.invoice.unitPrice), p2: usd(t.contract.unitPrice), ref: t.contract.reference,
    }));
  }
  if (qty !== 0) {
    parts.push(fill(CLAUSE_QTY[lang], {
      q1: t.invoice.qty, q2: t.gr.qty, gref: t.gr.reference,
    }));
  }

  return fill(ANSWER_PARTIAL[lang], {
    id: t.id, rel: usd(receivedAmount(t)), gap: usd(tieoutGap(t)),
    parts: parts.join(CLAUSE_JOIN[lang]), terms: t.terms,
  });
}

/**
 * One English line summarising the agent's answer — the buyer's summary box
 * under a bubble written in another language. Same computed figures.
 */
export function answerSummaryFor(q: SupplierQuestion): string | null {
  if (q.kind !== "direct" || !q.tieoutId) return null;
  const t = invoiceTieouts.find((x) => x.id === q.tieoutId);
  if (!t) return null;
  if (tieoutAgrees(t)) {
    return `The assistant confirmed ${t.id} cleared in full — payment scheduled on ${t.terms} terms.`;
  }
  const reasons: string[] = [];
  if (priceVariance(t) !== 0) reasons.push("billed above the agreed price");
  if (qtyVariance(t) !== 0) reasons.push("billed for more than arrived");
  return `The assistant explained the ${usd(tieoutGap(t))} hold on ${t.id} — ${reasons.join(" and ")} — the balance releases once settled.`;
}

/* ── The assistant's own conversational lines, in every language ────────── */

/** What the assistant says when it hands a strategic question to a person. */
export const PENDING_TEXT: Record<Lang, string> = {
  en: "This one changes a commercial term, so I am not going to answer it myself. I have passed it to a procurement specialist with everything they need, and I will bring their answer straight back to you here.",
  de: "Diese Frage betrifft eine kommerzielle Vereinbarung, deshalb beantworte ich sie nicht selbst. Ich habe sie mit allen Unterlagen an eine Einkaufsspezialistin übergeben und bringe Ihnen die Antwort direkt hierher zurück.",
};

/** The assistant's acknowledgement of a free-typed supplier message. */
export const ACK_TEXT: Record<Lang, string> = {
  en: "Thank you — I have noted this on your file, and the procurement desk can see it.",
  de: "Danke — ich habe das in Ihrer Akte vermerkt, und der Einkauf kann es sehen.",
};

/** The assistant's greeting when the conversation is empty. */
export const GREETING_TEXT: Record<Lang, string> = {
  en: "Hello — I can see your orders, invoices and payments. What would you like to know?",
  de: "Hallo — ich sehe Ihre Bestellungen, Rechnungen und Zahlungen. Was möchten Sie wissen?",
};

/** Why an invoice is held, one short line, in the reader's language. */
export function holdReasonFor(t: InvoiceTieout, lang: Lang): string | null {
  const price = priceVariance(t);
  const qty = qtyVariance(t);
  const priceLine: Record<Lang, string> = {
    en: "Billed {p} above the agreed price",
    de: "{p} über dem vereinbarten Preis berechnet",
  };
  const qtyLine: Record<Lang, string> = {
    en: "Billed for {q1} but only {q2} arrived",
    de: "{q1} berechnet, aber nur {q2} geliefert",
  };
  const parts: string[] = [];
  if (price !== 0) parts.push(fill(priceLine[lang], { p: usd(price) }));
  if (qty !== 0) parts.push(fill(qtyLine[lang], { q1: t.invoice.qty, q2: t.gr.qty }));
  return parts.length ? parts.join(CLAUSE_JOIN[lang]) : null;
}

/** The invoices this supplier can see, straight from the shared records. */
export function supplierInvoices(): InvoiceTieout[] {
  return invoiceTieouts;
}

/** What the supplier is owed in total, and what is on hold. */
export function supplierPosition(ts: InvoiceTieout[]) {
  const billed = ts.reduce((s, t) => s + invoiceAmount(t), 0);
  const onHold = ts.filter((t) => !tieoutAgrees(t)).reduce((s, t) => s + tieoutGap(t), 0);
  return { billed, onHold, releasing: billed - onHold };
}
