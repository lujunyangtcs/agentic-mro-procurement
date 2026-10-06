/**
 * The translation layer.
 *
 * Plant engineers and suppliers write in the language they work in. The
 * workforce reads that language, and renders everything downstream — the
 * structured requisition, the agent's findings, the workspace itself — in
 * whichever language the person reading it has chosen.
 *
 * The translation here is scripted rather than live: every phrase the demo can
 * show is written out in all five languages below. That keeps the demo exact
 * and repeatable, and means it works with no network and no model call.
 */

import * as React from "react";
import type { Lang } from "@/mro/data/procurement";
import { LANGUAGES } from "@/mro/data/procurement";
import { useProcurement } from "@/mro/data/store";
import { Spinner } from "@/mro/components/ai/Spinner";
import { StreamingText } from "@/mro/components/ai/StreamingText";
import { cn } from "@/mro/lib/utils";
import { Check, ChevronDown, Languages as LanguagesIcon } from "lucide-react";

/* ── Phrase book ────────────────────────────────────────────────────────── */

type Phrase = Record<Lang, string>;

const DICT: Record<string, Phrase> = {
  /* Work menu */
  "nav.myDesk": {
    en: "My desk", de: "Mein Arbeitsplatz", es: "Mi escritorio",
    fr: "Mon poste", zh: "我的工作台",
  },
  "nav.requisitions": {
    en: "Requisitions", de: "Bestellanforderungen", es: "Solicitudes",
    fr: "Demandes d'achat", zh: "采购申请",
  },
  "nav.exceptions": {
    en: "Exceptions", de: "Ausnahmen", es: "Excepciones",
    fr: "Exceptions", zh: "异常",
  },
  "nav.invoiceMatching": {
    en: "Invoice matching", de: "Rechnungsprüfung", es: "Cotejo de facturas",
    fr: "Rapprochement des factures", zh: "发票核对",
  },

  /* Requisitions page */
  "req.title": {
    en: "Requisitions", de: "Bestellanforderungen", es: "Solicitudes de compra",
    fr: "Demandes d'achat", zh: "采购申请",
  },
  "req.lead": {
    en: "Every maintenance request the workforce is structuring, validating and releasing. The agents do the work and recommend an action; you approve the ones that matter.",
    de: "Jede Instandhaltungsanforderung, die die Belegschaft strukturiert, prüft und freigibt. Die Agenten erledigen die Arbeit und empfehlen eine Maßnahme; Sie genehmigen die wichtigen.",
    es: "Cada solicitud de mantenimiento que el equipo estructura, valida y libera. Los agentes hacen el trabajo y recomiendan una acción; usted aprueba las que importan.",
    fr: "Chaque demande de maintenance que les agents structurent, vérifient et libèrent. Ils font le travail et recommandent une action ; vous approuvez celles qui comptent.",
    zh: "智能体正在结构化、校验并放行的每一张维修采购申请。工作由智能体完成并给出建议,关键决策由你批准。",
  },
  "req.worklist": {
    en: "Requisition worklist", de: "Arbeitsvorrat", es: "Lista de trabajo",
    fr: "Liste de travail", zh: "申请单工作队列",
  },
  "req.worklistSub": {
    en: "Ranked with the requests that need you at the top. Open any row to see the requisition exactly as it appears in the system of record.",
    de: "Die Anforderungen, die Sie brauchen, stehen oben. Öffnen Sie eine Zeile, um die Anforderung genau so zu sehen, wie sie im System steht.",
    es: "Las solicitudes que requieren su acción aparecen primero. Abra cualquier fila para ver la solicitud tal como está en el sistema.",
    fr: "Les demandes qui requièrent votre décision figurent en tête. Ouvrez une ligne pour voir la demande telle qu'elle figure dans le système.",
    zh: "需要你处理的排在最前。点开任一行,可查看该申请单在系统中的原样。",
  },
  "req.tile.total": {
    en: "Requisitions", de: "Anforderungen", es: "Solicitudes",
    fr: "Demandes", zh: "申请单",
  },
  "req.tile.inProgress": {
    en: "In progress", de: "In Bearbeitung", es: "En curso",
    fr: "En cours", zh: "处理中",
  },
  "req.tile.held": {
    en: "Held for you", de: "Für Sie angehalten", es: "Retenidas para usted",
    fr: "En attente de vous", zh: "待你决定",
  },
  "req.tile.touchless": {
    en: "Released without a person", de: "Ohne Person freigegeben", es: "Liberadas sin intervención",
    fr: "Libérées sans intervention", zh: "无人工放行",
  },
  "req.sub.total": {
    en: "of requested spend", de: "an angefordertem Volumen", es: "de gasto solicitado",
    fr: "de dépense demandée", zh: "申请金额",
  },
  "req.sub.inProgress": {
    en: "Being structured and validated now",
    de: "Wird gerade strukturiert und geprüft",
    es: "Estructurándose y validándose ahora",
    fr: "En cours de structuration et de vérification",
    zh: "正在结构化与校验",
  },
  "req.sub.held": {
    en: "waiting on a decision", de: "warten auf eine Entscheidung", es: "a la espera de una decisión",
    fr: "en attente d'une décision", zh: "等待决定",
  },
  "req.sub.touchless": {
    en: "finished requests", de: "abgeschlossenen Anforderungen", es: "solicitudes finalizadas",
    fr: "demandes terminées", zh: "已完成申请",
  },
  "word.of": { en: "of", de: "von", es: "de", fr: "sur", zh: "共" },

  /* Table headers */
  "col.request": {
    en: "Request", de: "Anforderung", es: "Solicitud", fr: "Demande", zh: "申请单",
  },
  "col.item": { en: "Item", de: "Artikel", es: "Artículo", fr: "Article", zh: "物料" },
  "col.raisedBy": {
    en: "Raised by", de: "Angefordert von", es: "Solicitado por",
    fr: "Demandé par", zh: "申请来源",
  },
  "col.value": { en: "Value", de: "Wert", es: "Valor", fr: "Valeur", zh: "金额" },
  "col.status": { en: "Status", de: "Status", es: "Estado", fr: "Statut", zh: "状态" },
  "col.workforce": {
    en: "Workforce", de: "Belegschaft", es: "Equipo", fr: "Agents", zh: "智能体",
  },
  "col.action": { en: "Action", de: "Aktion", es: "Acción", fr: "Action", zh: "操作" },

  /* Status */
  "status.structuring": {
    en: "Structuring", de: "Strukturierung", es: "Estructurando",
    fr: "Structuration", zh: "结构化中",
  },
  "status.validating": {
    en: "Validating", de: "Prüfung", es: "Validando", fr: "Vérification", zh: "校验中",
  },
  "status.held": {
    en: "Held for you", de: "Für Sie angehalten", es: "Retenida",
    fr: "En attente de vous", zh: "待你决定",
  },
  "status.released": {
    en: "Released", de: "Freigegeben", es: "Liberada", fr: "Libérée", zh: "已放行",
  },
  "status.needsYou": {
    en: "Needs you", de: "Braucht Sie", es: "Requiere su acción",
    fr: "Requiert votre action", zh: "需要你",
  },

  /* Buttons */
  "btn.open": { en: "Open", de: "Öffnen", es: "Abrir", fr: "Ouvrir", zh: "打开" },
  "btn.seeRun": {
    en: "See the run", de: "Ablauf ansehen", es: "Ver el proceso",
    fr: "Voir le déroulé", zh: "查看流程",
  },
  "btn.all": { en: "All", de: "Alle", es: "Todas", fr: "Toutes", zh: "全部" },
  "btn.needsYou": {
    en: "Needs you", de: "Braucht Sie", es: "Requiere acción",
    fr: "Requiert une action", zh: "需要你",
  },
  "btn.inProgress": {
    en: "In progress", de: "In Bearbeitung", es: "En curso", fr: "En cours", zh: "处理中",
  },
  "btn.released": {
    en: "Released", de: "Freigegeben", es: "Liberadas", fr: "Libérées", zh: "已放行",
  },

  /* Translation tell */
  "xlat.original": {
    en: "Original request", de: "Ursprüngliche Anforderung", es: "Solicitud original",
    fr: "Demande d'origine", zh: "原始请求",
  },
  "xlat.translated": {
    en: "translated by the workforce", de: "von der Belegschaft übersetzt",
    es: "traducido por el equipo", fr: "traduit par les agents", zh: "由智能体翻译",
  },
  "xlat.writtenIn": {
    en: "Written in", de: "Verfasst auf", es: "Redactada en",
    fr: "Rédigée en", zh: "原文语言",
  },
  "xlat.working": {
    en: "Reading and translating…", de: "Lesen und übersetzen…",
    es: "Leyendo y traduciendo…", fr: "Lecture et traduction…", zh: "正在阅读并翻译…",
  },
  "xlat.language": {
    en: "Language", de: "Sprache", es: "Idioma", fr: "Langue", zh: "语言",
  },

  /* ── Supplier portal — the whole page follows the chosen language ─────── */
  "sp.chip": {
    en: "Supplier self service", de: "Lieferanten-Self-Service", es: "Autoservicio de proveedores",
    fr: "Libre-service fournisseur", zh: "供应商自助服务",
  },
  "sp.overviewTitle": {
    en: "Overview", de: "Übersicht", es: "Resumen", fr: "Vue d'ensemble", zh: "概览",
  },
  "sp.askTitle": {
    en: "Ask & my payments", de: "Fragen & meine Zahlungen", es: "Preguntas y mis pagos",
    fr: "Questions & mes paiements", zh: "咨询与我的付款",
  },
  "sp.overviewLead": {
    en: "Your orders, your invoices and your money with Bond, live.",
    de: "Ihre Bestellungen, Rechnungen und Ihr Geld bei Bond — live.",
    es: "Sus pedidos, sus facturas y su dinero con Bond, en vivo.",
    fr: "Vos commandes, vos factures et votre argent chez Bond, en direct.",
    zh: "您与 Bond 之间的订单、发票和款项，实时呈现。",
  },
  "sp.askLead": {
    en: "Ask anything — the assistant answers from the live records and passes anything commercial to a person.",
    de: "Fragen Sie alles — der Assistent antwortet aus den Live-Daten und übergibt Kommerzielles an eine Person.",
    es: "Pregunte lo que quiera — el asistente responde desde los registros en vivo y pasa lo comercial a una persona.",
    fr: "Posez vos questions — l'assistant répond à partir des données en direct et transmet le commercial à une personne.",
    zh: "任何问题都可以问——助手依据实时记录作答，涉及商务事项会转交专人处理。",
  },
  "sp.tile.invoices": {
    en: "Invoices submitted", de: "Eingereichte Rechnungen", es: "Facturas presentadas",
    fr: "Factures déposées", zh: "已提交发票",
  },
  "sp.tile.invoicesSub": {
    en: "{amt} billed", de: "{amt} in Rechnung gestellt", es: "{amt} facturado",
    fr: "{amt} facturés", zh: "开票金额 {amt}",
  },
  "sp.tile.beingPaid": {
    en: "Being paid", de: "Wird bezahlt", es: "En pago", fr: "En cours de paiement", zh: "付款中",
  },
  "sp.tile.beingPaidSub": {
    en: "On {terms} terms", de: "Zahlungsziel {terms}", es: "Condiciones {terms}",
    fr: "Conditions {terms}", zh: "{terms} 账期",
  },
  "sp.tile.onHold": {
    en: "On hold", de: "Zurückgestellt", es: "Retenido", fr: "Retenu", zh: "暂扣中",
  },
  "sp.tile.onHoldSub": {
    en: "Queried against your invoices", de: "Rückfragen zu Ihren Rechnungen",
    es: "Con consultas sobre sus facturas", fr: "Faisant l'objet de questions", zh: "发票存在待解决的问题",
  },
  "sp.tile.waiting": {
    en: "Questions with a specialist", de: "Fragen beim Spezialisten",
    es: "Preguntas con un especialista", fr: "Questions chez un spécialiste", zh: "专员处理中的问题",
  },
  "sp.tile.waitingSome": {
    en: "Being reviewed by a person now", de: "Wird gerade von einer Person geprüft",
    es: "Un especialista las está revisando", fr: "En cours d'examen par une personne", zh: "正在由专人审阅",
  },
  "sp.tile.waitingNone": {
    en: "Nothing waiting", de: "Nichts offen", es: "Nada pendiente", fr: "Rien en attente", zh: "暂无待办",
  },
  "sp.panel.invoices": {
    en: "Your invoices", de: "Ihre Rechnungen", es: "Sus facturas", fr: "Vos factures", zh: "您的发票",
  },
  "sp.panel.invoicesSub": {
    en: "Exactly what we have received from you and what we are paying.",
    de: "Genau das, was wir von Ihnen erhalten haben und was wir bezahlen.",
    es: "Exactamente lo que hemos recibido de ustedes y lo que estamos pagando.",
    fr: "Exactement ce que nous avons reçu de vous et ce que nous payons.",
    zh: "我们收到的每张发票，以及正在支付的金额。",
  },
  "sp.panel.prs": {
    en: "Your purchase requests", de: "Ihre Bestellanforderungen", es: "Sus solicitudes de compra",
    fr: "Vos demandes d'achat", zh: "您的采购请求",
  },
  "sp.panel.prsSub": {
    en: "What Bond is preparing to order from you, live.",
    de: "Was Bond bei Ihnen bestellen wird — live.",
    es: "Lo que Bond está preparando para pedirles, en vivo.",
    fr: "Ce que Bond s'apprête à vous commander, en direct.",
    zh: "Bond 正准备向您下单的内容，实时更新。",
  },
  "sp.panel.money": {
    en: "Your money", de: "Ihr Geld", es: "Su dinero", fr: "Votre argent", zh: "您的款项",
  },
  "sp.panel.moneySub": {
    en: "How much of what you billed is on its way, and what is held.",
    de: "Wie viel Ihres Rechnungsbetrags unterwegs ist und was zurückgehalten wird.",
    es: "Cuánto de lo facturado está en camino y qué está retenido.",
    fr: "Ce qui est en route sur vos factures, et ce qui est retenu.",
    zh: "已开票金额中多少在付款途中，多少被扣留。",
  },
  "sp.col.invoice": { en: "Invoice", de: "Rechnung", es: "Factura", fr: "Facture", zh: "发票" },
  "sp.col.billed": { en: "Billed", de: "Berechnet", es: "Facturado", fr: "Facturé", zh: "开票金额" },
  "sp.col.paying": { en: "Paying", de: "Zahlung", es: "En pago", fr: "Payé", zh: "付款金额" },
  "sp.col.onHold": { en: "On hold", de: "Zurückgestellt", es: "Retenido", fr: "Retenu", zh: "暂扣" },
  "sp.col.status": { en: "Status", de: "Status", es: "Estado", fr: "Statut", zh: "状态" },
  "sp.col.item": { en: "Item", de: "Artikel", es: "Artículo", fr: "Article", zh: "物料" },
  "sp.col.value": { en: "Value", de: "Wert", es: "Valor", fr: "Valeur", zh: "金额" },
  "sp.col.reason": { en: "Reason", de: "Grund", es: "Motivo", fr: "Motif", zh: "原因" },
  "sp.pill.beingPaid": {
    en: "Being paid", de: "Wird bezahlt", es: "En pago", fr: "En paiement", zh: "付款中",
  },
  "sp.pill.query": {
    en: "Query open", de: "Rückfrage offen", es: "Consulta abierta", fr: "Question ouverte", zh: "有疑问待解决",
  },
  "sp.held": {
    en: "{amt} held", de: "{amt} zurückgehalten", es: "{amt} retenido",
    fr: "{amt} retenu", zh: "扣留 {amt}",
  },
  "sp.beingPaidLine": {
    en: "being paid", de: "wird bezahlt", es: "en pago", fr: "en paiement", zh: "付款中",
  },
  "sp.status.released": {
    en: "Released", de: "Freigegeben", es: "Liberada", fr: "Libérée", zh: "已放行",
  },
  "sp.status.onHold": {
    en: "On hold", de: "Zurückgestellt", es: "Retenida", fr: "En attente", zh: "暂缓",
  },
  "sp.status.processing": {
    en: "Being processed", de: "In Bearbeitung", es: "En proceso", fr: "En traitement", zh: "处理中",
  },
  "sp.reason.released": {
    en: "Order on its way", de: "Bestellung unterwegs", es: "Pedido en camino",
    fr: "Commande en route", zh: "订单已在途",
  },
  "sp.reason.spec": {
    en: "Specification being confirmed", de: "Spezifikation wird bestätigt",
    es: "Especificación en confirmación", fr: "Spécification en cours de confirmation", zh: "规格确认中",
  },
  "sp.reason.dup": {
    en: "Being consolidated with an open request", de: "Wird mit einer offenen Anforderung zusammengeführt",
    es: "Consolidándose con una solicitud abierta", fr: "En cours de regroupement avec une demande ouverte",
    zh: "正与已有请求合并",
  },
  "sp.reason.stock": {
    en: "Being checked against stock", de: "Wird gegen den Bestand geprüft",
    es: "Comprobándose contra el stock", fr: "Vérification par rapport au stock", zh: "正在核对库存",
  },
  "sp.reason.warranty": {
    en: "Warranty position being checked", de: "Garantieanspruch wird geprüft",
    es: "Comprobando la garantía", fr: "Garantie en cours de vérification", zh: "保修情况核查中",
  },
  "sp.reason.contract": {
    en: "Supplier terms under review", de: "Lieferantenkonditionen in Prüfung",
    es: "Condiciones del proveedor en revisión", fr: "Conditions fournisseur en cours d'examen",
    zh: "供应商条款审核中",
  },
  "sp.reason.threshold": {
    en: "Awaiting a sign-off", de: "Wartet auf eine Freigabe", es: "A la espera de una aprobación",
    fr: "En attente d'une validation", zh: "等待审批",
  },
  "sp.reason.review": {
    en: "Being reviewed", de: "Wird geprüft", es: "En revisión", fr: "En cours d'examen", zh: "审核中",
  },
  "sp.nothingInFlight": {
    en: "Nothing in flight.", de: "Nichts in Bearbeitung.", es: "Nada en curso.",
    fr: "Rien en cours.", zh: "暂无进行中的请求。",
  },
  "sp.chat.title": {
    en: "Ask about your orders and payments", de: "Fragen zu Bestellungen und Zahlungen",
    es: "Pregunte por sus pedidos y pagos", fr: "Vos commandes et paiements", zh: "咨询您的订单与付款",
  },
  "sp.chat.sub": {
    en: "You write in {lang} — the assistant and the desk read it in their own language.",
    de: "Sie schreiben auf {lang} — Assistent und Einkauf lesen es in ihrer Sprache.",
    es: "Usted escribe en {lang}; el asistente y el equipo de compras lo leen en su idioma.",
    fr: "Vous écrivez en {lang} ; l'assistant et le service achats le lisent dans leur langue.",
    zh: "您用{lang}书写——助手和采购团队会以他们的语言阅读。",
  },
  "sp.chat.online": {
    en: "Assistant online", de: "Assistent online", es: "Asistente en línea",
    fr: "Assistant en ligne", zh: "助手在线",
  },
  "sp.chat.assistant": {
    en: "Procurement assistant", de: "Einkaufsassistent", es: "Asistente de compras",
    fr: "Assistant achats", zh: "采购助手",
  },
  "sp.chat.specialist": {
    en: "Procurement specialist", de: "Einkaufsspezialist", es: "Especialista de compras",
    fr: "Spécialiste achats", zh: "采购专员",
  },
  "sp.chat.withSpecialist": {
    en: "With a specialist", de: "Beim Spezialisten", es: "Con un especialista",
    fr: "Chez un spécialiste", zh: "专员处理中",
  },
  "sp.chat.byEmail": {
    en: "sent by email", de: "per E-Mail gesendet", es: "enviado por correo",
    fr: "envoyé par e-mail", zh: "已通过邮件发送",
  },
  "sp.chat.inPortal": {
    en: "answered in the portal", de: "im Portal beantwortet", es: "respondido en el portal",
    fr: "répondu dans le portail", zh: "已在门户答复",
  },
  "sp.chat.answeredFrom": {
    en: "Answered from {name}'s live order and invoice records.",
    de: "Beantwortet aus den Live-Bestell- und Rechnungsdaten von {name}.",
    es: "Respondido desde los registros en vivo de pedidos y facturas de {name}.",
    fr: "Réponse issue des données en direct des commandes et factures de {name}.",
    zh: "依据 {name} 的实时订单与发票记录作答。",
  },
  "sp.chat.placeholder": {
    en: "Write your message…", de: "Nachricht schreiben…", es: "Escriba su mensaje…",
    fr: "Écrivez votre message…", zh: "请输入您的消息…",
  },
  "sp.chat.allAsked": {
    en: "You have asked everything on the list — the specialist's answers arrive above.",
    de: "Sie haben alle Fragen der Liste gestellt — die Antworten der Spezialisten erscheinen oben.",
    es: "Ya ha hecho todas las preguntas de la lista — las respuestas del especialista llegan arriba.",
    fr: "Vous avez posé toutes les questions de la liste — les réponses du spécialiste arrivent ci-dessus.",
    zh: "列表中的问题都已问完——专员的答复会显示在上方。",
  },

  /* ── The dashboard ─────────────────────────────────────────────────── */
  "dash.todaysRead": {
    en: "Today's read: {n} requests in flight — {held} held at {value}, {inv} invoices holding {rec}.",
    de: "Heutige Lage: {n} Anforderungen in Bearbeitung — {held} angehalten über {value}, {inv} Rechnungen halten {rec} zurück.",
    es: "Situación de hoy: {n} solicitudes en curso — {held} detenidas por {value}, {inv} facturas retienen {rec}.",
    fr: "Situation du jour : {n} demandes en cours — {held} bloquées pour {value}, {inv} factures retiennent {rec}.",
    zh: "今日概览：{n} 张申请在途 —— {held} 张被暂停，金额 {value}；{inv} 张发票扣住 {rec}。",
  },
  "dash.priority": {
    en: "Priority: the {value} mechanical seal for {line} — the line is down and one specification holds release. Everything else is on contract and moving.",
    de: "Priorität: die Gleitringdichtung über {value} für {line} — die Linie steht still, und eine offene Spezifikation hält die Freigabe auf. Alles Übrige läuft auf Vertrag.",
    es: "Prioridad: el cierre mecánico de {value} para {line} — la línea está parada y una especificación retiene la liberación. Todo lo demás está en contrato y avanza.",
    fr: "Priorité : la garniture mécanique à {value} pour {line} — la ligne est à l'arrêt et une spécification bloque la libération. Tout le reste est sous contrat et avance.",
    zh: "优先处理：{line} 的机械密封，{value} —— 产线停机，一项规格未定卡住放行。其余全部在协议内正常推进。",
  },
  "dash.closedSoFar": {
    en: "{n} exceptions closed so far. {held} still waiting on a decision.",
    de: "{n} Ausnahmen bisher geschlossen. {held} warten weiterhin auf eine Entscheidung.",
    es: "{n} excepciones cerradas hasta ahora. {held} siguen esperando una decisión.",
    fr: "{n} exceptions closes à ce jour. {held} attendent encore une décision.",
    zh: "已处理 {n} 项异常，还有 {held} 项等待决定。",
  },
  "dash.closedProtected": {
    en: "{n} exceptions closed and {value} protected so far. {held} still waiting on a decision.",
    de: "{n} Ausnahmen geschlossen und {value} gesichert. {held} warten weiterhin auf eine Entscheidung.",
    es: "{n} excepciones cerradas y {value} protegidos hasta ahora. {held} siguen esperando una decisión.",
    fr: "{n} exceptions closes et {value} protégés à ce jour. {held} attendent encore une décision.",
    zh: "已处理 {n} 项异常，守住 {value}；还有 {held} 项等待决定。",
  },
  "dash.allClear": {
    en: "All clear — every request released.",
    de: "Alles erledigt — jede Anforderung ist freigegeben.",
    es: "Todo despejado — todas las solicitudes están liberadas.",
    fr: "Tout est réglé — toutes les demandes sont libérées.",
    zh: "全部处理完毕 —— 所有申请均已放行。",
  },
  "dash.allClearProtected": {
    en: "All clear — every request released, {value} protected along the way.",
    de: "Alles erledigt — jede Anforderung freigegeben, {value} dabei gesichert.",
    es: "Todo despejado — todas las solicitudes liberadas, {value} protegidos por el camino.",
    fr: "Tout est réglé — toutes les demandes libérées, {value} protégés en chemin.",
    zh: "全部处理完毕 —— 所有申请均已放行，过程中守住 {value}。",
  },
  "dash.needYou": {
    en: "need you",
    de: "brauchen Sie",
    es: "requieren su atención",
    fr: "requièrent votre attention",
    zh: "待您处理",
  },
  "dash.heldStat": {
    en: "held",
    de: "angehalten",
    es: "detenido",
    fr: "bloqué",
    zh: "暂停金额",
  },
  "dash.touchless": {
    en: "touchless",
    de: "ohne Zutun",
    es: "sin intervención",
    fr: "sans intervention",
    zh: "无人工干预",
  },
  "dash.newRequest": {
    en: "+ New request",
    de: "+ Neue Anforderung",
    es: "+ Nueva solicitud",
    fr: "+ Nouvelle demande",
    zh: "+ 新建申请",
  },
  "dash.search": {
    en: "Search requisitions, materials…",
    de: "Anforderungen, Materialien suchen …",
    es: "Buscar solicitudes, materiales…",
    fr: "Rechercher demandes, matériels…",
    zh: "搜索申请单、物料……",
  },
  "dash.notifications": {
    en: "Notifications",
    de: "Benachrichtigungen",
    es: "Notificaciones",
    fr: "Notifications",
    zh: "通知",
  },
  "dash.fromSuppliers": {
    en: "From suppliers",
    de: "Von Lieferanten",
    es: "De proveedores",
    fr: "Des fournisseurs",
    zh: "来自供应商",
  },
  "dash.open": {
    en: "Open ↗",
    de: "Öffnen ↗",
    es: "Abrir ↗",
    fr: "Ouvrir ↗",
    zh: "打开 ↗",
  },
  "dash.showMore": {
    en: "Show {n} more →",
    de: "{n} weitere anzeigen →",
    es: "Ver {n} más →",
    fr: "Voir {n} de plus →",
    zh: "再看 {n} 条 →",
  },
  "dash.takeToMarket": {
    en: "Take it to market →",
    de: "In den Markt geben →",
    es: "Salir al mercado →",
    fr: "Aller au marché →",
    zh: "去市场询价 →",
  },
  "dash.nothingStopped": {
    en: "Nothing stopped.",
    de: "Nichts angehalten.",
    es: "Nada detenido.",
    fr: "Rien de bloqué.",
    zh: "没有停下的事项。",
  },
  "kpi.inFlight": {
    en: "Requests in flight",
    de: "Anforderungen in Bearbeitung",
    es: "Solicitudes en curso",
    fr: "Demandes en cours",
    zh: "在途申请",
  },
  "kpi.inFlightSub": {
    en: "{c} countries · {l} languages",
    de: "{c} Länder · {l} Sprachen",
    es: "{c} países · {l} idiomas",
    fr: "{c} pays · {l} langues",
    zh: "{c} 个国家 · {l} 种语言",
  },
  "kpi.heldForYou": {
    en: "Held for you",
    de: "Für Sie angehalten",
    es: "Detenidas para usted",
    fr: "Bloquées pour vous",
    zh: "等您决定",
  },
  "kpi.heldSub": {
    en: "{value} waiting on a decision",
    de: "{value} warten auf eine Entscheidung",
    es: "{value} esperando una decisión",
    fr: "{value} en attente d'une décision",
    zh: "{value} 等待决定",
  },
  "kpi.spendProtected": {
    en: "Spend protected",
    de: "Gesicherte Ausgaben",
    es: "Gasto protegido",
    fr: "Dépenses protégées",
    zh: "守住的支出",
  },
  "kpi.spendGrows": {
    en: "Grows as you resolve",
    de: "Wächst mit jeder Klärung",
    es: "Crece a medida que resuelve",
    fr: "Augmente à mesure que vous résolvez",
    zh: "随您逐条处理而增长",
  },
  "kpi.spendClosed": {
    en: "{n} exceptions closed",
    de: "{n} Ausnahmen geschlossen",
    es: "{n} excepciones cerradas",
    fr: "{n} exceptions closes",
    zh: "已处理 {n} 项异常",
  },
  "kpi.invoiceHolds": {
    en: "Invoice holds",
    de: "Rechnungssperren",
    es: "Facturas retenidas",
    fr: "Factures retenues",
    zh: "发票扣款",
  },
  "kpi.invoiceSub": {
    en: "Across {a} of {b} invoices",
    de: "Über {a} von {b} Rechnungen",
    es: "En {a} de {b} facturas",
    fr: "Sur {a} factures sur {b}",
    zh: "涉及 {b} 张发票中的 {a} 张",
  },
  "card.requisitions": {
    en: "Requisitions",
    de: "Bestellanforderungen",
    es: "Solicitudes de compra",
    fr: "Demandes d'achat",
    zh: "采购申请",
  },
  "card.reqRight": {
    en: "{value} in flight",
    de: "{value} in Bearbeitung",
    es: "{value} en curso",
    fr: "{value} en cours",
    zh: "在途 {value}",
  },
  "card.reqFoot": {
    en: "Held requests wait on the exception board — everything else the workforce moves on its own.",
    de: "Angehaltene Anforderungen warten auf der Ausnahmetafel — alles Übrige bewegen die Agenten selbst.",
    es: "Las solicitudes detenidas esperan en el tablero de excepciones — el resto lo mueven los agentes por sí solos.",
    fr: "Les demandes bloquées attendent sur le tableau des exceptions — le reste avance tout seul.",
    zh: "被暂停的申请在异常板上等待 —— 其余的由智能体自行推进。",
  },
  "card.exceptions": {
    en: "Exceptions",
    de: "Ausnahmen",
    es: "Excepciones",
    fr: "Exceptions",
    zh: "异常",
  },
  "card.excRight": {
    en: "{n} open",
    de: "{n} offen",
    es: "{n} abiertas",
    fr: "{n} ouvertes",
    zh: "{n} 项待办",
  },
  "card.excFoot": {
    en: "Each one carries its evidence and a single recommended action.",
    de: "Jede bringt ihre Belege mit und einen einzigen empfohlenen Schritt.",
    es: "Cada una trae sus pruebas y una única acción recomendada.",
    fr: "Chacune apporte ses pièces et une seule action recommandée.",
    zh: "每一条都附带证据，以及一个推荐的处理动作。",
  },
  "card.invoices": {
    en: "Invoice matching",
    de: "Rechnungsprüfung",
    es: "Cotejo de facturas",
    fr: "Rapprochement des factures",
    zh: "发票核对",
  },
  "card.invRight": {
    en: "{value} recoverable",
    de: "{value} rückholbar",
    es: "{value} recuperables",
    fr: "{value} récupérables",
    zh: "可追回 {value}",
  },
  "card.invFoot": {
    en: "Every invoice is checked against the order, the goods receipt and the agreement before it pays.",
    de: "Jede Rechnung wird vor der Zahlung gegen Bestellung, Wareneingang und Vertrag geprüft.",
    es: "Cada factura se coteja con el pedido, la entrada de mercancía y el acuerdo antes de pagarse.",
    fr: "Chaque facture est vérifiée contre la commande, la réception et le contrat avant paiement.",
    zh: "每张发票在付款前都会与订单、收货和协议逐项核对。",
  },
  "col.invoice": {
    en: "Invoice",
    de: "Rechnung",
    es: "Factura",
    fr: "Facture",
    zh: "发票",
  },
  "col.amount": {
    en: "Amount",
    de: "Betrag",
    es: "Importe",
    fr: "Montant",
    zh: "金额",
  },
  "inv.agree": {
    en: "Documents agree",
    de: "Belege stimmen überein",
    es: "Los documentos coinciden",
    fr: "Les documents concordent",
    zh: "单据一致",
  },
  "inv.heldAmt": {
    en: "{value} held",
    de: "{value} gesperrt",
    es: "{value} retenidos",
    fr: "{value} retenus",
    zh: "扣住 {value}",
  },
  "inv.records": {
    en: "{po} · {gr} records {a} of {b} billed",
    de: "{po} · {gr} verbucht {a} von {b} berechneten",
    es: "{po} · {gr} registra {a} de {b} facturados",
    fr: "{po} · {gr} enregistre {a} sur {b} facturés",
    zh: "{po} · {gr} 记录已收 {a}，开票 {b}",
  },
  "chart.heldByReason": {
    en: "Held value by reason",
    de: "Angehaltener Wert nach Grund",
    es: "Valor detenido por motivo",
    fr: "Valeur bloquée par motif",
    zh: "暂停金额（按原因）",
  },
  "chart.byStatus": {
    en: "Requests by status",
    de: "Anforderungen nach Status",
    es: "Solicitudes por estado",
    fr: "Demandes par statut",
    zh: "申请（按状态）",
  },
  "lane.spec": {
    en: "Spec",
    de: "Spezifikation",
    es: "Especificación",
    fr: "Spécification",
    zh: "规格",
  },
  "lane.duplicate": {
    en: "Duplicate",
    de: "Doppelt",
    es: "Duplicada",
    fr: "Doublon",
    zh: "重复",
  },
  "lane.stock": {
    en: "Stock",
    de: "Bestand",
    es: "Existencias",
    fr: "Stock",
    zh: "库存",
  },
  "lane.warranty": {
    en: "Warranty",
    de: "Gewährleistung",
    es: "Garantía",
    fr: "Garantie",
    zh: "保修",
  },
  "lane.contract": {
    en: "Contract",
    de: "Vertrag",
    es: "Contrato",
    fr: "Contrat",
    zh: "合约",
  },
  "lane.limit": {
    en: "Limit",
    de: "Limit",
    es: "Límite",
    fr: "Limite",
    zh: "限额",
  },
  "pie.held": {
    en: "Held",
    de: "Angehalten",
    es: "Detenidas",
    fr: "Bloquées",
    zh: "暂停",
  },
  "pie.inProgress": {
    en: "In progress",
    de: "In Arbeit",
    es: "En curso",
    fr: "En cours",
    zh: "处理中",
  },
  "pie.released": {
    en: "Released",
    de: "Freigegeben",
    es: "Liberadas",
    fr: "Libérées",
    zh: "已放行",
  },
  "audit.rule": {
    en: "The agents only recommend. Nothing is released, merged, claimed or paid without your approval.",
    de: "Die Agenten geben nur Empfehlungen. Nichts wird ohne Ihre Freigabe freigegeben, zusammengeführt, geltend gemacht oder bezahlt.",
    es: "Los agentes solo recomiendan. Nada se libera, fusiona, reclama ni paga sin su aprobación.",
    fr: "Les agents ne font que recommander. Rien n'est libéré, fusionné, réclamé ni payé sans votre approbation.",
    zh: "智能体只做推荐。未经您批准，不会放行、合并、索赔或付款。",
  },
  "audit.trail": {
    en: "Full audit trail on every decision",
    de: "Vollständige Nachvollziehbarkeit jeder Entscheidung",
    es: "Trazabilidad completa de cada decisión",
    fr: "Traçabilité complète de chaque décision",
    zh: "每个决定都有完整审计轨迹",
  },
  "user.buyerDesk": {
    en: "Procurement · MRO buyer desk",
    de: "Einkauf · MRO-Einkäuferplatz",
    es: "Compras · mesa de compras MRO",
    fr: "Achats · poste acheteur MRO",
    zh: "采购 · MRO 采购台",
  },

  /* ── The work menu ─────────────────────────────────────────────────── */
  "nav.overview": {
    en: "Overview",
    de: "Übersicht",
    es: "Visión general",
    fr: "Vue d'ensemble",
    zh: "总览",
  },
  "nav.dashboard": {
    en: "Dashboard",
    de: "Übersichtsseite",
    es: "Panel",
    fr: "Tableau de bord",
    zh: "仪表盘",
  },
  "nav.controlTower": {
    en: "Control tower",
    de: "Leitstand",
    es: "Torre de control",
    fr: "Tour de contrôle",
    zh: "控制塔",
  },
  "nav.agentWorkforce": {
    en: "Agent workforce",
    de: "Agenten-Team",
    es: "Equipo de agentes",
    fr: "Équipe d'agents",
    zh: "智能体团队",
  },
  "nav.serviceDesk": {
    en: "Service desk",
    de: "Service-Desk",
    es: "Mesa de servicio",
    fr: "Centre de service",
    zh: "服务台",
  },
  "nav.validation": {
    en: "Requisition validation",
    de: "Prüfung der Anforderung",
    es: "Validación de solicitudes",
    fr: "Validation des demandes",
    zh: "申请校验",
  },
  "nav.prProcessing": {
    en: "PR processing",
    de: "Anforderungsbearbeitung",
    es: "Procesamiento de solicitudes",
    fr: "Traitement des demandes",
    zh: "申请处理",
  },
  "nav.masterData": {
    en: "Master data",
    de: "Stammdaten",
    es: "Datos maestros",
    fr: "Données de base",
    zh: "主数据",
  },
  "nav.warranty": {
    en: "Warranty & coverage",
    de: "Gewährleistung & Deckung",
    es: "Garantía y cobertura",
    fr: "Garantie et couverture",
    zh: "保修与承保",
  },
  "nav.sourcing": {
    en: "Sourcing & contract",
    de: "Beschaffung & Vertrag",
    es: "Abastecimiento y contrato",
    fr: "Sourcing et contrat",
    zh: "寻源与合约",
  },
  "nav.approval": {
    en: "Approval & routing",
    de: "Freigabe & Weiterleitung",
    es: "Aprobación y enrutamiento",
    fr: "Approbation et acheminement",
    zh: "审批与路由",
  },
  "nav.system": {
    en: "System",
    de: "System",
    es: "Sistema",
    fr: "Système",
    zh: "系统",
  },
  "nav.auditLog": {
    en: "Audit log",
    de: "Prüfprotokoll",
    es: "Registro de auditoría",
    fr: "Journal d'audit",
    zh: "审计日志",
  },
  "nav.settings": {
    en: "Settings",
    de: "Einstellungen",
    es: "Ajustes",
    fr: "Paramètres",
    zh: "设置",
  },
  "nav.soon": {
    en: "Soon",
    de: "Bald",
    es: "Pronto",
    fr: "Bientôt",
    zh: "即将上线",
  },
  "nav.signOut": {
    en: "Sign out",
    de: "Abmelden",
    es: "Cerrar sesión",
    fr: "Se déconnecter",
    zh: "退出登录",
  },
  "nav.newRequest": {
    en: "New request",
    de: "Neue Anforderung",
    es: "Nueva solicitud",
    fr: "Nouvelle demande",
    zh: "新建申请",
  },

  /* ── What is bought, and why it stopped ────────────────────────────── */
  "item.MRO-SEAL-MECH-50MM-SIC": {
    en: "Mechanical seal — cartridge — 50 mm shaft — silicon carbide faces",
    de: "Gleitringdichtung — Patrone — 50 mm Welle — SiC-Gleitflächen",
    es: "Cierre mecánico — cartucho — eje 50 mm — caras de carburo de silicio",
    fr: "Garniture mécanique — cartouche — arbre 50 mm — faces carbure de silicium",
    zh: "机械密封 — 集装式 — 50 毫米轴 — 碳化硅端面",
  },
  "item.RAW-TIO2-RUTILE-SFC": {
    en: "Titanium dioxide — rutile — surface-treated — 25 kg bags",
    de: "Titandioxid — Rutil — oberflächenbehandelt — 25-kg-Säcke",
    es: "Dióxido de titanio — rutilo — tratado en superficie — sacos de 25 kg",
    fr: "Dioxyde de titane — rutile — traité en surface — sacs de 25 kg",
    zh: "钛白粉 — 金红石型 — 表面处理 — 25 公斤袋装",
  },
  "item.MRO-DIAPH-PTFE-2IN": {
    en: "Diaphragm — PTFE — 2 in transfer pump",
    de: "Membran — PTFE — 2-Zoll-Zulaufpumpe",
    es: "Membrana — PTFE — bomba de trasiego de 2 pulgadas",
    fr: "Membrane — PTFE — pompe de transfert 2 pouces",
    zh: "隔膜 — 聚四氟乙烯 — 2 英寸输送泵",
  },
  "item.MRO-DIAPH-PTFE-15IN": {
    en: "Diaphragm — PTFE — 1.5 in dosing pump",
    de: "Membran — PTFE — 1,5-Zoll-Dosierpumpe",
    es: "Membrana — PTFE — bomba dosificadora de 1,5 pulgadas",
    fr: "Membrane — PTFE — pompe doseuse 1,5 pouce",
    zh: "隔膜 — 聚四氟乙烯 — 1.5 英寸计量泵",
  },
  "item.MRO-MEDIA-ZRO2-1.2MM": {
    en: "Grinding media — zirconia — 1.2 mm — 25 kg bag",
    de: "Mahlkörper — Zirkonoxid — 1,2 mm — 25-kg-Sack",
    es: "Medio de molienda — circonia — 1,2 mm — saco de 25 kg",
    fr: "Média de broyage — zircone — 1,2 mm — sac de 25 kg",
    zh: "研磨介质 — 氧化锆 — 1.2 毫米 — 25 公斤/袋",
  },
  "item.MRO-VISC-PROBE-INLINE": {
    en: "Inline viscometer probe — DN50 flange — 0–20,000 cP",
    de: "Inline-Viskosimetersonde — Flansch DN50 — 0–20.000 cP",
    es: "Sonda de viscosímetro en línea — brida DN50 — 0–20.000 cP",
    fr: "Sonde de viscosimètre en ligne — bride DN50 — 0–20 000 cP",
    zh: "在线粘度计探头 — DN50 法兰 — 0–20,000 厘泊",
  },
  "item.MRO-MOTOR-IE3-15KW": {
    en: "Electric motor — IE3 — 15 kW — flange mount",
    de: "Elektromotor — IE3 — 15 kW — Flanschausführung",
    es: "Motor eléctrico — IE3 — 15 kW — montaje con brida",
    fr: "Moteur électrique — IE3 — 15 kW — montage à bride",
    zh: "电动机 — IE3 — 15 千瓦 — 法兰安装",
  },
  "item.MRO-HOSE-CHEM-2IN-EPDM": {
    en: "Chemical transfer hose — 2 in — EPDM lined — 6 m",
    de: "Chemieschlauch — 2 Zoll — EPDM-Auskleidung — 6 m",
    es: "Manguera para productos químicos — 2 pulgadas — forro EPDM — 6 m",
    fr: "Flexible produits chimiques — 2 pouces — revêtement EPDM — 6 m",
    zh: "化工输送软管 — 2 英寸 — 三元乙丙内衬 — 6 米",
  },
  "item.MRO-FILT-BAG-25UM-PP": {
    en: "Filter bag — 25 micron — polypropylene — size 2",
    de: "Filterbeutel — 25 Mikron — Polypropylen — Größe 2",
    es: "Bolsa filtrante — 25 micras — polipropileno — talla 2",
    fr: "Poche filtrante — 25 microns — polypropylène — taille 2",
    zh: "滤袋 — 25 微米 — 聚丙烯 — 2 号",
  },
  "item.MRO-VALVE-BFLY-DN80-PTFE": {
    en: "Butterfly valve — DN80 — PTFE lined — lever operated",
    de: "Absperrklappe — DN80 — PTFE-ausgekleidet — Handhebel",
    es: "Válvula de mariposa — DN80 — forrada de PTFE — accionamiento por palanca",
    fr: "Vanne papillon — DN80 — revêtue PTFE — commande par levier",
    zh: "蝶阀 — DN80 — 聚四氟乙烯衬里 — 手柄操作",
  },
  "item.MRO-PUMP-DIAPH-AODD-2IN": {
    en: "Air-operated double-diaphragm pump — 2 in — PTFE fitted",
    de: "Druckluft-Doppelmembranpumpe — 2 Zoll — PTFE-bestückt",
    es: "Bomba neumática de doble membrana — 2 pulgadas — con PTFE",
    fr: "Pompe pneumatique à double membrane — 2 pouces — équipée PTFE",
    zh: "气动双隔膜泵 — 2 英寸 — 聚四氟乙烯配置",
  },
  "item.MRO-TEMP-RTD-PT100": {
    en: "Temperature probe — RTD Pt100 — 6 mm — DN25 flange",
    de: "Temperaturfühler — RTD Pt100 — 6 mm — Flansch DN25",
    es: "Sonda de temperatura — RTD Pt100 — 6 mm — brida DN25",
    fr: "Sonde de température — RTD Pt100 — 6 mm — bride DN25",
    zh: "温度探头 — 铂电阻 Pt100 — 6 毫米 — DN25 法兰",
  },
  "item.MRO-GASKET-PTFE-DN80": {
    en: "Gasket — PTFE envelope — DN80 — full face",
    de: "Dichtung — PTFE-Ummantelung — DN80 — Vollflansch",
    es: "Junta — envuelta de PTFE — DN80 — cara completa",
    fr: "Joint — enveloppe PTFE — DN80 — pleine face",
    zh: "垫片 — 聚四氟乙烯包覆 — DN80 — 全平面",
  },
  "item.MRO-COUPL-FLEX-80MM": {
    en: "Flexible coupling — 80 mm — elastomer insert",
    de: "Elastische Kupplung — 80 mm — Elastomereinsatz",
    es: "Acoplamiento flexible — 80 mm — inserto elastomérico",
    fr: "Accouplement flexible — 80 mm — insert élastomère",
    zh: "挠性联轴器 — 80 毫米 — 弹性体嵌件",
  },
  "item.MRO-SEAL-KIT-AGIT-40MM": {
    en: "Seal kit — agitator — 40 mm — elastomer and face set",
    de: "Dichtungssatz — Rührwerk — 40 mm — Elastomer- und Gleitflächensatz",
    es: "Kit de cierre — agitador — 40 mm — elastómero y caras",
    fr: "Kit d'étanchéité — agitateur — 40 mm — élastomère et faces",
    zh: "密封套件 — 搅拌器 — 40 毫米 — 弹性体与端面组",
  },
  "item.MRO-GBOX-KIT-REACTOR": {
    en: "Gearbox rebuild kit — reactor drive — seal & bearing set",
    de: "Getriebe-Überholungssatz — Reaktorantrieb — Dichtungs- und Lagersatz",
    es: "Kit de reconstrucción de reductor — accionamiento del reactor — juego de cierres y rodamientos",
    fr: "Kit de rénovation de réducteur — entraînement réacteur — jeu de joints et roulements",
    zh: "齿轮箱大修套件 — 反应釜驱动 — 密封与轴承组",
  },
  "exc.spec-incomplete": {
    en: "Specification incomplete",
    de: "Spezifikation unvollständig",
    es: "Especificación incompleta",
    fr: "Spécification incomplète",
    zh: "规格不完整",
  },
  "exc.duplicate-demand": {
    en: "Duplicate request",
    de: "Doppelte Anforderung",
    es: "Solicitud duplicada",
    fr: "Demande en double",
    zh: "重复申请",
  },
  "exc.stock-available": {
    en: "Stock already available",
    de: "Bestand bereits vorhanden",
    es: "Existencias ya disponibles",
    fr: "Stock déjà disponible",
    zh: "库存已有",
  },
  "exc.warranty-covered": {
    en: "Covered by warranty",
    de: "Durch Gewährleistung gedeckt",
    es: "Cubierto por garantía",
    fr: "Couvert par la garantie",
    zh: "保修覆盖",
  },
  "exc.off-contract": {
    en: "Off-contract or price variance",
    de: "Außerhalb des Vertrags oder Preisabweichung",
    es: "Fuera de contrato o variación de precio",
    fr: "Hors contrat ou écart de prix",
    zh: "合约外或价格偏差",
  },
  "exc.over-threshold": {
    en: "Above approval limit",
    de: "Über der Freigabegrenze",
    es: "Por encima del límite de aprobación",
    fr: "Au-dessus de la limite d'approbation",
    zh: "超出审批限额",
  },

  /* ── How urgent ────────────────────────────────────────────────────── */
  "prio.critical": {
    en: "Critical",
    de: "Kritisch",
    es: "Crítica",
    fr: "Critique",
    zh: "紧急",
  },
  "prio.high": {
    en: "High",
    de: "Hoch",
    es: "Alta",
    fr: "Élevée",
    zh: "高",
  },
  "prio.normal": {
    en: "Normal",
    de: "Normal",
    es: "Normal",
    fr: "Normale",
    zh: "普通",
  },

  /* ── The guided run, its chrome ────────────────────────────────────── */
  "run.stepN": {
    en: "Step {n} · Process run",
    de: "Schritt {n} · Prozesslauf",
    es: "Paso {n} · Ejecución",
    fr: "Étape {n} · Exécution",
    zh: "第 {n} 步 · 流程运行",
  },
  "run.ready": {
    en: "Ready",
    de: "Bereit",
    es: "Listo",
    fr: "Prêt",
    zh: "就绪",
  },
  "run.working": {
    en: "Working",
    de: "Arbeitet",
    es: "Trabajando",
    fr: "En cours",
    zh: "处理中",
  },
  "run.produced": {
    en: "Produced",
    de: "Erstellt",
    es: "Generado",
    fr: "Produit",
    zh: "已生成",
  },
  "run.updated": {
    en: "Updated",
    de: "Aktualisiert",
    es: "Actualizado",
    fr: "Mis à jour",
    zh: "已更新",
  },
  "run.approveHandOff": {
    en: "Approve & hand off",
    de: "Freigeben & übergeben",
    es: "Aprobar y traspasar",
    fr: "Approuver et transmettre",
    zh: "批准并交接",
  },
  "run.approveProceed": {
    en: "Approve & proceed",
    de: "Freigeben & fortfahren",
    es: "Aprobar y continuar",
    fr: "Approuver et poursuivre",
    zh: "批准并继续",
  },
  "run.approveFlagsHandOff": {
    en: "Approve with flags & hand off",
    de: "Mit Hinweisen freigeben & übergeben",
    es: "Aprobar con avisos y traspasar",
    fr: "Approuver avec réserves et transmettre",
    zh: "带标记批准并交接",
  },
  "run.approveFlagsProceed": {
    en: "Approve with flags & proceed",
    de: "Mit Hinweisen freigeben & fortfahren",
    es: "Aprobar con avisos y continuar",
    fr: "Approuver avec réserves et poursuivre",
    zh: "带标记批准并继续",
  },
  "run.approveAnyway": {
    en: "Approve anyway",
    de: "Trotzdem freigeben",
    es: "Aprobar de todos modos",
    fr: "Approuver quand même",
    zh: "仍然批准",
  },
  "run.pending": {
    en: "Pending",
    de: "Zurückgestellt",
    es: "Pendiente",
    fr: "En attente",
    zh: "暂缓",
  },
  "run.escalate": {
    en: "Escalate",
    de: "Eskalieren",
    es: "Escalar",
    fr: "Escalader",
    zh: "上报",
  },
  "run.reject": {
    en: "Reject",
    de: "Ablehnen",
    es: "Rechazar",
    fr: "Rejeter",
    zh: "驳回",
  },
  "run.validateProceed": {
    en: "Validate & proceed",
    de: "Prüfen & fortfahren",
    es: "Validar y continuar",
    fr: "Valider et poursuivre",
    zh: "校验并继续",
  },
  "run.discard": {
    en: "Discard",
    de: "Verwerfen",
    es: "Descartar",
    fr: "Abandonner",
    zh: "放弃",
  },
  "run.approvedHanded": {
    en: "Approved · output handed to the next agent",
    de: "Freigegeben · Ergebnis an den nächsten Agenten übergeben",
    es: "Aprobado · resultado entregado al siguiente agente",
    fr: "Approuvé · résultat transmis à l'agent suivant",
    zh: "已批准 · 结果已交给下一个智能体",
  },
  "run.rejectedHalted": {
    en: "Rejected · sent back with a flag · run halted",
    de: "Abgelehnt · mit Hinweis zurückgeschickt · Lauf angehalten",
    es: "Rechazado · devuelto con aviso · ejecución detenida",
    fr: "Rejeté · renvoyé avec réserve · exécution arrêtée",
    zh: "已驳回 · 带标记退回 · 运行中止",
  },
  "run.aiRecommendation": {
    en: "AI recommendation",
    de: "KI-Empfehlung",
    es: "Recomendación de la IA",
    fr: "Recommandation de l'IA",
    zh: "AI 推荐",
  },
  "run.backToDashboard": {
    en: "Back to dashboard",
    de: "Zurück zur Übersicht",
    es: "Volver al panel",
    fr: "Retour au tableau de bord",
    zh: "返回仪表盘",
  },
  "run.agentRun": {
    en: "Agent run",
    de: "Agentenlauf",
    es: "Ejecución de agentes",
    fr: "Exécution des agents",
    zh: "智能体运行",
  },
  "run.handedOff": {
    en: "{done} of {total} handed off",
    de: "{done} von {total} übergeben",
    es: "{done} de {total} traspasados",
    fr: "{done} sur {total} transmis",
    zh: "已交接 {done} / {total}",
  },
  "run.sourceFiles": {
    en: "Source files",
    de: "Quelldateien",
    es: "Archivos de origen",
    fr: "Fichiers sources",
    zh: "来源文件",
  },
  "run.inputsClick": {
    en: "{n} inputs · click to inspect",
    de: "{n} Eingaben · zum Prüfen klicken",
    es: "{n} entradas · clic para inspeccionar",
    fr: "{n} entrées · cliquer pour inspecter",
    zh: "{n} 份输入 · 点击查看",
  },
  "run.approved": {
    en: "Approved",
    de: "Freigegeben",
    es: "Aprobado",
    fr: "Approuvé",
    zh: "已批准",
  },
  "run.pendingParked": {
    en: "On hold · parked for review, run can still continue",
    de: "Zurückgestellt · zur Prüfung geparkt, der Lauf kann weitergehen",
    es: "En espera · aparcado para revisión, la ejecución puede seguir",
    fr: "En attente · mis de côté pour revue, l'exécution peut continuer",
    zh: "暂缓 · 已挂起待复核，运行可继续",
  },
  "run.escalatedHalted": {
    en: "Escalated · routed to a human reviewer · run halted",
    de: "Eskaliert · an einen menschlichen Prüfer weitergeleitet · Lauf angehalten",
    es: "Escalado · enviado a un revisor humano · ejecución detenida",
    fr: "Escaladé · transmis à un relecteur humain · exécution arrêtée",
    zh: "已上报 · 转交人工复核 · 运行中止",
  },

  /* ── The hero run · the mechanical seal ────────────────────────────── */
  "run.pump.1.agentName": {
    en: "PR Processing agent",
    de: "Anforderungsbearbeitung",
    es: "PR Processing agent",
    fr: "PR Processing agent",
    zh: "申请处理智能体",
  },
  "run.pump.1.aiThought": {
    en: "An email just came in from the Mixing Line 2 plant engineer — their mechanical seal has failed and is leaking, and they need a replacement fast. It's free text with no part number, so let me read it and structure it into a proper requisition.",
    de: "Gerade kam eine E-Mail vom Anlageningenieur der Mischlinie 2 — die Gleitringdichtung ist ausgefallen und undicht, Ersatz wird dringend gebraucht. Der Text ist frei formuliert und ohne Teilenummer; ich lese ihn und forme daraus eine saubere Anforderung.",
    es: "An email just came in from the Mixing Line 2 plant engineer — their mechanical seal has failed and is leaking, and they need a replacement fast. It's free text with no part number, so let me read it and structure it into a proper requisition.",
    fr: "An email just came in from the Mixing Line 2 plant engineer — their mechanical seal has failed and is leaking, and they need a replacement fast. It's free text with no part number, so let me read it and structure it into a proper requisition.",
    zh: "刚收到搅拌 2 线工艺工程师的邮件 —— 机械密封失效漏液，急需更换。邮件是自由文本、没有零件号，我来读一遍并整理成规范的申请单。",
  },
  "run.pump.1.reasoning.0": {
    en: "Reading the engineer's free-text note from Mixing Line 2",
    de: "Lese die frei formulierte Notiz des Ingenieurs von Mischlinie 2",
    es: "Reading the engineer's free-text note from Mixing Line 2",
    fr: "Reading the engineer's free-text note from Mixing Line 2",
    zh: "读取搅拌 2 线工程师的自由文本说明",
  },
  "run.pump.1.reasoning.1": {
    en: "Extracting specs — ~45–50 mm, silicon carbide faces, heavy duty",
    de: "Extrahiere die Spezifikation — ca. 45–50 mm, SiC-Gleitflächen, schwere Ausführung",
    es: "Extracting specs — ~45–50 mm, silicon carbide faces, heavy duty",
    fr: "Extracting specs — ~45–50 mm, silicon carbide faces, heavy duty",
    zh: "提取规格 —— 约 45–50 毫米、碳化硅端面、重载型",
  },
  "run.pump.1.reasoning.2": {
    en: "Mapping to material code MRO-SEAL-MECH-50MM-SIC",
    de: "Ordne dem Materialcode MRO-SEAL-MECH-50MM-SIC zu",
    es: "Mapping to material code MRO-SEAL-MECH-50MM-SIC",
    fr: "Mapping to material code MRO-SEAL-MECH-50MM-SIC",
    zh: "匹配到物料编码 MRO-SEAL-MECH-50MM-SIC",
  },
  "run.pump.1.reasoning.3": {
    en: "Coding cost center 10034 · GL 600450",
    de: "Kontiere Kostenstelle 10034 · Sachkonto 600450",
    es: "Coding cost center 10034 · GL 600450",
    fr: "Coding cost center 10034 · GL 600450",
    zh: "编入成本中心 10034 · 总账 600450",
  },
  "run.pump.1.reasoning.4": {
    en: "Flagging the shaft-diameter range and missing part number",
    de: "Kennzeichne den Wellendurchmesser-Bereich und die fehlende Teilenummer",
    es: "Flagging the shaft-diameter range and missing part number",
    fr: "Flagging the shaft-diameter range and missing part number",
    zh: "标出轴径范围与缺失的零件号",
  },
  "run.pump.1.recommendation": {
    en: "Structured and coded to MRO-SEAL-MECH-50MM-SIC. The engineer gave a 45–50 mm range with no part number, so I read the shaft size off the equipment record for Mixing Line 2 — 50 mm. Drafted clean, routed for the checks.",
    de: "Strukturiert und auf MRO-SEAL-MECH-50MM-SIC kontiert. Der Ingenieur nannte einen Bereich von 45–50 mm ohne Teilenummer; die Wellengröße habe ich aus dem Anlagenstammsatz der Mischlinie 2 gelesen — 50 mm. Sauber erfasst und zur Prüfung weitergeleitet.",
    es: "Structured and coded to MRO-SEAL-MECH-50MM-SIC. The engineer gave a 45–50 mm range with no part number, so I read the shaft size off the equipment record for Mixing Line 2 — 50 mm. Drafted clean, routed for the checks.",
    fr: "Structured and coded to MRO-SEAL-MECH-50MM-SIC. The engineer gave a 45–50 mm range with no part number, so I read the shaft size off the equipment record for Mixing Line 2 — 50 mm. Drafted clean, routed for the checks.",
    zh: "已结构化并编码为 MRO-SEAL-MECH-50MM-SIC。工程师给的是 45–50 毫米范围、没有零件号，我从搅拌 2 线的设备档案里读到轴径为 50 毫米。申请单已拟好，转入后续校验。",
  },
  "run.pump.2.agentName": {
    en: "Master Data agent",
    de: "Stammdaten-Agent",
    es: "Master Data agent",
    fr: "Master Data agent",
    zh: "主数据智能体",
  },
  "run.pump.2.aiThought": {
    en: "The request is coded now. Let me confirm the material code in the master data, scan for any duplicate request already open, and check whether another plant already has this seal on the shelf before we buy.",
    de: "Die Anforderung ist kontiert. Ich prüfe den Materialcode im Stammsatz, suche nach einer bereits offenen Doppelanforderung und sehe nach, ob ein anderes Werk diese Dichtung schon am Lager hat, bevor wir kaufen.",
    es: "The request is coded now. Let me confirm the material code in the master data, scan for any duplicate request already open, and check whether another plant already has this seal on the shelf before we buy.",
    fr: "The request is coded now. Let me confirm the material code in the master data, scan for any duplicate request already open, and check whether another plant already has this seal on the shelf before we buy.",
    zh: "申请已完成编码。我来核对主数据里的物料编码、扫描是否已有重复申请，并在下单前查一下其它工厂货架上是否已有这个密封。",
  },
  "run.pump.2.reasoning.0": {
    en: "Reading structured PR-48630",
    de: "Lese die strukturierte Anforderung PR-48630",
    es: "Reading structured PR-48630",
    fr: "Reading structured PR-48630",
    zh: "读取结构化申请单 PR-48630",
  },
  "run.pump.2.reasoning.1": {
    en: "Confirming the mapped material code",
    de: "Bestätige den zugeordneten Materialcode",
    es: "Confirming the mapped material code",
    fr: "Confirming the mapped material code",
    zh: "确认匹配的物料编码",
  },
  "run.pump.2.reasoning.2": {
    en: "Scanning open PRs for a duplicate — none found",
    de: "Durchsuche offene Anforderungen auf Duplikate — keine gefunden",
    es: "Scanning open PRs for a duplicate — none found",
    fr: "Scanning open PRs for a duplicate — none found",
    zh: "扫描在途申请是否重复 —— 未发现",
  },
  "run.pump.2.reasoning.3": {
    en: "Checking on-hand and interplant stock — none",
    de: "Prüfe Lagerbestand und Werksübergreifendes — keiner",
    es: "Checking on-hand and interplant stock — none",
    fr: "Checking on-hand and interplant stock — none",
    zh: "检查本厂库存与跨厂库存 —— 均无",
  },
  "run.pump.2.reasoning.4": {
    en: "Flagging the ambiguous diameter for sign-off",
    de: "Lege den unklaren Durchmesser zur Bestätigung vor",
    es: "Flagging the ambiguous diameter for sign-off",
    fr: "Flagging the ambiguous diameter for sign-off",
    zh: "将不明确的轴径提交确认",
  },
  "run.pump.2.recommendation": {
    en: "Code is clean, no duplicate open, no stock to draw from — the buy is justified. The shaft range resolved to 50 mm off the equipment record for Mixing Line 2, so nothing is left open.",
    de: "Der Code ist sauber, kein Duplikat offen, kein Bestand verfügbar — der Kauf ist begründet. Der Wellenbereich löste sich über den Anlagenstammsatz der Mischlinie 2 zu 50 mm auf; es bleibt nichts offen.",
    es: "Code is clean, no duplicate open, no stock to draw from — the buy is justified. The shaft range resolved to 50 mm off the equipment record for Mixing Line 2, so nothing is left open.",
    fr: "Code is clean, no duplicate open, no stock to draw from — the buy is justified. The shaft range resolved to 50 mm off the equipment record for Mixing Line 2, so nothing is left open.",
    zh: "编码无误、没有重复申请、也没有可调拨的库存 —— 这笔采购成立。轴径范围已通过搅拌 2 线的设备档案确定为 50 毫米，没有遗留问题。",
  },
  "run.pump.3.agentName": {
    en: "Warranty & coverage desk",
    de: "Gewährleistung & Deckung",
    es: "Warranty & coverage desk",
    fr: "Warranty & coverage desk",
    zh: "保修与承保台",
  },
  "run.pump.3.aiThought": {
    en: "Before I treat this as a new purchase, let me check whether the agitator is still under warranty — if the failure is a covered defect, this should be a claim, not a buy.",
    de: "Bevor ich das als Neukauf behandle: Ich prüfe, ob das Rührwerk noch unter Gewährleistung steht — ist der Ausfall ein gedeckter Mangel, gehört das als Anspruch behandelt, nicht als Kauf.",
    es: "Before I treat this as a new purchase, let me check whether the agitator is still under warranty — if the failure is a covered defect, this should be a claim, not a buy.",
    fr: "Before I treat this as a new purchase, let me check whether the agitator is still under warranty — if the failure is a covered defect, this should be a claim, not a buy.",
    zh: "在按新购处理之前，我先查搅拌器是否还在保修期 —— 如果这次失效属于保修覆盖的缺陷，就应该走索赔而不是采购。",
  },
  "run.pump.3.reasoning.0": {
    en: "Checking the agitator's OEM warranty status",
    de: "Prüfe den Gewährleistungsstatus des Rührwerks beim Hersteller",
    es: "Checking the agitator's OEM warranty status",
    fr: "Checking the agitator's OEM warranty status",
    zh: "查询搅拌器的原厂保修状态",
  },
  "run.pump.3.reasoning.1": {
    en: "Seal is a wear part — not covered equipment",
    de: "Die Dichtung ist ein Verschleißteil — kein gedecktes Bauteil",
    es: "Seal is a wear part — not covered equipment",
    fr: "Seal is a wear part — not covered equipment",
    zh: "密封属于易损件 —— 不在承保设备范围内",
  },
  "run.pump.3.reasoning.2": {
    en: "Failure is wear & tear, not a covered defect",
    de: "Der Ausfall ist Verschleiß, kein gedeckter Mangel",
    es: "Failure is wear & tear, not a covered defect",
    fr: "Failure is wear & tear, not a covered defect",
    zh: "失效属正常磨损，不是承保缺陷",
  },
  "run.pump.3.reasoning.3": {
    en: "Coverage — parts only, buy new",
    de: "Deckung — nur Teile, Neukauf",
    es: "Coverage — parts only, buy new",
    fr: "Coverage — parts only, buy new",
    zh: "承保范围 —— 仅零件，按新购处理",
  },
  "run.pump.3.recommendation": {
    en: "Wear-and-tear on a wear part — no warranty claim applies. Proceed as a new-buy.",
    de: "Verschleiß an einem Verschleißteil — kein Gewährleistungsanspruch. Als Neukauf fortfahren.",
    es: "Wear-and-tear on a wear part — no warranty claim applies. Proceed as a new-buy.",
    fr: "Wear-and-tear on a wear part — no warranty claim applies. Proceed as a new-buy.",
    zh: "易损件的正常磨损 —— 不构成保修索赔。按新购继续。",
  },
  "run.pump.4.agentName": {
    en: "Sourcing & contract agent",
    de: "Beschaffung & Vertrag",
    es: "Sourcing & contract agent",
    fr: "Sourcing & contract agent",
    zh: "寻源与合约智能体",
  },
  "run.pump.4.aiThought": {
    en: "We already buy this seal from a supplier we have an agreement with, so there is nothing to go to market for. Let me confirm the supplier is still approved and that the request is priced at what the agreement says.",
    de: "Wir beziehen diese Dichtung bereits von einem Lieferanten, mit dem ein Vertrag besteht — es gibt also nichts auszuschreiben. Ich bestätige, dass der Lieferant weiterhin zugelassen ist und die Anforderung zum Vertragspreis kalkuliert wurde.",
    es: "We already buy this seal from a supplier we have an agreement with, so there is nothing to go to market for. Let me confirm the supplier is still approved and that the request is priced at what the agreement says.",
    fr: "We already buy this seal from a supplier we have an agreement with, so there is nothing to go to market for. Let me confirm the supplier is still approved and that the request is priced at what the agreement says.",
    zh: "这个密封我们本来就从有协议的供应商采购，没有什么可去市场询价的。我来确认供应商仍在核准名单内，且申请单的价格与协议一致。",
  },
  "run.pump.4.reasoning.0": {
    en: "Confirming the supplier is approved and still preferred",
    de: "Bestätige, dass der Lieferant zugelassen und weiterhin bevorzugt ist",
    es: "Confirming the supplier is approved and still preferred",
    fr: "Confirming the supplier is approved and still preferred",
    zh: "确认供应商已核准且仍为优先供应商",
  },
  "run.pump.4.reasoning.1": {
    en: "Reading the price and terms off the agreement",
    de: "Lese Preis und Konditionen aus dem Rahmenvertrag",
    es: "Reading the price and terms off the agreement",
    fr: "Reading the price and terms off the agreement",
    zh: "从框架协议读取价格与条款",
  },
  "run.pump.4.reasoning.2": {
    en: "Checking the request is priced at the agreed rate",
    de: "Prüfe, ob die Anforderung zum vereinbarten Satz kalkuliert ist",
    es: "Checking the request is priced at the agreed rate",
    fr: "Checking the request is priced at the agreed rate",
    zh: "核对申请单是否按约定价格计价",
  },
  "run.pump.4.recommendation": {
    en: "Apex Industrial Supply is the approved, preferred supplier for this seal and it sits on the live agreement SA-MRO-07 at $4,180 each, 5-day lead. The request is priced at exactly that. Nothing to source and nothing to negotiate.",
    de: "Apex Industrial Supply ist der zugelassene und bevorzugte Lieferant für diese Dichtung und steht im laufenden Vertrag SA-MRO-07 mit $4.180 je Stück, 5 Tage Lieferzeit. Die Anforderung ist genau so kalkuliert. Nichts zu beschaffen, nichts zu verhandeln.",
    es: "Apex Industrial Supply is the approved, preferred supplier for this seal and it sits on the live agreement SA-MRO-07 at $4,180 each, 5-day lead. The request is priced at exactly that. Nothing to source and nothing to negotiate.",
    fr: "Apex Industrial Supply is the approved, preferred supplier for this seal and it sits on the live agreement SA-MRO-07 at $4,180 each, 5-day lead. The request is priced at exactly that. Nothing to source and nothing to negotiate.",
    zh: "Apex Industrial Supply 是该密封已核准的优先供应商，在有效协议 SA-MRO-07 上单价 $4,180、交期 5 天。申请单的价格与之完全一致。无需寻源，也无需议价。",
  },
  "run.pump.5.agentName": {
    en: "Approval & routing",
    de: "Freigabe & Weiterleitung",
    es: "Approval & routing",
    fr: "Approval & routing",
    zh: "审批与路由",
  },
  "run.pump.5.aiThought": {
    en: "Every control has cleared, so all that is left is to route this for release and tell the engineer their seal is on the way.",
    de: "Alle Kontrollen sind bestanden; es bleibt nur, die Freigabe weiterzuleiten und dem Ingenieur mitzuteilen, dass seine Dichtung unterwegs ist.",
    es: "Every control has cleared, so all that is left is to route this for release and tell the engineer their seal is on the way.",
    fr: "Every control has cleared, so all that is left is to route this for release and tell the engineer their seal is on the way.",
    zh: "所有控制项都已通过，剩下的就是把它送去放行，并告诉工程师密封已经在路上。",
  },
  "run.pump.5.reasoning.0": {
    en: "Confirming cost center 10034 / GL 600450",
    de: "Bestätige Kostenstelle 10034 / Sachkonto 600450",
    es: "Confirming cost center 10034 / GL 600450",
    fr: "Confirming cost center 10034 / GL 600450",
    zh: "确认成本中心 10034 / 总账 600450",
  },
  "run.pump.5.reasoning.1": {
    en: "On-contract — competitive bidding not required",
    de: "Auf Vertrag — kein Wettbewerbsverfahren erforderlich",
    es: "On-contract — competitive bidding not required",
    fr: "On-contract — competitive bidding not required",
    zh: "协议内采购 —— 无需竞争性报价",
  },
  "run.pump.5.reasoning.2": {
    en: "Within the plant-maintenance approval limit",
    de: "Innerhalb der Freigabegrenze der Werksinstandhaltung",
    es: "Within the plant-maintenance approval limit",
    fr: "Within the plant-maintenance approval limit",
    zh: "在工厂维修的审批限额之内",
  },
  "run.pump.5.reasoning.3": {
    en: "Releasing the requisition to the supplier on the agreement",
    de: "Gebe die Anforderung an den Vertragslieferanten frei",
    es: "Releasing the requisition to the supplier on the agreement",
    fr: "Releasing the requisition to the supplier on the agreement",
    zh: "按协议向供应商放行该申请",
  },
  "run.pump.5.recommendation": {
    en: "Every control clears — nothing is waiting on anyone. On approve, the agent confirms back to the engineer and releases PR-48630 to Apex on the agreement at $4,180.",
    de: "Alle Kontrollen bestehen — nichts wartet auf jemanden. Nach Freigabe bestätigt der Agent dem Ingenieur und gibt PR-48630 an Apex zum Vertragspreis von $4.180 frei.",
    es: "Every control clears — nothing is waiting on anyone. On approve, the agent confirms back to the engineer and releases PR-48630 to Apex on the agreement at $4,180.",
    fr: "Every control clears — nothing is waiting on anyone. On approve, the agent confirms back to the engineer and releases PR-48630 to Apex on the agreement at $4,180.",
    zh: "所有控制项通过 —— 没有任何事在等人。批准后，智能体会回复工程师，并按协议以 $4,180 向 Apex 放行 PR-48630。",
  },
  "run.pump.6.agentName": {
    en: "Invoice Matching agent",
    de: "Rechnungsprüfungs-Agent",
    es: "Invoice Matching agent",
    fr: "Invoice Matching agent",
    zh: "发票核对智能体",
  },
  "run.pump.6.aiThought": {
    en: "Apex has emailed their invoice for the seal. Let me four-way match it against the PO, the goods receipt and the contract before we clear it for payment.",
    de: "Apex hat die Rechnung für die Dichtung geschickt. Ich gleiche sie vierfach gegen Bestellung, Wareneingang und Vertrag ab, bevor wir sie zur Zahlung freigeben.",
    es: "Apex has emailed their invoice for the seal. Let me four-way match it against the PO, the goods receipt and the contract before we clear it for payment.",
    fr: "Apex has emailed their invoice for the seal. Let me four-way match it against the PO, the goods receipt and the contract before we clear it for payment.",
    zh: "Apex 已把密封的发票发来。付款放行前，我把它与订单、收货单和合约做四单核对。",
  },
  "run.pump.6.reasoning.0": {
    en: "Reading the captured Apex invoice BPI-5567",
    de: "Lese die erfasste Apex-Rechnung BPI-5567",
    es: "Reading the captured Apex invoice BPI-5567",
    fr: "Reading the captured Apex invoice BPI-5567",
    zh: "读取已录入的 Apex 发票 BPI-5567",
  },
  "run.pump.6.reasoning.1": {
    en: "Running the four-way match — contract ↔ PO ↔ goods receipt ↔ invoice",
    de: "Führe den Vierfachabgleich durch — Vertrag ↔ Bestellung ↔ Wareneingang ↔ Rechnung",
    es: "Running the four-way match — contract ↔ PO ↔ goods receipt ↔ invoice",
    fr: "Running the four-way match — contract ↔ PO ↔ goods receipt ↔ invoice",
    zh: "执行四单核对 —— 合约 ↔ 订单 ↔ 收货 ↔ 发票",
  },
  "run.pump.6.reasoning.2": {
    en: "Checking price and quantity — $4,180 · 1 EA · all agree",
    de: "Prüfe Preis und Menge — $4.180 · 1 ST · alles stimmt überein",
    es: "Checking price and quantity — $4,180 · 1 EA · all agree",
    fr: "Checking price and quantity — $4,180 · 1 EA · all agree",
    zh: "核对价格与数量 —— $4,180 · 1 件 · 完全一致",
  },
  "run.pump.6.reasoning.3": {
    en: "Applying tolerance — variance $0.00, within threshold",
    de: "Wende die Toleranz an — Abweichung $0,00, innerhalb der Grenze",
    es: "Applying tolerance — variance $0.00, within threshold",
    fr: "Applying tolerance — variance $0.00, within threshold",
    zh: "套用容差 —— 差异 $0.00，在阈值内",
  },
  "run.pump.6.reasoning.4": {
    en: "Clearing the seal invoice for today's AP batch",
    de: "Gebe die Dichtungsrechnung für den heutigen Zahllauf frei",
    es: "Clearing the seal invoice for today's AP batch",
    fr: "Clearing the seal invoice for today's AP batch",
    zh: "将该密封发票放入今日应付批次",
  },
  "run.pump.6.recommendation": {
    en: "Seal invoice is four-way clean — contract, PO, goods receipt and invoice agree at $4,180 with $0 variance, within tolerance. Cleared for today's AP batch; no exception to route.",
    de: "Die Dichtungsrechnung ist vierfach sauber — Vertrag, Bestellung, Wareneingang und Rechnung stimmen bei $4.180 mit $0 Abweichung überein, innerhalb der Toleranz. Für den heutigen Zahllauf freigegeben; keine Ausnahme weiterzuleiten.",
    es: "Seal invoice is four-way clean — contract, PO, goods receipt and invoice agree at $4,180 with $0 variance, within tolerance. Cleared for today's AP batch; no exception to route.",
    fr: "Seal invoice is four-way clean — contract, PO, goods receipt and invoice agree at $4,180 with $0 variance, within tolerance. Cleared for today's AP batch; no exception to route.",
    zh: "密封发票四单全清 —— 合约、订单、收货、发票在 $4,180 上完全一致，差异 $0，在容差内。已放入今日应付批次，无异常需要转办。",
  },

  /* ── The other three runs ──────────────────────────────────────────── */
  "run.bearing.1.agentName": {
    en: "PR Processing agent",
    de: "Anforderungsbearbeitung",
    es: "PR Processing agent",
    fr: "PR Processing agent",
    zh: "申请处理智能体",
  },
  "run.bearing.1.aiThought": {
    en: "A planned-maintenance request has come in from Mixing Line 1 — six pump diaphragms for the July shutdown. The planner gave the part number outright, so this should code cleanly.",
    de: "Eine Wartungsplanungs-Anforderung von Mischlinie 1 ist eingegangen — sechs Pumpenmembranen für den Juli-Stillstand. Der Planer hat die Teilenummer direkt genannt, das sollte sauber kontieren.",
    es: "A planned-maintenance request has come in from Mixing Line 1 — six pump diaphragms for the July shutdown. The planner gave the part number outright, so this should code cleanly.",
    fr: "A planned-maintenance request has come in from Mixing Line 1 — six pump diaphragms for the July shutdown. The planner gave the part number outright, so this should code cleanly.",
    zh: "搅拌 1 线来了一张计划检修申请 —— 七月停车用的六片泵隔膜。计划员直接给了零件号，编码应该很干净。",
  },
  "run.bearing.1.reasoning.0": {
    en: "Reading the planner's note from Mixing Line 1",
    de: "Lese die Notiz des Planers von Mischlinie 1",
    es: "Reading the planner's note from Mixing Line 1",
    fr: "Reading the planner's note from Mixing Line 1",
    zh: "读取搅拌 1 线计划员的说明",
  },
  "run.bearing.1.reasoning.3": {
    en: "No gaps to flag",
    de: "Keine Lücken zu kennzeichnen",
    es: "No gaps to flag",
    fr: "No gaps to flag",
    zh: "没有需要标出的缺口",
  },
  "run.bearing.2.agentName": {
    en: "Master Data agent",
    de: "Stammdaten-Agent",
    es: "Master Data agent",
    fr: "Master Data agent",
    zh: "主数据智能体",
  },
  "run.bearing.2.aiThought": {
    en: "Before anyone buys anything, three questions: is this a real material, has someone already asked for it, and do we already own it? Let me check all three.",
    de: "Vor jedem Kauf drei Fragen: Gibt es dieses Material wirklich, hat es schon jemand angefordert, und besitzen wir es bereits? Ich prüfe alle drei.",
    es: "Before anyone buys anything, three questions: is this a real material, has someone already asked for it, and do we already own it? Let me check all three.",
    fr: "Before anyone buys anything, three questions: is this a real material, has someone already asked for it, and do we already own it? Let me check all three.",
    zh: "买东西之前先问三件事：这个物料真实存在吗？有人已经申请过了吗？我们自己是不是已经有了？三个都查一遍。",
  },
  "run.bearing.2.reasoning.0": {
    en: "Scanning open requisitions for the same material — none found",
    de: "Durchsuche offene Anforderungen nach demselben Material — keine gefunden",
    es: "Scanning open requisitions for the same material — none found",
    fr: "Scanning open requisitions for the same material — none found",
    zh: "扫描同物料的在途申请 —— 未发现",
  },
  "run.bearing.2.reasoning.1": {
    en: "Stock on hand across every plant — zero, and below safety stock here",
    de: "Bestand in allen Werken — null, und hier unter dem Sicherheitsbestand",
    es: "Stock on hand across every plant — zero, and below safety stock here",
    fr: "Stock on hand across every plant — zero, and below safety stock here",
    zh: "各厂库存 —— 为零，且本厂低于安全库存",
  },
  "run.bearing.2.recommendation": {
    en: "Material is active and stocked, no duplicate request is open, and the network holds none. There is nothing here that would stop the buy.",
    de: "Das Material ist aktiv und lagergeführt, keine Doppelanforderung offen, im Netzwerk ist keiner vorhanden. Nichts steht dem Kauf entgegen.",
    es: "Material is active and stocked, no duplicate request is open, and the network holds none. There is nothing here that would stop the buy.",
    fr: "Material is active and stocked, no duplicate request is open, and the network holds none. There is nothing here that would stop the buy.",
    zh: "物料状态有效且为库存件，没有重复申请，全网也没有存货。没有任何理由拦下这笔采购。",
  },
  "run.bearing.3.agentName": {
    en: "Warranty & coverage desk",
    de: "Gewährleistung & Deckung",
    es: "Warranty & coverage desk",
    fr: "Warranty & coverage desk",
    zh: "保修与承保台",
  },
  "run.bearing.3.aiThought": {
    en: "A diaphragm change can sometimes sit under an equipment warranty or a service contract. If it does, we should not be buying it at all. Let me check the register.",
    de: "Ein Membranwechsel kann unter eine Anlagengewährleistung oder einen Servicevertrag fallen. Wäre das so, dürften wir gar nicht kaufen. Ich sehe im Register nach.",
    es: "A diaphragm change can sometimes sit under an equipment warranty or a service contract. If it does, we should not be buying it at all. Let me check the register.",
    fr: "A diaphragm change can sometimes sit under an equipment warranty or a service contract. If it does, we should not be buying it at all. Let me check the register.",
    zh: "更换隔膜有时属于设备保修或服务合约的范围。若是如此，我们根本不该买。我去设备台账查一下。",
  },
  "run.bearing.3.reasoning.0": {
    en: "Equipment register · Mixing Line 1 drive end",
    de: "Anlagenregister · Mischlinie 1, Antriebsseite",
    es: "Equipment register · Mixing Line 1 drive end",
    fr: "Equipment register · Mixing Line 1 drive end",
    zh: "设备台账 · 搅拌 1 线驱动端",
  },
  "run.bearing.3.reasoning.1": {
    en: "Drive rebuilt 2023 — parts warranty expired 2024",
    de: "Antrieb 2023 überholt — Teilegewährleistung 2024 abgelaufen",
    es: "Drive rebuilt 2023 — parts warranty expired 2024",
    fr: "Drive rebuilt 2023 — parts warranty expired 2024",
    zh: "驱动装置 2023 年大修 —— 零件保修 2024 年已到期",
  },
  "run.bearing.3.reasoning.2": {
    en: "No service contract covering consumable pump spares",
    de: "Kein Servicevertrag deckt Pumpen-Verschleißteile ab",
    es: "No service contract covering consumable pump spares",
    fr: "No service contract covering consumable pump spares",
    zh: "没有服务合约覆盖泵类易损备件",
  },
  "run.bearing.3.reasoning.3": {
    en: "This is a planned replacement, not a failure claim",
    de: "Das ist ein geplanter Austausch, kein Schadensfall",
    es: "This is a planned replacement, not a failure claim",
    fr: "This is a planned replacement, not a failure claim",
    zh: "这是计划更换，不是故障索赔",
  },
  "run.bearing.3.recommendation": {
    en: "Out of warranty and outside every service contract, and it is a planned change rather than a failure. The plant carries the cost.",
    de: "Außerhalb der Gewährleistung und außerhalb jedes Servicevertrags, und es ist ein geplanter Wechsel, kein Ausfall. Die Kosten trägt das Werk.",
    es: "Out of warranty and outside every service contract, and it is a planned change rather than a failure. The plant carries the cost.",
    fr: "Out of warranty and outside every service contract, and it is a planned change rather than a failure. The plant carries the cost.",
    zh: "已过保修、也不在任何服务合约内，而且属于计划更换而非故障。费用由工厂承担。",
  },
  "run.bearing.4.agentName": {
    en: "Sourcing & contract agent",
    de: "Beschaffung & Vertrag",
    es: "Sourcing & contract agent",
    fr: "Sourcing & contract agent",
    zh: "寻源与合约智能体",
  },
  "run.bearing.4.aiThought": {
    en: "We already buy this diaphragm, from this supplier, at a price we hold on file — the planner even named them. So there is nothing to source and nothing to negotiate. All I need to do is confirm the price on file still stands.",
    de: "Wir kaufen diese Membran bereits bei diesem Lieferanten zu einem hinterlegten Preis — der Planer hat ihn sogar genannt. Es gibt also nichts zu beschaffen und nichts zu verhandeln. Ich muss nur bestätigen, dass der hinterlegte Preis weiterhin gilt.",
    es: "We already buy this diaphragm, from this supplier, at a price we hold on file — the planner even named them. So there is nothing to source and nothing to negotiate. All I need to do is confirm the price on file still stands.",
    fr: "We already buy this diaphragm, from this supplier, at a price we hold on file — the planner even named them. So there is nothing to source and nothing to negotiate. All I need to do is confirm the price on file still stands.",
    zh: "这个隔膜我们本来就从这家供应商买，价格也在档案里 —— 计划员甚至直接点了名。所以没什么可寻源、可议价的。我只需要确认档案上的价格仍然有效。",
  },
  "run.bearing.4.reasoning.0": {
    en: "Terms Net 30 · price held to 2026-12-31",
    de: "Konditionen Netto 30 · Preis gültig bis 31.12.2026",
    es: "Terms Net 30 · price held to 2026-12-31",
    fr: "Terms Net 30 · price held to 2026-12-31",
    zh: "付款条件 Net 30 · 价格有效期至 2026-12-31",
  },
  "run.bearing.5.agentName": {
    en: "Approval & routing agent",
    de: "Freigabe & Weiterleitung",
    es: "Approval & routing agent",
    fr: "Approval & routing agent",
    zh: "审批与路由智能体",
  },
  "run.bearing.5.aiThought": {
    en: "Every check is clean and the value is small. The delegation table says the plant lead signs up to $5,000 — this is $888 for a stocked material at the price we hold. The rule releases it without a signature.",
    de: "Alle Prüfungen sind sauber und der Wert ist gering. Laut Delegationstabelle zeichnet die Werksleitung bis $5.000 — hier geht es um $888 für ein lagergeführtes Material zum hinterlegten Preis. Die Regel gibt das ohne Unterschrift frei.",
    es: "Every check is clean and the value is small. The delegation table says the plant lead signs up to $5,000 — this is $888 for a stocked material at the price we hold. The rule releases it without a signature.",
    fr: "Every check is clean and the value is small. The delegation table says the plant lead signs up to $5,000 — this is $888 for a stocked material at the price we hold. The rule releases it without a signature.",
    zh: "所有检查都干净，金额也小。授权表规定厂区负责人可签至 $5,000 —— 这笔是 $888，库存件、按档案价格。规则允许无需签字直接放行。",
  },
  "run.bearing.5.reasoning.0": {
    en: "All prior checks clear — master data, stock, coverage, price",
    de: "Alle vorherigen Prüfungen bestanden — Stammdaten, Bestand, Deckung, Preis",
    es: "All prior checks clear — master data, stock, coverage, price",
    fr: "All prior checks clear — master data, stock, coverage, price",
    zh: "前面所有检查通过 —— 主数据、库存、承保、价格",
  },
  "run.bearing.5.reasoning.1": {
    en: "Release rule satisfied — no signature required",
    de: "Freigaberegel erfüllt — keine Unterschrift erforderlich",
    es: "Release rule satisfied — no signature required",
    fr: "Release rule satisfied — no signature required",
    zh: "满足放行规则 —— 无需签字",
  },
  "run.bearing.6.agentName": {
    en: "Invoice Matching agent",
    de: "Rechnungsprüfungs-Agent",
    es: "Invoice Matching agent",
    fr: "Invoice Matching agent",
    zh: "发票核对智能体",
  },
  "run.bearing.6.aiThought": {
    en: "Apex has invoiced for the diaphragms. Before a cent moves, let me put the invoice beside the purchase order, the goods receipt and the contract, and check they all say the same thing.",
    de: "Apex hat die Membranen berechnet. Bevor ein Cent fließt, lege ich die Rechnung neben Bestellung, Wareneingang und Vertrag und prüfe, ob alle dasselbe sagen.",
    es: "Apex has invoiced for the diaphragms. Before a cent moves, let me put the invoice beside the purchase order, the goods receipt and the contract, and check they all say the same thing.",
    fr: "Apex has invoiced for the diaphragms. Before a cent moves, let me put the invoice beside the purchase order, the goods receipt and the contract, and check they all say the same thing.",
    zh: "Apex 已就隔膜开票。在动一分钱之前，我把发票与订单、收货单、合约摆在一起，看它们说的是不是同一件事。",
  },
  "run.bearing.6.reasoning.0": {
    en: "Four-way match — every dimension agrees",
    de: "Vierfachabgleich — alle Dimensionen stimmen überein",
    es: "Four-way match — every dimension agrees",
    fr: "Four-way match — every dimension agrees",
    zh: "四单核对 —— 每一项都一致",
  },
  "run.off-catalogue.1.agentName": {
    en: "PR Processing agent",
    de: "Anforderungsbearbeitung",
    es: "PR Processing agent",
    fr: "PR Processing agent",
    zh: "申请处理智能体",
  },
  "run.off-catalogue.1.aiThought": {
    en: "The engineer's note is in German and there is no part number in it. Let me structure the request first, then look for something that covers this grade — an agreement, a source list, an old price. If there is nothing, this has to go to market.",
    de: "Die Notiz des Ingenieurs ist auf Deutsch und enthält keine Teilenummer. Ich strukturiere die Anforderung zuerst und suche dann nach etwas, das diese Qualität abdeckt — einen Vertrag, eine Orderbuchpflege, einen alten Preis. Gibt es nichts, muss das an den Markt.",
    es: "The engineer's note is in German and there is no part number in it. Let me structure the request first, then look for something that covers this grade — an agreement, a source list, an old price. If there is nothing, this has to go to market.",
    fr: "The engineer's note is in German and there is no part number in it. Let me structure the request first, then look for something that covers this grade — an agreement, a source list, an old price. If there is nothing, this has to go to market.",
    zh: "工程师的说明是德语的，里面没有零件号。我先把申请结构化，再去找有没有东西覆盖这个牌号 —— 协议、货源清单、历史价格。如果什么都没有，就只能去市场。",
  },
  "run.off-catalogue.1.reasoning.0": {
    en: "Reading the formulation lead's note from Let-down Line 1",
    de: "Lese die Notiz der Rezepturleitung von Let-down-Linie 1",
    es: "Reading the formulation lead's note from Let-down Line 1",
    fr: "Reading the formulation lead's note from Let-down Line 1",
    zh: "读取稀释 1 线配方负责人的说明",
  },
  "run.off-catalogue.1.reasoning.1": {
    en: "Coding it to a material and a plant",
    de: "Kontiere auf Material und Werk",
    es: "Coding it to a material and a plant",
    fr: "Coding it to a material and a plant",
    zh: "编入物料与工厂",
  },
  "run.off-catalogue.1.reasoning.2": {
    en: "Searching outline agreements for this material — nothing",
    de: "Durchsuche Rahmenverträge für dieses Material — nichts",
    es: "Searching outline agreements for this material — nothing",
    fr: "Searching outline agreements for this material — nothing",
    zh: "在框架协议中查找该物料 —— 没有",
  },
  "run.off-catalogue.1.reasoning.3": {
    en: "Searching the source list and info records — nothing",
    de: "Durchsuche Orderbuch und Infosätze — nichts",
    es: "Searching the source list and info records — nothing",
    fr: "Searching the source list and info records — nothing",
    zh: "查找货源清单与信息记录 —— 没有",
  },
  "run.off-catalogue.1.reasoning.4": {
    en: "No contract route exists · a competitive RFQ is the only honest price",
    de: "Kein Vertragsweg vorhanden · eine Ausschreibung ist der einzige ehrliche Preis",
    es: "No contract route exists · a competitive RFQ is the only honest price",
    fr: "No contract route exists · a competitive RFQ is the only honest price",
    zh: "没有合约路径 · 竞争性询价是唯一站得住的价格",
  },
  "run.off-catalogue.1.recommendation": {
    en: "Nothing on file covers this grade, so there is no agreed price to buy at and nothing to hold a supplier to. It goes to market — and at twelve tonnes the clauses behind each price matter as much as the price.",
    de: "Nichts im Bestand deckt diese Qualität ab, es gibt also keinen vereinbarten Preis und nichts, woran ein Lieferant zu binden wäre. Das geht an den Markt — und bei zwölf Tonnen zählen die Klauseln hinter jedem Preis ebenso wie der Preis selbst.",
    es: "Nothing on file covers this grade, so there is no agreed price to buy at and nothing to hold a supplier to. It goes to market — and at twelve tonnes the clauses behind each price matter as much as the price.",
    fr: "Nothing on file covers this grade, so there is no agreed price to buy at and nothing to hold a supplier to. It goes to market — and at twelve tonnes the clauses behind each price matter as much as the price.",
    zh: "档案里没有任何东西覆盖这个牌号，所以既没有约定价格，也没有可以约束供应商的依据。只能去市场 —— 而且一次十二吨，价格背后的条款和价格本身一样重要。",
  },
  "run.off-catalogue.2.agentName": {
    en: "Sourcing & contract agent",
    de: "Beschaffung & Vertrag",
    es: "Sourcing & contract agent",
    fr: "Sourcing & contract agent",
    zh: "寻源与合约智能体",
  },
  "run.off-catalogue.2.aiThought": {
    en: "No agreement means no shortlist either, so let me search for suppliers who actually make this grade. Most of them will be here in Germany — I will write to them in German, and to the overseas one in their own language.",
    de: "Kein Vertrag heißt auch keine Auswahlliste, also suche ich nach Lieferanten, die diese Qualität tatsächlich herstellen. Die meisten sitzen hier in Deutschland — ich schreibe sie auf Deutsch an, den überseeischen in seiner eigenen Sprache.",
    es: "No agreement means no shortlist either, so let me search for suppliers who actually make this grade. Most of them will be here in Germany — I will write to them in German, and to the overseas one in their own language.",
    fr: "No agreement means no shortlist either, so let me search for suppliers who actually make this grade. Most of them will be here in Germany — I will write to them in German, and to the overseas one in their own language.",
    zh: "没有协议就等于没有候选名单，那我去找真正生产这个牌号的供应商。大部分就在德国本地 —— 我用德语写给他们，海外那家用他们自己的语言。",
  },
  "run.off-catalogue.2.reasoning.0": {
    en: "Searching the supplier master and the web",
    de: "Durchsuche den Lieferantenstamm und das Web",
    es: "Searching the supplier master and the web",
    fr: "Searching the supplier master and the web",
    zh: "检索供应商主数据与网络",
  },
  "run.off-catalogue.2.reasoning.1": {
    en: "Four suppliers make or stock this rutile grade",
    de: "Vier Lieferanten fertigen oder lagern diese Rutil-Qualität",
    es: "Four suppliers make or stock this rutile grade",
    fr: "Four suppliers make or stock this rutile grade",
    zh: "四家供应商生产或备有这个金红石牌号",
  },
  "run.off-catalogue.2.reasoning.2": {
    en: "Three are German · one manufacturer is in China",
    de: "Drei sind deutsch · ein Hersteller sitzt in China",
    es: "Three are German · one manufacturer is in China",
    fr: "Three are German · one manufacturer is in China",
    zh: "三家在德国 · 一家制造商在中国",
  },
  "run.off-catalogue.2.reasoning.3": {
    en: "Writing each request in the language they work in",
    de: "Schreibe jede Anfrage in der Sprache, in der sie arbeiten",
    es: "Writing each request in the language they work in",
    fr: "Writing each request in the language they work in",
    zh: "每封询价用对方工作的语言写",
  },
  "run.off-catalogue.2.reasoning.4": {
    en: "Sending, and collecting what comes back",
    de: "Versende und sammle die Rückläufer",
    es: "Sending, and collecting what comes back",
    fr: "Sending, and collecting what comes back",
    zh: "发出，并收集回复",
  },
  "run.off-catalogue.2.recommendation": {
    en: "Four requests out, three quotes back and one refusal. The prices are close together; the lead times are not, and that is what this decision turns on.",
    de: "Vier Anfragen raus, drei Angebote zurück und eine Absage. Die Preise liegen eng beieinander, die Lieferzeiten nicht — und daran entscheidet sich die Sache.",
    es: "Four requests out, three quotes back and one refusal. The prices are close together; the lead times are not, and that is what this decision turns on.",
    fr: "Four requests out, three quotes back and one refusal. The prices are close together; the lead times are not, and that is what this decision turns on.",
    zh: "发出四封，回来三份报价和一次婉拒。价格彼此接近，交期却不是 —— 这个决定就落在交期上。",
  },
  "run.off-catalogue.3.agentName": {
    en: "Sourcing & contract agent",
    de: "Beschaffung & Vertrag",
    es: "Sourcing & contract agent",
    fr: "Sourcing & contract agent",
    zh: "寻源与合约智能体",
  },
  "run.off-catalogue.3.aiThought": {
    en: "Three usable quotes and one refusal. The spread on price is small; the spread on terms is not — freight, settlement and what happens if it slips. Let me weigh them properly.",
    de: "Drei brauchbare Angebote und eine Absage. Die Preisspanne ist klein, die Spanne bei den Konditionen nicht — Fracht, Skonto und was passiert, wenn es sich verzögert. Ich wäge das sauber ab.",
    es: "Three usable quotes and one refusal. The spread on price is small; the spread on terms is not — freight, settlement and what happens if it slips. Let me weigh them properly.",
    fr: "Three usable quotes and one refusal. The spread on price is small; the spread on terms is not — freight, settlement and what happens if it slips. Let me weigh them properly.",
    zh: "三份可用报价，一次婉拒。价格差距不大，条款差距很大 —— 运费、账期折扣，以及延误了怎么办。我来认真权衡。",
  },
  "run.off-catalogue.3.reasoning.0": {
    en: "Reading all four replies, two of them translated",
    de: "Lese alle vier Antworten, zwei davon übersetzt",
    es: "Reading all four replies, two of them translated",
    fr: "Reading all four replies, two of them translated",
    zh: "读完四封回复，其中两封是翻译过来的",
  },
  "run.off-catalogue.3.reasoning.1": {
    en: "Comparing unit price, lead time and what is actually in stock",
    de: "Vergleiche Stückpreis, Lieferzeit und tatsächlichen Lagerbestand",
    es: "Comparing unit price, lead time and what is actually in stock",
    fr: "Comparing unit price, lead time and what is actually in stock",
    zh: "比较单价、交期和实际现货",
  },
  "run.off-catalogue.3.reasoning.2": {
    en: "Costing the downtime the slower quotes would add",
    de: "Bewerte die Stillstandskosten der langsameren Angebote",
    es: "Costing the downtime the slower quotes would add",
    fr: "Costing the downtime the slower quotes would add",
    zh: "测算较慢报价会额外带来的停机成本",
  },
  "run.off-catalogue.3.reasoning.3": {
    en: "Recommending one, and saying what the runner-up lost on",
    de: "Empfehle einen und benenne, woran der Zweitplatzierte scheiterte",
    es: "Recommending one, and saying what the runner-up lost on",
    fr: "Recommending one, and saying what the runner-up lost on",
    zh: "推荐一家，并说明次优者输在哪里",
  },
  "run.off-catalogue.4.agentName": {
    en: "Approval & routing agent",
    de: "Freigabe & Weiterleitung",
    es: "Approval & routing agent",
    fr: "Approval & routing agent",
    zh: "审批与路由智能体",
  },
  "run.off-catalogue.4.aiThought": {
    en: "The supplier is chosen and the price is evidenced by three quotes. Let me raise the order, route it for the one signature it needs, and write to the supplier — in German, with the English alongside so you can check it before it goes.",
    de: "Der Lieferant steht fest und der Preis ist durch drei Angebote belegt. Ich lege die Bestellung an, leite sie zur einen nötigen Unterschrift weiter und schreibe dem Lieferanten — auf Deutsch, mit dem englischen Text daneben, damit Sie ihn vor dem Versand prüfen können.",
    es: "The supplier is chosen and the price is evidenced by three quotes. Let me raise the order, route it for the one signature it needs, and write to the supplier — in German, with the English alongside so you can check it before it goes.",
    fr: "The supplier is chosen and the price is evidenced by three quotes. Let me raise the order, route it for the one signature it needs, and write to the supplier — in German, with the English alongside so you can check it before it goes.",
    zh: "供应商已定，价格有三份报价作证。我来开订单、送去做那一个必要的签字，并写信给供应商 —— 用德语，旁边附英文，方便你在发出前核对。",
  },
  "run.off-catalogue.4.reasoning.0": {
    en: "Raising PO-77318 against the chosen quote",
    de: "Lege Bestellung PO-77318 zum gewählten Angebot an",
    es: "Raising PO-77318 against the chosen quote",
    fr: "Raising PO-77318 against the chosen quote",
    zh: "按选定报价开立订单 PO-77318",
  },
  "run.off-catalogue.4.reasoning.1": {
    en: "Attaching all three quotes as the price evidence",
    de: "Hänge alle drei Angebote als Preisnachweis an",
    es: "Attaching all three quotes as the price evidence",
    fr: "Attaching all three quotes as the price evidence",
    zh: "附上三份报价作为价格依据",
  },
  "run.off-catalogue.4.reasoning.2": {
    en: "Drafting the order confirmation in German",
    de: "Entwerfe die Auftragsbestätigung auf Deutsch",
    es: "Drafting the order confirmation in German",
    fr: "Drafting the order confirmation in German",
    zh: "用德语起草订单确认函",
  },
  "run.onboarding.1.agentName": {
    en: "Sourcing & contract agent",
    de: "Beschaffung & Vertrag",
    es: "Sourcing & contract agent",
    fr: "Sourcing & contract agent",
    zh: "寻源与合约智能体",
  },
  "run.onboarding.1.aiThought": {
    en: "Westport needs two mixing vessels relined during the September shutdown, and we have no approved supplier for vessel coating at all. There is nothing to compare against, so the market has to tell us the price.",
    de: "Westport muss im September-Stillstand zwei Rührbehälter neu auskleiden lassen, und für Behälterbeschichtung haben wir überhaupt keinen zugelassenen Lieferanten. Es gibt nichts zum Vergleichen — den Preis muss der Markt nennen.",
    es: "Westport needs two mixing vessels relined during the September shutdown, and we have no approved supplier for vessel coating at all. There is nothing to compare against, so the market has to tell us the price.",
    fr: "Westport needs two mixing vessels relined during the September shutdown, and we have no approved supplier for vessel coating at all. There is nothing to compare against, so the market has to tell us the price.",
    zh: "Westport 需要在九月停车期间给两台搅拌罐重新做内衬，而我们在罐体涂层这一类别下根本没有核准供应商。没有可比对象，价格只能由市场来说。",
  },
  "run.onboarding.1.reasoning.0": {
    en: "No approved supplier in this category — the buy cannot be routed to anyone",
    de: "Kein zugelassener Lieferant in dieser Kategorie — der Kauf lässt sich niemandem zuordnen",
    es: "No approved supplier in this category — the buy cannot be routed to anyone",
    fr: "No approved supplier in this category — the buy cannot be routed to anyone",
    zh: "该类别下没有核准供应商 —— 这笔采购无处可派",
  },
  "run.onboarding.1.reasoning.1": {
    en: "Searching the market for specialist vessel-coating contractors",
    de: "Suche im Markt nach Spezialisten für Behälterbeschichtung",
    es: "Searching the market for specialist vessel-coating contractors",
    fr: "Searching the market for specialist vessel-coating contractors",
    zh: "在市场上寻找专业的罐体涂层承包商",
  },
  "run.onboarding.1.reasoning.2": {
    en: "Writing the request for quote from the shutdown scope",
    de: "Erstelle die Anfrage aus dem Stillstandsumfang",
    es: "Writing the request for quote from the shutdown scope",
    fr: "Writing the request for quote from the shutdown scope",
    zh: "依据停车检修范围撰写询价",
  },
  "run.onboarding.1.reasoning.3": {
    en: "Drafting the emails for you to send",
    de: "Entwerfe die E-Mails für Ihren Versand",
    es: "Drafting the emails for you to send",
    fr: "Drafting the emails for you to send",
    zh: "起草邮件交由你发送",
  },
  "run.onboarding.1.reasoning.4": {
    en: "Collecting the quotes as they come back",
    de: "Sammle die eingehenden Angebote",
    es: "Collecting the quotes as they come back",
    fr: "Collecting the quotes as they come back",
    zh: "陆续收集回来的报价",
  },
  "run.onboarding.2.agentName": {
    en: "Master Data agent",
    de: "Stammdaten-Agent",
    es: "Master Data agent",
    fr: "Master Data agent",
    zh: "主数据智能体",
  },
  "run.onboarding.2.aiThought": {
    en: "The winning contractor has sent their registration pack — in Spanish, as four separate documents. Let me read them and pull out the fields the supplier master actually needs.",
    de: "Der beauftragte Auftragnehmer hat seine Registrierungsunterlagen geschickt — auf Spanisch, als vier einzelne Dokumente. Ich lese sie und entnehme die Felder, die der Lieferantenstamm tatsächlich braucht.",
    es: "The winning contractor has sent their registration pack — in Spanish, as four separate documents. Let me read them and pull out the fields the supplier master actually needs.",
    fr: "The winning contractor has sent their registration pack — in Spanish, as four separate documents. Let me read them and pull out the fields the supplier master actually needs.",
    zh: "中标的承包商把注册资料发来了 —— 西班牙语，四份独立文件。我来读一遍，把供应商主数据真正需要的字段提取出来。",
  },
  "run.onboarding.2.reasoning.0": {
    en: "Reading the registration email and its four attachments",
    de: "Lese die Registrierungs-E-Mail und ihre vier Anhänge",
    es: "Reading the registration email and its four attachments",
    fr: "Reading the registration email and its four attachments",
    zh: "读取注册邮件及其四份附件",
  },
  "run.onboarding.2.reasoning.1": {
    en: "Translating from Español",
    de: "Übersetze aus dem Spanischen",
    es: "Translating from Español",
    fr: "Translating from Español",
    zh: "从西班牙语翻译",
  },
  "run.onboarding.2.reasoning.2": {
    en: "Certificate of incorporation → legal name, address, incorporation date",
    de: "Handelsregisterauszug → Firmenname, Anschrift, Gründungsdatum",
    es: "Certificate of incorporation → legal name, address, incorporation date",
    fr: "Certificate of incorporation → legal name, address, incorporation date",
    zh: "公司注册证书 → 法定名称、地址、注册日期",
  },
  "run.onboarding.2.reasoning.3": {
    en: "Tax certificate → tax identification and VAT status",
    de: "Steuerbescheinigung → Steuernummer und Umsatzsteuerstatus",
    es: "Tax certificate → tax identification and VAT status",
    fr: "Tax certificate → tax identification and VAT status",
    zh: "税务证明 → 税号与增值税状态",
  },
  "run.onboarding.2.reasoning.4": {
    en: "Insurance policy → cover and expiry",
    de: "Versicherungspolice → Deckung und Ablauf",
    es: "Insurance policy → cover and expiry",
    fr: "Insurance policy → cover and expiry",
    zh: "保险单 → 承保范围与到期日",
  },
  "run.onboarding.2.recommendation": {
    en: "Every field the supplier master needs was found in the documents themselves and translated. Nothing was typed by hand, so there is nothing to mistype.",
    de: "Jedes Feld, das der Lieferantenstamm braucht, wurde in den Dokumenten selbst gefunden und übersetzt. Nichts wurde von Hand eingegeben, also kann sich niemand vertippen.",
    es: "Every field the supplier master needs was found in the documents themselves and translated. Nothing was typed by hand, so there is nothing to mistype.",
    fr: "Every field the supplier master needs was found in the documents themselves and translated. Nothing was typed by hand, so there is nothing to mistype.",
    zh: "供应商主数据需要的每一个字段，都是从文件本身读出来并翻译的。没有一处是手打的，也就没有打错的可能。",
  },
  "run.onboarding.3.agentName": {
    en: "Master Data agent",
    de: "Stammdaten-Agent",
    es: "Master Data agent",
    fr: "Master Data agent",
    zh: "主数据智能体",
  },
  "run.onboarding.3.aiThought": {
    en: "A supplier record that is missing a field fails later, usually when someone is trying to pay them. Let me check each mandatory field against the document that proves it.",
    de: "Ein Lieferantensatz mit fehlendem Feld fällt später auf die Füße — meist genau dann, wenn jemand zahlen will. Ich prüfe jedes Pflichtfeld gegen das Dokument, das es belegt.",
    es: "A supplier record that is missing a field fails later, usually when someone is trying to pay them. Let me check each mandatory field against the document that proves it.",
    fr: "A supplier record that is missing a field fails later, usually when someone is trying to pay them. Let me check each mandatory field against the document that proves it.",
    zh: "供应商档案缺字段，问题会在后面爆出来，通常是有人要付款的时候。我把每个必填字段与能证明它的文件逐一对上。",
  },
  "run.onboarding.3.reasoning.0": {
    en: "Reading the mandatory-field list for a supplier master",
    de: "Lese die Pflichtfeldliste für den Lieferantenstamm",
    es: "Reading the mandatory-field list for a supplier master",
    fr: "Reading the mandatory-field list for a supplier master",
    zh: "读取供应商主数据的必填字段清单",
  },
  "run.onboarding.3.reasoning.1": {
    en: "Matching each field to the document that evidences it",
    de: "Ordne jedem Feld das belegende Dokument zu",
    es: "Matching each field to the document that evidences it",
    fr: "Matching each field to the document that evidences it",
    zh: "把每个字段对应到能佐证它的文件",
  },
  "run.onboarding.3.reasoning.2": {
    en: "Four of five proven by a document",
    de: "Vier von fünf durch ein Dokument belegt",
    es: "Four of five proven by a document",
    fr: "Four of five proven by a document",
    zh: "五项中有四项有文件佐证",
  },
  "run.onboarding.3.reasoning.3": {
    en: "Bank account present but not verifiable from paper alone",
    de: "Bankverbindung vorhanden, aber nicht allein aus Papier prüfbar",
    es: "Bank account present but not verifiable from paper alone",
    fr: "Bank account present but not verifiable from paper alone",
    zh: "银行账户已提供，但仅凭纸面无法核实",
  },
  "run.onboarding.3.recommendation": {
    en: "Nothing is missing. The bank account is flagged as unverified on purpose — it is set by callback, never from a document or a message.",
    de: "Es fehlt nichts. Die Bankverbindung ist bewusst als ungeprüft gekennzeichnet — sie wird per Rückruf gesetzt, nie aus einem Dokument oder einer Nachricht.",
    es: "Nothing is missing. The bank account is flagged as unverified on purpose — it is set by callback, never from a document or a message.",
    fr: "Nothing is missing. The bank account is flagged as unverified on purpose — it is set by callback, never from a document or a message.",
    zh: "没有缺项。银行账户被有意标记为未核实 —— 它只能通过回拨电话确认，绝不从文件或消息里直接采信。",
  },
  "run.onboarding.4.agentName": {
    en: "Master Data agent",
    de: "Stammdaten-Agent",
    es: "Master Data agent",
    fr: "Master Data agent",
    zh: "主数据智能体",
  },
  "run.onboarding.4.aiThought": {
    en: "Before this supplier can be paid anything, they have to pass the screens. Sanctions, who actually owns them, whether they are solvent, and what taking them on does to our concentration.",
    de: "Bevor dieser Lieferant irgendetwas erhält, muss er die Prüfungen bestehen: Sanktionen, tatsächliche Eigentümer, Zahlungsfähigkeit — und was seine Aufnahme für unsere Konzentration bedeutet.",
    es: "Before this supplier can be paid anything, they have to pass the screens. Sanctions, who actually owns them, whether they are solvent, and what taking them on does to our concentration.",
    fr: "Before this supplier can be paid anything, they have to pass the screens. Sanctions, who actually owns them, whether they are solvent, and what taking them on does to our concentration.",
    zh: "在给这家供应商付任何钱之前，他们得先过筛查：制裁名单、实际控制人、是否有偿付能力，以及接纳他们会对我们的供应集中度产生什么影响。",
  },
  "run.onboarding.4.reasoning.0": {
    en: "Sanctions screening against the consolidated lists",
    de: "Sanktionsprüfung gegen die konsolidierten Listen",
    es: "Sanctions screening against the consolidated lists",
    fr: "Sanctions screening against the consolidated lists",
    zh: "对照合并制裁名单进行筛查",
  },
  "run.onboarding.4.reasoning.1": {
    en: "Adverse-media search",
    de: "Negativ-Medienrecherche",
    es: "Adverse-media search",
    fr: "Adverse-media search",
    zh: "负面媒体检索",
  },
  "run.onboarding.4.reasoning.2": {
    en: "Beneficial ownership against the register extract",
    de: "Wirtschaftlich Berechtigte gegen den Registerauszug",
    es: "Beneficial ownership against the register extract",
    fr: "Beneficial ownership against the register extract",
    zh: "实际受益人比对登记摘录",
  },
  "run.onboarding.4.reasoning.3": {
    en: "Insolvency and filed accounts",
    de: "Insolvenz und eingereichte Abschlüsse",
    es: "Insolvency and filed accounts",
    fr: "Insolvency and filed accounts",
    zh: "破产记录与已备案财报",
  },
  "run.onboarding.4.reasoning.4": {
    en: "Category concentration — first supplier here, so none",
    de: "Kategoriekonzentration — erster Lieferant hier, also keine",
    es: "Category concentration — first supplier here, so none",
    fr: "Category concentration — first supplier here, so none",
    zh: "类别集中度 —— 这是该类别第一家，暂无集中",
  },
  "run.onboarding.4.recommendation": {
    en: "Clear on every screen. One thing diarised rather than escalated: the liability insurance expires 2027-03-31, so a renewal reminder is set against the record.",
    de: "In jeder Prüfung sauber. Eines wurde terminiert statt eskaliert: Die Haftpflichtversicherung läuft am 31.03.2027 ab, daher ist eine Erinnerung zur Verlängerung hinterlegt.",
    es: "Clear on every screen. One thing diarised rather than escalated: the liability insurance expires 2027-03-31, so a renewal reminder is set against the record.",
    fr: "Clear on every screen. One thing diarised rather than escalated: the liability insurance expires 2027-03-31, so a renewal reminder is set against the record.",
    zh: "各项筛查全部通过。有一件事是记进日程而不是上报：责任险 2027-03-31 到期，已在档案上设置续保提醒。",
  },
  "run.onboarding.5.agentName": {
    en: "Master Data agent",
    de: "Stammdaten-Agent",
    es: "Master Data agent",
    fr: "Master Data agent",
    zh: "主数据智能体",
  },
  "run.onboarding.5.aiThought": {
    en: "Everything checks out, so I can prepare the supplier master. I will fill every field I can evidence — and deliberately leave the bank account empty, because that one is set by callback.",
    de: "Alles stimmt, ich kann den Lieferantenstamm vorbereiten. Ich fülle jedes Feld, das ich belegen kann — und lasse die Bankverbindung bewusst leer, denn die wird per Rückruf gesetzt.",
    es: "Everything checks out, so I can prepare the supplier master. I will fill every field I can evidence — and deliberately leave the bank account empty, because that one is set by callback.",
    fr: "Everything checks out, so I can prepare the supplier master. I will fill every field I can evidence — and deliberately leave the bank account empty, because that one is set by callback.",
    zh: "全部核实无误，可以准备供应商主数据了。我会填上每一个有据可查的字段 —— 并有意把银行账户留空，因为那一项要靠回拨确认。",
  },
  "run.onboarding.5.reasoning.0": {
    en: "Filling the supplier master from the extracted fields",
    de: "Fülle den Lieferantenstamm aus den extrahierten Feldern",
    es: "Filling the supplier master from the extracted fields",
    fr: "Filling the supplier master from the extracted fields",
    zh: "用提取到的字段填充供应商主数据",
  },
  "run.onboarding.5.reasoning.1": {
    en: "Setting purchasing org, category and the quoted payment terms",
    de: "Setze Einkaufsorganisation, Kategorie und die angebotenen Zahlungsbedingungen",
    es: "Setting purchasing org, category and the quoted payment terms",
    fr: "Setting purchasing org, category and the quoted payment terms",
    zh: "设置采购组织、类别与报价中的付款条件",
  },
  "run.onboarding.5.reasoning.2": {
    en: "Leaving the bank account blank — callback required",
    de: "Lasse die Bankverbindung leer — Rückruf erforderlich",
    es: "Leaving the bank account blank — callback required",
    fr: "Leaving the bank account blank — callback required",
    zh: "银行账户留空 —— 需回拨确认",
  },
  "run.onboarding.5.reasoning.3": {
    en: "Preparing one approval card for a person",
    de: "Bereite eine Freigabekarte für einen Menschen vor",
    es: "Preparing one approval card for a person",
    fr: "Preparing one approval card for a person",
    zh: "为人工审批准备一张卡片",
  },

  /* ── Run headers, and the hero run's stages ────────────────────────── */
  "flow.pump.contextTitle": {
    en: "Dispersion · Mixing Line 2 · mechanical seal PR",
    de: "Dispersion · Mischlinie 2 · Anforderung Gleitringdichtung",
    es: "Dispersion · Mixing Line 2 · mechanical seal PR",
    fr: "Dispersion · Mixing Line 2 · mechanical seal PR",
    zh: "分散体厂 · 搅拌 2 线 · 机械密封申请",
  },
  "flow.pump.contextSub": {
    en: "Free-text request · intake structured it, every check cleared · released on contract",
    de: "Freitext-Anforderung · vom Eingang strukturiert, alle Prüfungen bestanden · auf Vertrag freigegeben",
    es: "Free-text request · intake structured it, every check cleared · released on contract",
    fr: "Free-text request · intake structured it, every check cleared · released on contract",
    zh: "自由文本申请 · 由收单结构化，全部检查通过 · 按协议放行",
  },
  "flow.pump.reviewPill": {
    en: "PR validation · in review",
    de: "Anforderungsprüfung · in Bearbeitung",
    es: "PR validation · in review",
    fr: "PR validation · in review",
    zh: "申请校验 · 进行中",
  },
  "flow.bearing.contextTitle": {
    en: "Dispersion · Mixing Line 1 · pump diaphragm PR",
    de: "Dispersion · Mischlinie 1 · Anforderung Pumpenmembran",
    es: "Dispersion · Mixing Line 1 · pump diaphragm PR",
    fr: "Dispersion · Mixing Line 1 · pump diaphragm PR",
    zh: "分散体厂 · 搅拌 1 线 · 泵隔膜申请",
  },
  "flow.bearing.contextSub": {
    en: "Complete request · every check clean · released and paid without a person",
    de: "Vollständige Anforderung · alle Prüfungen sauber · ohne Zutun freigegeben und bezahlt",
    es: "Complete request · every check clean · released and paid without a person",
    fr: "Complete request · every check clean · released and paid without a person",
    zh: "申请完整 · 每项检查干净 · 无人工介入即放行并付款",
  },
  "flow.bearing.reviewPill": {
    en: "PR validation · running",
    de: "Anforderungsprüfung · läuft",
    es: "PR validation · running",
    fr: "PR validation · running",
    zh: "申请校验 · 运行中",
  },
  "flow.off-catalogue.contextTitle": {
    en: "Dispersion Plant · Let-down Line 1 · no agreement covers it",
    de: "Dispersion · Let-down-Linie 1 · kein Vertrag deckt das ab",
    es: "Dispersion Plant · Let-down Line 1 · no agreement covers it",
    fr: "Dispersion Plant · Let-down Line 1 · no agreement covers it",
    zh: "分散体厂 · 稀释 1 线 · 无协议覆盖",
  },
  "flow.off-catalogue.contextSub": {
    en: "Nothing on contract · taken to market · four suppliers asked, three quoted",
    de: "Nichts auf Vertrag · an den Markt gegeben · vier Lieferanten angefragt, drei haben angeboten",
    es: "Nothing on contract · taken to market · four suppliers asked, three quoted",
    fr: "Nothing on contract · taken to market · four suppliers asked, three quoted",
    zh: "无合约可用 · 转入市场 · 询价四家，三家报价",
  },
  "flow.off-catalogue.reviewPill": {
    en: "Off-contract sourcing · in review",
    de: "Beschaffung außerhalb des Vertrags · in Bearbeitung",
    es: "Off-contract sourcing · in review",
    fr: "Off-contract sourcing · in review",
    zh: "合约外寻源 · 进行中",
  },
  "flow.onboarding.contextTitle": {
    en: "Westport · vessel relining · new supplier",
    de: "Westport · Behälterauskleidung · neuer Lieferant",
    es: "Westport · vessel relining · new supplier",
    fr: "Westport · vessel relining · new supplier",
    zh: "Westport 厂 · 罐体内衬 · 新供应商",
  },
  "flow.onboarding.contextSub": {
    en: "No approved supplier existed · market searched, quotes compared, supplier onboarded",
    de: "Kein zugelassener Lieferant vorhanden · Markt gesucht, Angebote verglichen, Lieferant angelegt",
    es: "No approved supplier existed · market searched, quotes compared, supplier onboarded",
    fr: "No approved supplier existed · market searched, quotes compared, supplier onboarded",
    zh: "此前没有核准供应商 · 已搜索市场、比较报价、完成供应商入驻",
  },
  "flow.onboarding.reviewPill": {
    en: "Supplier onboarding · in review",
    de: "Lieferantenanlage · in Bearbeitung",
    es: "Supplier onboarding · in review",
    fr: "Supplier onboarding · in review",
    zh: "供应商入驻 · 进行中",
  },
  "run.pump.1.stage.0.title": {
    en: "Item — what's needed",
    de: "Position — was gebraucht wird",
    es: "Item — what's needed",
    fr: "Item — what's needed",
    zh: "采购项 —— 需要什么",
  },
  "run.pump.1.stage.1.title": {
    en: "Requisition header",
    de: "Anforderungskopf",
    es: "Requisition header",
    fr: "Requisition header",
    zh: "申请单抬头",
  },
  "run.pump.1.stage.2.title": {
    en: "Account assignment",
    de: "Kontierung",
    es: "Account assignment",
    fr: "Account assignment",
    zh: "科目分配",
  },
  "run.pump.1.stage.3.title": {
    en: "Stock on hand",
    de: "Lagerbestand",
    es: "Stock on hand",
    fr: "Stock on hand",
    zh: "现有库存",
  },
  "run.pump.1.stage.4.title": {
    en: "Source of supply",
    de: "Bezugsquelle",
    es: "Source of supply",
    fr: "Source of supply",
    zh: "供货来源",
  },
  "run.pump.2.stage.0.title": {
    en: "Material master · MM03",
    de: "Materialstamm · MM03",
    es: "Material master · MM03",
    fr: "Material master · MM03",
    zh: "物料主数据 · MM03",
  },
  "run.pump.2.stage.1.title": {
    en: "Duplicate scan · ME5A",
    de: "Duplikatsuche · ME5A",
    es: "Duplicate scan · ME5A",
    fr: "Duplicate scan · ME5A",
    zh: "重复扫描 · ME5A",
  },
  "run.pump.2.stage.2.title": {
    en: "Stock overview · MB52",
    de: "Bestandsübersicht · MB52",
    es: "Stock overview · MB52",
    fr: "Stock overview · MB52",
    zh: "库存总览 · MB52",
  },
  "run.pump.3.stage.0.title": {
    en: "Warranty & coverage · IQS3",
    de: "Gewährleistung & Deckung · IQS3",
    es: "Warranty & coverage · IQS3",
    fr: "Warranty & coverage · IQS3",
    zh: "保修与承保 · IQS3",
  },
  "run.pump.4.stage.0.title": {
    en: "Price · ME33K SA-MRO-07",
    de: "Preis · ME33K SA-MRO-07",
    es: "Price · ME33K SA-MRO-07",
    fr: "Price · ME33K SA-MRO-07",
    zh: "价格 · ME33K SA-MRO-07",
  },
  "run.pump.6.stage.0.title": {
    en: "Four-way match — invoice vs PO",
    de: "Vierfachabgleich — Rechnung gegen Bestellung",
    es: "Four-way match — invoice vs PO",
    fr: "Four-way match — invoice vs PO",
    zh: "四单核对 —— 发票对订单",
  },
  "run.pump.6.stage.1.title": {
    en: "Four-way match — adding the goods receipt",
    de: "Vierfachabgleich — Wareneingang ergänzt",
    es: "Four-way match — adding the goods receipt",
    fr: "Four-way match — adding the goods receipt",
    zh: "四单核对 —— 加入收货单",
  },
  "run.pump.6.stage.2.title": {
    en: "Four-way match — adding the contract · verdict",
    de: "Vierfachabgleich — Vertrag ergänzt · Ergebnis",
    es: "Four-way match — adding the contract · verdict",
    fr: "Four-way match — adding the contract · verdict",
    zh: "四单核对 —— 加入合约 · 结论",
  },
  "run.pump.1.stage.0.field.0": {
    en: "Material",
    de: "Material",
    es: "Material",
    fr: "Material",
    zh: "物料",
  },
  "run.pump.1.stage.0.field.1": {
    en: "Shaft diameter",
    de: "Wellendurchmesser",
    es: "Shaft diameter",
    fr: "Shaft diameter",
    zh: "轴径",
  },
  "run.pump.1.stage.0.field.2": {
    en: "Quantity",
    de: "Menge",
    es: "Quantity",
    fr: "Quantity",
    zh: "数量",
  },
  "run.pump.1.stage.0.field.3": {
    en: "UoM",
    de: "Mengeneinheit",
    es: "UoM",
    fr: "UoM",
    zh: "计量单位",
  },
  "run.pump.1.stage.0.field.4": {
    en: "Delivery",
    de: "Lieferung",
    es: "Delivery",
    fr: "Delivery",
    zh: "交付",
  },
  "run.pump.1.stage.0.field.5": {
    en: "Delivery date",
    de: "Liefertermin",
    es: "Delivery date",
    fr: "Delivery date",
    zh: "交货日期",
  },
  "run.pump.1.stage.0.field.6": {
    en: "Requisitioner",
    de: "Anforderer",
    es: "Requisitioner",
    fr: "Requisitioner",
    zh: "申请人",
  },
  "run.pump.1.stage.1.field.0": {
    en: "PR type",
    de: "Anforderungsart",
    es: "PR type",
    fr: "PR type",
    zh: "申请类型",
  },
  "run.pump.1.stage.1.field.1": {
    en: "Requestor",
    de: "Antragsteller",
    es: "Requestor",
    fr: "Requestor",
    zh: "提出人",
  },
  "run.pump.1.stage.1.field.2": {
    en: "Purch. org",
    de: "Einkaufsorganisation",
    es: "Purch. org",
    fr: "Purch. org",
    zh: "采购组织",
  },
  "run.pump.1.stage.1.field.3": {
    en: "Purch. group",
    de: "Einkäufergruppe",
    es: "Purch. group",
    fr: "Purch. group",
    zh: "采购组",
  },
  "run.pump.1.stage.2.field.0": {
    en: "Material code",
    de: "Materialcode",
    es: "Material code",
    fr: "Material code",
    zh: "物料编码",
  },
  "run.pump.1.stage.2.field.1": {
    en: "Plant",
    de: "Werk",
    es: "Plant",
    fr: "Plant",
    zh: "工厂",
  },
  "run.pump.1.stage.2.field.2": {
    en: "Cost center",
    de: "Kostenstelle",
    es: "Cost center",
    fr: "Cost center",
    zh: "成本中心",
  },
  "run.pump.1.stage.2.field.3": {
    en: "G/L account",
    de: "Sachkonto",
    es: "G/L account",
    fr: "G/L account",
    zh: "总账科目",
  },
  "run.pump.1.stage.2.field.4": {
    en: "Material group",
    de: "Warengruppe",
    es: "Material group",
    fr: "Material group",
    zh: "物料组",
  },
  "run.pump.1.stage.3.field.0": {
    en: "On-hand · this plant",
    de: "Bestand · dieses Werk",
    es: "On-hand · this plant",
    fr: "On-hand · this plant",
    zh: "本厂库存",
  },
  "run.pump.1.stage.3.field.1": {
    en: "Interplant (Eastbrook · Westport)",
    de: "Werksübergreifend (Eastbrook · Westport)",
    es: "Interplant (Eastbrook · Westport)",
    fr: "Interplant (Eastbrook · Westport)",
    zh: "跨厂（Eastbrook · Westport）",
  },
  "run.pump.1.stage.3.field.2": {
    en: "Current safety stock",
    de: "Aktueller Sicherheitsbestand",
    es: "Current safety stock",
    fr: "Current safety stock",
    zh: "当前安全库存",
  },
  "run.pump.1.stage.3.field.3": {
    en: "Recommended safety stock",
    de: "Empfohlener Sicherheitsbestand",
    es: "Recommended safety stock",
    fr: "Recommended safety stock",
    zh: "建议安全库存",
  },
  "run.pump.1.stage.3.field.4": {
    en: "Verdict",
    de: "Ergebnis",
    es: "Verdict",
    fr: "Verdict",
    zh: "结论",
  },
  "run.pump.1.stage.4.field.0": {
    en: "Vendor",
    de: "Lieferant",
    es: "Vendor",
    fr: "Vendor",
    zh: "供应商",
  },
  "run.pump.1.stage.4.field.1": {
    en: "Outline agreement",
    de: "Rahmenvertrag",
    es: "Outline agreement",
    fr: "Outline agreement",
    zh: "框架协议",
  },
  "run.pump.1.stage.4.field.2": {
    en: "Unit price",
    de: "Stückpreis",
    es: "Unit price",
    fr: "Unit price",
    zh: "单价",
  },
  "run.pump.1.stage.4.field.3": {
    en: "Total value",
    de: "Gesamtwert",
    es: "Total value",
    fr: "Total value",
    zh: "总金额",
  },
  "run.pump.1.stage.4.field.4": {
    en: "Payment terms",
    de: "Zahlungsbedingungen",
    es: "Payment terms",
    fr: "Payment terms",
    zh: "付款条件",
  },
  "run.pump.2.stage.0.field.0": {
    en: "Material",
    de: "Material",
    es: "Material",
    fr: "Material",
    zh: "物料",
  },
  "run.pump.2.stage.0.field.1": {
    en: "Description",
    de: "Bezeichnung",
    es: "Description",
    fr: "Description",
    zh: "描述",
  },
  "run.pump.2.stage.0.field.2": {
    en: "Valuation class",
    de: "Bewertungsklasse",
    es: "Valuation class",
    fr: "Valuation class",
    zh: "评估类别",
  },
  "run.pump.2.stage.0.field.3": {
    en: "Status",
    de: "Status",
    es: "Status",
    fr: "Status",
    zh: "状态",
  },
  "run.pump.2.stage.1.field.0": {
    en: "Open PRs scanned",
    de: "Geprüfte offene Anforderungen",
    es: "Open PRs scanned",
    fr: "Open PRs scanned",
    zh: "已扫描的在途申请",
  },
  "run.pump.2.stage.1.field.1": {
    en: "Same material",
    de: "Gleiches Material",
    es: "Same material",
    fr: "Same material",
    zh: "同一物料",
  },
  "run.pump.2.stage.1.field.2": {
    en: "Duplicate",
    de: "Duplikat",
    es: "Duplicate",
    fr: "Duplicate",
    zh: "重复",
  },
  "run.pump.2.stage.1.field.3": {
    en: "Result",
    de: "Ergebnis",
    es: "Result",
    fr: "Result",
    zh: "结果",
  },
  "run.pump.2.stage.2.field.0": {
    en: "On-hand · Northgate",
    de: "Bestand · Northgate",
    es: "On-hand · Northgate",
    fr: "On-hand · Northgate",
    zh: "Northgate 库存",
  },
  "run.pump.2.stage.2.field.1": {
    en: "Eastbrook plant",
    de: "Werk Eastbrook",
    es: "Eastbrook plant",
    fr: "Eastbrook plant",
    zh: "Eastbrook 工厂",
  },
  "run.pump.2.stage.2.field.2": {
    en: "Westport",
    de: "Westport",
    es: "Westport",
    fr: "Westport",
    zh: "Westport",
  },
  "run.pump.2.stage.2.field.3": {
    en: "Transfer possible",
    de: "Umlagerung möglich",
    es: "Transfer possible",
    fr: "Transfer possible",
    zh: "可否调拨",
  },
  "run.pump.3.stage.0.field.0": {
    en: "Equipment",
    de: "Anlage",
    es: "Equipment",
    fr: "Equipment",
    zh: "设备",
  },
  "run.pump.3.stage.0.field.1": {
    en: "OEM warranty",
    de: "Herstellergewährleistung",
    es: "OEM warranty",
    fr: "OEM warranty",
    zh: "原厂保修",
  },
  "run.pump.3.stage.0.field.2": {
    en: "Service contract",
    de: "Servicevertrag",
    es: "Service contract",
    fr: "Service contract",
    zh: "服务合约",
  },
  "run.pump.3.stage.0.field.3": {
    en: "Failure type",
    de: "Ausfallart",
    es: "Failure type",
    fr: "Failure type",
    zh: "失效类型",
  },
  "run.pump.3.stage.0.field.4": {
    en: "Claimable",
    de: "Anspruchsfähig",
    es: "Claimable",
    fr: "Claimable",
    zh: "可否索赔",
  },
  "run.pump.3.stage.0.field.5": {
    en: "Outcome",
    de: "Ergebnis",
    es: "Outcome",
    fr: "Outcome",
    zh: "处理结果",
  },
  "run.pump.4.stage.0.field.0": {
    en: "Contract price",
    de: "Vertragspreis",
    es: "Contract price",
    fr: "Contract price",
    zh: "合约价格",
  },
  "run.pump.4.stage.0.field.1": {
    en: "PR price",
    de: "Anforderungspreis",
    es: "PR price",
    fr: "PR price",
    zh: "申请价格",
  },
  "run.pump.4.stage.0.field.2": {
    en: "Agreement",
    de: "Vertrag",
    es: "Agreement",
    fr: "Agreement",
    zh: "协议",
  },
  "run.pump.4.stage.0.field.3": {
    en: "Payment terms",
    de: "Zahlungsbedingungen",
    es: "Payment terms",
    fr: "Payment terms",
    zh: "付款条件",
  },
  "run.pump.4.stage.0.field.4": {
    en: "Off-contract leakage",
    de: "Vertragsabfluss",
    es: "Off-contract leakage",
    fr: "Off-contract leakage",
    zh: "合约外流失",
  },

  /* ── The remaining stage labels, and the lines that carry figures ──── */
  "run.bearing.1.recommendation": {
    en: "Structured and coded to {0}, {1} EA at {2}, total {3}. Nothing is open — the part number, the quantity and the date were all given. Routed straight for the checks.",
    de: "Strukturiert und auf {0} kontiert, {1} ST zu {2}, gesamt {3}. Nichts ist offen — Teilenummer, Menge und Termin lagen alle vor. Direkt zur Prüfung weitergeleitet.",
    es: "Structured and coded to {0}, {1} EA at {2}, total {3}. Nothing is open — the part number, the quantity and the date were all given. Routed straight for the checks.",
    fr: "Structured and coded to {0}, {1} EA at {2}, total {3}. Nothing is open — the part number, the quantity and the date were all given. Routed straight for the checks.",
    zh: "已结构化并编码为 {0}，{1} 件、单价 {2}、合计 {3}。没有任何遗留 —— 零件号、数量、日期都给全了。直接转入后续校验。",
  },
  "run.bearing.4.recommendation": {
    en: "The price the plant asked for is the price we already hold — {0} an each, {1} of them, {2}. Nothing to source, nothing to quote, nothing to negotiate.",
    de: "Der vom Werk angefragte Preis ist der Preis, den wir bereits halten — {0} je Stück, {1} Stück, {2}. Nichts zu beschaffen, nichts anzufragen, nichts zu verhandeln.",
    es: "The price the plant asked for is the price we already hold — {0} an each, {1} of them, {2}. Nothing to source, nothing to quote, nothing to negotiate.",
    fr: "The price the plant asked for is the price we already hold — {0} an each, {1} of them, {2}. Nothing to source, nothing to quote, nothing to negotiate.",
    zh: "工厂申请的价格就是我们本来就持有的价格 —— 单价 {0}，共 {1} 件，合计 {2}。无需寻源，无需询价，无需议价。",
  },
  "run.bearing.5.recommendation": {
    en: "Released under the plant's own limit and ordered as {0}. This is the case nobody has to touch — and the reason the other requests get the attention instead.",
    de: "Innerhalb der werkseigenen Grenze freigegeben und als {0} bestellt. Dieser Fall braucht niemanden — und genau deshalb bekommen die anderen Anforderungen die Aufmerksamkeit.",
    es: "Released under the plant's own limit and ordered as {0}. This is the case nobody has to touch — and the reason the other requests get the attention instead.",
    fr: "Released under the plant's own limit and ordered as {0}. This is the case nobody has to touch — and the reason the other requests get the attention instead.",
    zh: "在工厂自身限额内放行，并以 {0} 下单。这是一件没人需要碰的事 —— 也正因如此，注意力可以留给其它申请。",
  },
  "run.bearing.6.recommendation": {
    en: "Contract, order, goods receipt and invoice agree to the cent. {0} cleared for the payment run on Net 30 — no variance, no hold, nobody asked to approve it.",
    de: "Vertrag, Bestellung, Wareneingang und Rechnung stimmen auf den Cent überein. {0} für den Zahllauf zu Netto 30 freigegeben — keine Abweichung, keine Sperre, niemand musste freigeben.",
    es: "Contract, order, goods receipt and invoice agree to the cent. {0} cleared for the payment run on Net 30 — no variance, no hold, nobody asked to approve it.",
    fr: "Contract, order, goods receipt and invoice agree to the cent. {0} cleared for the payment run on Net 30 — no variance, no hold, nobody asked to approve it.",
    zh: "合约、订单、收货、发票分毫不差。{0} 已按 Net 30 放入付款批次 —— 无差异、无扣款、无人需要审批。",
  },
  "run.off-catalogue.3.recommendation": {
    en: "Süddeutsche Dichtungswerke at {0} — from stock, shipping this week. It is {1} more than the cheapest quote and four days sooner, and four days of a stopped mixing line costs considerably more than {2}.",
    de: "Süddeutsche Dichtungswerke zu {0} — ab Lager, Versand diese Woche. Das sind {1} mehr als das günstigste Angebot, dafür vier Tage früher — und vier Tage stillstehende Mischlinie kosten erheblich mehr als {2}.",
    es: "Süddeutsche Dichtungswerke at {0} — from stock, shipping this week. It is {1} more than the cheapest quote and four days sooner, and four days of a stopped mixing line costs considerably more than {2}.",
    fr: "Süddeutsche Dichtungswerke at {0} — from stock, shipping this week. It is {1} more than the cheapest quote and four days sooner, and four days of a stopped mixing line costs considerably more than {2}.",
    zh: "Süddeutsche Dichtungswerke，{0} —— 现货，本周发运。比最便宜的报价高 {1}，但早四天到货；而搅拌线停四天的代价远高于 {2}。",
  },
  "run.off-catalogue.4.recommendation": {
    en: "{0} raised to Süddeutsche Dichtungswerke for {1}, with three competitive quotes on file behind the price. One signature releases it, and the confirmation goes out in German.",
    de: "{0} an Süddeutsche Dichtungswerke über {1} angelegt, mit drei Wettbewerbsangeboten als Preisnachweis. Eine Unterschrift gibt sie frei, die Bestätigung geht auf Deutsch hinaus.",
    es: "{0} raised to Süddeutsche Dichtungswerke for {1}, with three competitive quotes on file behind the price. One signature releases it, and the confirmation goes out in German.",
    fr: "{0} raised to Süddeutsche Dichtungswerke for {1}, with three competitive quotes on file behind the price. One signature releases it, and the confirmation goes out in German.",
    zh: "已向 Süddeutsche Dichtungswerke 开立 {0}，金额 {1}，价格背后有三份竞争性报价存档。一个签字即可放行，确认函以德语发出。",
  },
  "run.onboarding.1.recommendation": {
    en: "Two quotes in. The winning contractor at {0} is {1} below the alternative and is the only one that mobilises inside the shutdown. Recommended — but they are not a supplier of ours yet, so onboarding comes first.",
    de: "Zwei Angebote liegen vor. Der siegreiche Auftragnehmer liegt mit {0} um {1} unter der Alternative und ist der Einzige, der innerhalb des Stillstands mobilisieren kann. Empfohlen — er ist aber noch kein Lieferant von uns, also kommt zuerst die Anlage.",
    es: "Two quotes in. The winning contractor at {0} is {1} below the alternative and is the only one that mobilises inside the shutdown. Recommended — but they are not a supplier of ours yet, so onboarding comes first.",
    fr: "Two quotes in. The winning contractor at {0} is {1} below the alternative and is the only one that mobilises inside the shutdown. Recommended — but they are not a supplier of ours yet, so onboarding comes first.",
    zh: "两份报价到齐。中标承包商报价 {0}，比另一家低 {1}，而且是唯一能在停车窗口内进场的。推荐这家 —— 但他们还不是我们的供应商，所以要先走入驻。",
  },
  "run.onboarding.5.recommendation": {
    en: "Prepared, not created. One signature sets the contractor up as a supplier and releases the {0} order; the bank account is set separately, after a callback to the number on the company register rather than the one in the email.",
    de: "Vorbereitet, nicht angelegt. Eine Unterschrift legt den Auftragnehmer als Lieferanten an und gibt die Bestellung über {0} frei; die Bankverbindung wird separat gesetzt — nach einem Rückruf an die Nummer im Handelsregister, nicht an die aus der E-Mail.",
    es: "Prepared, not created. One signature sets the contractor up as a supplier and releases the {0} order; the bank account is set separately, after a callback to the number on the company register rather than the one in the email.",
    fr: "Prepared, not created. One signature sets the contractor up as a supplier and releases the {0} order; the bank account is set separately, after a callback to the number on the company register rather than the one in the email.",
    zh: "只是准备好，还没建档。一个签字就能把这家承包商建为供应商并放行 {0} 的订单；银行账户单独设置，且要回拨工商登记上的号码，而不是邮件里的号码。",
  },
  "run.bearing.1.stage.0.title": {
    en: "Item — what's needed",
    de: "Position — was gebraucht wird",
    es: "Item — what's needed",
    fr: "Item — what's needed",
    zh: "采购项 —— 需要什么",
  },
  "run.bearing.1.stage.1.title": {
    en: "Requisition header",
    de: "Anforderungskopf",
    es: "Requisition header",
    fr: "Requisition header",
    zh: "申请单抬头",
  },
  "run.bearing.1.stage.2.title": {
    en: "Account assignment",
    de: "Kontierung",
    es: "Account assignment",
    fr: "Account assignment",
    zh: "科目分配",
  },
  "run.bearing.2.stage.0.title": {
    en: "Material master · MM03",
    de: "Materialstamm · MM03",
    es: "Material master · MM03",
    fr: "Material master · MM03",
    zh: "物料主数据 · MM03",
  },
  "run.bearing.2.stage.1.title": {
    en: "Stock overview · MB52",
    de: "Bestandsübersicht · MB52",
    es: "Stock overview · MB52",
    fr: "Stock overview · MB52",
    zh: "库存总览 · MB52",
  },
  "run.bearing.3.stage.0.title": {
    en: "Warranty & coverage · IQS3",
    de: "Gewährleistung & Deckung · IQS3",
    es: "Warranty & coverage · IQS3",
    fr: "Warranty & coverage · IQS3",
    zh: "保修与承保 · IQS3",
  },
  "run.bearing.5.stage.0.title": {
    en: "Release routing · WF-48692-REL",
    de: "Freigabeweg · WF-48692-REL",
    es: "Release routing · WF-48692-REL",
    fr: "Release routing · WF-48692-REL",
    zh: "放行路由 · WF-48692-REL",
  },
  "run.bearing.6.stage.0.title": {
    en: "Four-way match — invoice vs PO",
    de: "Vierfachabgleich — Rechnung gegen Bestellung",
    es: "Four-way match — invoice vs PO",
    fr: "Four-way match — invoice vs PO",
    zh: "四单核对 —— 发票对订单",
  },
  "run.bearing.6.stage.1.title": {
    en: "Four-way match — adding the goods receipt",
    de: "Vierfachabgleich — Wareneingang ergänzt",
    es: "Four-way match — adding the goods receipt",
    fr: "Four-way match — adding the goods receipt",
    zh: "四单核对 —— 加入收货单",
  },
  "run.bearing.6.stage.2.title": {
    en: "Four-way match — adding the contract · verdict",
    de: "Vierfachabgleich — Vertrag ergänzt · Ergebnis",
    es: "Four-way match — adding the contract · verdict",
    fr: "Four-way match — adding the contract · verdict",
    zh: "四单核对 —— 加入合约 · 结论",
  },
  "run.off-catalogue.1.stage.0.title": {
    en: "Source of supply",
    de: "Bezugsquelle",
    es: "Source of supply",
    fr: "Source of supply",
    zh: "供货来源",
  },
  "run.onboarding.2.stage.0.title": {
    en: "The submission",
    de: "Die Einreichung",
    es: "The submission",
    fr: "The submission",
    zh: "提交的资料",
  },
  "run.onboarding.2.stage.1.title": {
    en: "Extracted fields",
    de: "Extrahierte Felder",
    es: "Extracted fields",
    fr: "Extracted fields",
    zh: "提取出的字段",
  },
  "run.onboarding.3.stage.0.title": {
    en: "Mandatory fields",
    de: "Pflichtfelder",
    es: "Mandatory fields",
    fr: "Mandatory fields",
    zh: "必填字段",
  },
  "run.onboarding.4.stage.0.title": {
    en: "Screening result",
    de: "Prüfergebnis",
    es: "Screening result",
    fr: "Screening result",
    zh: "筛查结果",
  },
  "run.onboarding.5.stage.0.title": {
    en: "Supplier master · prepared",
    de: "Lieferantenstamm · vorbereitet",
    es: "Supplier master · prepared",
    fr: "Supplier master · prepared",
    zh: "供应商主数据 · 已准备",
  },
  "run.onboarding.5.stage.1.title": {
    en: "Approval · WF-49010-VEN",
    de: "Freigabe · WF-49010-VEN",
    es: "Approval · WF-49010-VEN",
    fr: "Approval · WF-49010-VEN",
    zh: "审批 · WF-49010-VEN",
  },
  "run.bearing.1.stage.0.field.0": {
    en: "Material",
    de: "Material",
    es: "Material",
    fr: "Material",
    zh: "物料",
  },
  "run.bearing.1.stage.0.field.1": {
    en: "Description",
    de: "Bezeichnung",
    es: "Description",
    fr: "Description",
    zh: "描述",
  },
  "run.bearing.1.stage.0.field.2": {
    en: "Quantity",
    de: "Menge",
    es: "Quantity",
    fr: "Quantity",
    zh: "数量",
  },
  "run.bearing.1.stage.0.field.3": {
    en: "UoM",
    de: "Mengeneinheit",
    es: "UoM",
    fr: "UoM",
    zh: "计量单位",
  },
  "run.bearing.1.stage.0.field.4": {
    en: "Delivery date",
    de: "Liefertermin",
    es: "Delivery date",
    fr: "Delivery date",
    zh: "交货日期",
  },
  "run.bearing.1.stage.0.field.5": {
    en: "Requisitioner",
    de: "Anforderer",
    es: "Requisitioner",
    fr: "Requisitioner",
    zh: "申请人",
  },
  "run.bearing.1.stage.1.field.0": {
    en: "PR type",
    de: "Anforderungsart",
    es: "PR type",
    fr: "PR type",
    zh: "申请类型",
  },
  "run.bearing.1.stage.1.field.1": {
    en: "Requestor",
    de: "Antragsteller",
    es: "Requestor",
    fr: "Requestor",
    zh: "提出人",
  },
  "run.bearing.1.stage.1.field.2": {
    en: "Purch. org",
    de: "Einkaufsorganisation",
    es: "Purch. org",
    fr: "Purch. org",
    zh: "采购组织",
  },
  "run.bearing.1.stage.1.field.3": {
    en: "Purch. group",
    de: "Einkäufergruppe",
    es: "Purch. group",
    fr: "Purch. group",
    zh: "采购组",
  },
  "run.bearing.1.stage.2.field.0": {
    en: "Material code",
    de: "Materialcode",
    es: "Material code",
    fr: "Material code",
    zh: "物料编码",
  },
  "run.bearing.1.stage.2.field.1": {
    en: "Plant",
    de: "Werk",
    es: "Plant",
    fr: "Plant",
    zh: "工厂",
  },
  "run.bearing.1.stage.2.field.2": {
    en: "Cost center",
    de: "Kostenstelle",
    es: "Cost center",
    fr: "Cost center",
    zh: "成本中心",
  },
  "run.bearing.1.stage.2.field.3": {
    en: "G/L account",
    de: "Sachkonto",
    es: "G/L account",
    fr: "G/L account",
    zh: "总账科目",
  },
  "run.bearing.2.stage.0.field.0": {
    en: "Material",
    de: "Material",
    es: "Material",
    fr: "Material",
    zh: "物料",
  },
  "run.bearing.2.stage.0.field.1": {
    en: "Status",
    de: "Status",
    es: "Status",
    fr: "Status",
    zh: "状态",
  },
  "run.bearing.2.stage.0.field.2": {
    en: "Valuation class",
    de: "Bewertungsklasse",
    es: "Valuation class",
    fr: "Valuation class",
    zh: "评估类别",
  },
  "run.bearing.2.stage.0.field.3": {
    en: "Last purchase",
    de: "Letzter Einkauf",
    es: "Last purchase",
    fr: "Last purchase",
    zh: "最近一次采购",
  },
  "run.bearing.2.stage.1.field.0": {
    en: "Dispersion · Mixing Line 1",
    de: "Dispersion · Mischlinie 1",
    es: "Dispersion · Mixing Line 1",
    fr: "Dispersion · Mixing Line 1",
    zh: "分散体厂 · 搅拌 1 线",
  },
  "run.bearing.2.stage.1.field.1": {
    en: "Eastbrook",
    de: "Eastbrook",
    es: "Eastbrook",
    fr: "Eastbrook",
    zh: "Eastbrook",
  },
  "run.bearing.2.stage.1.field.2": {
    en: "Westport",
    de: "Westport",
    es: "Westport",
    fr: "Westport",
    zh: "Westport",
  },
  "run.bearing.2.stage.1.field.3": {
    en: "Verdict",
    de: "Ergebnis",
    es: "Verdict",
    fr: "Verdict",
    zh: "结论",
  },
  "run.bearing.3.stage.0.field.0": {
    en: "Parts warranty",
    de: "Teilegewährleistung",
    es: "Parts warranty",
    fr: "Parts warranty",
    zh: "零件保修",
  },
  "run.bearing.3.stage.0.field.1": {
    en: "Service contract",
    de: "Servicevertrag",
    es: "Service contract",
    fr: "Service contract",
    zh: "服务合约",
  },
  "run.bearing.3.stage.0.field.2": {
    en: "Outcome",
    de: "Ergebnis",
    es: "Outcome",
    fr: "Outcome",
    zh: "处理结果",
  },
  "run.bearing.4.stage.0.field.0": {
    en: "Supplier",
    de: "Lieferant",
    es: "Supplier",
    fr: "Supplier",
    zh: "供应商",
  },
  "run.bearing.4.stage.0.field.1": {
    en: "Price we hold",
    de: "Hinterlegter Preis",
    es: "Price we hold",
    fr: "Price we hold",
    zh: "我们持有的价格",
  },
  "run.bearing.4.stage.0.field.2": {
    en: "Price requested",
    de: "Angefragter Preis",
    es: "Price requested",
    fr: "Price requested",
    zh: "申请的价格",
  },
  "run.bearing.4.stage.0.field.3": {
    en: "Line value",
    de: "Positionswert",
    es: "Line value",
    fr: "Line value",
    zh: "行项金额",
  },
  "run.bearing.4.stage.0.field.4": {
    en: "Terms",
    de: "Konditionen",
    es: "Terms",
    fr: "Terms",
    zh: "条款",
  },
  "run.bearing.5.stage.0.field.0": {
    en: "Value",
    de: "Wert",
    es: "Value",
    fr: "Value",
    zh: "金额",
  },
  "run.bearing.5.stage.0.field.1": {
    en: "L1 · Plant Maintenance lead",
    de: "L1 · Leitung Werksinstandhaltung",
    es: "L1 · Plant Maintenance lead",
    fr: "L1 · Plant Maintenance lead",
    zh: "L1 · 工厂维修负责人",
  },
  "run.bearing.5.stage.0.field.2": {
    en: "Signature required",
    de: "Unterschrift erforderlich",
    es: "Signature required",
    fr: "Signature required",
    zh: "是否需要签字",
  },
  "run.bearing.5.stage.0.field.3": {
    en: "Outcome",
    de: "Ergebnis",
    es: "Outcome",
    fr: "Outcome",
    zh: "处理结果",
  },
  "run.bearing.5.stage.1.field.0": {
    en: "Supplier",
    de: "Lieferant",
    es: "Supplier",
    fr: "Supplier",
    zh: "供应商",
  },
  "run.bearing.5.stage.1.field.1": {
    en: "Quantity",
    de: "Menge",
    es: "Quantity",
    fr: "Quantity",
    zh: "数量",
  },
  "run.bearing.5.stage.1.field.2": {
    en: "Net value",
    de: "Nettowert",
    es: "Net value",
    fr: "Net value",
    zh: "净额",
  },
  "run.bearing.5.stage.1.field.3": {
    en: "Delivery",
    de: "Lieferung",
    es: "Delivery",
    fr: "Delivery",
    zh: "交付",
  },
  "run.off-catalogue.1.stage.0.field.0": {
    en: "Material",
    de: "Material",
    es: "Material",
    fr: "Material",
    zh: "物料",
  },
  "run.off-catalogue.1.stage.0.field.1": {
    en: "Outline agreement",
    de: "Rahmenvertrag",
    es: "Outline agreement",
    fr: "Outline agreement",
    zh: "框架协议",
  },
  "run.off-catalogue.1.stage.0.field.2": {
    en: "Source list",
    de: "Orderbuch",
    es: "Source list",
    fr: "Source list",
    zh: "货源清单",
  },
  "run.off-catalogue.1.stage.0.field.3": {
    en: "Last price paid",
    de: "Zuletzt gezahlter Preis",
    es: "Last price paid",
    fr: "Last price paid",
    zh: "上次成交价",
  },
  "run.off-catalogue.1.stage.0.field.4": {
    en: "Route",
    de: "Weg",
    es: "Route",
    fr: "Route",
    zh: "采购路径",
  },
  "run.onboarding.2.stage.0.field.0": {
    en: "Received",
    de: "Eingegangen",
    es: "Received",
    fr: "Received",
    zh: "收到时间",
  },
  "run.onboarding.2.stage.0.field.1": {
    en: "Written in",
    de: "Verfasst in",
    es: "Written in",
    fr: "Written in",
    zh: "撰写语言",
  },
  "run.onboarding.2.stage.0.field.2": {
    en: "Documents",
    de: "Dokumente",
    es: "Documents",
    fr: "Documents",
    zh: "文件",
  },
  "run.onboarding.2.stage.0.field.3": {
    en: "Tax ID stated",
    de: "Angegebene Steuernummer",
    es: "Tax ID stated",
    fr: "Tax ID stated",
    zh: "申报税号",
  },
  "run.onboarding.2.stage.1.field.0": {
    en: "Legal name",
    de: "Firmenname",
    es: "Legal name",
    fr: "Legal name",
    zh: "法定名称",
  },
  "run.onboarding.2.stage.1.field.1": {
    en: "Registered address",
    de: "Eingetragene Anschrift",
    es: "Registered address",
    fr: "Registered address",
    zh: "注册地址",
  },
  "run.onboarding.2.stage.1.field.2": {
    en: "Tax ID",
    de: "Steuernummer",
    es: "Tax ID",
    fr: "Tax ID",
    zh: "税号",
  },
  "run.onboarding.2.stage.1.field.3": {
    en: "Public liability",
    de: "Haftpflicht",
    es: "Public liability",
    fr: "Public liability",
    zh: "公众责任险",
  },
  "run.onboarding.3.stage.0.field.0": {
    en: "Legal name",
    de: "Firmenname",
    es: "Legal name",
    fr: "Legal name",
    zh: "法定名称",
  },
  "run.onboarding.3.stage.0.field.1": {
    en: "Registered address",
    de: "Eingetragene Anschrift",
    es: "Registered address",
    fr: "Registered address",
    zh: "注册地址",
  },
  "run.onboarding.3.stage.0.field.2": {
    en: "Tax identification",
    de: "Steuerliche Identifikation",
    es: "Tax identification",
    fr: "Tax identification",
    zh: "税务识别",
  },
  "run.onboarding.3.stage.0.field.3": {
    en: "Public liability cover",
    de: "Haftpflichtdeckung",
    es: "Public liability cover",
    fr: "Public liability cover",
    zh: "公众责任险承保额",
  },
  "run.onboarding.3.stage.0.field.4": {
    en: "Bank account",
    de: "Bankverbindung",
    es: "Bank account",
    fr: "Bank account",
    zh: "银行账户",
  },
  "run.onboarding.4.stage.0.field.0": {
    en: "Sanctions",
    de: "Sanktionen",
    es: "Sanctions",
    fr: "Sanctions",
    zh: "制裁名单",
  },
  "run.onboarding.4.stage.0.field.1": {
    en: "Adverse media",
    de: "Negativmedien",
    es: "Adverse media",
    fr: "Adverse media",
    zh: "负面媒体",
  },
  "run.onboarding.4.stage.0.field.2": {
    en: "Beneficial ownership",
    de: "Wirtschaftlich Berechtigte",
    es: "Beneficial ownership",
    fr: "Beneficial ownership",
    zh: "实际受益人",
  },
  "run.onboarding.4.stage.0.field.3": {
    en: "Insolvency",
    de: "Insolvenz",
    es: "Insolvency",
    fr: "Insolvency",
    zh: "破产记录",
  },
  "run.onboarding.4.stage.0.field.4": {
    en: "Insurance expiry",
    de: "Ablauf der Versicherung",
    es: "Insurance expiry",
    fr: "Insurance expiry",
    zh: "保险到期",
  },
  "run.onboarding.5.stage.0.field.0": {
    en: "Supplier",
    de: "Lieferant",
    es: "Supplier",
    fr: "Supplier",
    zh: "供应商",
  },
  "run.onboarding.5.stage.0.field.1": {
    en: "Number",
    de: "Nummer",
    es: "Number",
    fr: "Number",
    zh: "编号",
  },
  "run.onboarding.5.stage.0.field.2": {
    en: "Payment terms",
    de: "Zahlungsbedingungen",
    es: "Payment terms",
    fr: "Payment terms",
    zh: "付款条件",
  },
  "run.onboarding.5.stage.0.field.3": {
    en: "Bank account",
    de: "Bankverbindung",
    es: "Bank account",
    fr: "Bank account",
    zh: "银行账户",
  },
  "run.onboarding.5.stage.1.field.0": {
    en: "To sign",
    de: "Zu unterzeichnen",
    es: "To sign",
    fr: "To sign",
    zh: "待签",
  },
  "run.onboarding.5.stage.1.field.1": {
    en: "Compliance",
    de: "Compliance",
    es: "Compliance",
    fr: "Compliance",
    zh: "合规",
  },
  "run.onboarding.5.stage.1.field.2": {
    en: "Creates",
    de: "Erstellt",
    es: "Creates",
    fr: "Creates",
    zh: "将创建",
  },
  "run.onboarding.5.stage.1.field.3": {
    en: "Does not set",
    de: "Setzt nicht",
    es: "Does not set",
    fr: "Does not set",
    zh: "不会设置",
  },

  /* ── Reading the quotes that came back ─────────────────────────────── */
  "qr.quotesIn": {
    en: "Quotes in · {n} suppliers",
    de: "Angebote da · {n} Lieferanten",
    es: "Quotes in · {n} suppliers",
    fr: "Quotes in · {n} suppliers",
    zh: "报价已到 · {n} 家供应商",
  },
  "qr.compared": {
    en: "compared",
    de: "verglichen",
    es: "compared",
    fr: "compared",
    zh: "已比较",
  },
  "qr.comparing": {
    en: "comparing…",
    de: "vergleicht …",
    es: "comparing…",
    fr: "comparing…",
    zh: "比较中…",
  },
  "qr.readyToCompare": {
    en: "ready to compare",
    de: "bereit zum Vergleich",
    es: "ready to compare",
    fr: "ready to compare",
    zh: "可以开始比较",
  },
  "qr.noQuote": {
    en: "No quote",
    de: "Kein Angebot",
    es: "No quote",
    fr: "No quote",
    zh: "未报价",
  },
  "qr.emailReply": {
    en: "Email reply · quote",
    de: "Antwort per E-Mail · Angebot",
    es: "Email reply · quote",
    fr: "Email reply · quote",
    zh: "邮件回复 · 报价",
  },
  "qr.allIn": {
    en: "All-in",
    de: "Gesamt",
    es: "All-in",
    fr: "All-in",
    zh: "总账",
  },
  "qr.openEmail": {
    en: "Open email",
    de: "E-Mail öffnen",
    es: "Open email",
    fr: "Open email",
    zh: "打开邮件",
  },
  "qr.openQuote": {
    en: "Open email · quotation PDF",
    de: "E-Mail öffnen · Angebots-PDF",
    es: "Open email · quotation PDF",
    fr: "Open email · quotation PDF",
    zh: "打开邮件 · 报价单 PDF",
  },
  "qr.compare": {
    en: "Compare the quotes",
    de: "Angebote vergleichen",
    es: "Compare the quotes",
    fr: "Compare the quotes",
    zh: "比较这些报价",
  },
  "qr.weighing": {
    en: "Weighing price against lead time and what the downtime costs…",
    de: "Wäge Preis gegen Lieferzeit und Stillstandskosten ab …",
    es: "Weighing price against lead time and what the downtime costs…",
    fr: "Weighing price against lead time and what the downtime costs…",
    zh: "正在权衡价格、交期与停机代价…",
  },
  "qr.accept": {
    en: "Accept {vendor}",
    de: "{vendor} annehmen",
    es: "Accept {vendor}",
    fr: "Accept {vendor}",
    zh: "接受 {vendor}",
  },
  "phrase.Break applied": {
    en: "Break applied",
    de: "Angewandte Staffel",
    es: "Break applied",
    fr: "Break applied",
    zh: "适用阶梯",
  },
  "phrase.Settlement": {
    en: "Settlement",
    de: "Skonto",
    es: "Settlement",
    fr: "Settlement",
    zh: "账期折扣",
  },
  "phrase.Freight": {
    en: "Freight",
    de: "Fracht",
    es: "Freight",
    fr: "Freight",
    zh: "运费",
  },
  "phrase.Cancellation": {
    en: "Cancellation",
    de: "Stornierung",
    es: "Cancellation",
    fr: "Cancellation",
    zh: "取消条款",
  },
  "phrase.Late delivery": {
    en: "Late delivery",
    de: "Lieferverzug",
    es: "Late delivery",
    fr: "Late delivery",
    zh: "延误罚则",
  },
  "phrase.Quality & shelf life": {
    en: "Quality & shelf life",
    de: "Qualität & Haltbarkeit",
    es: "Quality & shelf life",
    fr: "Quality & shelf life",
    zh: "质量与保质期",
  },
  "phrase.Quote valid": {
    en: "Quote valid",
    de: "Angebot bindend",
    es: "Quote valid",
    fr: "Quote valid",
    zh: "报价有效期",
  },
  "phrase.None offered": {
    en: "None offered",
    de: "Nicht angeboten",
    es: "None offered",
    fr: "None offered",
    zh: "未提供",
  },
  "phrase.Included · DAP": {
    en: "Included · DAP",
    de: "Inklusive · DAP",
    es: "Included · DAP",
    fr: "Included · DAP",
    zh: "含运 · DAP",
  },
  "phrase.Locked once released": {
    en: "Locked once released",
    de: "Nach Freigabe fixiert",
    es: "Locked once released",
    fr: "Locked once released",
    zh: "排产后锁定",
  },
  "phrase.Cancellable up to dispatch": {
    en: "Cancellable up to dispatch",
    de: "Bis Versand stornierbar",
    es: "Cancellable up to dispatch",
    fr: "Cancellable up to dispatch",
    zh: "发货前可取消",
  },
  "phrase.No penalty": {
    en: "No penalty",
    de: "Keine Pönale",
    es: "No penalty",
    fr: "No penalty",
    zh: "无罚则",
  },
  "phrase.0.5% per week late, capped at 5%": {
    en: "0.5% per week late, capped at 5%",
    de: "0,5% je Verzugswoche, maximal 5%",
    es: "0.5% per week late, capped at 5%",
    fr: "0.5% per week late, capped at 5%",
    zh: "每周 0.5%，封顶 5%",
  },
  "phrase.CoA per batch · 12 months shelf life": {
    en: "CoA per batch · 12 months shelf life",
    de: "Analysenzertifikat je Charge · 12 Monate haltbar",
    es: "CoA per batch · 12 months shelf life",
    fr: "CoA per batch · 12 months shelf life",
    zh: "每批分析证书 · 保质期 12 个月",
  },
  "phrase.CoA per batch · 9 months shelf life": {
    en: "CoA per batch · 9 months shelf life",
    de: "Analysenzertifikat je Charge · 9 Monate haltbar",
    es: "CoA per batch · 9 months shelf life",
    fr: "CoA per batch · 9 months shelf life",
    zh: "每批分析证书 · 保质期 9 个月",
  },
  "phrase.CoA per batch · 18 months shelf life": {
    en: "CoA per batch · 18 months shelf life",
    de: "Analysenzertifikat je Charge · 18 Monate haltbar",
    es: "CoA per batch · 18 months shelf life",
    fr: "CoA per batch · 18 months shelf life",
    zh: "每批分析证书 · 保质期 18 个月",
  },
  "phrase.30 days": {
    en: "30 days",
    de: "30 Tage",
    es: "30 days",
    fr: "30 days",
    zh: "30 天",
  },
  "phrase.21 days": {
    en: "21 days",
    de: "21 Tage",
    es: "21 days",
    fr: "21 days",
    zh: "21 天",
  },
  "phrase.goods + freight − settlement": {
    en: "goods + freight − settlement",
    de: "Ware + Fracht − Skonto",
    es: "goods + freight − settlement",
    fr: "goods + freight − settlement",
    zh: "货款 + 运费 − 折扣",
  },
  "phrase.7 days lead": {
    en: "7 days lead",
    de: "7 Tage Lieferzeit",
    es: "7 days lead",
    fr: "7 days lead",
    zh: "交期 7 天",
  },
  "phrase.9 days lead": {
    en: "9 days lead",
    de: "9 Tage Lieferzeit",
    es: "9 days lead",
    fr: "9 days lead",
    zh: "交期 9 天",
  },
  "phrase.5 days lead": {
    en: "5 days lead",
    de: "5 Tage Lieferzeit",
    es: "5 days lead",
    fr: "5 days lead",
    zh: "交期 5 天",
  },
  "phrase.Declined": {
    en: "Declined",
    de: "Abgelehnt",
    es: "Declined",
    fr: "Declined",
    zh: "已婉拒",
  },
  "phrase.Distributor part load. No settlement discount, and no penalty if it slips.": {
    en: "Distributor part load. No settlement discount, and no penalty if it slips.",
    de: "Händler-Teilladung. Kein Skonto, und keine Pönale bei Verzug.",
    es: "Distributor part load. No settlement discount, and no penalty if it slips.",
    fr: "Distributor part load. No settlement discount, and no penalty if it slips.",
    zh: "经销商零担。无账期折扣，延误也没有罚则。",
  },
  "phrase.Cheapest a tonne — but ex works, non-cancellable, and a shorter shelf life.": {
    en: "Cheapest a tonne — but ex works, non-cancellable, and a shorter shelf life.",
    de: "Je Tonne am günstigsten — aber ab Werk, nicht stornierbar und kürzer haltbar.",
    es: "Cheapest a tonne — but ex works, non-cancellable, and a shorter shelf life.",
    fr: "Cheapest a tonne — but ex works, non-cancellable, and a shorter shelf life.",
    zh: "每吨最便宜 —— 但是出厂价、不可取消、保质期也更短。",
  },
  "phrase.Dearest a tonne, but delivered, cancellable, and it stands behind the date.": {
    en: "Dearest a tonne, but delivered, cancellable, and it stands behind the date.",
    de: "Je Tonne am teuersten, aber frei Haus, stornierbar — und sie stehen für den Termin ein.",
    es: "Dearest a tonne, but delivered, cancellable, and it stands behind the date.",
    fr: "Dearest a tonne, but delivered, cancellable, and it stands behind the date.",
    zh: "每吨最贵，但含运、可取消，而且他们为交期背书。",
  },
  "phrase.Titanium dioxide line fully booked this quarter — would requote for September.": {
    en: "Titanium dioxide line fully booked this quarter — would requote for September.",
    de: "Titandioxid-Linie in diesem Quartal ausgebucht — würde für September neu anbieten.",
    es: "Titanium dioxide line fully booked this quarter — would requote for September.",
    fr: "Titanium dioxide line fully booked this quarter — would requote for September.",
    zh: "钛白粉产线本季度排满 —— 可为九月重新报价。",
  },
  "phrase.Three quotes to compare — Hengtai has declined on capacity": {
    en: "Three quotes to compare — Hengtai has declined on capacity",
    de: "Drei Angebote zu vergleichen — Hengtai hat wegen Kapazität abgesagt",
    es: "Three quotes to compare — Hengtai has declined on capacity",
    fr: "Three quotes to compare — Hengtai has declined on capacity",
    zh: "三份报价可比 —— 恒泰因产能婉拒",
  },
  "phrase.The cheapest is also the only one that cannot be cancelled and offers no delivery penalty": {
    en: "The cheapest is also the only one that cannot be cancelled and offers no delivery penalty",
    de: "Das günstigste ist zugleich das einzige, das nicht stornierbar ist und keine Verzugspönale bietet",
    es: "The cheapest is also the only one that cannot be cancelled and offers no delivery penalty",
    fr: "The cheapest is also the only one that cannot be cancelled and offers no delivery penalty",
    zh: "最便宜的那家，恰好也是唯一不可取消、且不承担延误罚则的",
  },
  "phrase.On the tonne price they are within # of each other · # to # a tonne": {
    en: "On the tonne price they are within # of each other · # to # a tonne",
    de: "Beim Tonnenpreis liegen sie {0} auseinander · {1} bis {2} je Tonne",
    es: "On the tonne price they are within # of each other · # to # a tonne",
    fr: "On the tonne price they are within # of each other · # to # a tonne",
    zh: "按吨价它们只差 {0} · 从 {1} 到 {2} 每吨",
  },
  "phrase.At # t that is a # spread on the sticker — worth reading the clauses before believing it": {
    en: "At # t that is a # spread on the sticker — worth reading the clauses before believing it",
    de: "Bei {0} t sind das {1} Unterschied auf dem Papier — es lohnt, erst die Klauseln zu lesen",
    es: "At # t that is a # spread on the sticker — worth reading the clauses before believing it",
    fr: "At # t that is a # spread on the sticker — worth reading the clauses before believing it",
    zh: "{0} 吨算下来，账面差 {1} —— 先把条款读完再下结论",
  },
  "phrase.Nordwest is EXW, so # of haulage lands on us; the other two deliver carriage paid": {
    en: "Nordwest is EXW, so # of haulage lands on us; the other two deliver carriage paid",
    de: "Nordfarben liefert ab Werk, also fallen {0} Fracht bei uns an; die beiden anderen liefern frei Haus",
    es: "Nordwest is EXW, so # of haulage lands on us; the other two deliver carriage paid",
    fr: "Nordwest is EXW, so # of haulage lands on us; the other two deliver carriage paid",
    zh: "Nordfarben 是出厂价，{0} 的运费落在我们头上；另外两家含运送到厂",
  },
  "phrase.Settlement discounts differ — #% in # days against #% in #, and none at all from Rheinpigment": {
    en: "Settlement discounts differ — #% in # days against #% in #, and none at all from Rheinpigment",
    de: "Die Skonti unterscheiden sich — {0}% in {1} Tagen gegen {2}% in {3}, und von Rheinpigment gar keins",
    es: "Settlement discounts differ — #% in # days against #% in #, and none at all from Rheinpigment",
    fr: "Settlement discounts differ — #% in # days against #% in #, and none at all from Rheinpigment",
    zh: "账期折扣各不相同 —— {0}% / {1} 天 对 {2}% / {3} 天，而 Rheinpigment 完全没有",
  },
  "phrase.All-in the three land at #, # and # — a # spread, not #": {
    en: "All-in the three land at #, # and # — a # spread, not #",
    de: "Gesamt landen die drei bei {0}, {1} und {2} — {3} Unterschied, nicht {4}",
    es: "All-in the three land at #, # and # — a # spread, not #",
    fr: "All-in the three land at #, # and # — a # spread, not #",
    zh: "三家总账分别是 {0}、{1}、{2} —— 实际只差 {3}，不是 {4}",
  },
  "phrase.All three quote a # t break — we are ordering exactly # t, so the break is already in the price": {
    en: "All three quote a # t break — we are ordering exactly # t, so the break is already in the price",
    de: "Alle drei nennen eine Staffel ab {0} t — wir bestellen genau {1} t, die Staffel steckt also schon im Preis",
    es: "All three quote a # t break — we are ordering exactly # t, so the break is already in the price",
    fr: "All three quote a # t break — we are ordering exactly # t, so the break is already in the price",
    zh: "三家都给了 {0} 吨的阶梯价 —— 我们正好订 {1} 吨，阶梯已经算进价格里了",
  },
  "phrase.Süddeutsche Pigmentwerke — # / t, # all-in, # t ex stock": {
    en: "Süddeutsche Pigmentwerke — # / t, # all-in, # t ex stock",
    de: "Süddeutsche Pigmentwerke — {0} / t, {1} gesamt, {2} t ab Lager",
    es: "Süddeutsche Pigmentwerke — # / t, # all-in, # t ex stock",
    fr: "Süddeutsche Pigmentwerke — # / t, # all-in, # t ex stock",
    zh: "Süddeutsche Pigmentwerke —— {0} / 吨，总账 {1}，{2} 吨现货",
  },
  "phrase.They are the only one holding the full # t on the shelf, they deliver carriage paid, and they take #% off if we settle in # days. Cancellable up to dispatch and 0.5% per week late, capped at 5% if the date slips — for a line that is down, that is what we are buying.": {
    en: "They are the only one holding the full # t on the shelf, they deliver carriage paid, and they take #% off if we settle in # days. Cancellable up to dispatch and 0.5% per week late, capped at 5% if the date slips — for a line that is down, that is what we are buying.",
    de: "Nur sie haben die vollen {0} t am Lager, liefern frei Haus und geben {1}% Skonto bei Zahlung in {2} Tagen. Bis Versand stornierbar, und bei Verzug 0,5% je Woche, maximal 5% — bei stillstehender Linie ist genau das der Kaufgrund.",
    es: "They are the only one holding the full # t on the shelf, they deliver carriage paid, and they take #% off if we settle in # days. Cancellable up to dispatch and 0.5% per week late, capped at 5% if the date slips — for a line that is down, that is what we are buying.",
    fr: "They are the only one holding the full # t on the shelf, they deliver carriage paid, and they take #% off if we settle in # days. Cancellable up to dispatch and 0.5% per week late, capped at 5% if the date slips — for a line that is down, that is what we are buying.",
    zh: "只有他们手上有完整的 {0} 吨现货，含运送到厂，{2} 天内付款还给 {1}% 折扣。发货前可取消，延误按每周 0.5%、封顶 5% 赔付 —— 产线停着的时候，我们买的正是这些。",
  },
  "phrase.Nordwest looks # cheaper on the sticker, but ex works it adds # of haulage and lands at # — # apart, not #. For that we would take a nine-day wait, a batch we cannot cancel once the campaign is scheduled, no penalty if it slips, and three months less shelf life.": {
    en: "Nordwest looks # cheaper on the sticker, but ex works it adds # of haulage and lands at # — # apart, not #. For that we would take a nine-day wait, a batch we cannot cancel once the campaign is scheduled, no penalty if it slips, and three months less shelf life.",
    de: "Nordfarben sieht auf dem Papier {0} günstiger aus, ab Werk kommen aber {1} Fracht dazu und es landet bei {2} — {3} Unterschied, nicht {4}. Dafür nähmen wir neun Tage Wartezeit in Kauf, eine nach Einplanung nicht stornierbare Charge, keine Verzugspönale und drei Monate weniger Haltbarkeit.",
    es: "Nordwest looks # cheaper on the sticker, but ex works it adds # of haulage and lands at # — # apart, not #. For that we would take a nine-day wait, a batch we cannot cancel once the campaign is scheduled, no penalty if it slips, and three months less shelf life.",
    fr: "Nordwest looks # cheaper on the sticker, but ex works it adds # of haulage and lands at # — # apart, not #. For that we would take a nine-day wait, a batch we cannot cancel once the campaign is scheduled, no penalty if it slips, and three months less shelf life.",
    zh: "Nordfarben 账面看便宜 {0}，但出厂价要加 {1} 运费，总账是 {2} —— 实际只差 {3}，不是 {4}。为此我们要接受九天等待、排产后不可取消、延误无赔付，以及少三个月的保质期。",
  },
  "phrase.Mixing Line 2 is stopped, so every extra day is lost output": {
    en: "Mixing Line 2 is stopped, so every extra day is lost output",
    de: "Die Mischlinie steht, jeder zusätzliche Tag ist verlorene Produktion",
    es: "Mixing Line 2 is stopped, so every extra day is lost output",
    fr: "Mixing Line 2 is stopped, so every extra day is lost output",
    zh: "产线停着，每多等一天都是产量损失",
  },

  /* ── Step titles, as the rail shows them ───────────────────────────── */
  "run.pump.1.title": {
    en: "Structure & code the request",
    de: "Anforderung strukturieren & kontieren",
    es: "Structure & code the request",
    fr: "Structure & code the request",
    zh: "结构化并编码申请",
  },
  "run.pump.2.title": {
    en: "Master data, duplicate & inventory",
    de: "Stammdaten, Duplikat & Bestand",
    es: "Master data, duplicate & inventory",
    fr: "Master data, duplicate & inventory",
    zh: "主数据、重复与库存",
  },
  "run.pump.3.title": {
    en: "Warranty & coverage",
    de: "Gewährleistung & Deckung",
    es: "Warranty & coverage",
    fr: "Warranty & coverage",
    zh: "保修与承保",
  },
  "run.pump.4.title": {
    en: "Vendor & agreed price",
    de: "Lieferant & vereinbarter Preis",
    es: "Vendor & agreed price",
    fr: "Vendor & agreed price",
    zh: "供应商与约定价格",
  },
  "run.pump.5.title": {
    en: "Approval & routing",
    de: "Freigabe & Weiterleitung",
    es: "Approval & routing",
    fr: "Approval & routing",
    zh: "审批与路由",
  },
  "run.pump.6.title": {
    en: "Invoice four-way match",
    de: "Rechnung im Vierfachabgleich",
    es: "Invoice four-way match",
    fr: "Invoice four-way match",
    zh: "发票四单核对",
  },
  "run.bearing.1.title": {
    en: "Structure & code the request",
    de: "Anforderung strukturieren & kontieren",
    es: "Structure & code the request",
    fr: "Structure & code the request",
    zh: "结构化并编码申请",
  },
  "run.bearing.2.title": {
    en: "Master data, duplicate & inventory",
    de: "Stammdaten, Duplikat & Bestand",
    es: "Master data, duplicate & inventory",
    fr: "Master data, duplicate & inventory",
    zh: "主数据、重复与库存",
  },
  "run.bearing.3.title": {
    en: "Warranty & coverage",
    de: "Gewährleistung & Deckung",
    es: "Warranty & coverage",
    fr: "Warranty & coverage",
    zh: "保修与承保",
  },
  "run.bearing.4.title": {
    en: "Supplier & price",
    de: "Lieferant & Preis",
    es: "Supplier & price",
    fr: "Supplier & price",
    zh: "供应商与价格",
  },
  "run.bearing.5.title": {
    en: "Approval & routing",
    de: "Freigabe & Weiterleitung",
    es: "Approval & routing",
    fr: "Approval & routing",
    zh: "审批与路由",
  },
  "run.bearing.6.title": {
    en: "Invoice four-way match",
    de: "Rechnung im Vierfachabgleich",
    es: "Invoice four-way match",
    fr: "Invoice four-way match",
    zh: "发票四单核对",
  },
  "run.off-catalogue.1.title": {
    en: "Read it, and find nothing covering it",
    de: "Lesen — und nichts finden, was es abdeckt",
    es: "Read it, and find nothing covering it",
    fr: "Read it, and find nothing covering it",
    zh: "读懂它，并发现无物覆盖",
  },
  "run.off-catalogue.2.title": {
    en: "Go to market",
    de: "An den Markt gehen",
    es: "Go to market",
    fr: "Go to market",
    zh: "去市场询价",
  },
  "run.off-catalogue.3.title": {
    en: "Weigh what came back",
    de: "Abwägen, was zurückkam",
    es: "Weigh what came back",
    fr: "Weigh what came back",
    zh: "权衡收到的回复",
  },
  "run.off-catalogue.4.title": {
    en: "Raise the order",
    de: "Bestellung anlegen",
    es: "Raise the order",
    fr: "Raise the order",
    zh: "开立订单",
  },
  "run.onboarding.1.title": {
    en: "Find suppliers & get quotes",
    de: "Lieferanten finden & Angebote einholen",
    es: "Find suppliers & get quotes",
    fr: "Find suppliers & get quotes",
    zh: "寻找供应商并取得报价",
  },
  "run.onboarding.2.title": {
    en: "Read the submitted documents",
    de: "Eingereichte Unterlagen lesen",
    es: "Read the submitted documents",
    fr: "Read the submitted documents",
    zh: "读取提交的文件",
  },
  "run.onboarding.3.title": {
    en: "Check nothing is missing",
    de: "Prüfen, dass nichts fehlt",
    es: "Check nothing is missing",
    fr: "Check nothing is missing",
    zh: "检查有无缺项",
  },
  "run.onboarding.4.title": {
    en: "Compliance & risk screening",
    de: "Compliance- und Risikoprüfung",
    es: "Compliance & risk screening",
    fr: "Compliance & risk screening",
    zh: "合规与风险筛查",
  },
  "run.onboarding.5.title": {
    en: "Prepare the supplier record",
    de: "Lieferantensatz vorbereiten",
    es: "Prepare the supplier record",
    fr: "Prepare the supplier record",
    zh: "准备供应商档案",
  },

  /* ── Seeing past the single order ──────────────────────────────────── */
  "insight.adoption": {
    en: "Catalogue adoption · this category",
    de: "Katalognutzung · diese Kategorie",
    es: "Is this even coming through the catalogue?",
    fr: "Is this even coming through the catalogue?",
    zh: "本品类的目录采用率",
  },
  "insight.throughCatalogue": {
    en: "Current adoption",
    de: "Aktuelle Nutzung",
    es: "Through the catalogue",
    fr: "Through the catalogue",
    zh: "当前采用率",
  },
  "insight.target": {
    en: "Target",
    de: "Ziel",
    es: "Target",
    fr: "Target",
    zh: "目标",
  },
  "insight.worthMoving": {
    en: "Addressable value",
    de: "Erschließbarer Wert",
    es: "Worth moving",
    fr: "Worth moving",
    zh: "可争取金额",
  },
  "insight.requestsFound": {
    en: "Off-catalogue requests",
    de: "Anfragen außerhalb des Katalogs",
    es: "Requests found",
    fr: "Requests found",
    zh: "目录外需求",
  },
  "insight.whoElse": {
    en: "Network consumption by site",
    de: "Netzwerkverbrauch nach Standort",
    es: "Who else consumes it",
    fr: "Who else consumes it",
    zh: "各厂消耗分布",
  },
  "insight.priceBreaks": {
    en: "Price break position",
    de: "Position in der Preisstaffel",
    es: "Are we buying at the right break?",
    fr: "Are we buying at the right break?",
    zh: "所处价格档位",
  },
  "insight.perUnit": {
    en: "per unit",
    de: "je Stück",
    es: "per unit",
    fr: "per unit",
    zh: "每件",
  },
  "insight.atOurVolume": {
    en: "Annual volume analysis",
    de: "Jahresmengenanalyse",
    es: "At our own volume",
    fr: "At our own volume",
    zh: "年度用量测算",
  },
  "insight.oneOrThree": {
    en: "Order consolidation analysis",
    de: "Analyse der Bestellkonsolidierung",
    es: "One order, or three?",
    fr: "One order, or three?",
    zh: "订单合并分析",
  },

  /* ── The catalogue buy ─────────────────────────────────────────────── */
  "run.catalogue.1.agentName": {
    en: "PR Processing agent",
    de: "Anforderungsbearbeitung",
    es: "PR Processing agent",
    fr: "PR Processing agent",
    zh: "申请处理智能体",
  },
  "run.catalogue.1.title": {
    en: "Structure & code the request",
    de: "Anforderung strukturieren & kontieren",
    es: "Structure & code the request",
    fr: "Structure & code the request",
    zh: "结构化并编码申请",
  },
  "run.catalogue.1.aiThought": {
    en: "A quarterly filter change has come in from Let-down Line 1 — 400 bags, and the engineer gave the material number outright. This should code straight onto the catalogue. What interests me more is that it arrived as an email at all.",
    de: "Ein Quartals-Filterwechsel von Let-down-Linie 1 ist eingegangen — 400 Beutel, und der Ingenieur hat die Materialnummer direkt genannt. Das sollte unmittelbar auf den Katalog kontieren. Interessanter finde ich, dass es überhaupt als E-Mail kam.",
    es: "A quarterly filter change has come in from Let-down Line 1 — 400 bags, and the engineer gave the material number outright. This should code straight onto the catalogue. What interests me more is that it arrived as an email at all.",
    fr: "A quarterly filter change has come in from Let-down Line 1 — 400 bags, and the engineer gave the material number outright. This should code straight onto the catalogue. What interests me more is that it arrived as an email at all.",
    zh: "稀释 1 线来了一张季度换滤申请 —— 400 个滤袋，工程师直接给了物料号，应该能直接编到目录上。更值得注意的是：它居然是以邮件形式进来的。",
  },
  "run.catalogue.1.reasoning.0": {
    en: "Reading the process engineer's note from Let-down Line 1",
    de: "Lese die Notiz des Verfahrensingenieurs von Let-down-Linie 1",
    es: "Reading the process engineer's note from Let-down Line 1",
    fr: "Reading the process engineer's note from Let-down Line 1",
    zh: "读取稀释 1 线工艺工程师的说明",
  },
  "run.catalogue.1.reasoning.1": {
    en: "Matching it to the catalogue item on the material master",
    de: "Ordne es dem Katalogartikel im Materialstamm zu",
    es: "Matching it to the catalogue item on the material master",
    fr: "Matching it to the catalogue item on the material master",
    zh: "在物料主数据中匹配到对应的目录条目",
  },
  "run.catalogue.1.reasoning.2": {
    en: "Coding cost centre 10034 · GL 600420",
    de: "Kontiere Kostenstelle 10034 · Sachkonto 600420",
    es: "Coding cost centre 10034 · GL 600420",
    fr: "Coding cost centre 10034 · GL 600420",
    zh: "编入成本中心 10034 · 总账 600420",
  },
  "run.catalogue.1.reasoning.3": {
    en: "Checking how this category's demand usually reaches us",
    de: "Prüfe, wie die Nachfrage dieser Kategorie sonst zu uns kommt",
    es: "Checking how this category's demand usually reaches us",
    fr: "Checking how this category's demand usually reaches us",
    zh: "查看这个品类的需求平时是怎么到我们这里的",
  },
  "run.catalogue.1.recommendation": {
    en: "Coded to MRO-FILT-BAG-25UM-PP at 400 EA, $8,960.00 — a clean catalogue match. It came in as free text, though, and it did not have to: this item has been on the catalogue for five years.",
    de: "Auf MRO-FILT-BAG-25UM-PP kontiert, 400 ST, $8.960,00 — ein sauberer Katalogtreffer. Es kam allerdings als Freitext, und das hätte nicht sein müssen: Der Artikel steht seit fünf Jahren im Katalog.",
    es: "Coded to MRO-FILT-BAG-25UM-PP at 400 EA, $8,960.00 — a clean catalogue match. It came in as free text, though, and it did not have to: this item has been on the catalogue for five years.",
    fr: "Coded to MRO-FILT-BAG-25UM-PP at 400 EA, $8,960.00 — a clean catalogue match. It came in as free text, though, and it did not have to: this item has been on the catalogue for five years.",
    zh: "已编码为 MRO-FILT-BAG-25UM-PP，400 件，$8,960.00 —— 干净的目录匹配。但它是以自由文本进来的，本不必如此：这个料在目录里已经五年了。",
  },
  "run.catalogue.2.agentName": {
    en: "Master Data agent",
    de: "Stammdaten-Agent",
    es: "Master Data agent",
    fr: "Master Data agent",
    zh: "主数据智能体",
  },
  "run.catalogue.2.title": {
    en: "Master data, duplicate & inventory",
    de: "Stammdaten, Duplikat & Bestand",
    es: "Master data, duplicate & inventory",
    fr: "Master data, duplicate & inventory",
    zh: "主数据、重复与库存",
  },
  "run.catalogue.2.aiThought": {
    en: "Three questions before anyone buys: is the material real, has someone already asked for it, and do we already hold it. Then a fourth this one deserves — who else in the network buys the same bag.",
    de: "Drei Fragen vor jedem Kauf: Gibt es das Material, hat es schon jemand angefordert, halten wir es bereits. Und eine vierte, die dieser Fall verdient — wer im Netzwerk kauft denselben Beutel.",
    es: "Three questions before anyone buys: is the material real, has someone already asked for it, and do we already hold it. Then a fourth this one deserves — who else in the network buys the same bag.",
    fr: "Three questions before anyone buys: is the material real, has someone already asked for it, and do we already hold it. Then a fourth this one deserves — who else in the network buys the same bag.",
    zh: "买之前先问三件事：物料是否真实存在、是否已有人申请、我们是否已经持有。再加第四个问题：全网还有谁在买同一种滤袋。",
  },
  "run.catalogue.2.reasoning.0": {
    en: "Confirming the catalogue item on the material master",
    de: "Bestätige den Katalogartikel im Materialstamm",
    es: "Confirming the catalogue item on the material master",
    fr: "Confirming the catalogue item on the material master",
    zh: "确认物料主数据中的目录条目",
  },
  "run.catalogue.2.reasoning.1": {
    en: "Scanning open requisitions for a duplicate — none found",
    de: "Durchsuche offene Anforderungen auf Duplikate — keine gefunden",
    es: "Scanning open requisitions for a duplicate — none found",
    fr: "Scanning open requisitions for a duplicate — none found",
    zh: "扫描在途申请是否重复 —— 未发现",
  },
  "run.catalogue.2.reasoning.2": {
    en: "Reading stock at every plant — small buffers, none can cover a change",
    de: "Lese den Bestand jedes Werks — kleine Puffer, keiner deckt einen Wechsel",
    es: "Reading stock at every plant — small buffers, none can cover a change",
    fr: "Reading stock at every plant — small buffers, none can cover a change",
    zh: "读取各厂库存 —— 都是小额缓冲，没有一家够一次换滤",
  },
  "run.catalogue.2.reasoning.3": {
    en: "Pulling twelve months of consumption across the network",
    de: "Ziehe zwölf Monate Verbrauch über das gesamte Netzwerk",
    es: "Pulling twelve months of consumption across the network",
    fr: "Pulling twelve months of consumption across the network",
    zh: "拉取全网十二个月的消耗数据",
  },
  "run.catalogue.2.recommendation": {
    en: "The item is real, no duplicate is open, and no plant holds enough to cover a change. The buy is justified — and the consumption history says four sites are buying the same bag separately.",
    de: "Der Artikel existiert, kein Duplikat ist offen, und kein Werk hält genug für einen Wechsel. Der Kauf ist begründet — und die Verbrauchshistorie zeigt: vier Standorte kaufen denselben Beutel getrennt.",
    es: "The item is real, no duplicate is open, and no plant holds enough to cover a change. The buy is justified — and the consumption history says four sites are buying the same bag separately.",
    fr: "The item is real, no duplicate is open, and no plant holds enough to cover a change. The buy is justified — and the consumption history says four sites are buying the same bag separately.",
    zh: "物料存在、没有重复申请、也没有哪个厂的库存够一次换滤。这笔采购成立 —— 而消耗历史显示：四个厂在各买各的同一种袋。",
  },
  "run.catalogue.3.agentName": {
    en: "Sourcing & contract agent",
    de: "Beschaffung & Vertrag",
    es: "Sourcing & contract agent",
    fr: "Sourcing & contract agent",
    zh: "寻源与合约智能体",
  },
  "run.catalogue.3.title": {
    en: "Supplier & price break",
    de: "Lieferant & Preisstaffel",
    es: "Supplier & price break",
    fr: "Supplier & price break",
    zh: "供应商与价格档",
  },
  "run.catalogue.3.aiThought": {
    en: "We are on agreement with Apex for this bag, so the supplier is settled. The price is not quite settled: the agreement publishes four breaks, and where we land depends entirely on how much we put on one order.",
    de: "Für diesen Beutel besteht ein Vertrag mit Apex, der Lieferant ist also geklärt. Der Preis nicht ganz: Der Vertrag veröffentlicht vier Staffeln, und wo wir landen, hängt allein davon ab, wie viel auf eine Bestellung geht.",
    es: "We are on agreement with Apex for this bag, so the supplier is settled. The price is not quite settled: the agreement publishes four breaks, and where we land depends entirely on how much we put on one order.",
    fr: "We are on agreement with Apex for this bag, so the supplier is settled. The price is not quite settled: the agreement publishes four breaks, and where we land depends entirely on how much we put on one order.",
    zh: "这个袋我们和 Apex 有协议，供应商没有疑问。价格却还没定：协议公布了四个档位，落在哪一档完全取决于我们把多少放进一张订单。",
  },
  "run.catalogue.3.reasoning.0": {
    en: "Confirming Apex is approved and on agreement SA-MRO-07",
    de: "Bestätige, dass Apex zugelassen und im Vertrag SA-MRO-07 ist",
    es: "Confirming Apex is approved and on agreement SA-MRO-07",
    fr: "Confirming Apex is approved and on agreement SA-MRO-07",
    zh: "确认 Apex 已核准且在协议 SA-MRO-07 上",
  },
  "run.catalogue.3.reasoning.1": {
    en: "Reading the published breaks — four of them, $24.80 down to $18.10",
    de: "Lese die veröffentlichten Staffeln — vier Stück, von $24,80 bis $18,10",
    es: "Reading the published breaks — four of them, $24.80 down to $18.10",
    fr: "Reading the published breaks — four of them, $24.80 down to $18.10",
    zh: "读取公布的阶梯价 —— 四档，从 $24.80 到 $18.10",
  },
  "run.catalogue.3.reasoning.2": {
    en: "This order of 400 EA prices at $22.40 — correct for its size",
    de: "Diese Bestellung über 400 ST kostet $22,40 — für ihre Größe korrekt",
    es: "This order of 400 EA prices at $22.40 — correct for its size",
    fr: "This order of 400 EA prices at $22.40 — correct for its size",
    zh: "本单 400 件的价格是 $22.40 —— 按这个量是对的",
  },
  "run.catalogue.3.reasoning.3": {
    en: "Putting the network's annual volume against the same table",
    de: "Halte die Jahresmenge des Netzwerks gegen dieselbe Tabelle",
    es: "Putting the network's annual volume against the same table",
    fr: "Putting the network's annual volume against the same table",
    zh: "把全网年用量放到同一张表上比",
  },
  "run.catalogue.3.recommendation": {
    en: "Priced correctly at $22.40 / EA for a 400 EA order. Correct is not the same as best — at the volume this network already consumes, the agreement's own price list has two cheaper rows in it.",
    de: "Korrekt kalkuliert mit $22,40 je Stück für eine Bestellung über 400 ST. Korrekt ist nicht dasselbe wie bestmöglich — bei der Menge, die dieses Netzwerk ohnehin verbraucht, hat die Preisliste des Vertrags zwei günstigere Zeilen.",
    es: "Priced correctly at $22.40 / EA for a 400 EA order. Correct is not the same as best — at the volume this network already consumes, the agreement's own price list has two cheaper rows in it.",
    fr: "Priced correctly at $22.40 / EA for a 400 EA order. Correct is not the same as best — at the volume this network already consumes, the agreement's own price list has two cheaper rows in it.",
    zh: "按 400 件的量，$22.40 单价是对的。但「对」不等于「最好」—— 以这个网络本来就在消耗的量来看，协议自己的价目表上还有两行更便宜的。",
  },
  "run.catalogue.4.agentName": {
    en: "Approval & routing agent",
    de: "Freigabe & Weiterleitung",
    es: "Approval & routing agent",
    fr: "Approval & routing agent",
    zh: "审批与路由智能体",
  },
  "run.catalogue.4.title": {
    en: "Approval, routing & how to place it",
    de: "Freigabe, Weiterleitung & wie bestellt wird",
    es: "Approval, routing & how to place it",
    fr: "Approval, routing & how to place it",
    zh: "审批、路由与如何下单",
  },
  "run.catalogue.4.aiThought": {
    en: "Every rule passes and nothing needs a signature, so this would normally just go. Before it does — the Resin Plant and the Coatings Works both have live requests for the same bag this week.",
    de: "Alle Regeln sind erfüllt, nichts braucht eine Unterschrift, das würde also normalerweise einfach rausgehen. Vorher aber: Harzanlage und Lackwerk haben diese Woche beide offene Anforderungen für denselben Beutel.",
    es: "Every rule passes and nothing needs a signature, so this would normally just go. Before it does — the Resin Plant and the Coatings Works both have live requests for the same bag this week.",
    fr: "Every rule passes and nothing needs a signature, so this would normally just go. Before it does — the Resin Plant and the Coatings Works both have live requests for the same bag this week.",
    zh: "所有规则都通过，也不需要任何签字，按理这单就直接出去了。出去之前 —— 树脂厂和涂料厂这周都有同一种袋的在途申请。",
  },
  "run.catalogue.4.reasoning.0": {
    en: "Confirming cost centre 10034 / GL 600420",
    de: "Bestätige Kostenstelle 10034 / Sachkonto 600420",
    es: "Confirming cost centre 10034 / GL 600420",
    fr: "Confirming cost centre 10034 / GL 600420",
    zh: "确认成本中心 10034 / 总账 600420",
  },
  "run.catalogue.4.reasoning.1": {
    en: "On agreement — competitive bidding not required",
    de: "Auf Vertrag — kein Wettbewerbsverfahren erforderlich",
    es: "On agreement — competitive bidding not required",
    fr: "On agreement — competitive bidding not required",
    zh: "协议内采购 —— 无需竞争性报价",
  },
  "run.catalogue.4.reasoning.2": {
    en: "$8,960.00 is inside the plant-maintenance limit",
    de: "$8.960,00 liegt innerhalb der Grenze der Werksinstandhaltung",
    es: "$8,960.00 is inside the plant-maintenance limit",
    fr: "$8,960.00 is inside the plant-maintenance limit",
    zh: "$8,960.00 在工厂维修限额之内",
  },
  "run.catalogue.4.reasoning.3": {
    en: "Finding two more live requests for the same bag this week",
    de: "Finde zwei weitere offene Anforderungen für denselben Beutel diese Woche",
    es: "Finding two more live requests for the same bag this week",
    fr: "Finding two more live requests for the same bag this week",
    zh: "发现本周还有两张同款袋的在途申请",
  },
  "run.catalogue.4.reasoning.4": {
    en: "Costing them as three orders, and as one",
    de: "Kalkuliere sie als drei Bestellungen und als eine",
    es: "Costing them as three orders, and as one",
    fr: "Costing them as three orders, and as one",
    zh: "分别按三张单和一张单算成本",
  },
  "run.catalogue.4.recommendation": {
    en: "Released under the plant's own limit. The one thing worth deciding is not whether to buy, but how to place it — three plants want the same bag this week, and one order crosses a price break that three separate orders never reach.",
    de: "Innerhalb der werkseigenen Grenze freigegeben. Zu entscheiden ist nicht, ob gekauft wird, sondern wie bestellt wird — drei Werke wollen diese Woche denselben Beutel, und eine Bestellung erreicht eine Staffel, die drei getrennte nie erreichen.",
    es: "Released under the plant's own limit. The one thing worth deciding is not whether to buy, but how to place it — three plants want the same bag this week, and one order crosses a price break that three separate orders never reach.",
    fr: "Released under the plant's own limit. The one thing worth deciding is not whether to buy, but how to place it — three plants want the same bag this week, and one order crosses a price break that three separate orders never reach.",
    zh: "已在工厂自身限额内放行。要决定的不是买不买，而是怎么下 —— 三个厂这周要同一种袋，合成一张单能跨进一个档位，分成三张永远够不着。",
  },
  "phrase.Filtration consumables": {
    en: "Filtration consumables",
    de: "Filtrationsverbrauchsmaterial",
    es: "Filtration consumables",
    fr: "Filtration consumables",
    zh: "过滤耗材",
  },
  "phrase.This request is one of the 36% that arrives as free text for an item already on the catalogue. Coding it moved the needle; 312 more like it are sitting in the last twelve months of intake.": {
    en: "This request is one of the 36% that arrives as free text for an item already on the catalogue. Coding it moved the needle; 312 more like it are sitting in the last twelve months of intake.",
    de: "Diese Anforderung gehört zu den 36%, die als Freitext für einen bereits im Katalog gelisteten Artikel eingehen. Das Kontieren hat den Wert bewegt; 312 weitere dieser Art liegen in den letzten zwölf Monaten Eingang.",
    es: "This request is one of the 36% that arrives as free text for an item already on the catalogue. Coding it moved the needle; 312 more like it are sitting in the last twelve months of intake.",
    fr: "This request is one of the 36% that arrives as free text for an item already on the catalogue. Coding it moved the needle; 312 more like it are sitting in the last twelve months of intake.",
    zh: "这条需求属于那 36% —— 明明目录里已经有的料，却以自由文本进来。刚才编码这一下就让指标动了；过去十二个月的来件里还躺着 312 条同类。",
  },
  "phrase.4,000 EA a year across the network": {
    en: "4,000 EA a year across the network",
    de: "4.000 ST pro Jahr im gesamten Netzwerk",
    es: "4,000 EA a year across the network",
    fr: "4,000 EA a year across the network",
    zh: "全网每年 4,000 件",
  },
  "phrase.Northgate · Dispersion Plant": {
    en: "Northgate · Dispersion Plant",
    de: "Northgate · Dispersionsanlage",
    es: "Northgate · Dispersion Plant",
    fr: "Northgate · Dispersion Plant",
    zh: "Northgate · 分散体厂",
  },
  "phrase.Northgate · Resin Plant": {
    en: "Northgate · Resin Plant",
    de: "Northgate · Harzanlage",
    es: "Northgate · Resin Plant",
    fr: "Northgate · Resin Plant",
    zh: "Northgate · 树脂厂",
  },
  "phrase.Lianhe · Coatings Works": {
    en: "Lianhe · Coatings Works",
    de: "Lianhe · Lackwerk",
    es: "Lianhe · Coatings Works",
    fr: "Lianhe · Coatings Works",
    zh: "联合 · 涂料厂",
  },
  "phrase.Westport · Filling & Packaging": {
    en: "Westport · Filling & Packaging",
    de: "Westport · Abfüllung & Verpackung",
    es: "Westport · Filling & Packaging",
    fr: "Westport · Filling & Packaging",
    zh: "Westport · 灌装与包装",
  },
  "phrase.Four sites, one bag, four separate buying patterns. Each orders a quarter at a time, so each is priced as a small buyer — even though together they are not one.": {
    en: "Four sites, one bag, four separate buying patterns. Each orders a quarter at a time, so each is priced as a small buyer — even though together they are not one.",
    de: "Vier Standorte, ein Beutel, vier getrennte Einkaufsmuster. Jeder bestellt quartalsweise und wird deshalb wie ein Kleinabnehmer bepreist — obwohl sie zusammen keiner sind.",
    es: "Four sites, one bag, four separate buying patterns. Each orders a quarter at a time, so each is priced as a small buyer — even though together they are not one.",
    fr: "Four sites, one bag, four separate buying patterns. Each orders a quarter at a time, so each is priced as a small buyer — even though together they are not one.",
    zh: "四个厂、一种袋、四套各买各的。每家一次只订一个季度的量，于是每家都被当小买家定价 —— 可它们加起来并不小。",
  },
  "phrase.Where Westport and Lianhe order today": {
    en: "Where Westport and Lianhe order today",
    de: "Wo Westport und Lianhe heute bestellen",
    es: "Where Westport and Lianhe order today",
    fr: "Where Westport and Lianhe order today",
    zh: "Westport 和联合现在就订在这一档",
  },
  "phrase.This order · 400 EA": {
    en: "This order · 400 EA",
    de: "Diese Bestellung · 400 ST",
    es: "This order · 400 EA",
    fr: "This order · 400 EA",
    zh: "本单 · 400 件",
  },
  "phrase.One order for the three live requests": {
    en: "One order for the three live requests",
    de: "Eine Bestellung für die drei offenen Anforderungen",
    es: "One order for the three live requests",
    fr: "One order for the three live requests",
    zh: "三张在途申请合成一张单",
  },
  "phrase.A year of network demand in one call-off": {
    en: "A year of network demand in one call-off",
    de: "Ein Jahr Netzwerkbedarf in einem Abruf",
    es: "A year of network demand in one call-off",
    fr: "A year of network demand in one call-off",
    zh: "全网一年的量做成一次框架call-off",
  },
  "phrase.Network volume, last twelve months": {
    en: "Network volume, last twelve months",
    de: "Netzwerkmenge, letzte zwölf Monate",
    es: "Network volume, last twelve months",
    fr: "Network volume, last twelve months",
    zh: "全网用量（近十二个月）",
  },
  "phrase.What it cost, bought site by site": {
    en: "What it cost, bought site by site",
    de: "Was es kostete, Standort für Standort gekauft",
    es: "What it cost, bought site by site",
    fr: "What it cost, bought site by site",
    zh: "各厂分别采购的实际花费",
  },
  "phrase.The same volume on one annual call-off": {
    en: "The same volume on one annual call-off",
    de: "Dieselbe Menge in einem Jahresabruf",
    es: "The same volume on one annual call-off",
    fr: "The same volume on one annual call-off",
    zh: "同样的量做成一次年度框架",
  },
  "phrase.Difference": {
    en: "Difference",
    de: "Differenz",
    es: "Difference",
    fr: "Difference",
    zh: "差额",
  },
  "phrase.Nobody is paying the wrong price — every site is paying the right price for the order it placed. The money is in the size of the orders, not the rate.": {
    en: "Nobody is paying the wrong price — every site is paying the right price for the order it placed. The money is in the size of the orders, not the rate.",
    de: "Niemand zahlt den falschen Preis — jeder Standort zahlt den richtigen Preis für die Bestellung, die er aufgegeben hat. Das Geld steckt in der Bestellgröße, nicht im Satz.",
    es: "Nobody is paying the wrong price — every site is paying the right price for the order it placed. The money is in the size of the orders, not the rate.",
    fr: "Nobody is paying the wrong price — every site is paying the right price for the order it placed. The money is in the size of the orders, not the rate.",
    zh: "没有人买错价 —— 每个厂都按自己下的单量付了正确的价。钱不在费率上，在订单的大小上。",
  },
  "phrase.Three orders, as requested": {
    en: "Three orders, as requested",
    de: "Drei Bestellungen, wie angefordert",
    es: "Three orders, as requested",
    fr: "Three orders, as requested",
    zh: "按申请开三张单",
  },
  "phrase.Dispersion 400 · Resin 380 · Coatings 260": {
    en: "Dispersion 400 · Resin 380 · Coatings 260",
    de: "Dispersion 400 · Harz 380 · Lack 260",
    es: "Dispersion 400 · Resin 380 · Coatings 260",
    fr: "Dispersion 400 · Resin 380 · Coatings 260",
    zh: "分散体 400 · 树脂 380 · 涂料 260",
  },
  "phrase.Each priced at the 250–999 EA break": {
    en: "Each priced at the 250–999 EA break",
    de: "Jede zur Staffel 250–999 ST bepreist",
    es: "Each priced at the 250–999 EA break",
    fr: "Each priced at the 250–999 EA break",
    zh: "各自按 250–999 件档计价",
  },
  "phrase.One order, 1,040 EA": {
    en: "One order, 1,040 EA",
    de: "Eine Bestellung, 1.040 ST",
    es: "One order, 1,040 EA",
    fr: "One order, 1,040 EA",
    zh: "合成一张单，1,040 件",
  },
  "phrase.One purchase order, three delivery points": {
    en: "One purchase order, three delivery points",
    de: "Eine Bestellung, drei Lieferstellen",
    es: "One purchase order, three delivery points",
    fr: "One purchase order, three delivery points",
    zh: "一张采购订单，三个交货点",
  },
  "phrase.$2,750 saved · crosses the 1,000 EA break": {
    en: "$2,750 saved · crosses the 1,000 EA break",
    de: "$2.750 gespart · überschreitet die 1.000-ST-Staffel",
    es: "$2,750 saved · crosses the 1,000 EA break",
    fr: "$2,750 saved · crosses the 1,000 EA break",
    zh: "省下 $2,750 · 跨过 1,000 件档",
  },
  "phrase.Goods, three orders at $22.40": {
    en: "Goods, three orders at $22.40",
    de: "Ware, drei Bestellungen zu $22,40",
    es: "Goods, three orders at $22.40",
    fr: "Goods, three orders at $22.40",
    zh: "货款：三张单，单价 $22.40",
  },
  "phrase.Goods, one order at $19.90": {
    en: "Goods, one order at $19.90",
    de: "Ware, eine Bestellung zu $19,90",
    es: "Goods, one order at $19.90",
    fr: "Goods, one order at $19.90",
    zh: "货款：一张单，单价 $19.90",
  },
  "phrase.Order processing · 3 × $75": {
    en: "Order processing · 3 × $75",
    de: "Bestellabwicklung · 3 × $75",
    es: "Order processing · 3 × $75",
    fr: "Order processing · 3 × $75",
    zh: "订单处理成本 · 3 × $75",
  },
  "phrase.Order processing · 1 × $75": {
    en: "Order processing · 1 × $75",
    de: "Bestellabwicklung · 1 × $75",
    es: "Order processing · 1 × $75",
    fr: "Order processing · 1 × $75",
    zh: "订单处理成本 · 1 × $75",
  },
  "phrase.Same bags, same week, same supplier, same delivery dates. The only thing that changes is how many purchase orders carry them — and that is worth $2,750 without anyone negotiating anything.": {
    en: "Same bags, same week, same supplier, same delivery dates. The only thing that changes is how many purchase orders carry them — and that is worth $2,750 without anyone negotiating anything.",
    de: "Dieselben Beutel, dieselbe Woche, derselbe Lieferant, dieselben Liefertermine. Es ändert sich nur, wie viele Bestellungen sie tragen — und das ist $2.750 wert, ohne dass irgendjemand verhandelt hätte.",
    es: "Same bags, same week, same supplier, same delivery dates. The only thing that changes is how many purchase orders carry them — and that is worth $2,750 without anyone negotiating anything.",
    fr: "Same bags, same week, same supplier, same delivery dates. The only thing that changes is how many purchase orders carry them — and that is worth $2,750 without anyone negotiating anything.",
    zh: "同样的袋、同样的一周、同样的供应商、同样的到货日。唯一变的是用几张采购订单来承载 —— 而这一点值 $2,750，没有任何人去谈判。",
  },
  "phrase.A trial drum quantity": {
    en: "A trial drum quantity",
    de: "Eine Versuchsmenge in Fässern",
    es: "A trial drum quantity",
    fr: "A trial drum quantity",
    zh: "试用桶装量",
  },
  "phrase.Half a truck": {
    en: "Half a truck",
    de: "Eine halbe Lkw-Ladung",
    es: "Half a truck",
    fr: "Half a truck",
    zh: "半车",
  },
  "phrase.This order · 12 t, a full truckload": {
    en: "This order · 12 t, a full truckload",
    de: "Diese Bestellung · 12 t, eine volle Lkw-Ladung",
    es: "This order · 12 t, a full truckload",
    fr: "This order · 12 t, a full truckload",
    zh: "本单 · 12 吨，整车",
  },
  "phrase.Annual call-off": {
    en: "Annual call-off",
    de: "Jahresabruf",
    es: "Annual call-off",
    fr: "Annual call-off",
    zh: "年度框架",
  },
  "phrase.Not offered": {
    en: "Not offered",
    de: "Nicht angeboten",
    es: "Not offered",
    fr: "Not offered",
    zh: "未提供",
  },
  "phrase.No agreement exists — there is no annual rate to reach": {
    en: "No agreement exists — there is no annual rate to reach",
    de: "Es besteht kein Vertrag — es gibt keinen Jahressatz zu erreichen",
    es: "No agreement exists — there is no annual rate to reach",
    fr: "No agreement exists — there is no annual rate to reach",
    zh: "没有协议 —— 也就没有年度价格可以够到",
  },
  "phrase.This order · 12 t at the truckload break": {
    en: "This order · 12 t at the truckload break",
    de: "Diese Bestellung · 12 t zur Lkw-Staffel",
    es: "This order · 12 t at the truckload break",
    fr: "This order · 12 t at the truckload break",
    zh: "本单 · 12 吨，按整车档",
  },
  "phrase.If the formulation goes to full production": {
    en: "If the formulation goes to full production",
    de: "Wenn die Rezeptur in die Serienfertigung geht",
    es: "If the formulation goes to full production",
    fr: "If the formulation goes to full production",
    zh: "如果这个配方转入正式量产",
  },
  "phrase.60 t a year": {
    en: "60 t a year",
    de: "60 t pro Jahr",
    es: "60 t a year",
    fr: "60 t a year",
    zh: "每年 60 吨",
  },
  "phrase.Bought as five more spot loads at this rate": {
    en: "Bought as five more spot loads at this rate",
    de: "Als fünf weitere Spot-Ladungen zu diesem Satz gekauft",
    es: "Bought as five more spot loads at this rate",
    fr: "Bought as five more spot loads at this rate",
    zh: "按这个价再买五车现货",
  },
  "phrase.What an agreement would be worth negotiating for": {
    en: "What an agreement would be worth negotiating for",
    de: "Wofür sich eine Vertragsverhandlung lohnen würde",
    es: "What an agreement would be worth negotiating for",
    fr: "What an agreement would be worth negotiating for",
    zh: "这就是值得去谈一份协议的理由",
  },
  "phrase.This is the moment to ask": {
    en: "This is the moment to ask",
    de: "Jetzt ist der Moment zu fragen",
    es: "This is the moment to ask",
    fr: "This is the moment to ask",
    zh: "现在正是开口的时候",
  },
  "flow.catalogue.contextTitle": {
    en: "Dispersion Plant · Let-down Line 1 · quarterly filter change",
    de: "Dispersionsanlage · Let-down-Linie 1 · Quartals-Filterwechsel",
    es: "Dispersion Plant · Let-down Line 1 · quarterly filter change",
    fr: "Dispersion Plant · Let-down Line 1 · quarterly filter change",
    zh: "分散体厂 · 稀释 1 线 · 季度换滤",
  },
  "flow.catalogue.contextSub": {
    en: "A catalogue line · bought again every quarter · four sites buying it apart",
    de: "Eine Katalogposition · jedes Quartal erneut gekauft · vier Standorte kaufen getrennt",
    es: "A catalogue line · bought again every quarter · four sites buying it apart",
    fr: "A catalogue line · bought again every quarter · four sites buying it apart",
    zh: "目录内的料 · 每季度都买一次 · 四个厂各买各的",
  },
  "flow.catalogue.reviewPill": {
    en: "Catalogue purchase · in review",
    de: "Katalogeinkauf · in Bearbeitung",
    es: "Catalogue purchase · in review",
    fr: "Catalogue purchase · in review",
    zh: "目录采购 · 进行中",
  },
  "run.catalogue.5.agentName": {
    en: "Invoice Matching agent",
    de: "Rechnungsprüfungs-Agent",
    es: "Invoice Matching agent",
    fr: "Invoice Matching agent",
    zh: "发票核对智能体",
  },
  "run.catalogue.5.title": {
    en: "Invoice four-way match",
    de: "Rechnung im Vierfachabgleich",
    es: "Invoice four-way match",
    fr: "Invoice four-way match",
    zh: "发票四单核对",
  },
  "run.catalogue.5.aiThought": {
    en: "The bags landed at all three plants and Apex has invoiced. The question now is narrow but it is the one that matters: did they bill the consolidated break, or the price a single plant would have paid?",
    de: "Die Beutel sind an allen drei Standorten angekommen und Apex hat fakturiert. Die Frage ist jetzt eng, aber es ist die entscheidende: Wurde die konsolidierte Staffel berechnet oder der Preis, den ein einzelnes Werk gezahlt hätte?",
    es: "The bags landed at all three plants and Apex has invoiced. The question now is narrow but it is the one that matters: did they bill the consolidated break, or the price a single plant would have paid?",
    fr: "The bags landed at all three plants and Apex has invoiced. The question now is narrow but it is the one that matters: did they bill the consolidated break, or the price a single plant would have paid?",
    zh: "三个厂的货都到了，Apex 也开票了。现在的问题很窄，但正是关键的那个：他们按合并后的档位开票，还是按单个厂本来会付的价？",
  },
  "run.catalogue.5.reasoning.4": {
    en: "Four-way match — every dimension agrees",
    de: "Vierfachabgleich — alle Dimensionen stimmen überein",
    es: "Four-way match — every dimension agrees",
    fr: "Four-way match — every dimension agrees",
    zh: "四单核对 —— 每一项都一致",
  },
  "phrase.Billed at the consolidated break, not the price any single plant would have paid alone — the saving survived all the way to the invoice.": {
    en: "Billed at the consolidated break, not the price any single plant would have paid alone — the saving survived all the way to the invoice.",
    de: "Zur konsolidierten Staffel berechnet, nicht zu dem Preis, den ein einzelnes Werk allein gezahlt hätte — die Ersparnis hat es bis auf die Rechnung geschafft.",
    es: "Billed at the consolidated break, not the price any single plant would have paid alone — the saving survived all the way to the invoice.",
    fr: "Billed at the consolidated break, not the price any single plant would have paid alone — the saving survived all the way to the invoice.",
    zh: "按合并后的档位开票，而不是任何单个厂自己会付的价 —— 这笔节省一路守到了发票上。",
  },
  "insight.openRecord": {
    en: "Open the record",
    de: "Beleg öffnen",
    es: "Open the record",
    fr: "Open the record",
    zh: "打开原始记录",
  },
  "insight.recommended": {
    en: "Recommended",
    de: "Empfohlen",
    es: "Recommended",
    fr: "Recommended",
    zh: "推荐方案",
  },
  "insight.showWorking": {
    en: "Show the calculation →",
    de: "Berechnung anzeigen →",
    es: "Show the calculation →",
    fr: "Show the calculation →",
    zh: "查看计算过程 →",
  },
};

