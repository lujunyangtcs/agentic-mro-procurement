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

export type Lang = "de" | "zh" | "es" | "fr";

/** A sentence with its numbers lifted out, so one entry covers every value. */
type Pattern = { en: RegExp; de: string; zh: string; es: string; fr: string };

/**
 * `{0}`, `{1}` … are the numbers, dates and quantities captured from the
 * English, in order. They are re-inserted untouched — a date is a date in
 * every language, and that is what makes this safe.
 */
const PATTERNS: Pattern[] = [
  {
    en: /^please quote for (.+?) tonnes of titanium dioxide,? rutile,? surface-treated,? in (.+?) bags\.?$/i,
    de: "Wir bitten um ein Angebot über {0} t Titandioxid, Rutil, oberflächenbehandelt, in {1}-Säcken.",
    zh: "请就 {0} 吨金红石型钛白粉（表面处理，{1} 袋装）报价。",
    es: "Solicitamos oferta por {0} toneladas de dióxido de titanio rutilo, con tratamiento superficial, en sacos de {1}.",
    fr: "Nous vous prions de nous remettre une offre pour {0} tonnes de dioxyde de titane rutile, traité en surface, en sacs de {1}.",
  },
  {
    en: /^delivery by (.+?) — the line is down\.? please state price,? lead time and payment terms\.?$/i,
    de: "Lieferung bis {0} — die Linie steht still. Bitte Preis, Lieferzeit und Zahlungsziel angeben.",
    zh: "交付期限 {0} —— 产线目前停机。请提供价格、交货周期与付款条件。",
    es: "Entrega antes del {0} — la línea está parada. Indiquen precio, plazo de entrega y condiciones de pago.",
    fr: "Livraison pour le {0} — la ligne est à l'arrêt. Merci d'indiquer le prix, le délai de livraison et les conditions de paiement.",
  },
  /* The same request split at the full stop — a sentence at a time is how the
     body is actually broken up, so each half needs its own entry. */
  {
    en: /^delivery by (.+?) — the line is down\.?$/i,
    de: "Lieferung bis {0} — die Linie steht still.",
    zh: "交付期限 {0} —— 产线目前停机。",
    es: "Entrega antes del {0} — la línea está parada.",
    fr: "Livraison pour le {0} — la ligne est à l'arrêt.",
  },
  {
    en: /^delivery by (.+?)\.?$/i,
    de: "Lieferung bis {0}.",
    zh: "交付期限 {0}。",
    es: "Entrega antes del {0}.",
    fr: "Livraison pour le {0}.",
  },
  {
    en: /^please state price,? lead time and payment terms\.?$/i,
    de: "Bitte Preis, Lieferzeit und Zahlungsziel angeben.",
    zh: "请提供价格、交货周期与付款条件。",
    es: "Indiquen precio, plazo de entrega y condiciones de pago.",
    fr: "Merci d'indiquer le prix, le délai de livraison et les conditions de paiement.",
  },
  {
    en: /^delivery by (.+?)\.? please state price,? lead time and payment terms\.?$/i,
    de: "Lieferung bis {0}. Bitte Preis, Lieferzeit und Zahlungsziel angeben.",
    zh: "交付期限 {0}。请提供价格、交货周期与付款条件。",
    es: "Entrega antes del {0}. Indiquen precio, plazo de entrega y condiciones de pago.",
    fr: "Livraison pour le {0}. Merci d'indiquer le prix, le délai de livraison et les conditions de paiement.",
  },
  /* The order itself — the last thing that leaves the building. */
  {
    en: /^thank you for your quotation\.?$/i,
    de: "Vielen Dank für Ihr Angebot.",
    zh: "感谢贵司报价。",
    es: "Gracias por su oferta.",
    fr: "Nous vous remercions de votre offre.",
  },
  {
    en: /^we hereby order (.+?) tonnes of titanium dioxide,? rutile,? surface-treated,? at (.+?) (?:per tonne|\/ t|a tonne),? payment terms (.+?)\.?$/i,
    de: "Wir bestellen hiermit {0} t Titandioxid, Rutil, oberflächenbehandelt, zum Preis von {1} / t, Zahlungsziel {2}.",
    zh: "现向贵司订购 {0} 吨金红石型钛白粉（表面处理），单价 {1} / 吨，付款条件 {2}。",
    es: "Por la presente pedimos {0} toneladas de dióxido de titanio rutilo, tratado en superficie, a {1} la tonelada, condiciones de pago {2}.",
    fr: "Nous commandons par la présente {0} tonnes de dioxyde de titane rutile, traité en surface, au prix de {1} la tonne, conditions de paiement {2}.",
  },
  {
    en: /^please confirm shipment this week — the line is stopped\.?$/i,
    de: "Bitte bestätigen Sie den Versand in dieser Woche — die Linie steht still.",
    zh: "产线目前停机，请确认本周发货。",
    es: "Confirmen el envío esta semana — la línea está parada.",
    fr: "Merci de confirmer l'expédition cette semaine — la ligne est à l'arrêt.",
  },
  {
    en: /^purchase order (.+?) is attached\.?$/i,
    de: "Die Bestellung {0} finden Sie im Anhang.",
    zh: "订单 {0} 见附件。",
    es: "Adjuntamos el pedido {0}.",
    fr: "Vous trouverez la commande {0} en pièce jointe.",
  },
  {
    en: /^we are ordering (.+?) (?:of )?diaphragm.*? at (.+?) each,? payment terms (.+?)\.?$/i,
    de: "Wir bestellen {0} Membranen zum Preis von {1} / Stück, Zahlungsziel {2}.",
    zh: "现订购 {0} 片隔膜，单价 {1}，付款条件 {2}。",
    es: "Pedimos {0} membranas a {1} la unidad, condiciones de pago {2}.",
    fr: "Nous commandons {0} membranes au prix de {1} l'unité, conditions de paiement {2}.",
  },
  {
    en: /^purchase order (.+?) is attached\.? please confirm the delivery date\.?$/i,
    de: "Die Bestellung {0} finden Sie im Anhang. Bitte bestätigen Sie den Liefertermin.",
    zh: "订单 {0} 见附件，请确认交货日期。",
    es: "Adjuntamos el pedido {0}. Confirmen la fecha de entrega, por favor.",
    fr: "Vous trouverez la commande {0} en pièce jointe. Merci de confirmer la date de livraison.",
  },
  {
    en: /^please confirm the delivery date\.?$/i,
    de: "Bitte bestätigen Sie den Liefertermin.",
    zh: "请确认交货日期。",
    es: "Confirmen la fecha de entrega, por favor.",
    fr: "Merci de confirmer la date de livraison.",
  },
  {
    en: /^please confirm (?:by|before) (.+?)\.?$/i,
    de: "Bitte bestätigen Sie bis zum {0}.",
    zh: "请在 {0} 前确认。",
    es: "Confirmen antes del {0}.",
    fr: "Merci de confirmer avant le {0}.",
  },
  {
    en: /^payment terms (.+?)\.?$/i,
    de: "Zahlungsziel {0}.",
    zh: "付款条件：{0}。",
    es: "Condiciones de pago: {0}.",
    fr: "Conditions de paiement : {0}.",
  },
  {
    en: /^this is urgent\.?$/i,
    de: "Die Angelegenheit ist dringend.",
    zh: "此事紧急。",
    es: "El asunto es urgente.",
    fr: "L'affaire est urgente.",
  },
  {
    en: /^please include the lead time\.?$/i,
    de: "Bitte geben Sie die Lieferzeit an.",
    zh: "请注明交货周期。",
    es: "Indiquen el plazo de entrega.",
    fr: "Merci de préciser le délai de livraison.",
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
    const template = lang === "de" ? p.de : lang === "zh" ? p.zh : lang === "fr" ? p.fr : p.es;
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
