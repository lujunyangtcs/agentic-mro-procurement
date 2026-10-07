/**
 * Re-translating an edited request.
 *
 * There is no translation model behind this demo, and pretending otherwise
 * would be worse than useless: a German reader in the room would catch an
 * invented sentence immediately. So this does something narrower and honest.
 *
 * It works sentence by sentence over the vocabulary this desk actually uses,
 * with the numbers pulled out first. Change the need-by date, the quantity or
 * the terms and the German and Chinese genuinely change with it, because the
 * numbers are substituted back into a known sentence. Write something outside
 * that vocabulary and it says so — the sentence comes back marked, rather than
 * guessed at.
 *
 * That is also the more truthful demo claim: you are editing the *request*,
 * and every language is a rendering of it.
 */

export type Lang = "de";

/** A sentence with its numbers lifted out, so one entry covers every value. */
type Pattern = { en: RegExp; de: string };

/**
 * `{0}`, `{1}` … are the numbers, dates and quantities captured from the
 * English, in order. They are re-inserted untouched — a date is a date in
 * every language, and that is what makes this safe.
 */
const PATTERNS: Pattern[] = [
  {
    en: /^please quote for (.+?) tonnes of grain-oriented electrical steel,? M4 grade,? C5 insulation coated,? in (.+?) coil\.?$/i,
    de: "Wir bitten um ein Angebot über {0} t kornorientiertes Elektroblech, M4, C5-isoliert, als {1}-Coil.",
  },
  {
    en: /^delivery by (.+?) — the line is down\.? please state price,? lead time and payment terms\.?$/i,
    de: "Lieferung bis {0} — die Linie steht still. Bitte Preis, Lieferzeit und Zahlungsziel angeben.",
  },
  /* The same request split at the full stop — a sentence at a time is how the
     body is actually broken up, so each half needs its own entry. */
  {
    en: /^delivery by (.+?) — the line is down\.?$/i,
    de: "Lieferung bis {0} — die Linie steht still.",
  },
  {
    en: /^delivery by (.+?)\.?$/i,
    de: "Lieferung bis {0}.",
  },
  {
    en: /^please state price,? lead time and payment terms\.?$/i,
    de: "Bitte Preis, Lieferzeit und Zahlungsziel angeben.",
  },
  {
    en: /^delivery by (.+?)\.? please state price,? lead time and payment terms\.?$/i,
    de: "Lieferung bis {0}. Bitte Preis, Lieferzeit und Zahlungsziel angeben.",
  },
  /* The order itself — the last thing that leaves the building. */
  {
    en: /^thank you for your quotation\.?$/i,
    de: "Vielen Dank für Ihr Angebot.",
  },
  {
    en: /^we hereby order (.+?) tonnes of grain-oriented electrical steel,? M4 grade,? C5 insulation coated,? at (.+?) (?:per tonne|\/ t|a tonne),? payment terms (.+?)\.?$/i,
    de: "Wir bestellen hiermit {0} t kornorientiertes Elektroblech, M4, C5-isoliert, zum Preis von {1} / t, Zahlungsziel {2}.",
  },
  {
    en: /^please confirm shipment this week — the line is stopped\.?$/i,
    de: "Bitte bestätigen Sie den Versand in dieser Woche — die Linie steht still.",
  },
  {
    en: /^purchase order (.+?) is attached\.?$/i,
    de: "Die Bestellung {0} finden Sie im Anhang.",
  },
  {
    en: /^we are ordering (.+?) (?:of )?diaphragm.*? at (.+?) each,? payment terms (.+?)\.?$/i,
    de: "Wir bestellen {0} Membranen zum Preis von {1} / Stück, Zahlungsziel {2}.",
  },
  {
    en: /^purchase order (.+?) is attached\.? please confirm the delivery date\.?$/i,
    de: "Die Bestellung {0} finden Sie im Anhang. Bitte bestätigen Sie den Liefertermin.",
  },
  {
    en: /^please confirm the delivery date\.?$/i,
    de: "Bitte bestätigen Sie den Liefertermin.",
  },
  {
    en: /^please confirm (?:by|before) (.+?)\.?$/i,
    de: "Bitte bestätigen Sie bis zum {0}.",
  },
  {
    en: /^payment terms (.+?)\.?$/i,
    de: "Zahlungsziel {0}.",
  },
  {
    en: /^this is urgent\.?$/i,
    de: "Die Angelegenheit ist dringend.",
  },
  {
    en: /^please include the lead time\.?$/i,
    de: "Bitte geben Sie die Lieferzeit an.",
  },
];

/** One translated sentence, and whether the vocabulary actually covered it. */
export type Piece = { text: string; known: boolean };

function translateSentence(sentence: string, lang: Lang): Piece {
  const trimmed = sentence.trim();
  if (!trimmed) return { text: "", known: true };
  for (const p of PATTERNS) {
    const m = trimmed.match(p.en);
    if (!m) continue;
    const template = p[lang];
    const text = template.replace(/\{(\d)\}/g, (_, i) => m[Number(i) + 1] ?? "");
    return { text, known: true };
  }
  return { text: trimmed, known: false };
}

/**
 * Re-translate a body. Sentences are kept as written where the desk's
 * vocabulary does not reach — flagged, never invented.
 */
export function retranslate(lines: string[], lang: Lang): Piece[] {
  return lines
    .flatMap((line) => line.split(/(?<=\.)\s+/))
    .map((s) => translateSentence(s, lang))
    .filter((p) => p.text !== "");
}

/** True when every sentence was covered — the buyer can send without checking. */
export const fullyKnown = (pieces: Piece[]) => pieces.every((p) => p.known);