/**
 * Look a phrase up in the reader's language, falling back to English.
 * `vars` fills `{slot}` placeholders — computed values only, never retyped.
 */
export function translate(key: string, lang: Lang, vars?: Record<string, string | number>): string {
  const phrase = DICT[key];
  if (!phrase) return key;
  const text = phrase[lang] ?? phrase.en;
  return vars ? text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : text;
}

/** The reader's language plus a lookup bound to it. */
/**
 * What a material is called in the reader's language. Falls back to whatever
 * the master data says — a new part shows its English description rather than
 * a missing-key placeholder.
 */
export function itemText(material: string, fallback: string, lang: Lang): string {
  const phrase = DICT[`item.${material}`];
  return phrase ? (phrase[lang] ?? phrase.en) : fallback;
}

/**
 * A line of a guided run, in the reader's language.
 *
 * Keyed `run.<flow>.<step>.<field>` — additive, so a run whose lines have not
 * been translated yet simply shows what the case file says. That matters: the
 * ERP documents inside a run are 1:1 copies of what the plant actually sent,
 * and those are never translated here.
 */
export function runText(
  flow: string,
  stepN: number,
  field: string,
  fallback: string,
  lang: Lang,
): string {
  const phrase = DICT[`run.${flow}.${stepN}.${field}`];
  if (!phrase) return fallback;
  const text = phrase[lang] ?? phrase.en;
  /* Some lines carry live figures. Rather than write those numbers a second
     time in every language, the translation leaves `{0}`, `{1}` … and they are
     filled from the English the case file just produced — so the case file
     stays the only place a figure is written down. */
  if (!text.includes("{")) return text;
  const tokens = fallback.match(/\$[\d,]+(?:\.\d{2})?|\b[A-Z]{2,}-[A-Z0-9-]+\b|\b\d[\d,]*(?:\.\d{2})?\b/g) ?? [];
  return text.replace(/\{(\d+)\}/g, (m, i) => tokens[Number(i)] ?? m);
}

