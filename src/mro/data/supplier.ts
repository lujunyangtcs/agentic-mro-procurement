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
  lang: "es",
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
      es: "¿Por qué se pagó de menos la factura BPI-5581?",
      fr: "Pourquoi la facture BPI-5581 est-elle payée en partie ?",
      zh: "发票 BPI-5581 为何少付?",
    },
    asked: {
      en: "We have not received the full amount for invoice BPI-5581. Why is part of it missing?",
      de: "Wir haben den vollen Betrag für Rechnung BPI-5581 nicht erhalten. Warum fehlt ein Teil?",
      es: "No hemos recibido el importe completo de la factura BPI-5581. ¿Por qué falta una parte?",
      fr: "Nous n'avons pas reçu le montant total de la facture BPI-5581. Pourquoi une partie manque-t-elle ?",
      zh: "发票 BPI-5581 我们没有收到全额付款,为什么少了一部分?",
    },
  },
  {
    id: "Q-PAY-5588",
    kind: "direct",
    tieoutId: "BPI-5588",
    chip: {
      en: "Why has the money for BPI-5588 not arrived?",
      de: "Warum ist das Geld für BPI-5588 nicht eingegangen?",
      es: "¿Por qué no ha llegado el dinero de BPI-5588?",
      fr: "Pourquoi l'argent de BPI-5588 n'est-il pas arrivé ?",
      zh: "BPI-5588 的款项为何还没到账?",
    },
    asked: {
      en: "The money for invoice BPI-5588 has not arrived. Can you tell me what is holding it up?",
      de: "Das Geld für Rechnung BPI-5588 ist nicht eingegangen. Können Sie mir sagen, woran es liegt?",
      es: "El dinero de la factura BPI-5588 no ha llegado. ¿Pueden decirme qué lo está reteniendo?",
      fr: "L'argent de la facture BPI-5588 n'est pas arrivé. Pouvez-vous me dire ce qui le bloque ?",
      zh: "发票 BPI-5588 的款项还没到账,能告诉我卡在哪里吗?",
    },
  },
  {
    id: "Q-PAY-5567",
    kind: "direct",
    tieoutId: "BPI-5567",
    chip: {
      en: "When will invoice BPI-5567 be paid?",
      de: "Wann wird Rechnung BPI-5567 bezahlt?",
      es: "¿Cuándo se pagará la factura BPI-5567?",
      fr: "Quand la facture BPI-5567 sera-t-elle payée ?",
      zh: "发票 BPI-5567 什么时候付款?",
    },
    asked: {
      en: "Could you confirm when invoice BPI-5567 will be paid?",
      de: "Können Sie bestätigen, wann Rechnung BPI-5567 bezahlt wird?",
      es: "¿Pueden confirmar cuándo se pagará la factura BPI-5567?",
      fr: "Pouvez-vous confirmer quand la facture BPI-5567 sera payée ?",
      zh: "能否确认发票 BPI-5567 的付款时间?",
    },
  },
  {
    id: "Q-TERMS",
    kind: "strategic",
    chip: {
      en: "Can we move to shorter payment terms?",
      de: "Können wir kürzere Zahlungsziele vereinbaren?",
      es: "¿Podemos acordar plazos de pago más cortos?",
      fr: "Pouvons-nous raccourcir les délais de paiement ?",
      zh: "能否缩短付款账期?",
    },
    asked: {
      en: "Our costs have risen this year. Could we move from Net 30 to Net 15 payment terms?",
      de: "Unsere Kosten sind dieses Jahr gestiegen. Könnten wir von 30 auf 15 Tage Zahlungsziel wechseln?",
      es: "Nuestros costes han subido este año. ¿Podríamos pasar de 30 a 15 días de plazo de pago?",
      fr: "Nos coûts ont augmenté cette année. Pourrions-nous passer de 30 à 15 jours de paiement ?",
      zh: "今年我们成本上升,能否把付款账期从 30 天改为 15 天?",
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
          es: "Gracias por plantearlo. Nuestro plazo de pago de 30 días está fijado en el acuerdo de compras SA-MRO-07, vigente hasta final de año. No podemos cambiarlo durante su vigencia, pero con gusto revisaremos las condiciones juntos en la renovación anual.",
          fr: "Merci d'avoir soulevé ce point. Notre délai de paiement de 30 jours est fixé dans l'accord d'achat SA-MRO-07, valable jusqu'à la fin de l'année. Nous ne pouvons pas le modifier en cours de contrat, mais nous reverrons volontiers les conditions ensemble lors du renouvellement annuel.",
          zh: "感谢您的提议。我们的付款账期为 30 天，已在采购协议 SA-MRO-07 中约定，协议有效期至今年年底。协议期内无法变更，但我们很乐意在年度续签时与您一起重新审视付款条件。",
        },
      },
      {
        label: "Offer early settlement for a discount",
        tone: "offer",
        body: {
          en: "Thank you for raising this. We cannot change the agreed terms mid-contract, but we can offer early settlement at Net 15 in exchange for a 1.5% early-payment discount. If that works for you, we will document it as an addendum to SA-MRO-07.",
          de: "Vielen Dank für Ihre Anfrage. Die vereinbarten Zahlungsziele können wir während der Vertragslaufzeit nicht ändern, bieten aber eine frühere Zahlung nach 15 Tagen gegen 1,5% Skonto an. Wenn das für Sie passt, halten wir es als Nachtrag zur Vereinbarung SA-MRO-07 fest.",
          es: "Gracias por plantearlo. No podemos cambiar los plazos acordados durante el contrato, pero podemos ofrecer pago anticipado a 15 días a cambio de un descuento del 1,5% por pronto pago. Si le conviene, lo documentaremos como anexo al acuerdo SA-MRO-07.",
          fr: "Merci d'avoir soulevé ce point. Nous ne pouvons pas modifier les délais convenus en cours de contrat, mais nous pouvons proposer un règlement anticipé à 15 jours en échange d'un escompte de 1,5%. Si cela vous convient, nous le documenterons dans un avenant à l'accord SA-MRO-07.",
          zh: "感谢您的提议。合同期内我们无法变更已约定的账期，但可以提供 15 天提前付款，条件是 1.5% 的提前付款折扣。如果您接受，我们将以补充协议的形式写入 SA-MRO-07。",
        },
      },
      {
        label: "Agree to shorter terms",
        tone: "concede",
        body: {
          en: "Thank you for raising this. We have reviewed your request and can move to Net 15 from the start of next quarter. We will issue an addendum to SA-MRO-07 for signature.",
          de: "Vielen Dank für Ihre Anfrage. Wir haben Ihren Wunsch geprüft und können ab Beginn des nächsten Quartals auf ein Zahlungsziel von 15 Tagen umstellen. Wir erstellen einen Nachtrag zur Vereinbarung SA-MRO-07 zur Unterschrift.",
          es: "Gracias por plantearlo. Hemos revisado su solicitud y podemos pasar a un plazo de 15 días desde el inicio del próximo trimestre. Emitiremos un anexo al acuerdo SA-MRO-07 para su firma.",
          fr: "Merci d'avoir soulevé ce point. Nous avons examiné votre demande et pouvons passer à un délai de 15 jours à compter du début du prochain trimestre. Nous émettrons un avenant à l'accord SA-MRO-07 pour signature.",
          zh: "感谢您的提议。经审核，我们可以从下季度起将付款账期改为 15 天，并将出具 SA-MRO-07 的补充协议供双方签署。",
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
      es: "Necesitamos subir precios el próximo trimestre",
      fr: "Nous devons augmenter nos prix le trimestre prochain",
      zh: "下季度我们需要涨价",
    },
    asked: {
      en: "Raw material costs have increased. We need to raise prices by 6% from next quarter.",
      de: "Die Rohstoffkosten sind gestiegen. Wir müssen die Preise ab dem nächsten Quartal um 6% erhöhen.",
      es: "Los costes de materia prima han subido. Necesitamos aumentar los precios un 6% el próximo trimestre.",
      fr: "Les coûts des matières premières ont augmenté. Nous devons augmenter nos prix de 6% le trimestre prochain.",
      zh: "原材料成本上涨,下季度我们需要提价 6%。",
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
          es: "Gracias por el aviso. Los precios están fijados en el acuerdo SA-MRO-07 para el periodo vigente. Antes de considerar cualquier cambio, envíennos la evolución de costes que lo respalda — índice o cotizaciones — y la revisaremos con nuestro equipo de categoría.",
          fr: "Merci pour votre message. Les prix sont fixés par l'accord SA-MRO-07 pour la période en cours. Avant d'envisager un changement, merci de nous transmettre l'évolution des coûts — indice ou devis justificatifs — que nous examinerons avec notre équipe catégorie.",
          zh: "感谢告知。当前合同期内价格已在 SA-MRO-07 中锁定。在考虑任何调整之前，请提供成本变动的依据——指数或相关报价——我们会与品类团队一起评估。",
        },
      },
      {
        label: "Hold prices to the agreement",
        tone: "hold",
        body: {
          en: "Thank you for the notice. Our agreement SA-MRO-07 fixes prices for the current term, so we are not able to accept an increase before renewal. We will include your cost position in the renewal discussion.",
          de: "Vielen Dank für die Mitteilung. Unsere Vereinbarung SA-MRO-07 schreibt die Preise für die laufende Periode fest, daher können wir vor der Verlängerung keine Erhöhung akzeptieren. Ihre Kostensituation nehmen wir in die Verlängerungsgespräche mit.",
          es: "Gracias por el aviso. Nuestro acuerdo SA-MRO-07 fija los precios para el periodo vigente, por lo que no podemos aceptar una subida antes de la renovación. Incluiremos su posición de costes en esa conversación.",
          fr: "Merci pour votre message. Notre accord SA-MRO-07 fixe les prix pour la période en cours ; nous ne pouvons donc pas accepter de hausse avant le renouvellement. Nous inclurons votre situation de coûts dans cette discussion.",
          zh: "感谢告知。SA-MRO-07 协议已锁定本期价格，续签之前我们无法接受涨价。续签谈判时我们会把贵司的成本状况纳入考虑。",
        },
      },
      {
        label: "Accept a partial increase",
        tone: "concede",
        body: {
          en: "Thank you for the notice. We have reviewed your cost position and can accept a 3% increase from the start of next quarter, applied to the milling and media lines only. We will issue an addendum to SA-MRO-07.",
          de: "Vielen Dank für die Mitteilung. Wir haben Ihre Kostensituation geprüft und können ab Beginn des nächsten Quartals eine Erhöhung um 3% akzeptieren, begrenzt auf die Mahl- und Mahlkörperlinien. Wir erstellen einen Nachtrag zur Vereinbarung SA-MRO-07.",
          es: "Gracias por el aviso. Hemos revisado su posición de costes y podemos aceptar una subida del 3% desde el próximo trimestre, aplicada solo a las líneas de molienda y medios. Emitiremos un anexo al acuerdo SA-MRO-07.",
          fr: "Merci pour votre message. Après examen de vos coûts, nous pouvons accepter une hausse de 3% à compter du prochain trimestre, limitée aux lignes de broyage et de médias. Nous émettrons un avenant à l'accord SA-MRO-07.",
          zh: "感谢告知。经评估贵司成本状况，我们可以接受从下季度起上调 3%，仅适用于研磨与研磨介质产品线，并将出具 SA-MRO-07 补充协议。",
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
      es: "Necesitamos cambiar nuestros datos bancarios",
      fr: "Nous devons changer nos coordonnées bancaires",
      zh: "我们需要变更银行账户",
    },
    asked: {
      en: "We have changed banks. Please update the account we are paid into.",
      de: "Wir haben die Bank gewechselt. Bitte aktualisieren Sie das Konto, auf das wir bezahlt werden.",
      es: "Hemos cambiado de banco. Actualicen la cuenta en la que se nos paga.",
      fr: "Nous avons changé de banque. Merci de mettre à jour le compte sur lequel nous sommes payés.",
      zh: "我们更换了银行,请更新收款账户。",
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
          es: "Gracias por avisarnos. Por seguridad de todos, nunca cambiamos datos bancarios a partir de un mensaje del portal o un correo. Nuestro equipo de gestión de proveedores les llamará al número que ya tenemos registrado para verificar el cambio y les enviará el formulario oficial. Los pagos seguirán a la cuenta actual hasta completarlo.",
          fr: "Merci de nous en informer. Pour la protection de tous, nous ne modifions jamais de coordonnées bancaires sur la base d'un message du portail ou d'un e-mail. Notre équipe fournisseurs vous contactera au numéro déjà enregistré pour vérifier le changement et vous enverra le formulaire officiel. Les paiements continuent sur le compte actuel d'ici là.",
          zh: "感谢告知。为保护双方安全，我们从不依据门户消息或电子邮件变更银行账户。供应商管理团队将通过档案中已登记的电话号码与您核实，并发送正式的变更表单。在此之前，付款仍汇入现有账户。",
        },
      },
      {
        label: "Request signed confirmation",
        tone: "hold",
        body: {
          en: "Thank you for letting us know. Please have the change confirmed on company letterhead, signed by a director, and we will verify it by callback on the number held on file before anything is updated.",
          de: "Danke für die Information. Bitte lassen Sie die Änderung auf Firmenbriefpapier bestätigen, von einem Geschäftsführer unterschrieben. Wir verifizieren sie per Rückruf über die hinterlegte Nummer, bevor etwas aktualisiert wird.",
          es: "Gracias por avisarnos. Por favor, confirmen el cambio en papel con membrete, firmado por un director. Lo verificaremos por llamada al número registrado antes de actualizar nada.",
          fr: "Merci de nous en informer. Merci de faire confirmer le changement sur papier à en-tête, signé par un dirigeant. Nous le vérifierons par rappel au numéro enregistré avant toute mise à jour.",
          zh: "感谢告知。请以公司抬头信纸出具变更确认函，并由公司董事签署。在任何更新之前，我们会通过档案中的电话号码回拨核实。",
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
  es: "La factura {id} por {amt} coincidió con su pedido, la mercancía recibida y nuestro acuerdo, así que se aprobó sin necesidad de revisión. El pago está programado en condiciones {terms} desde el {on}. No se retiene nada.",
  fr: "La facture {id} de {amt} correspondait à votre commande, aux marchandises reçues et à notre accord ; elle a donc été validée sans intervention. Le paiement est programmé aux conditions {terms} à compter du {on}. Rien n'est retenu.",
  zh: "发票 {id}（金额 {amt}）与订单、到货记录和协议完全一致，因此无需人工审核即已通过。付款按 {terms} 账期自 {on} 起安排，没有任何款项被扣留。",
};

const ANSWER_PARTIAL: Record<Lang, string> = {
  en: "Invoice {id} has been paid in part. We have released {rel}, which covers what was delivered at the agreed price. {gap} is on hold because {parts}. As soon as that is settled — a credit note, or the remaining delivery — the balance is released on {terms} terms.",
  de: "Rechnung {id} wurde teilweise bezahlt. Wir haben {rel} freigegeben — das deckt die gelieferte Menge zum vereinbarten Preis. {gap} ist zurückgestellt, weil {parts}. Sobald das geklärt ist — per Gutschrift oder Restlieferung — wird der Rest mit Ziel {terms} freigegeben.",
  es: "La factura {id} se ha pagado en parte. Hemos liberado {rel}, que cubre lo entregado al precio acordado. {gap} está retenido porque {parts}. En cuanto se resuelva — con un abono o la entrega pendiente — el resto se libera en condiciones {terms}.",
  fr: "La facture {id} a été payée en partie. Nous avons libéré {rel}, ce qui couvre ce qui a été livré au prix convenu. {gap} est retenu parce que {parts}. Dès que c'est réglé — par avoir ou par la livraison restante — le solde est libéré aux conditions {terms}.",
  zh: "发票 {id} 已部分付款。我们已放行 {rel}，覆盖按约定价格实际交付的部分。{gap} 暂被扣留，原因是{parts}。一旦解决——收到贷项凭证或补齐交货——余款将按 {terms} 账期放行。",
};

const CLAUSE_PRICE: Record<Lang, string> = {
  en: "it was billed at {p1} per unit against the {p2} we have agreed in {ref}",
  de: "pro Einheit {p1} berechnet wurden statt der in {ref} vereinbarten {p2}",
  es: "se facturó a {p1} por unidad frente a los {p2} acordados en {ref}",
  fr: "elle a été facturée à {p1} l'unité contre les {p2} convenus dans {ref}",
  zh: "开票单价为 {p1}，高于 {ref} 中约定的 {p2}",
};

const CLAUSE_QTY: Record<Lang, string> = {
  en: "it was billed for {q1} but our goods receipt {gref} records {q2} delivered",
  de: "{q1} berechnet wurden, unser Wareneingang {gref} aber {q2} verzeichnet",
  es: "se facturaron {q1} pero nuestro albarán {gref} registra {q2} entregados",
  fr: "elle a été facturée pour {q1} alors que notre réception {gref} enregistre {q2} livrés",
  zh: "开票数量为 {q1}，但收货单 {gref} 记录实际到货 {q2}",
};

const CLAUSE_JOIN: Record<Lang, string> = {
  en: ", and ", de: " und ", es: ", y ", fr: ", et ", zh: "，且",
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
  es: "Esta pregunta cambia una condición comercial, así que no voy a responderla yo. La he pasado a un especialista de compras con todo lo necesario, y le traeré su respuesta directamente aquí.",
  fr: "Cette question touche à une condition commerciale, je ne vais donc pas y répondre moi-même. Je l'ai transmise à un spécialiste des achats avec tout le nécessaire, et je vous rapporterai sa réponse directement ici.",
  zh: "这个问题涉及商务条款的变更，我不会自行答复。我已把它连同所需资料转给采购专员，拿到答复后会第一时间在这里回复您。",
};

/** The assistant's acknowledgement of a free-typed supplier message. */
export const ACK_TEXT: Record<Lang, string> = {
  en: "Thank you — I have noted this on your file, and the procurement desk can see it.",
  de: "Danke — ich habe das in Ihrer Akte vermerkt, und der Einkauf kann es sehen.",
  es: "Gracias — lo he anotado en su expediente y el equipo de compras puede verlo.",
  fr: "Merci — je l'ai noté dans votre dossier et le service achats peut le voir.",
  zh: "谢谢——我已记录在您的档案中，采购团队可以看到。",
};

/** The assistant's greeting when the conversation is empty. */
export const GREETING_TEXT: Record<Lang, string> = {
  en: "Hello — I can see your orders, invoices and payments. What would you like to know?",
  de: "Hallo — ich sehe Ihre Bestellungen, Rechnungen und Zahlungen. Was möchten Sie wissen?",
  es: "Hola — puedo ver sus pedidos, facturas y pagos. ¿Qué desea saber?",
  fr: "Bonjour — je vois vos commandes, factures et paiements. Que souhaitez-vous savoir ?",
  zh: "您好——我可以看到您的订单、发票和付款情况。想了解什么？",
};

/** Why an invoice is held, one short line, in the reader's language. */
export function holdReasonFor(t: InvoiceTieout, lang: Lang): string | null {
  const price = priceVariance(t);
  const qty = qtyVariance(t);
  const priceLine: Record<Lang, string> = {
    en: "Billed {p} above the agreed price",
    de: "{p} über dem vereinbarten Preis berechnet",
    es: "Facturado {p} por encima del precio acordado",
    fr: "Facturé {p} au-dessus du prix convenu",
    zh: "开票价高出约定价 {p}",
  };
  const qtyLine: Record<Lang, string> = {
    en: "Billed for {q1} but only {q2} arrived",
    de: "{q1} berechnet, aber nur {q2} geliefert",
    es: "Facturado {q1} pero solo llegaron {q2}",
    fr: "Facturé pour {q1} mais seulement {q2} livrés",
    zh: "开票 {q1} 件，实际到货 {q2} 件",
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