/** The run's own header lines — title, subtitle, the pill while it is in review. */
export function useFlowText(flow: string) {
  const { lang } = useProcurement();
  return React.useCallback(
    (field: string, fallback: string) => {
      const phrase = DICT[`flow.${flow}.${field}`];
      return phrase ? (phrase[lang] ?? phrase.en) : fallback;
    },
    [flow, lang],
  );
}

/**
 * A phrase book, keyed by the English itself.
 *
 * Some copy lives in the case files as plain sentences — a clause on a
 * quotation card, a line the agent works through. Rather than restructure that
 * data, the English doubles as the key: `phrase.<the english>`. Untranslated
 * phrases fall through to the English, so nothing ever renders as a key.
 */
const MONEY = /\$[\d,]+(?:\.\d{2})?|\b\d[\d,]*(?:\.\d{2})?\b/g;

export function phrase(text: string, lang: Lang): string {
  /* A sentence carrying live figures cannot be its own key — the key would
     change every time a number does. So the figures are blanked out of the
     key, and put back into the translation from the English that produced
     them. The case file stays the only place a number is written. */
  const exact = DICT[`phrase.${text}`];
  const blanked = exact ? undefined : DICT[`phrase.${text.replace(MONEY, "#")}`];
  const p = exact ?? blanked;
  if (!p) return text;
  const out = p[lang] ?? p.en;
  /* A blanked entry is keyed by its own placeholders, so any language that
     was never translated holds "#" rather than a sentence. Those fall back to
     the English the case file produced, figures and all. */
  if (blanked && !out.includes("{")) return text;
  if (!out.includes("{")) return out;
  const figures = text.match(MONEY) ?? [];
  return out.replace(/\{(\d+)\}/g, (m, i) => figures[Number(i)] ?? m);
}

export function usePhrase() {
  const { lang } = useProcurement();
  return React.useCallback((text: string) => phrase(text, lang), [lang]);
}

/** Bound to one step, so a component reads `rt("aiThought", step.aiThought)`. */
export function useRunText(flow: string, stepN: number) {
  const { lang } = useProcurement();
  return React.useCallback(
    (field: string, fallback: string) => runText(flow, stepN, field, fallback, lang),
    [flow, stepN, lang],
  );
}

export function useT() {
  const { lang, setLang } = useProcurement();
  const t = React.useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(key, lang, vars),
    [lang],
  );
  const item = React.useCallback(
    (material: string, fallback: string) => itemText(material, fallback, lang),
    [lang],
  );
  return { t, item, lang, setLang };
}

/* ── Language switch ────────────────────────────────────────────────────── */

/**
 * Sits in the top-right of the workspace. Changing it re-renders every
 * translated surface at once — the person reading decides the language, not
 * whoever happened to raise the request.
 */
export function LanguageSwitch({ className }: { className?: string }) {
  const { lang, setLang, t } = useT();
  const [open, setOpen] = React.useState(false);
  const box = React.useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find((l) => l.code === lang)!;

  React.useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={box} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("xlat.language")}
        className="ui-pill inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-divider bg-white px-3.5 py-2 text-[13px] font-medium text-ink hover:bg-surface-fog"
      >
        <LanguagesIcon size={15} className="text-mute" />
        {current.native}
        <ChevronDown
          size={14}
          className={cn("text-mute transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-[190px] overflow-hidden rounded-md border border-divider bg-white shadow-xl">
          {LANGUAGES.map((l) => {
            const on = l.code === lang;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 whitespace-nowrap px-3.5 py-2.5 text-left text-[13px] transition-colors",
                  on ? "bg-surface-mint text-surface-deep font-medium" : "text-ink hover:bg-surface-fog",
                )}
              >
                <span>{l.native}</span>
                <span className="flex items-center gap-2">
                  <span className="text-[12px] text-mute">{l.label}</span>
                  {on && <Check size={14} strokeWidth={2.6} />}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── The visible act of translating ─────────────────────────────────────── */

/**
 * Shows a phrase arriving in the reader's language: a brief pass while the
 * workforce reads the original, then the translation typing itself out. Used
 * where the source really was written in another language, so the translation
 * is something the viewer watches happen rather than something already done.
 */
export function TranslatedText({
  text,
  from,
  gateMs = 850,
  className,
}: {
  text: string;
  /** The language the source was written in. */
  from: Lang;
  gateMs?: number;
  className?: string;
}) {
  const { lang, t } = useT();
  const needsWork = from !== lang;
  const [working, setWorking] = React.useState(needsWork);

  React.useEffect(() => {
    if (!needsWork) {
      setWorking(false);
      return;
    }
    setWorking(true);
    const timer = setTimeout(() => setWorking(false), gateMs);
    return () => clearTimeout(timer);
  }, [needsWork, gateMs, text, lang]);

  if (working) {
    return (
      <span className={cn("inline-flex items-center gap-2 text-mute", className)}>
        <Spinner size={13} />
        {t("xlat.working")}
      </span>
    );
  }
  return (
    <span className={className}>
      {needsWork ? <StreamingText text={text} cps={95} caret={false} /> : text}
    </span>
  );
}

/** Small badge marking content the workforce translated rather than authored. */
export function TranslatedBadge({ from }: { from: Lang }) {
  const { t } = useT();
  const src = LANGUAGES.find((l) => l.code === from);
  if (!src) return null;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-surface-mint px-2.5 py-1 text-[12px] font-medium text-surface-deep">
      {src.flag} → {t("xlat.translated")}
    </span>
  );
}
