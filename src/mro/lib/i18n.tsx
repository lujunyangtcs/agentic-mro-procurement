/**
 * The translation layer.
 *
 * Plant engineers and suppliers write in the language they work in. The
 * workforce reads that language, and renders everything downstream — the
 * structured requisition, the agent's findings, the workspace itself — in
 * whichever language the person reading it has chosen.
 *
 * The translation here is scripted rather than live: every phrase the demo can
 * show is written out in English and German below. That keeps the demo exact
 * and repeatable, and means it works with no network and no model call.
 */

import * as React from "react";
import type { Lang } from "@/mro/data/procurement";
import { LANGUAGES } from "@/mro/data/procurement";
import { useProcurement } from "@/mro/data/store";
import { AP_DICT } from "@/mro/lib/i18n-ap";
import { Spinner } from "@/mro/components/ai/Spinner";
import { StreamingText } from "@/mro/components/ai/StreamingText";
import { cn } from "@/mro/lib/utils";
import { Check, ChevronDown, Languages as LanguagesIcon } from "lucide-react";

/* ── Phrase book ────────────────────────────────────────────────────────── */

type Phrase = Record<Lang, string>;

const DICT: Record<string, Phrase> = {
  /* Work menu */
  "nav.myDesk": {
    en: "My desk", de: "Mein Arbeitsplatz",
  },
  "nav.requisitions": {
    en: "Requisitions", de: "Bestellanforderungen",
  },
  "nav.exceptions": {
    en: "Exceptions", de: "Ausnahmen",
  },
  "nav.invoiceMatching": {
    en: "Invoice matching", de: "Rechnungsprüfung",
  },

  /* Requisitions page */
  "req.title": {
    en: "Requisitions", de: "Bestellanforderungen",
  },
  "req.lead": {
    en: "Every maintenance request the workforce is structuring, validating and releasing. The agents do the work and recommend an action; you approve the ones that matter.",
    de: "Jede Instandhaltungsanforderung, die die Belegschaft strukturiert, prüft und freigibt. Die Agenten erledigen die Arbeit und empfehlen eine Maßnahme; Sie genehmigen die wichtigen.",
  },
  "req.worklist": {
    en: "Requisition worklist", de: "Arbeitsvorrat",
  },
  "req.worklistSub": {
    en: "Ranked with the requests that need you at the top. Open any row to see the requisition exactly as it appears in the system of record.",
    de: "Die Anforderungen, die Sie brauchen, stehen oben. Öffnen Sie eine Zeile, um die Anforderung genau so zu sehen, wie sie im System steht.",
  },
  "req.tile.total": {
    en: "Requisitions", de: "Anforderungen",
  },
  "req.tile.inProgress": {
    en: "In progress", de: "In Bearbeitung",
  },
  "req.tile.held": {
    en: "Held for you", de: "Für Sie angehalten",
  },
  "req.tile.touchless": {
    en: "Released without a person", de: "Ohne Person freigegeben",
  },
  "req.sub.total": {
    en: "of requested spend", de: "an angefordertem Volumen",
  },
  "req.sub.inProgress": {
    en: "Being structured and validated now",
    de: "Wird gerade strukturiert und geprüft",
  },
  "req.sub.held": {
    en: "waiting on a decision", de: "warten auf eine Entscheidung",
  },
  "req.sub.touchless": {
    en: "finished requests", de: "abgeschlossenen Anforderungen",
  },
  "word.of": { en: "of", de: "von", },

  /* Table headers */
  "col.request": {
    en: "Request", de: "Anforderung",
  },
  "col.item": { en: "Item", de: "Artikel", },
  "col.raisedBy": {
    en: "Raised by", de: "Angefordert von",
  },
  "col.value": { en: "Value", de: "Wert", },
  "col.status": { en: "Status", de: "Status", },
  "col.workforce": {
    en: "Workforce", de: "Belegschaft",
  },
  "col.action": { en: "Action", de: "Aktion", },

  /* Status */
  "status.structuring": {
    en: "Structuring", de: "Strukturierung",
  },
  "status.validating": {
    en: "Validating", de: "Prüfung",
  },
  "status.held": {
    en: "Held for you", de: "Für Sie angehalten",
  },
  "status.released": {
    en: "Released", de: "Freigegeben",
  },
  "status.needsYou": {
    en: "Needs you", de: "Braucht Sie",
  },

  /* Buttons */
  "btn.open": { en: "Open", de: "Öffnen", },
  "btn.seeRun": {
    en: "See the run", de: "Ablauf ansehen",
  },
  "btn.all": { en: "All", de: "Alle", },
  "btn.needsYou": {
    en: "Needs you", de: "Braucht Sie",
  },
  "btn.inProgress": {
    en: "In progress", de: "In Bearbeitung",
  },
  "btn.released": {
    en: "Released", de: "Freigegeben",
  },

  /* Translation tell */
  "xlat.original": {
    en: "Original request", de: "Ursprüngliche Anforderung",
  },
  "xlat.translated": {
    en: "translated by the workforce", de: "von der Belegschaft übersetzt",
  },
  "xlat.writtenIn": {
    en: "Written in", de: "Verfasst auf",
  },
  "xlat.working": {
    en: "Reading and translating…", de: "Lesen und übersetzen…",
  },
  "xlat.language": {
    en: "Language", de: "Sprache",
  },

  /* ── Supplier portal — the whole page follows the chosen language ─────── */
  "sp.chip": {
    en: "Supplier self service", de: "Lieferanten-Self-Service",
  },
  "sp.overviewTitle": {
    en: "Overview", de: "Übersicht",
  },
  "sp.askTitle": {
    en: "Ask & my payments", de: "Fragen & meine Zahlungen",
  },
  "sp.overviewLead": {
    en: "Your orders, your invoices and your money with Orvantec, live.",
    de: "Ihre Bestellungen, Rechnungen und Ihr Geld bei Orvantec — live.",
  },
  "sp.askLead": {
    en: "Ask anything — the assistant answers from the live records and passes anything commercial to a person.",
    de: "Fragen Sie alles — der Assistent antwortet aus den Live-Daten und übergibt Kommerzielles an eine Person.",
  },
  "sp.tile.invoices": {
    en: "Invoices submitted", de: "Eingereichte Rechnungen",
  },
  "sp.tile.invoicesSub": {
    en: "{amt} billed", de: "{amt} in Rechnung gestellt",
  },
  "sp.tile.beingPaid": {
    en: "Being paid", de: "Wird bezahlt",
  },
  "sp.tile.beingPaidSub": {
    en: "On {terms} terms", de: "Zahlungsziel {terms}",
  },
  "sp.tile.onHold": {
    en: "On hold", de: "Zurückgestellt",
  },
  "sp.tile.onHoldSub": {
    en: "Queried against your invoices", de: "Rückfragen zu Ihren Rechnungen",
  },
  "sp.tile.waiting": {
    en: "Questions with a specialist", de: "Fragen beim Spezialisten",
  },
  "sp.tile.waitingSome": {
    en: "Being reviewed by a person now", de: "Wird gerade von einer Person geprüft",
  },
  "sp.tile.waitingNone": {
    en: "Nothing waiting", de: "Nichts offen",
  },
  "sp.panel.invoices": {
    en: "Your invoices", de: "Ihre Rechnungen",
  },
  "sp.panel.invoicesSub": {
    en: "Exactly what we have received from you and what we are paying.",
    de: "Genau das, was wir von Ihnen erhalten haben und was wir bezahlen.",
  },
  "sp.panel.prs": {
    en: "Your purchase requests", de: "Ihre Bestellanforderungen",
  },
  "sp.panel.prsSub": {
    en: "What Orvantec is preparing to order from you, live.",
    de: "Was Orvantec bei Ihnen bestellen wird — live.",
  },
  "sp.panel.money": {
    en: "Your money", de: "Ihr Geld",
  },
  "sp.panel.moneySub": {
    en: "How much of what you billed is on its way, and what is held.",
    de: "Wie viel Ihres Rechnungsbetrags unterwegs ist und was zurückgehalten wird.",
  },
  "sp.col.invoice": { en: "Invoice", de: "Rechnung", },
  "sp.col.billed": { en: "Billed", de: "Berechnet", },
  "sp.col.paying": { en: "Paying", de: "Zahlung", },
  "sp.col.onHold": { en: "On hold", de: "Zurückgestellt", },
  "sp.col.status": { en: "Status", de: "Status", },
  "sp.col.item": { en: "Item", de: "Artikel", },
  "sp.col.value": { en: "Value", de: "Wert", },
  "sp.col.reason": { en: "Reason", de: "Grund", },
  "sp.pill.beingPaid": {
    en: "Being paid", de: "Wird bezahlt",
  },
  "sp.pill.query": {
    en: "Query open", de: "Rückfrage offen",
  },
  "sp.held": {
    en: "{amt} held", de: "{amt} zurückgehalten",
  },
  "sp.beingPaidLine": {
    en: "being paid", de: "wird bezahlt",
  },
  "sp.status.released": {
    en: "Released", de: "Freigegeben",
  },
  "sp.status.onHold": {
    en: "On hold", de: "Zurückgestellt",
  },
  "sp.status.processing": {
    en: "Being processed", de: "In Bearbeitung",
  },
  "sp.reason.released": {
    en: "Order on its way", de: "Bestellung unterwegs",
  },
  "sp.reason.spec": {
    en: "Specification being confirmed", de: "Spezifikation wird bestätigt",
  },
  "sp.reason.dup": {
    en: "Being consolidated with an open request", de: "Wird mit einer offenen Anforderung zusammengeführt",
  },
  "sp.reason.stock": {
    en: "Being checked against stock", de: "Wird gegen den Bestand geprüft",
  },
  "sp.reason.warranty": {
    en: "Warranty position being checked", de: "Garantieanspruch wird geprüft",
  },
  "sp.reason.contract": {
    en: "Supplier terms under review", de: "Lieferantenkonditionen in Prüfung",
  },
  "sp.reason.threshold": {
    en: "Awaiting a sign-off", de: "Wartet auf eine Freigabe",
  },
  "sp.reason.review": {
    en: "Being reviewed", de: "Wird geprüft",
  },
  "sp.nothingInFlight": {
    en: "Nothing in flight.", de: "Nichts in Bearbeitung.",
  },
  "sp.chat.title": {
    en: "Ask about your orders and payments", de: "Fragen zu Bestellungen und Zahlungen",
  },
  "sp.chat.sub": {
    en: "You write in {lang} — the assistant and the desk read it in their own language.",
    de: "Sie schreiben auf {lang} — Assistent und Einkauf lesen es in ihrer Sprache.",
  },
  "sp.chat.online": {
    en: "Assistant online", de: "Assistent online",
  },
  "sp.chat.assistant": {
    en: "Procurement assistant", de: "Einkaufsassistent",
  },
  "sp.chat.specialist": {
    en: "Procurement specialist", de: "Einkaufsspezialist",
  },
  "sp.chat.withSpecialist": {
    en: "With a specialist", de: "Beim Spezialisten",
  },
  "sp.chat.byEmail": {
    en: "sent by email", de: "per E-Mail gesendet",
  },
  "sp.chat.inPortal": {
    en: "answered in the portal", de: "im Portal beantwortet",
  },
  "sp.chat.answeredFrom": {
    en: "Answered from {name}'s live order and invoice records.",
    de: "Beantwortet aus den Live-Bestell- und Rechnungsdaten von {name}.",
  },
  "sp.chat.placeholder": {
    en: "Write your message…", de: "Nachricht schreiben…",
  },
  "sp.chat.allAsked": {
    en: "You have asked everything on the list — the specialist's answers arrive above.",
    de: "Sie haben alle Fragen der Liste gestellt — die Antworten der Spezialisten erscheinen oben.",
  },

  /* ── The dashboard ─────────────────────────────────────────────────── */
  "dash.todaysRead": {
    en: "Today's read: {n} requests in flight — {held} held at {value}, {inv} invoices holding {rec}.",
    de: "Heutige Lage: {n} Anforderungen in Bearbeitung — {held} angehalten über {value}, {inv} Rechnungen halten {rec} zurück.",
  },
  "dash.priority": {
    en: "Priority: the {value} mechanical seal for {line} — the line is down and one specification holds release. Everything else is on contract and moving.",
    de: "Priorität: die Gleitringdichtung über {value} für {line} — die Linie steht still, und eine offene Spezifikation hält die Freigabe auf. Alles Übrige läuft auf Vertrag.",
  },
  "dash.closedSoFar": {
    en: "{n} exceptions closed so far. {held} still waiting on a decision.",
    de: "{n} Ausnahmen bisher geschlossen. {held} warten weiterhin auf eine Entscheidung.",
  },
  "dash.closedProtected": {
    en: "{n} exceptions closed and {value} protected so far. {held} still waiting on a decision.",
    de: "{n} Ausnahmen geschlossen und {value} gesichert. {held} warten weiterhin auf eine Entscheidung.",
  },
  "dash.allClear": {
    en: "All clear — every request released.",
    de: "Alles erledigt — jede Anforderung ist freigegeben.",
  },
  "dash.allClearProtected": {
    en: "All clear — every request released, {value} protected along the way.",
    de: "Alles erledigt — jede Anforderung freigegeben, {value} dabei gesichert.",
  },
  "dash.needYou": {
    en: "need you",
    de: "brauchen Sie",
  },
  "dash.heldStat": {
    en: "held",
    de: "angehalten",
  },
  "dash.touchless": {
    en: "touchless",
    de: "ohne Zutun",
  },
  "dash.newRequest": {
    en: "+ New request",
    de: "+ Neue Anforderung",
  },
  "dash.search": {
    en: "Search requisitions, materials…",
    de: "Anforderungen, Materialien suchen …",
  },
  "dash.notifications": {
    en: "Notifications",
    de: "Benachrichtigungen",
  },
  "dash.fromSuppliers": {
    en: "From suppliers",
    de: "Von Lieferanten",
  },
  "dash.open": {
    en: "Open ↗",
    de: "Öffnen ↗",
  },
  "dash.showMore": {
    en: "Show {n} more →",
    de: "{n} weitere anzeigen →",
  },
  "dash.takeToMarket": {
    en: "Take it to market →",
    de: "In den Markt geben →",
  },
  "dash.nothingStopped": {
    en: "Nothing stopped.",
    de: "Nichts angehalten.",
  },
  "kpi.inFlight": {
    en: "Requests in flight",
    de: "Anforderungen in Bearbeitung",
  },
  "kpi.inFlightSub": {
    en: "{c} countries · {l} languages",
    de: "{c} Länder · {l} Sprachen",
  },
  "kpi.heldForYou": {
    en: "Held for you",
    de: "Für Sie angehalten",
  },
  "kpi.heldSub": {
    en: "{value} waiting on a decision",
    de: "{value} warten auf eine Entscheidung",
  },
  "kpi.spendProtected": {
    en: "Spend protected",
    de: "Gesicherte Ausgaben",
  },
  "kpi.spendGrows": {
    en: "Grows as you resolve",
    de: "Wächst mit jeder Klärung",
  },
  "kpi.spendClosed": {
    en: "{n} exceptions closed",
    de: "{n} Ausnahmen geschlossen",
  },
  "kpi.invoiceHolds": {
    en: "Invoice holds",
    de: "Rechnungssperren",
  },
  "kpi.invoiceSub": {
    en: "Across {a} of {b} invoices",
    de: "Über {a} von {b} Rechnungen",
  },
  "card.requisitions": {
    en: "Requisitions",
    de: "Bestellanforderungen",
  },
  "card.reqRight": {
    en: "{value} in flight",
    de: "{value} in Bearbeitung",
  },
  "card.reqFoot": {
    en: "Held requests wait on the exception board — everything else the workforce moves on its own.",
    de: "Angehaltene Anforderungen warten auf der Ausnahmetafel — alles Übrige bewegen die Agenten selbst.",
  },
  "card.exceptions": {
    en: "Exceptions",
    de: "Ausnahmen",
  },
  "card.excRight": {
    en: "{n} open",
    de: "{n} offen",
  },
  "card.excFoot": {
    en: "Each one carries its evidence and a single recommended action.",
    de: "Jede bringt ihre Belege mit und einen einzigen empfohlenen Schritt.",
  },
  "card.invoices": {
    en: "Invoice matching",
    de: "Rechnungsprüfung",
  },
  "card.invRight": {
    en: "{value} recoverable",
    de: "{value} rückholbar",
  },
  "card.invFoot": {
    en: "Every invoice is checked against the order, the goods receipt and the agreement before it pays.",
    de: "Jede Rechnung wird vor der Zahlung gegen Bestellung, Wareneingang und Vertrag geprüft.",
  },
  "col.invoice": {
    en: "Invoice",
    de: "Rechnung",
  },
  "col.amount": {
    en: "Amount",
    de: "Betrag",
  },
  "inv.agree": {
    en: "Documents agree",
    de: "Belege stimmen überein",
  },
  "inv.heldAmt": {
    en: "{value} held",
    de: "{value} gesperrt",
  },
  "inv.records": {
    en: "{po} · {gr} records {a} of {b} billed",
    de: "{po} · {gr} verbucht {a} von {b} berechneten",
  },
  "chart.heldByReason": {
    en: "Held value by reason",
    de: "Angehaltener Wert nach Grund",
  },
  "chart.byStatus": {
    en: "Requests by status",
    de: "Anforderungen nach Status",
  },
  "lane.spec": {
    en: "Spec",
    de: "Spezifikation",
  },
  "lane.duplicate": {
    en: "Duplicate",
    de: "Doppelt",
  },
  "lane.stock": {
    en: "Stock",
    de: "Bestand",
  },
  "lane.warranty": {
    en: "Warranty",
    de: "Gewährleistung",
  },
  "lane.contract": {
    en: "Contract",
    de: "Vertrag",
  },
  "lane.limit": {
    en: "Limit",
    de: "Limit",
  },
  "pie.held": {
    en: "Held",
    de: "Angehalten",
  },
  "pie.inProgress": {
    en: "In progress",
    de: "In Arbeit",
  },
  "pie.released": {
    en: "Released",
    de: "Freigegeben",
  },
  "audit.rule": {
    en: "The agents only recommend. Nothing is released, merged, claimed or paid without your approval.",
    de: "Die Agenten geben nur Empfehlungen. Nichts wird ohne Ihre Freigabe freigegeben, zusammengeführt, geltend gemacht oder bezahlt.",
  },
  "audit.trail": {
    en: "Full audit trail on every decision",
    de: "Vollständige Nachvollziehbarkeit jeder Entscheidung",
  },
  "user.buyerDesk": {
    en: "Procurement · MRO buyer desk",
    de: "Einkauf · MRO-Einkäuferplatz",
  },

  /* ── The work menu ─────────────────────────────────────────────────── */
  "nav.overview": {
    en: "Overview",
    de: "Übersicht",
  },
  "nav.dashboard": {
    en: "Dashboard",
    de: "Übersichtsseite",
  },
  "nav.controlTower": {
    en: "Control tower",
    de: "Leitstand",
  },
  "nav.agentWorkforce": {
    en: "Agent workforce",
    de: "Agenten-Team",
  },
  "nav.serviceDesk": {
    en: "Service desk",
    de: "Service-Desk",
  },
  "nav.validation": {
    en: "Requisition validation",
    de: "Prüfung der Anforderung",
  },
  "nav.prProcessing": {
    en: "PR processing",
    de: "Anforderungsbearbeitung",
  },
  "nav.masterData": {
    en: "Master data",
    de: "Stammdaten",
  },
  "nav.warranty": {
    en: "Warranty & coverage",
    de: "Gewährleistung & Deckung",
  },
  "nav.sourcing": {
    en: "Sourcing & contract",
    de: "Beschaffung & Vertrag",
  },
  "nav.approval": {
    en: "Approval & routing",
    de: "Freigabe & Weiterleitung",
  },
  "nav.system": {
    en: "System",
    de: "System",
  },
  "nav.auditLog": {
    en: "Audit log",
    de: "Prüfprotokoll",
  },
  "nav.settings": {
    en: "Settings",
    de: "Einstellungen",
  },
  "nav.soon": {
    en: "Soon",
    de: "Bald",
  },
  "nav.signOut": {
    en: "Sign out",
    de: "Abmelden",
  },
  "nav.newRequest": {
    en: "New request",
    de: "Neue Anforderung",
  },

  /* ── What is bought, and why it stopped ────────────────────────────── */
  "item.MRO-SEAL-MECH-50MM-SIC": {
    en: "Mechanical seal — cartridge — 50 mm shaft — silicon carbide faces",
    de: "Gleitringdichtung — Patrone — 50 mm Welle — SiC-Gleitflächen",
  },
  "item.RAW-ELSTEEL-M4-030MM": {
    en: "Grain-oriented electrical steel — M4 grade — C5 insulation coated — 0.30 mm coil",
    de: "Kornorientiertes Elektroblech — M4 — C5-isoliert — 0,30 mm Coil",
  },
  "item.MRO-DIAPH-PTFE-2IN": {
    en: "Diaphragm — PTFE — 2 in transfer pump",
    de: "Membran — PTFE — 2-Zoll-Zulaufpumpe",
  },
  "item.MRO-DIAPH-PTFE-15IN": {
    en: "Diaphragm — PTFE — 1.5 in dosing pump",
    de: "Membran — PTFE — 1,5-Zoll-Dosierpumpe",
  },
  "item.MRO-MEDIA-ZRO2-1.2MM": {
    en: "Grinding media — zirconia — 1.2 mm — 25 kg bag",
    de: "Mahlkörper — Zirkonoxid — 1,2 mm — 25-kg-Sack",
  },
  "item.MRO-VIB-SENSOR-INLINE": {
    en: "Inline vibration sensor — accelerometer — 4–20 mA output",
    de: "Inline-Viskosimetersonde — Flansch DN50 — 0–20.000 cP",
  },
  "item.MRO-MOTOR-IE3-15KW": {
    en: "Electric motor — IE3 — 15 kW — flange mount",
    de: "Elektromotor — IE3 — 15 kW — Flanschausführung",
  },
  "item.MRO-HOSE-COOL-2IN-EPDM": {
    en: "Coolant transfer hose — 2 in — EPDM lined — 6 m",
    de: "Chemieschlauch — 2 Zoll — EPDM-Auskleidung — 6 m",
  },
  "item.MRO-FILT-BAG-25UM-PP": {
    en: "Filter bag — 25 micron — polypropylene — size 2",
    de: "Filterbeutel — 25 Mikron — Polypropylen — Größe 2",
  },
  "item.MRO-VALVE-BFLY-DN80-PTFE": {
    en: "Butterfly valve — DN80 — PTFE lined — lever operated",
    de: "Absperrklappe — DN80 — PTFE-ausgekleidet — Handhebel",
  },
  "item.MRO-PUMP-DIAPH-AODD-2IN": {
    en: "Air-operated double-diaphragm pump — 2 in — PTFE fitted",
    de: "Druckluft-Doppelmembranpumpe — 2 Zoll — PTFE-bestückt",
  },
  "item.MRO-TEMP-RTD-PT100": {
    en: "Temperature probe — RTD Pt100 — 6 mm — DN25 flange",
    de: "Temperaturfühler — RTD Pt100 — 6 mm — Flansch DN25",
  },
  "item.MRO-GASKET-PTFE-DN80": {
    en: "Gasket — PTFE envelope — DN80 — full face",
    de: "Dichtung — PTFE-Ummantelung — DN80 — Vollflansch",
  },
  "item.MRO-COUPL-FLEX-80MM": {
    en: "Flexible coupling — 80 mm — elastomer insert",
    de: "Elastische Kupplung — 80 mm — Elastomereinsatz",
  },
  "item.MRO-SEAL-KIT-GBOX-40MM": {
    en: "Seal kit — gear reducer — 40 mm — elastomer and face set",
    de: "Dichtungssatz — Getriebe — 40 mm — Elastomer- und Gleitflächensatz",
  },
  "item.MRO-GBOX-KIT-WINDER": {
    en: "Gearbox rebuild kit — winder drive — seal & bearing set",
    de: "Getriebe-Überholungssatz — Wicklerantrieb — Dichtungs- und Lagersatz",
  },
  "exc.spec-incomplete": {
    en: "Specification incomplete",
    de: "Spezifikation unvollständig",
  },
  "exc.duplicate-demand": {
    en: "Duplicate request",
    de: "Doppelte Anforderung",
  },
  "exc.stock-available": {
    en: "Stock already available",
    de: "Bestand bereits vorhanden",
  },
  "exc.warranty-covered": {
    en: "Covered by warranty",
    de: "Durch Gewährleistung gedeckt",
  },
  "exc.off-contract": {
    en: "Off-contract or price variance",
    de: "Außerhalb des Vertrags oder Preisabweichung",
  },
  "exc.over-threshold": {
    en: "Above approval limit",
    de: "Über der Freigabegrenze",
  },

  /* ── How urgent ────────────────────────────────────────────────────── */
  "prio.critical": {
    en: "Critical",
    de: "Kritisch",
  },
  "prio.high": {
    en: "High",
    de: "Hoch",
  },
  "prio.normal": {
    en: "Normal",
    de: "Normal",
  },

  /* ── The guided run, its chrome ────────────────────────────────────── */
  "run.stepN": {
    en: "Step {n} · Process run",
    de: "Schritt {n} · Prozesslauf",
  },
  "run.ready": {
    en: "Ready",
    de: "Bereit",
  },
  "run.working": {
    en: "Working",
    de: "Arbeitet",
  },
  "run.produced": {
    en: "Produced",
    de: "Erstellt",
  },
  "run.updated": {
    en: "Updated",
    de: "Aktualisiert",
  },
  "run.approveHandOff": {
    en: "Approve & hand off",
    de: "Freigeben & übergeben",
  },
  "run.approveProceed": {
    en: "Approve & proceed",
    de: "Freigeben & fortfahren",
  },
  "run.approveFlagsHandOff": {
    en: "Approve with flags & hand off",
    de: "Mit Hinweisen freigeben & übergeben",
  },
  "run.approveFlagsProceed": {
    en: "Approve with flags & proceed",
    de: "Mit Hinweisen freigeben & fortfahren",
  },
  "run.approveAnyway": {
    en: "Approve anyway",
    de: "Trotzdem freigeben",
  },
  "run.pending": {
    en: "Pending",
    de: "Zurückgestellt",
  },
  "run.escalate": {
    en: "Escalate",
    de: "Eskalieren",
  },
  "run.reject": {
    en: "Reject",
    de: "Ablehnen",
  },
  "run.validateProceed": {
    en: "Validate & proceed",
    de: "Prüfen & fortfahren",
  },
  "run.discard": {
    en: "Discard",
    de: "Verwerfen",
  },
  "run.approvedHanded": {
    en: "Approved · output handed to the next agent",
    de: "Freigegeben · Ergebnis an den nächsten Agenten übergeben",
  },
  "run.rejectedHalted": {
    en: "Rejected · sent back with a flag · run halted",
    de: "Abgelehnt · mit Hinweis zurückgeschickt · Lauf angehalten",
  },
  "run.aiRecommendation": {
    en: "AI recommendation",
    de: "KI-Empfehlung",
  },
  "run.backToDashboard": {
    en: "Back to dashboard",
    de: "Zurück zur Übersicht",
  },
  "run.agentRun": {
    en: "Agent run",
    de: "Agentenlauf",
  },
  "run.handedOff": {
    en: "{done} of {total} handed off",
    de: "{done} von {total} übergeben",
  },
  "run.sourceFiles": {
    en: "Source files",
    de: "Quelldateien",
  },
  "run.inputsClick": {
    en: "{n} inputs · click to inspect",
    de: "{n} Eingaben · zum Prüfen klicken",
  },
  "run.approved": {
    en: "Approved",
    de: "Freigegeben",
  },
  "run.pendingParked": {
    en: "On hold · parked for review, run can still continue",
    de: "Zurückgestellt · zur Prüfung geparkt, der Lauf kann weitergehen",
  },
  "run.escalatedHalted": {
    en: "Escalated · routed to a human reviewer · run halted",
    de: "Eskaliert · an einen menschlichen Prüfer weitergeleitet · Lauf angehalten",
  },

  /* ── The hero run · the mechanical seal ────────────────────────────── */
  "run.pump.1.agentName": {
    en: "PR Processing agent",
    de: "Anforderungsbearbeitung",
  },
  "run.pump.1.aiThought": {
    en: "An email just came in from the Assembly Line 2 plant engineer — their mechanical seal has failed and is leaking, and they need a replacement fast. It's free text with no part number, so let me read it and structure it into a proper requisition.",
    de: "Gerade kam eine E-Mail vom Anlageningenieur der Montagelinie 2 — die Gleitringdichtung ist ausgefallen und undicht, Ersatz wird dringend gebraucht. Der Text ist frei formuliert und ohne Teilenummer; ich lese ihn und forme daraus eine saubere Anforderung.",
  },
  "run.pump.1.reasoning.0": {
    en: "Reading the engineer's free-text note from Assembly Line 2",
    de: "Lese die frei formulierte Notiz des Ingenieurs von Montagelinie 2",
  },
  "run.pump.1.reasoning.1": {
    en: "Extracting specs — ~45–50 mm, silicon carbide faces, heavy duty",
    de: "Extrahiere die Spezifikation — ca. 45–50 mm, SiC-Gleitflächen, schwere Ausführung",
  },
  "run.pump.1.reasoning.2": {
    en: "Mapping to material code MRO-SEAL-MECH-50MM-SIC",
    de: "Ordne dem Materialcode MRO-SEAL-MECH-50MM-SIC zu",
  },
  "run.pump.1.reasoning.3": {
    en: "Coding cost center 10034 · GL 600450",
    de: "Kontiere Kostenstelle 10034 · Sachkonto 600450",
  },
  "run.pump.1.reasoning.4": {
    en: "Flagging the shaft-diameter range and missing part number",
    de: "Kennzeichne den Wellendurchmesser-Bereich und die fehlende Teilenummer",
  },
  "run.pump.1.recommendation": {
    en: "Structured and coded to MRO-SEAL-MECH-50MM-SIC. The engineer gave a 45–50 mm range with no part number, so I read the shaft size off the equipment record for Assembly Line 2 — 50 mm. Drafted clean, routed for the checks.",
    de: "Strukturiert und auf MRO-SEAL-MECH-50MM-SIC kontiert. Der Ingenieur nannte einen Bereich von 45–50 mm ohne Teilenummer; die Wellengröße habe ich aus dem Anlagenstammsatz der Montagelinie 2 gelesen — 50 mm. Sauber erfasst und zur Prüfung weitergeleitet.",
  },
  "run.pump.2.agentName": {
    en: "Master Data agent",
    de: "Stammdaten-Agent",
  },
  "run.pump.2.aiThought": {
    en: "The request is coded now. Let me confirm the material code in the master data, scan for any duplicate request already open, and check whether another plant already has this seal on the shelf before we buy.",
    de: "Die Anforderung ist kontiert. Ich prüfe den Materialcode im Stammsatz, suche nach einer bereits offenen Doppelanforderung und sehe nach, ob ein anderes Werk diese Dichtung schon am Lager hat, bevor wir kaufen.",
  },
  "run.pump.2.reasoning.0": {
    en: "Reading structured PR-48630",
    de: "Lese die strukturierte Anforderung PR-48630",
  },
  "run.pump.2.reasoning.1": {
    en: "Confirming the mapped material code",
    de: "Bestätige den zugeordneten Materialcode",
  },
  "run.pump.2.reasoning.2": {
    en: "Scanning open PRs for a duplicate — none found",
    de: "Durchsuche offene Anforderungen auf Duplikate — keine gefunden",
  },
  "run.pump.2.reasoning.3": {
    en: "Checking on-hand and interplant stock — none",
    de: "Prüfe Lagerbestand und Werksübergreifendes — keiner",
  },
  "run.pump.2.reasoning.4": {
    en: "Flagging the ambiguous diameter for sign-off",
    de: "Lege den unklaren Durchmesser zur Bestätigung vor",
  },
  "run.pump.2.recommendation": {
    en: "Code is clean, no duplicate open, no stock to draw from — the buy is justified. The shaft range resolved to 50 mm off the equipment record for Assembly Line 2, so nothing is left open.",
    de: "Der Code ist sauber, kein Duplikat offen, kein Bestand verfügbar — der Kauf ist begründet. Der Wellenbereich löste sich über den Anlagenstammsatz der Montagelinie 2 zu 50 mm auf; es bleibt nichts offen.",
  },
  "run.pump.3.agentName": {
    en: "Warranty & coverage desk",
    de: "Gewährleistung & Deckung",
  },
  "run.pump.3.aiThought": {
    en: "Before I treat this as a new purchase, let me check whether the gear reducer is still under warranty — if the failure is a covered defect, this should be a claim, not a buy.",
    de: "Bevor ich das als Neukauf behandle: Ich prüfe, ob das Rührwerk noch unter Gewährleistung steht — ist der Ausfall ein gedeckter Mangel, gehört das als Anspruch behandelt, nicht als Kauf.",
  },
  "run.pump.3.reasoning.0": {
    en: "Checking the gear reducer's OEM warranty status",
    de: "Prüfe den Gewährleistungsstatus des Rührwerks beim Hersteller",
  },
  "run.pump.3.reasoning.1": {
    en: "Seal is a wear part — not covered equipment",
    de: "Die Dichtung ist ein Verschleißteil — kein gedecktes Bauteil",
  },
  "run.pump.3.reasoning.2": {
    en: "Failure is wear & tear, not a covered defect",
    de: "Der Ausfall ist Verschleiß, kein gedeckter Mangel",
  },
  "run.pump.3.reasoning.3": {
    en: "Coverage — parts only, buy new",
    de: "Deckung — nur Teile, Neukauf",
  },
  "run.pump.3.recommendation": {
    en: "Wear-and-tear on a wear part — no warranty claim applies. Proceed as a new-buy.",
    de: "Verschleiß an einem Verschleißteil — kein Gewährleistungsanspruch. Als Neukauf fortfahren.",
  },
  "run.pump.4.agentName": {
    en: "Sourcing & contract agent",
    de: "Beschaffung & Vertrag",
  },
  "run.pump.4.aiThought": {
    en: "We already buy this seal from a supplier we have an agreement with, so there is nothing to go to market for. Let me confirm the supplier is still approved and that the request is priced at what the agreement says.",
    de: "Wir beziehen diese Dichtung bereits von einem Lieferanten, mit dem ein Vertrag besteht — es gibt also nichts auszuschreiben. Ich bestätige, dass der Lieferant weiterhin zugelassen ist und die Anforderung zum Vertragspreis kalkuliert wurde.",
  },
  "run.pump.4.reasoning.0": {
    en: "Confirming the supplier is approved and still preferred",
    de: "Bestätige, dass der Lieferant zugelassen und weiterhin bevorzugt ist",
  },
  "run.pump.4.reasoning.1": {
    en: "Reading the price and terms off the agreement",
    de: "Lese Preis und Konditionen aus dem Rahmenvertrag",
  },
  "run.pump.4.reasoning.2": {
    en: "Checking the request is priced at the agreed rate",
    de: "Prüfe, ob die Anforderung zum vereinbarten Satz kalkuliert ist",
  },
  "run.pump.4.recommendation": {
    en: "Apex Industrial Supply is the approved, preferred supplier for this seal and it sits on the live agreement SA-MRO-07 at $4,180 each, 5-day lead. The request is priced at exactly that. Nothing to source and nothing to negotiate.",
    de: "Apex Industrial Supply ist der zugelassene und bevorzugte Lieferant für diese Dichtung und steht im laufenden Vertrag SA-MRO-07 mit $4.180 je Stück, 5 Tage Lieferzeit. Die Anforderung ist genau so kalkuliert. Nichts zu beschaffen, nichts zu verhandeln.",
  },
  "run.pump.5.agentName": {
    en: "Approval & routing",
    de: "Freigabe & Weiterleitung",
  },
  "run.pump.5.aiThought": {
    en: "Every control has cleared, so all that is left is to route this for release and tell the engineer their seal is on the way.",
    de: "Alle Kontrollen sind bestanden; es bleibt nur, die Freigabe weiterzuleiten und dem Ingenieur mitzuteilen, dass seine Dichtung unterwegs ist.",
  },
  "run.pump.5.reasoning.0": {
    en: "Confirming cost center 10034 / GL 600450",
    de: "Bestätige Kostenstelle 10034 / Sachkonto 600450",
  },
  "run.pump.5.reasoning.1": {
    en: "On-contract — competitive bidding not required",
    de: "Auf Vertrag — kein Wettbewerbsverfahren erforderlich",
  },
  "run.pump.5.reasoning.2": {
    en: "Within the plant-maintenance approval limit",
    de: "Innerhalb der Freigabegrenze der Werksinstandhaltung",
  },
  "run.pump.5.reasoning.3": {
    en: "Releasing the requisition to the supplier on the agreement",
    de: "Gebe die Anforderung an den Vertragslieferanten frei",
  },
  "run.pump.5.recommendation": {
    en: "Every control clears — nothing is waiting on anyone. On approve, the agent confirms back to the engineer and releases PR-48630 to Apex on the agreement at $4,180.",
    de: "Alle Kontrollen bestehen — nichts wartet auf jemanden. Nach Freigabe bestätigt der Agent dem Ingenieur und gibt PR-48630 an Apex zum Vertragspreis von $4.180 frei.",
  },
  "run.pump.6.agentName": {
    en: "Invoice Matching agent",
    de: "Rechnungsprüfungs-Agent",
  },
  "run.pump.6.aiThought": {
    en: "Apex has emailed their invoice for the seal. Let me four-way match it against the PO, the goods receipt and the contract before we clear it for payment.",
    de: "Apex hat die Rechnung für die Dichtung geschickt. Ich gleiche sie vierfach gegen Bestellung, Wareneingang und Vertrag ab, bevor wir sie zur Zahlung freigeben.",
  },
  "run.pump.6.reasoning.0": {
    en: "Reading the captured Apex invoice BPI-5567",
    de: "Lese die erfasste Apex-Rechnung BPI-5567",
  },
  "run.pump.6.reasoning.1": {
    en: "Running the four-way match — contract ↔ PO ↔ goods receipt ↔ invoice",
    de: "Führe den Vierfachabgleich durch — Vertrag ↔ Bestellung ↔ Wareneingang ↔ Rechnung",
  },
  "run.pump.6.reasoning.2": {
    en: "Checking price and quantity — $4,180 · 1 EA · all agree",
    de: "Prüfe Preis und Menge — $4.180 · 1 ST · alles stimmt überein",
  },
  "run.pump.6.reasoning.3": {
    en: "Applying tolerance — variance $0.00, within threshold",
    de: "Wende die Toleranz an — Abweichung $0,00, innerhalb der Grenze",
  },
  "run.pump.6.reasoning.4": {
    en: "Clearing the seal invoice for today's AP batch",
    de: "Gebe die Dichtungsrechnung für den heutigen Zahllauf frei",
  },
  "run.pump.6.recommendation": {
    en: "Seal invoice is four-way clean — contract, PO, goods receipt and invoice agree at $4,180 with $0 variance, within tolerance. Cleared for today's AP batch; no exception to route.",
    de: "Die Dichtungsrechnung ist vierfach sauber — Vertrag, Bestellung, Wareneingang und Rechnung stimmen bei $4.180 mit $0 Abweichung überein, innerhalb der Toleranz. Für den heutigen Zahllauf freigegeben; keine Ausnahme weiterzuleiten.",
  },

  /* ── The other three runs ──────────────────────────────────────────── */
  "run.bearing.1.agentName": {
    en: "PR Processing agent",
    de: "Anforderungsbearbeitung",
  },
  "run.bearing.1.aiThought": {
    en: "A planned-maintenance request has come in from Assembly Line 1 — six pump diaphragms for the July shutdown. The planner gave the part number outright, so this should code cleanly.",
    de: "Eine Wartungsplanungs-Anforderung von Montagelinie 1 ist eingegangen — sechs Pumpenmembranen für den Juli-Stillstand. Der Planer hat die Teilenummer direkt genannt, das sollte sauber kontieren.",
  },
  "run.bearing.1.reasoning.0": {
    en: "Reading the planner's note from Assembly Line 1",
    de: "Lese die Notiz des Planers von Montagelinie 1",
  },
  "run.bearing.1.reasoning.3": {
    en: "No gaps to flag",
    de: "Keine Lücken zu kennzeichnen",
  },
  "run.bearing.2.agentName": {
    en: "Master Data agent",
    de: "Stammdaten-Agent",
  },
  "run.bearing.2.aiThought": {
    en: "Before anyone buys anything, three questions: is this a real material, has someone already asked for it, and do we already own it? Let me check all three.",
    de: "Vor jedem Kauf drei Fragen: Gibt es dieses Material wirklich, hat es schon jemand angefordert, und besitzen wir es bereits? Ich prüfe alle drei.",
  },
  "run.bearing.2.reasoning.0": {
    en: "Scanning open requisitions for the same material — none found",
    de: "Durchsuche offene Anforderungen nach demselben Material — keine gefunden",
  },
  "run.bearing.2.reasoning.1": {
    en: "Stock on hand across every plant — zero, and below safety stock here",
    de: "Bestand in allen Werken — null, und hier unter dem Sicherheitsbestand",
  },
  "run.bearing.2.recommendation": {
    en: "Material is active and stocked, no duplicate request is open, and the network holds none. There is nothing here that would stop the buy.",
    de: "Das Material ist aktiv und lagergeführt, keine Doppelanforderung offen, im Netzwerk ist keiner vorhanden. Nichts steht dem Kauf entgegen.",
  },
  "run.bearing.3.agentName": {
    en: "Warranty & coverage desk",
    de: "Gewährleistung & Deckung",
  },
  "run.bearing.3.aiThought": {
    en: "A diaphragm change can sometimes sit under an equipment warranty or a service contract. If it does, we should not be buying it at all. Let me check the register.",
    de: "Ein Membranwechsel kann unter eine Anlagengewährleistung oder einen Servicevertrag fallen. Wäre das so, dürften wir gar nicht kaufen. Ich sehe im Register nach.",
  },
  "run.bearing.3.reasoning.0": {
    en: "Equipment register · Assembly Line 1 drive end",
    de: "Anlagenregister · Montagelinie 1, Antriebsseite",
  },
  "run.bearing.3.reasoning.1": {
    en: "Drive rebuilt 2023 — parts warranty expired 2024",
    de: "Antrieb 2023 überholt — Teilegewährleistung 2024 abgelaufen",
  },
  "run.bearing.3.reasoning.2": {
    en: "No service contract covering consumable pump spares",
    de: "Kein Servicevertrag deckt Pumpen-Verschleißteile ab",
  },
  "run.bearing.3.reasoning.3": {
    en: "This is a planned replacement, not a failure claim",
    de: "Das ist ein geplanter Austausch, kein Schadensfall",
  },
  "run.bearing.3.recommendation": {
    en: "Out of warranty and outside every service contract, and it is a planned change rather than a failure. The plant carries the cost.",
    de: "Außerhalb der Gewährleistung und außerhalb jedes Servicevertrags, und es ist ein geplanter Wechsel, kein Ausfall. Die Kosten trägt das Werk.",
  },
  "run.bearing.4.agentName": {
    en: "Sourcing & contract agent",
    de: "Beschaffung & Vertrag",
  },
  "run.bearing.4.aiThought": {
    en: "We already buy this diaphragm, from this supplier, at a price we hold on file — the planner even named them. So there is nothing to source and nothing to negotiate. All I need to do is confirm the price on file still stands.",
    de: "Wir kaufen diese Membran bereits bei diesem Lieferanten zu einem hinterlegten Preis — der Planer hat ihn sogar genannt. Es gibt also nichts zu beschaffen und nichts zu verhandeln. Ich muss nur bestätigen, dass der hinterlegte Preis weiterhin gilt.",
  },
  "run.bearing.4.reasoning.0": {
    en: "Terms Net 30 · price held to 2026-12-31",
    de: "Konditionen Netto 30 · Preis gültig bis 31.12.2026",
  },
  "run.bearing.5.agentName": {
    en: "Approval & routing agent",
    de: "Freigabe & Weiterleitung",
  },
  "run.bearing.5.aiThought": {
    en: "Every check is clean and the value is small. The delegation table says the plant lead signs up to $5,000 — this is $888 for a stocked material at the price we hold. The rule releases it without a signature.",
    de: "Alle Prüfungen sind sauber und der Wert ist gering. Laut Delegationstabelle zeichnet die Werksleitung bis $5.000 — hier geht es um $888 für ein lagergeführtes Material zum hinterlegten Preis. Die Regel gibt das ohne Unterschrift frei.",
  },
  "run.bearing.5.reasoning.0": {
    en: "All prior checks clear — master data, stock, coverage, price",
    de: "Alle vorherigen Prüfungen bestanden — Stammdaten, Bestand, Deckung, Preis",
  },
  "run.bearing.5.reasoning.1": {
    en: "Release rule satisfied — no signature required",
    de: "Freigaberegel erfüllt — keine Unterschrift erforderlich",
  },
  "run.bearing.6.agentName": {
    en: "Invoice Matching agent",
    de: "Rechnungsprüfungs-Agent",
  },
  "run.bearing.6.aiThought": {
    en: "Apex has invoiced for the diaphragms. Before a cent moves, let me put the invoice beside the purchase order, the goods receipt and the contract, and check they all say the same thing.",
    de: "Apex hat die Membranen berechnet. Bevor ein Cent fließt, lege ich die Rechnung neben Bestellung, Wareneingang und Vertrag und prüfe, ob alle dasselbe sagen.",
  },
  "run.bearing.6.reasoning.0": {
    en: "Four-way match — every dimension agrees",
    de: "Vierfachabgleich — alle Dimensionen stimmen überein",
  },
  "run.off-catalogue.1.agentName": {
    en: "PR Processing agent",
    de: "Anforderungsbearbeitung",
  },
  "run.off-catalogue.1.aiThought": {
    en: "The engineer's note is in German and there is no part number in it. Let me structure the request first, then look for something that covers this grade — an agreement, a source list, an old price. If there is nothing, this has to go to market.",
    de: "Die Notiz des Ingenieurs ist auf Deutsch und enthält keine Teilenummer. Ich strukturiere die Anforderung zuerst und suche dann nach etwas, das diese Qualität abdeckt — einen Vertrag, eine Orderbuchpflege, einen alten Preis. Gibt es nichts, muss das an den Markt.",
  },
  "run.off-catalogue.1.reasoning.0": {
    en: "Reading the formulation lead's note from Deburring Line 1",
    de: "Lese die Notiz der Rezepturleitung von Entgratlinie 1",
  },
  "run.off-catalogue.1.reasoning.1": {
    en: "Coding it to a material and a plant",
    de: "Kontiere auf Material und Werk",
  },
  "run.off-catalogue.1.reasoning.2": {
    en: "Searching outline agreements for this material — nothing",
    de: "Durchsuche Rahmenverträge für dieses Material — nichts",
  },
  "run.off-catalogue.1.reasoning.3": {
    en: "Searching the source list and info records — nothing",
    de: "Durchsuche Orderbuch und Infosätze — nichts",
  },
  "run.off-catalogue.1.reasoning.4": {
    en: "No contract route exists · a competitive RFQ is the only honest price",
    de: "Kein Vertragsweg vorhanden · eine Ausschreibung ist der einzige ehrliche Preis",
  },
  "run.off-catalogue.1.recommendation": {
    en: "Nothing on file covers this grade, so there is no agreed price to buy at and nothing to hold a supplier to. It goes to market — and at twelve tonnes the clauses behind each price matter as much as the price.",
    de: "Nichts im Bestand deckt diese Qualität ab, es gibt also keinen vereinbarten Preis und nichts, woran ein Lieferant zu binden wäre. Das geht an den Markt — und bei zwölf Tonnen zählen die Klauseln hinter jedem Preis ebenso wie der Preis selbst.",
  },
  "run.off-catalogue.2.agentName": {
    en: "Sourcing & contract agent",
    de: "Beschaffung & Vertrag",
  },
  "run.off-catalogue.2.aiThought": {
    en: "No agreement means no shortlist either, so let me search for suppliers who actually make this grade. Most of them will be here in Germany — I will write to them in German, and to the overseas one in their own language.",
    de: "Kein Vertrag heißt auch keine Auswahlliste, also suche ich nach Lieferanten, die diese Qualität tatsächlich herstellen. Die meisten sitzen hier in Deutschland — ich schreibe sie auf Deutsch an, den überseeischen in seiner eigenen Sprache.",
  },
  "run.off-catalogue.2.reasoning.0": {
    en: "Searching the supplier master and the web",
    de: "Durchsuche den Lieferantenstamm und das Web",
  },
  "run.off-catalogue.2.reasoning.1": {
    en: "Four suppliers make or stock this lamination grade",
    de: "Vier Lieferanten fertigen oder lagern diese Blechqualität",
  },
  "run.off-catalogue.2.reasoning.2": {
    en: "Three are German · one manufacturer is in China",
    de: "Drei sind deutsch · ein Hersteller sitzt in China",
  },
  "run.off-catalogue.2.reasoning.3": {
    en: "Writing each request in the language they work in",
    de: "Schreibe jede Anfrage in der Sprache, in der sie arbeiten",
  },
  "run.off-catalogue.2.reasoning.4": {
    en: "Sending, and collecting what comes back",
    de: "Versende und sammle die Rückläufer",
  },
  "run.off-catalogue.2.recommendation": {
    en: "Four requests out, three quotes back and one refusal. The prices are close together; the lead times are not, and that is what this decision turns on.",
    de: "Vier Anfragen raus, drei Angebote zurück und eine Absage. Die Preise liegen eng beieinander, die Lieferzeiten nicht — und daran entscheidet sich die Sache.",
  },
  "run.off-catalogue.3.agentName": {
    en: "Sourcing & contract agent",
    de: "Beschaffung & Vertrag",
  },
  "run.off-catalogue.3.aiThought": {
    en: "Three usable quotes and one refusal. The spread on price is small; the spread on terms is not — freight, settlement and what happens if it slips. Let me weigh them properly.",
    de: "Drei brauchbare Angebote und eine Absage. Die Preisspanne ist klein, die Spanne bei den Konditionen nicht — Fracht, Skonto und was passiert, wenn es sich verzögert. Ich wäge das sauber ab.",
  },
  "run.off-catalogue.3.reasoning.0": {
    en: "Reading all four replies, two of them translated",
    de: "Lese alle vier Antworten, zwei davon übersetzt",
  },
  "run.off-catalogue.3.reasoning.1": {
    en: "Comparing unit price, lead time and what is actually in stock",
    de: "Vergleiche Stückpreis, Lieferzeit und tatsächlichen Lagerbestand",
  },
  "run.off-catalogue.3.reasoning.2": {
    en: "Costing the downtime the slower quotes would add",
    de: "Bewerte die Stillstandskosten der langsameren Angebote",
  },
  "run.off-catalogue.3.reasoning.3": {
    en: "Recommending one, and saying what the runner-up lost on",
    de: "Empfehle einen und benenne, woran der Zweitplatzierte scheiterte",
  },
  "run.off-catalogue.4.agentName": {
    en: "Approval & routing agent",
    de: "Freigabe & Weiterleitung",
  },
  "run.off-catalogue.4.aiThought": {
    en: "The supplier is chosen and the price is evidenced by three quotes. Let me raise the order, route it for the one signature it needs, and write to the supplier — in German, with the English alongside so you can check it before it goes.",
    de: "Der Lieferant steht fest und der Preis ist durch drei Angebote belegt. Ich lege die Bestellung an, leite sie zur einen nötigen Unterschrift weiter und schreibe dem Lieferanten — auf Deutsch, mit dem englischen Text daneben, damit Sie ihn vor dem Versand prüfen können.",
  },
  "run.off-catalogue.4.reasoning.0": {
    en: "Raising PO-77318 against the chosen quote",
    de: "Lege Bestellung PO-77318 zum gewählten Angebot an",
  },
  "run.off-catalogue.4.reasoning.1": {
    en: "Attaching all three quotes as the price evidence",
    de: "Hänge alle drei Angebote als Preisnachweis an",
  },
  "run.off-catalogue.4.reasoning.2": {
    en: "Drafting the order confirmation in German",
    de: "Entwerfe die Auftragsbestätigung auf Deutsch",
  },
  "run.onboarding.1.agentName": {
    en: "Sourcing & contract agent",
    de: "Beschaffung & Vertrag",
  },
  "run.onboarding.1.aiThought": {
    en: "Riomar needs two robotic weld cells recalibrated during the September shutdown, and we have no approved supplier for robotic calibration at all. There is nothing to compare against, so the market has to tell us the price.",
    de: "Riomar muss im September-Stillstand zwei Rührbehälter neu auskleiden lassen, und für Behälterbeschichtung haben wir überhaupt keinen zugelassenen Lieferanten. Es gibt nichts zum Vergleichen — den Preis muss der Markt nennen.",
  },
  "run.onboarding.1.reasoning.0": {
    en: "No approved supplier in this category — the buy cannot be routed to anyone",
    de: "Kein zugelassener Lieferant in dieser Kategorie — der Kauf lässt sich niemandem zuordnen",
  },
  "run.onboarding.1.reasoning.1": {
    en: "Searching the market for specialist robotic calibration contractors",
    de: "Suche im Markt nach Spezialisten für Roboterkalibrierung",
  },
  "run.onboarding.1.reasoning.2": {
    en: "Writing the request for quote from the shutdown scope",
    de: "Erstelle die Anfrage aus dem Stillstandsumfang",
  },
  "run.onboarding.1.reasoning.3": {
    en: "Drafting the emails for you to send",
    de: "Entwerfe die E-Mails für Ihren Versand",
  },
  "run.onboarding.1.reasoning.4": {
    en: "Collecting the quotes as they come back",
    de: "Sammle die eingehenden Angebote",
  },
  "run.onboarding.2.agentName": {
    en: "Master Data agent",
    de: "Stammdaten-Agent",
  },
  "run.onboarding.2.aiThought": {
    en: "The winning contractor has sent their registration pack as four separate documents. Let me read them and pull out the fields the supplier master actually needs.",
    de: "Der beauftragte Auftragnehmer hat seine Registrierungsunterlagen geschickt — auf Spanisch, als vier einzelne Dokumente. Ich lese sie und entnehme die Felder, die der Lieferantenstamm tatsächlich braucht.",
  },
  "run.onboarding.2.reasoning.0": {
    en: "Reading the registration email and its four attachments",
    de: "Lese die Registrierungs-E-Mail und ihre vier Anhänge",
  },
  "run.onboarding.2.reasoning.1": {
    en: "Matching the attachments to the email",
    de: "Gleiche die Anhänge mit der E-Mail ab",
  },
  "run.onboarding.2.reasoning.2": {
    en: "Certificate of incorporation → legal name, address, incorporation date",
    de: "Handelsregisterauszug → Firmenname, Anschrift, Gründungsdatum",
  },
  "run.onboarding.2.reasoning.3": {
    en: "Tax certificate → tax identification and VAT status",
    de: "Steuerbescheinigung → Steuernummer und Umsatzsteuerstatus",
  },
  "run.onboarding.2.reasoning.4": {
    en: "Insurance policy → cover and expiry",
    de: "Versicherungspolice → Deckung und Ablauf",
  },
  "run.onboarding.2.recommendation": {
    en: "Every field the supplier master needs was found in the documents themselves and translated. Nothing was typed by hand, so there is nothing to mistype.",
    de: "Jedes Feld, das der Lieferantenstamm braucht, wurde in den Dokumenten selbst gefunden und übersetzt. Nichts wurde von Hand eingegeben, also kann sich niemand vertippen.",
  },
  "run.onboarding.3.agentName": {
    en: "Master Data agent",
    de: "Stammdaten-Agent",
  },
  "run.onboarding.3.aiThought": {
    en: "A supplier record that is missing a field fails later, usually when someone is trying to pay them. Let me check each mandatory field against the document that proves it.",
    de: "Ein Lieferantensatz mit fehlendem Feld fällt später auf die Füße — meist genau dann, wenn jemand zahlen will. Ich prüfe jedes Pflichtfeld gegen das Dokument, das es belegt.",
  },
  "run.onboarding.3.reasoning.0": {
    en: "Reading the mandatory-field list for a supplier master",
    de: "Lese die Pflichtfeldliste für den Lieferantenstamm",
  },
  "run.onboarding.3.reasoning.1": {
    en: "Matching each field to the document that evidences it",
    de: "Ordne jedem Feld das belegende Dokument zu",
  },
  "run.onboarding.3.reasoning.2": {
    en: "Four of five proven by a document",
    de: "Vier von fünf durch ein Dokument belegt",
  },
  "run.onboarding.3.reasoning.3": {
    en: "Bank account present but not verifiable from paper alone",
    de: "Bankverbindung vorhanden, aber nicht allein aus Papier prüfbar",
  },
  "run.onboarding.3.recommendation": {
    en: "Nothing is missing. The bank account is flagged as unverified on purpose — it is set by callback, never from a document or a message.",
    de: "Es fehlt nichts. Die Bankverbindung ist bewusst als ungeprüft gekennzeichnet — sie wird per Rückruf gesetzt, nie aus einem Dokument oder einer Nachricht.",
  },
  "run.onboarding.4.agentName": {
    en: "Master Data agent",
    de: "Stammdaten-Agent",
  },
  "run.onboarding.4.aiThought": {
    en: "Before this supplier can be paid anything, they have to pass the screens. Sanctions, who actually owns them, whether they are solvent, and what taking them on does to our concentration.",
    de: "Bevor dieser Lieferant irgendetwas erhält, muss er die Prüfungen bestehen: Sanktionen, tatsächliche Eigentümer, Zahlungsfähigkeit — und was seine Aufnahme für unsere Konzentration bedeutet.",
  },
  "run.onboarding.4.reasoning.0": {
    en: "Sanctions screening against the consolidated lists",
    de: "Sanktionsprüfung gegen die konsolidierten Listen",
  },
  "run.onboarding.4.reasoning.1": {
    en: "Adverse-media search",
    de: "Negativ-Medienrecherche",
  },
  "run.onboarding.4.reasoning.2": {
    en: "Beneficial ownership against the register extract",
    de: "Wirtschaftlich Berechtigte gegen den Registerauszug",
  },
  "run.onboarding.4.reasoning.3": {
    en: "Insolvency and filed accounts",
    de: "Insolvenz und eingereichte Abschlüsse",
  },
  "run.onboarding.4.reasoning.4": {
    en: "Category concentration — first supplier here, so none",
    de: "Kategoriekonzentration — erster Lieferant hier, also keine",
  },
  "run.onboarding.4.recommendation": {
    en: "Clear on every screen. One thing diarised rather than escalated: the liability insurance expires 2027-03-31, so a renewal reminder is set against the record.",
    de: "In jeder Prüfung sauber. Eines wurde terminiert statt eskaliert: Die Haftpflichtversicherung läuft am 31.03.2027 ab, daher ist eine Erinnerung zur Verlängerung hinterlegt.",
  },
  "run.onboarding.5.agentName": {
    en: "Master Data agent",
    de: "Stammdaten-Agent",
  },
  "run.onboarding.5.aiThought": {
    en: "Everything checks out, so I can prepare the supplier master. I will fill every field I can evidence — and deliberately leave the bank account empty, because that one is set by callback.",
    de: "Alles stimmt, ich kann den Lieferantenstamm vorbereiten. Ich fülle jedes Feld, das ich belegen kann — und lasse die Bankverbindung bewusst leer, denn die wird per Rückruf gesetzt.",
  },
  "run.onboarding.5.reasoning.0": {
    en: "Filling the supplier master from the extracted fields",
    de: "Fülle den Lieferantenstamm aus den extrahierten Feldern",
  },
  "run.onboarding.5.reasoning.1": {
    en: "Setting purchasing org, category and the quoted payment terms",
    de: "Setze Einkaufsorganisation, Kategorie und die angebotenen Zahlungsbedingungen",
  },
  "run.onboarding.5.reasoning.2": {
    en: "Leaving the bank account blank — callback required",
    de: "Lasse die Bankverbindung leer — Rückruf erforderlich",
  },
  "run.onboarding.5.reasoning.3": {
    en: "Preparing one approval card for a person",
    de: "Bereite eine Freigabekarte für einen Menschen vor",
  },

  /* ── Run headers, and the hero run's stages ────────────────────────── */
  "flow.pump.contextTitle": {
    en: "Amberg · Assembly Line 2 · mechanical seal PR",
    de: "Amberg · Montagelinie 2 · Anforderung Gleitringdichtung",
  },
  "flow.pump.contextSub": {
    en: "Free-text request · intake structured it, every check cleared · released on contract",
    de: "Freitext-Anforderung · vom Eingang strukturiert, alle Prüfungen bestanden · auf Vertrag freigegeben",
  },
  "flow.pump.reviewPill": {
    en: "PR validation · in review",
    de: "Anforderungsprüfung · in Bearbeitung",
  },
  "flow.bearing.contextTitle": {
    en: "Amberg · Assembly Line 1 · pump diaphragm PR",
    de: "Amberg · Montagelinie 1 · Anforderung Pumpenmembran",
  },
  "flow.bearing.contextSub": {
    en: "Complete request · every check clean · released and paid without a person",
    de: "Vollständige Anforderung · alle Prüfungen sauber · ohne Zutun freigegeben und bezahlt",
  },
  "flow.bearing.reviewPill": {
    en: "PR validation · running",
    de: "Anforderungsprüfung · läuft",
  },
  "flow.off-catalogue.contextTitle": {
    en: "Deburring Plant · Deburring Line 1 · no agreement covers it",
    de: "Amberg · Entgratlinie 1 · kein Vertrag deckt das ab",
  },
  "flow.off-catalogue.contextSub": {
    en: "Nothing on contract · taken to market · four suppliers asked, three quoted",
    de: "Nichts auf Vertrag · an den Markt gegeben · vier Lieferanten angefragt, drei haben angeboten",
  },
  "flow.off-catalogue.reviewPill": {
    en: "Off-contract sourcing · in review",
    de: "Beschaffung außerhalb des Vertrags · in Bearbeitung",
  },
  "flow.onboarding.contextTitle": {
    en: "Riomar · vessel relining · new supplier",
    de: "Riomar · Behälterauskleidung · neuer Lieferant",
  },
  "flow.onboarding.contextSub": {
    en: "No approved supplier existed · market searched, quotes compared, supplier onboarded",
    de: "Kein zugelassener Lieferant vorhanden · Markt gesucht, Angebote verglichen, Lieferant angelegt",
  },
  "flow.onboarding.reviewPill": {
    en: "Supplier onboarding · in review",
    de: "Lieferantenanlage · in Bearbeitung",
  },
  "run.pump.1.stage.0.title": {
    en: "Item — what's needed",
    de: "Position — was gebraucht wird",
  },
  "run.pump.1.stage.1.title": {
    en: "Requisition header",
    de: "Anforderungskopf",
  },
  "run.pump.1.stage.2.title": {
    en: "Account assignment",
    de: "Kontierung",
  },
  "run.pump.1.stage.3.title": {
    en: "Stock on hand",
    de: "Lagerbestand",
  },
  "run.pump.1.stage.4.title": {
    en: "Source of supply",
    de: "Bezugsquelle",
  },
  "run.pump.2.stage.0.title": {
    en: "Material master · MM03",
    de: "Materialstamm · MM03",
  },
  "run.pump.2.stage.1.title": {
    en: "Duplicate scan · ME5A",
    de: "Duplikatsuche · ME5A",
  },
  "run.pump.2.stage.2.title": {
    en: "Stock overview · MB52",
    de: "Bestandsübersicht · MB52",
  },
  "run.pump.3.stage.0.title": {
    en: "Warranty & coverage · IQS3",
    de: "Gewährleistung & Deckung · IQS3",
  },
  "run.pump.4.stage.0.title": {
    en: "Price · ME33K SA-MRO-07",
    de: "Preis · ME33K SA-MRO-07",
  },
  "run.pump.6.stage.0.title": {
    en: "Four-way match — invoice vs PO",
    de: "Vierfachabgleich — Rechnung gegen Bestellung",
  },
  "run.pump.6.stage.1.title": {
    en: "Four-way match — adding the goods receipt",
    de: "Vierfachabgleich — Wareneingang ergänzt",
  },
  "run.pump.6.stage.2.title": {
    en: "Four-way match — adding the contract · verdict",
    de: "Vierfachabgleich — Vertrag ergänzt · Ergebnis",
  },
  "run.pump.1.stage.0.field.0": {
    en: "Material",
    de: "Material",
  },
  "run.pump.1.stage.0.field.1": {
    en: "Shaft diameter",
    de: "Wellendurchmesser",
  },
  "run.pump.1.stage.0.field.2": {
    en: "Quantity",
    de: "Menge",
  },
  "run.pump.1.stage.0.field.3": {
    en: "UoM",
    de: "Mengeneinheit",
  },
  "run.pump.1.stage.0.field.4": {
    en: "Delivery",
    de: "Lieferung",
  },
  "run.pump.1.stage.0.field.5": {
    en: "Delivery date",
    de: "Liefertermin",
  },
  "run.pump.1.stage.0.field.6": {
    en: "Requisitioner",
    de: "Anforderer",
  },
  "run.pump.1.stage.1.field.0": {
    en: "PR type",
    de: "Anforderungsart",
  },
  "run.pump.1.stage.1.field.1": {
    en: "Requestor",
    de: "Antragsteller",
  },
  "run.pump.1.stage.1.field.2": {
    en: "Purch. org",
    de: "Einkaufsorganisation",
  },
  "run.pump.1.stage.1.field.3": {
    en: "Purch. group",
    de: "Einkäufergruppe",
  },
  "run.pump.1.stage.2.field.0": {
    en: "Material code",
    de: "Materialcode",
  },
  "run.pump.1.stage.2.field.1": {
    en: "Plant",
    de: "Werk",
  },
  "run.pump.1.stage.2.field.2": {
    en: "Cost center",
    de: "Kostenstelle",
  },
  "run.pump.1.stage.2.field.3": {
    en: "G/L account",
    de: "Sachkonto",
  },
  "run.pump.1.stage.2.field.4": {
    en: "Material group",
    de: "Warengruppe",
  },
  "run.pump.1.stage.3.field.0": {
    en: "On-hand · this plant",
    de: "Bestand · dieses Werk",
  },
  "run.pump.1.stage.3.field.1": {
    en: "Interplant (Clairmont · Riomar)",
    de: "Werksübergreifend (Clairmont · Riomar)",
  },
  "run.pump.1.stage.3.field.2": {
    en: "Current safety stock",
    de: "Aktueller Sicherheitsbestand",
  },
  "run.pump.1.stage.3.field.3": {
    en: "Recommended safety stock",
    de: "Empfohlener Sicherheitsbestand",
  },
  "run.pump.1.stage.3.field.4": {
    en: "Verdict",
    de: "Ergebnis",
  },
  "run.pump.1.stage.4.field.0": {
    en: "Vendor",
    de: "Lieferant",
  },
  "run.pump.1.stage.4.field.1": {
    en: "Outline agreement",
    de: "Rahmenvertrag",
  },
  "run.pump.1.stage.4.field.2": {
    en: "Unit price",
    de: "Stückpreis",
  },
  "run.pump.1.stage.4.field.3": {
    en: "Total value",
    de: "Gesamtwert",
  },
  "run.pump.1.stage.4.field.4": {
    en: "Payment terms",
    de: "Zahlungsbedingungen",
  },
  "run.pump.2.stage.0.field.0": {
    en: "Material",
    de: "Material",
  },
  "run.pump.2.stage.0.field.1": {
    en: "Description",
    de: "Bezeichnung",
  },
  "run.pump.2.stage.0.field.2": {
    en: "Valuation class",
    de: "Bewertungsklasse",
  },
  "run.pump.2.stage.0.field.3": {
    en: "Status",
    de: "Status",
  },
  "run.pump.2.stage.1.field.0": {
    en: "Open PRs scanned",
    de: "Geprüfte offene Anforderungen",
  },
  "run.pump.2.stage.1.field.1": {
    en: "Same material",
    de: "Gleiches Material",
  },
  "run.pump.2.stage.1.field.2": {
    en: "Duplicate",
    de: "Duplikat",
  },
  "run.pump.2.stage.1.field.3": {
    en: "Result",
    de: "Ergebnis",
  },
  "run.pump.2.stage.2.field.0": {
    en: "On-hand · Amberg",
    de: "Bestand · Amberg",
  },
  "run.pump.2.stage.2.field.1": {
    en: "Clairmont plant",
    de: "Werk Clairmont",
  },
  "run.pump.2.stage.2.field.2": {
    en: "Riomar",
    de: "Riomar",
  },
  "run.pump.2.stage.2.field.3": {
    en: "Transfer possible",
    de: "Umlagerung möglich",
  },
  "run.pump.3.stage.0.field.0": {
    en: "Equipment",
    de: "Anlage",
  },
  "run.pump.3.stage.0.field.1": {
    en: "OEM warranty",
    de: "Herstellergewährleistung",
  },
  "run.pump.3.stage.0.field.2": {
    en: "Service contract",
    de: "Servicevertrag",
  },
  "run.pump.3.stage.0.field.3": {
    en: "Failure type",
    de: "Ausfallart",
  },
  "run.pump.3.stage.0.field.4": {
    en: "Claimable",
    de: "Anspruchsfähig",
  },
  "run.pump.3.stage.0.field.5": {
    en: "Outcome",
    de: "Ergebnis",
  },
  "run.pump.4.stage.0.field.0": {
    en: "Contract price",
    de: "Vertragspreis",
  },
  "run.pump.4.stage.0.field.1": {
    en: "PR price",
    de: "Anforderungspreis",
  },
  "run.pump.4.stage.0.field.2": {
    en: "Agreement",
    de: "Vertrag",
  },
  "run.pump.4.stage.0.field.3": {
    en: "Payment terms",
    de: "Zahlungsbedingungen",
  },
  "run.pump.4.stage.0.field.4": {
    en: "Off-contract leakage",
    de: "Vertragsabfluss",
  },

  /* ── The remaining stage labels, and the lines that carry figures ──── */
  "run.bearing.1.recommendation": {
    en: "Structured and coded to {0}, {1} EA at {2}, total {3}. Nothing is open — the part number, the quantity and the date were all given. Routed straight for the checks.",
    de: "Strukturiert und auf {0} kontiert, {1} ST zu {2}, gesamt {3}. Nichts ist offen — Teilenummer, Menge und Termin lagen alle vor. Direkt zur Prüfung weitergeleitet.",
  },
  "run.bearing.4.recommendation": {
    en: "The price the plant asked for is the price we already hold — {0} an each, {1} of them, {2}. Nothing to source, nothing to quote, nothing to negotiate.",
    de: "Der vom Werk angefragte Preis ist der Preis, den wir bereits halten — {0} je Stück, {1} Stück, {2}. Nichts zu beschaffen, nichts anzufragen, nichts zu verhandeln.",
  },
  "run.bearing.5.recommendation": {
    en: "Released under the plant's own limit and ordered as {0}. This is the case nobody has to touch — and the reason the other requests get the attention instead.",
    de: "Innerhalb der werkseigenen Grenze freigegeben und als {0} bestellt. Dieser Fall braucht niemanden — und genau deshalb bekommen die anderen Anforderungen die Aufmerksamkeit.",
  },
  "run.bearing.6.recommendation": {
    en: "Contract, order, goods receipt and invoice agree to the cent. {0} cleared for the payment run on Net 30 — no variance, no hold, nobody asked to approve it.",
    de: "Vertrag, Bestellung, Wareneingang und Rechnung stimmen auf den Cent überein. {0} für den Zahllauf zu Netto 30 freigegeben — keine Abweichung, keine Sperre, niemand musste freigeben.",
  },
  "run.off-catalogue.3.recommendation": {
    en: "Süddeutsche Dichtungswerke at {0} — from stock, shipping this week. It is {1} more than the cheapest quote and four days sooner, and four days of a stopped mixing line costs considerably more than {2}.",
    de: "Süddeutsche Dichtungswerke zu {0} — ab Lager, Versand diese Woche. Das sind {1} mehr als das günstigste Angebot, dafür vier Tage früher — und vier Tage stillstehende Montagelinie kosten erheblich mehr als {2}.",
  },
  "run.off-catalogue.4.recommendation": {
    en: "{0} raised to Süddeutsche Dichtungswerke for {1}, with three competitive quotes on file behind the price. One signature releases it, and the confirmation goes out in German.",
    de: "{0} an Süddeutsche Dichtungswerke über {1} angelegt, mit drei Wettbewerbsangeboten als Preisnachweis. Eine Unterschrift gibt sie frei, die Bestätigung geht auf Deutsch hinaus.",
  },
  "run.onboarding.1.recommendation": {
    en: "Two quotes in. The winning contractor at {0} is {1} below the alternative and is the only one that mobilises inside the shutdown. Recommended — but they are not a supplier of ours yet, so onboarding comes first.",
    de: "Zwei Angebote liegen vor. Der siegreiche Auftragnehmer liegt mit {0} um {1} unter der Alternative und ist der Einzige, der innerhalb des Stillstands mobilisieren kann. Empfohlen — er ist aber noch kein Lieferant von uns, also kommt zuerst die Anlage.",
  },
  "run.onboarding.5.recommendation": {
    en: "Prepared, not created. One signature sets the contractor up as a supplier and releases the {0} order; the bank account is set separately, after a callback to the number on the company register rather than the one in the email.",
    de: "Vorbereitet, nicht angelegt. Eine Unterschrift legt den Auftragnehmer als Lieferanten an und gibt die Bestellung über {0} frei; die Bankverbindung wird separat gesetzt — nach einem Rückruf an die Nummer im Handelsregister, nicht an die aus der E-Mail.",
  },
  "run.bearing.1.stage.0.title": {
    en: "Item — what's needed",
    de: "Position — was gebraucht wird",
  },
  "run.bearing.1.stage.1.title": {
    en: "Requisition header",
    de: "Anforderungskopf",
  },
  "run.bearing.1.stage.2.title": {
    en: "Account assignment",
    de: "Kontierung",
  },
  "run.bearing.2.stage.0.title": {
    en: "Material master · MM03",
    de: "Materialstamm · MM03",
  },
  "run.bearing.2.stage.1.title": {
    en: "Stock overview · MB52",
    de: "Bestandsübersicht · MB52",
  },
  "run.bearing.3.stage.0.title": {
    en: "Warranty & coverage · IQS3",
    de: "Gewährleistung & Deckung · IQS3",
  },
  "run.bearing.5.stage.0.title": {
    en: "Release routing · WF-48692-REL",
    de: "Freigabeweg · WF-48692-REL",
  },
  "run.bearing.6.stage.0.title": {
    en: "Four-way match — invoice vs PO",
    de: "Vierfachabgleich — Rechnung gegen Bestellung",
  },
  "run.bearing.6.stage.1.title": {
    en: "Four-way match — adding the goods receipt",
    de: "Vierfachabgleich — Wareneingang ergänzt",
  },
  "run.bearing.6.stage.2.title": {
    en: "Four-way match — adding the contract · verdict",
    de: "Vierfachabgleich — Vertrag ergänzt · Ergebnis",
  },
  "run.off-catalogue.1.stage.0.title": {
    en: "Source of supply",
    de: "Bezugsquelle",
  },
  "run.onboarding.2.stage.0.title": {
    en: "The submission",
    de: "Die Einreichung",
  },
  "run.onboarding.2.stage.1.title": {
    en: "Extracted fields",
    de: "Extrahierte Felder",
  },
  "run.onboarding.3.stage.0.title": {
    en: "Mandatory fields",
    de: "Pflichtfelder",
  },
  "run.onboarding.4.stage.0.title": {
    en: "Screening result",
    de: "Prüfergebnis",
  },
  "run.onboarding.5.stage.0.title": {
    en: "Supplier master · prepared",
    de: "Lieferantenstamm · vorbereitet",
  },
  "run.onboarding.5.stage.1.title": {
    en: "Approval · WF-49010-VEN",
    de: "Freigabe · WF-49010-VEN",
  },
  "run.bearing.1.stage.0.field.0": {
    en: "Material",
    de: "Material",
  },
  "run.bearing.1.stage.0.field.1": {
    en: "Description",
    de: "Bezeichnung",
  },
  "run.bearing.1.stage.0.field.2": {
    en: "Quantity",
    de: "Menge",
  },
  "run.bearing.1.stage.0.field.3": {
    en: "UoM",
    de: "Mengeneinheit",
  },
  "run.bearing.1.stage.0.field.4": {
    en: "Delivery date",
    de: "Liefertermin",
  },
  "run.bearing.1.stage.0.field.5": {
    en: "Requisitioner",
    de: "Anforderer",
  },
  "run.bearing.1.stage.1.field.0": {
    en: "PR type",
    de: "Anforderungsart",
  },
  "run.bearing.1.stage.1.field.1": {
    en: "Requestor",
    de: "Antragsteller",
  },
  "run.bearing.1.stage.1.field.2": {
    en: "Purch. org",
    de: "Einkaufsorganisation",
  },
  "run.bearing.1.stage.1.field.3": {
    en: "Purch. group",
    de: "Einkäufergruppe",
  },
  "run.bearing.1.stage.2.field.0": {
    en: "Material code",
    de: "Materialcode",
  },
  "run.bearing.1.stage.2.field.1": {
    en: "Plant",
    de: "Werk",
  },
  "run.bearing.1.stage.2.field.2": {
    en: "Cost center",
    de: "Kostenstelle",
  },
  "run.bearing.1.stage.2.field.3": {
    en: "G/L account",
    de: "Sachkonto",
  },
  "run.bearing.2.stage.0.field.0": {
    en: "Material",
    de: "Material",
  },
  "run.bearing.2.stage.0.field.1": {
    en: "Status",
    de: "Status",
  },
  "run.bearing.2.stage.0.field.2": {
    en: "Valuation class",
    de: "Bewertungsklasse",
  },
  "run.bearing.2.stage.0.field.3": {
    en: "Last purchase",
    de: "Letzter Einkauf",
  },
  "run.bearing.2.stage.1.field.0": {
    en: "Amberg · Assembly Line 1",
    de: "Amberg · Montagelinie 1",
  },
  "run.bearing.2.stage.1.field.1": {
    en: "Clairmont",
    de: "Clairmont",
  },
  "run.bearing.2.stage.1.field.2": {
    en: "Riomar",
    de: "Riomar",
  },
  "run.bearing.2.stage.1.field.3": {
    en: "Verdict",
    de: "Ergebnis",
  },
  "run.bearing.3.stage.0.field.0": {
    en: "Parts warranty",
    de: "Teilegewährleistung",
  },
  "run.bearing.3.stage.0.field.1": {
    en: "Service contract",
    de: "Servicevertrag",
  },
  "run.bearing.3.stage.0.field.2": {
    en: "Outcome",
    de: "Ergebnis",
  },
  "run.bearing.4.stage.0.field.0": {
    en: "Supplier",
    de: "Lieferant",
  },
  "run.bearing.4.stage.0.field.1": {
    en: "Price we hold",
    de: "Hinterlegter Preis",
  },
  "run.bearing.4.stage.0.field.2": {
    en: "Price requested",
    de: "Angefragter Preis",
  },
  "run.bearing.4.stage.0.field.3": {
    en: "Line value",
    de: "Positionswert",
  },
  "run.bearing.4.stage.0.field.4": {
    en: "Terms",
    de: "Konditionen",
  },
  "run.bearing.5.stage.0.field.0": {
    en: "Value",
    de: "Wert",
  },
  "run.bearing.5.stage.0.field.1": {
    en: "L1 · Plant Maintenance lead",
    de: "L1 · Leitung Werksinstandhaltung",
  },
  "run.bearing.5.stage.0.field.2": {
    en: "Signature required",
    de: "Unterschrift erforderlich",
  },
  "run.bearing.5.stage.0.field.3": {
    en: "Outcome",
    de: "Ergebnis",
  },
  "run.bearing.5.stage.1.field.0": {
    en: "Supplier",
    de: "Lieferant",
  },
  "run.bearing.5.stage.1.field.1": {
    en: "Quantity",
    de: "Menge",
  },
  "run.bearing.5.stage.1.field.2": {
    en: "Net value",
    de: "Nettowert",
  },
  "run.bearing.5.stage.1.field.3": {
    en: "Delivery",
    de: "Lieferung",
  },
  "run.off-catalogue.1.stage.0.field.0": {
    en: "Material",
    de: "Material",
  },
  "run.off-catalogue.1.stage.0.field.1": {
    en: "Outline agreement",
    de: "Rahmenvertrag",
  },
  "run.off-catalogue.1.stage.0.field.2": {
    en: "Source list",
    de: "Orderbuch",
  },
  "run.off-catalogue.1.stage.0.field.3": {
    en: "Last price paid",
    de: "Zuletzt gezahlter Preis",
  },
  "run.off-catalogue.1.stage.0.field.4": {
    en: "Route",
    de: "Weg",
  },
  "run.onboarding.2.stage.0.field.0": {
    en: "Received",
    de: "Eingegangen",
  },
  "run.onboarding.2.stage.0.field.1": {
    en: "Written in",
    de: "Verfasst in",
  },
  "run.onboarding.2.stage.0.field.2": {
    en: "Documents",
    de: "Dokumente",
  },
  "run.onboarding.2.stage.0.field.3": {
    en: "Tax ID stated",
    de: "Angegebene Steuernummer",
  },
  "run.onboarding.2.stage.1.field.0": {
    en: "Legal name",
    de: "Firmenname",
  },
  "run.onboarding.2.stage.1.field.1": {
    en: "Registered address",
    de: "Eingetragene Anschrift",
  },
  "run.onboarding.2.stage.1.field.2": {
    en: "Tax ID",
    de: "Steuernummer",
  },
  "run.onboarding.2.stage.1.field.3": {
    en: "Public liability",
    de: "Haftpflicht",
  },
  "run.onboarding.3.stage.0.field.0": {
    en: "Legal name",
    de: "Firmenname",
  },
  "run.onboarding.3.stage.0.field.1": {
    en: "Registered address",
    de: "Eingetragene Anschrift",
  },
  "run.onboarding.3.stage.0.field.2": {
    en: "Tax identification",
    de: "Steuerliche Identifikation",
  },
  "run.onboarding.3.stage.0.field.3": {
    en: "Public liability cover",
    de: "Haftpflichtdeckung",
  },
  "run.onboarding.3.stage.0.field.4": {
    en: "Bank account",
    de: "Bankverbindung",
  },
  "run.onboarding.4.stage.0.field.0": {
    en: "Sanctions",
    de: "Sanktionen",
  },
  "run.onboarding.4.stage.0.field.1": {
    en: "Adverse media",
    de: "Negativmedien",
  },
  "run.onboarding.4.stage.0.field.2": {
    en: "Beneficial ownership",
    de: "Wirtschaftlich Berechtigte",
  },
  "run.onboarding.4.stage.0.field.3": {
    en: "Insolvency",
    de: "Insolvenz",
  },
  "run.onboarding.4.stage.0.field.4": {
    en: "Insurance expiry",
    de: "Ablauf der Versicherung",
  },
  "run.onboarding.5.stage.0.field.0": {
    en: "Supplier",
    de: "Lieferant",
  },
  "run.onboarding.5.stage.0.field.1": {
    en: "Number",
    de: "Nummer",
  },
  "run.onboarding.5.stage.0.field.2": {
    en: "Payment terms",
    de: "Zahlungsbedingungen",
  },
  "run.onboarding.5.stage.0.field.3": {
    en: "Bank account",
    de: "Bankverbindung",
  },
  "run.onboarding.5.stage.1.field.0": {
    en: "To sign",
    de: "Zu unterzeichnen",
  },
  "run.onboarding.5.stage.1.field.1": {
    en: "Compliance",
    de: "Compliance",
  },
  "run.onboarding.5.stage.1.field.2": {
    en: "Creates",
    de: "Erstellt",
  },
  "run.onboarding.5.stage.1.field.3": {
    en: "Does not set",
    de: "Setzt nicht",
  },

  /* ── Reading the quotes that came back ─────────────────────────────── */
  "qr.quotesIn": {
    en: "Quotes in · {n} suppliers",
    de: "Angebote da · {n} Lieferanten",
  },
  "qr.compared": {
    en: "compared",
    de: "verglichen",
  },
  "qr.comparing": {
    en: "comparing…",
    de: "vergleicht …",
  },
  "qr.readyToCompare": {
    en: "ready to compare",
    de: "bereit zum Vergleich",
  },
  "qr.noQuote": {
    en: "No quote",
    de: "Kein Angebot",
  },
  "qr.emailReply": {
    en: "Email reply · quote",
    de: "Antwort per E-Mail · Angebot",
  },
  "qr.allIn": {
    en: "All-in",
    de: "Gesamt",
  },
  "qr.openEmail": {
    en: "Open email",
    de: "E-Mail öffnen",
  },
  "qr.openQuote": {
    en: "Open email · quotation PDF",
    de: "E-Mail öffnen · Angebots-PDF",
  },
  "qr.compare": {
    en: "Compare the quotes",
    de: "Angebote vergleichen",
  },
  "qr.weighing": {
    en: "Weighing price against lead time and what the downtime costs…",
    de: "Wäge Preis gegen Lieferzeit und Stillstandskosten ab …",
  },
  "qr.accept": {
    en: "Accept {vendor}",
    de: "{vendor} annehmen",
  },
  "phrase.Break applied": {
    en: "Break applied",
    de: "Angewandte Staffel",
  },
  "phrase.Settlement": {
    en: "Settlement",
    de: "Skonto",
  },
  "phrase.Freight": {
    en: "Freight",
    de: "Fracht",
  },
  "phrase.Cancellation": {
    en: "Cancellation",
    de: "Stornierung",
  },
  "phrase.Late delivery": {
    en: "Late delivery",
    de: "Lieferverzug",
  },
  "phrase.Quality & shelf life": {
    en: "Quality & shelf life",
    de: "Qualität & Haltbarkeit",
  },
  "phrase.Quote valid": {
    en: "Quote valid",
    de: "Angebot bindend",
  },
  "phrase.None offered": {
    en: "None offered",
    de: "Nicht angeboten",
  },
  "phrase.Included · DAP": {
    en: "Included · DAP",
    de: "Inklusive · DAP",
  },
  "phrase.Locked once released": {
    en: "Locked once released",
    de: "Nach Freigabe fixiert",
  },
  "phrase.Cancellable up to dispatch": {
    en: "Cancellable up to dispatch",
    de: "Bis Versand stornierbar",
  },
  "phrase.No penalty": {
    en: "No penalty",
    de: "Keine Pönale",
  },
  "phrase.0.5% per week late, capped at 5%": {
    en: "0.5% per week late, capped at 5%",
    de: "0,5% je Verzugswoche, maximal 5%",
  },
  "phrase.CoA per batch · 12 months shelf life": {
    en: "CoA per batch · 12 months shelf life",
    de: "Analysenzertifikat je Charge · 12 Monate haltbar",
  },
  "phrase.CoA per batch · 9 months shelf life": {
    en: "CoA per batch · 9 months shelf life",
    de: "Analysenzertifikat je Charge · 9 Monate haltbar",
  },
  "phrase.CoA per batch · 18 months shelf life": {
    en: "CoA per batch · 18 months shelf life",
    de: "Analysenzertifikat je Charge · 18 Monate haltbar",
  },
  "phrase.30 days": {
    en: "30 days",
    de: "30 Tage",
  },
  "phrase.21 days": {
    en: "21 days",
    de: "21 Tage",
  },
  "phrase.goods + freight − settlement": {
    en: "goods + freight − settlement",
    de: "Ware + Fracht − Skonto",
  },
  "phrase.7 days lead": {
    en: "7 days lead",
    de: "7 Tage Lieferzeit",
  },
  "phrase.9 days lead": {
    en: "9 days lead",
    de: "9 Tage Lieferzeit",
  },
  "phrase.5 days lead": {
    en: "5 days lead",
    de: "5 Tage Lieferzeit",
  },
  "phrase.Declined": {
    en: "Declined",
    de: "Abgelehnt",
  },
  "phrase.Distributor part load. No settlement discount, and no penalty if it slips.": {
    en: "Distributor part load. No settlement discount, and no penalty if it slips.",
    de: "Händler-Teilladung. Kein Skonto, und keine Pönale bei Verzug.",
  },
  "phrase.Cheapest a tonne — but ex works, non-cancellable, and a shorter shelf life.": {
    en: "Cheapest a tonne — but ex works, non-cancellable, and a shorter shelf life.",
    de: "Je Tonne am günstigsten — aber ab Werk, nicht stornierbar und kürzer haltbar.",
  },
  "phrase.Dearest a tonne, but delivered, cancellable, and it stands behind the date.": {
    en: "Dearest a tonne, but delivered, cancellable, and it stands behind the date.",
    de: "Je Tonne am teuersten, aber frei Haus, stornierbar — und sie stehen für den Termin ein.",
  },
  "phrase.Electrical steel line fully booked this quarter — would requote for September.": {
    en: "Electrical steel line fully booked this quarter — would requote for September.",
    de: "Titandioxid-Linie in diesem Quartal ausgebucht — würde für September neu anbieten.",
  },
  "phrase.Three quotes to compare — Hengtai has declined on capacity": {
    en: "Three quotes to compare — Hengtai has declined on capacity",
    de: "Drei Angebote zu vergleichen — Hengtai hat wegen Kapazität abgesagt",
  },
  "phrase.The cheapest is also the only one that cannot be cancelled and offers no delivery penalty": {
    en: "The cheapest is also the only one that cannot be cancelled and offers no delivery penalty",
    de: "Das günstigste ist zugleich das einzige, das nicht stornierbar ist und keine Verzugspönale bietet",
  },
  "phrase.On the tonne price they are within # of each other · # to # a tonne": {
    en: "On the tonne price they are within # of each other · # to # a tonne",
    de: "Beim Tonnenpreis liegen sie {0} auseinander · {1} bis {2} je Tonne",
  },
  "phrase.At # t that is a # spread on the sticker — worth reading the clauses before believing it": {
    en: "At # t that is a # spread on the sticker — worth reading the clauses before believing it",
    de: "Bei {0} t sind das {1} Unterschied auf dem Papier — es lohnt, erst die Klauseln zu lesen",
  },
  "phrase.Nordwest is EXW, so # of haulage lands on us; the other two deliver carriage paid": {
    en: "Nordwest is EXW, so # of haulage lands on us; the other two deliver carriage paid",
    de: "Nordfarben liefert ab Werk, also fallen {0} Fracht bei uns an; die beiden anderen liefern frei Haus",
  },
  "phrase.Settlement discounts differ — #% in # days against #% in #, and none at all from Rheinstahl": {
    en: "Settlement discounts differ — #% in # days against #% in #, and none at all from Rheinstahl",
    de: "Die Skonti unterscheiden sich — {0}% in {1} Tagen gegen {2}% in {3}, und von Rheinstahl gar keins",
  },
  "phrase.All-in the three land at #, # and # — a # spread, not #": {
    en: "All-in the three land at #, # and # — a # spread, not #",
    de: "Gesamt landen die drei bei {0}, {1} und {2} — {3} Unterschied, nicht {4}",
  },
  "phrase.All three quote a # t break — we are ordering exactly # t, so the break is already in the price": {
    en: "All three quote a # t break — we are ordering exactly # t, so the break is already in the price",
    de: "Alle drei nennen eine Staffel ab {0} t — wir bestellen genau {1} t, die Staffel steckt also schon im Preis",
  },
  "phrase.Süddeutsche Elektrobleche — # / t, # all-in, # t ex stock": {
    en: "Süddeutsche Elektrobleche — # / t, # all-in, # t ex stock",
    de: "Süddeutsche Elektrobleche — {0} / t, {1} gesamt, {2} t ab Lager",
  },
  "phrase.They are the only one holding the full # t on the shelf, they deliver carriage paid, and they take #% off if we settle in # days. Cancellable up to dispatch and 0.5% per week late, capped at 5% if the date slips — for a line that is down, that is what we are buying.": {
    en: "They are the only one holding the full # t on the shelf, they deliver carriage paid, and they take #% off if we settle in # days. Cancellable up to dispatch and 0.5% per week late, capped at 5% if the date slips — for a line that is down, that is what we are buying.",
    de: "Nur sie haben die vollen {0} t am Lager, liefern frei Haus und geben {1}% Skonto bei Zahlung in {2} Tagen. Bis Versand stornierbar, und bei Verzug 0,5% je Woche, maximal 5% — bei stillstehender Linie ist genau das der Kaufgrund.",
  },
  "phrase.Nordwest looks # cheaper on the sticker, but ex works it adds # of haulage and lands at # — # apart, not #. For that we would take a nine-day wait, a batch we cannot cancel once the campaign is scheduled, no penalty if it slips, and three months less shelf life.": {
    en: "Nordwest looks # cheaper on the sticker, but ex works it adds # of haulage and lands at # — # apart, not #. For that we would take a nine-day wait, a batch we cannot cancel once the campaign is scheduled, no penalty if it slips, and three months less shelf life.",
    de: "Nordfarben sieht auf dem Papier {0} günstiger aus, ab Werk kommen aber {1} Fracht dazu und es landet bei {2} — {3} Unterschied, nicht {4}. Dafür nähmen wir neun Tage Wartezeit in Kauf, eine nach Einplanung nicht stornierbare Charge, keine Verzugspönale und drei Monate weniger Haltbarkeit.",
  },
  "phrase.Assembly Line 2 is stopped, so every extra day is lost output": {
    en: "Assembly Line 2 is stopped, so every extra day is lost output",
    de: "Die Montagelinie steht, jeder zusätzliche Tag ist verlorene Produktion",
  },

  /* ── Step titles, as the rail shows them ───────────────────────────── */
  "run.pump.1.title": {
    en: "Structure & code the request",
    de: "Anforderung strukturieren & kontieren",
  },
  "run.pump.2.title": {
    en: "Master data, duplicate & inventory",
    de: "Stammdaten, Duplikat & Bestand",
  },
  "run.pump.3.title": {
    en: "Warranty & coverage",
    de: "Gewährleistung & Deckung",
  },
  "run.pump.4.title": {
    en: "Vendor & agreed price",
    de: "Lieferant & vereinbarter Preis",
  },
  "run.pump.5.title": {
    en: "Approval & routing",
    de: "Freigabe & Weiterleitung",
  },
  "run.pump.6.title": {
    en: "Invoice four-way match",
    de: "Rechnung im Vierfachabgleich",
  },
  "run.bearing.1.title": {
    en: "Structure & code the request",
    de: "Anforderung strukturieren & kontieren",
  },
  "run.bearing.2.title": {
    en: "Master data, duplicate & inventory",
    de: "Stammdaten, Duplikat & Bestand",
  },
  "run.bearing.3.title": {
    en: "Warranty & coverage",
    de: "Gewährleistung & Deckung",
  },
  "run.bearing.4.title": {
    en: "Supplier & price",
    de: "Lieferant & Preis",
  },
  "run.bearing.5.title": {
    en: "Approval & routing",
    de: "Freigabe & Weiterleitung",
  },
  "run.bearing.6.title": {
    en: "Invoice four-way match",
    de: "Rechnung im Vierfachabgleich",
  },
  "run.off-catalogue.1.title": {
    en: "Read it, and find nothing covering it",
    de: "Lesen — und nichts finden, was es abdeckt",
  },
  "run.off-catalogue.2.title": {
    en: "Go to market",
    de: "An den Markt gehen",
  },
  "run.off-catalogue.3.title": {
    en: "Weigh what came back",
    de: "Abwägen, was zurückkam",
  },
  "run.off-catalogue.4.title": {
    en: "Raise the order",
    de: "Bestellung anlegen",
  },
  "run.onboarding.1.title": {
    en: "Find suppliers & get quotes",
    de: "Lieferanten finden & Angebote einholen",
  },
  "run.onboarding.2.title": {
    en: "Read the submitted documents",
    de: "Eingereichte Unterlagen lesen",
  },
  "run.onboarding.3.title": {
    en: "Check nothing is missing",
    de: "Prüfen, dass nichts fehlt",
  },
  "run.onboarding.4.title": {
    en: "Compliance & risk screening",
    de: "Compliance- und Risikoprüfung",
  },
  "run.onboarding.5.title": {
    en: "Prepare the supplier record",
    de: "Lieferantensatz vorbereiten",
  },

  /* ── Seeing past the single order ──────────────────────────────────── */
  "insight.adoption": {
    en: "Catalogue adoption · this category",
    de: "Katalognutzung · diese Kategorie",
  },
  "insight.throughCatalogue": {
    en: "Current adoption",
    de: "Aktuelle Nutzung",
  },
  "insight.target": {
    en: "Target",
    de: "Ziel",
  },
  "insight.worthMoving": {
    en: "Addressable value",
    de: "Erschließbarer Wert",
  },
  "insight.requestsFound": {
    en: "Off-catalogue requests",
    de: "Anfragen außerhalb des Katalogs",
  },
  "insight.whoElse": {
    en: "Network consumption by site",
    de: "Netzwerkverbrauch nach Standort",
  },
  "insight.priceBreaks": {
    en: "Price break position",
    de: "Position in der Preisstaffel",
  },
  "insight.perUnit": {
    en: "per unit",
    de: "je Stück",
  },
  "insight.atOurVolume": {
    en: "Annual volume analysis",
    de: "Jahresmengenanalyse",
  },
  "insight.oneOrThree": {
    en: "Order consolidation analysis",
    de: "Analyse der Bestellkonsolidierung",
  },

  /* ── The catalogue buy ─────────────────────────────────────────────── */
  "run.catalogue.1.agentName": {
    en: "PR Processing agent",
    de: "Anforderungsbearbeitung",
  },
  "run.catalogue.1.title": {
    en: "Structure & code the request",
    de: "Anforderung strukturieren & kontieren",
  },
  "run.catalogue.1.aiThought": {
    en: "A quarterly filter change has come in from Deburring Line 1 — 400 bags, and the engineer gave the material number outright. This should code straight onto the catalogue. What interests me more is that it arrived as an email at all.",
    de: "Ein Quartals-Filterwechsel von Entgratlinie 1 ist eingegangen — 400 Beutel, und der Ingenieur hat die Materialnummer direkt genannt. Das sollte unmittelbar auf den Katalog kontieren. Interessanter finde ich, dass es überhaupt als E-Mail kam.",
  },
  "run.catalogue.1.reasoning.0": {
    en: "Reading the process engineer's note from Deburring Line 1",
    de: "Lese die Notiz des Verfahrensingenieurs von Entgratlinie 1",
  },
  "run.catalogue.1.reasoning.1": {
    en: "Matching it to the catalogue item on the material master",
    de: "Ordne es dem Katalogartikel im Materialstamm zu",
  },
  "run.catalogue.1.reasoning.2": {
    en: "Coding cost centre 10034 · GL 600420",
    de: "Kontiere Kostenstelle 10034 · Sachkonto 600420",
  },
  "run.catalogue.1.reasoning.3": {
    en: "Checking how this category's demand usually reaches us",
    de: "Prüfe, wie die Nachfrage dieser Kategorie sonst zu uns kommt",
  },
  "run.catalogue.1.recommendation": {
    en: "Coded to MRO-FILT-BAG-25UM-PP at 400 EA, $8,960.00 — a clean catalogue match. It came in as free text, though, and it did not have to: this item has been on the catalogue for five years.",
    de: "Auf MRO-FILT-BAG-25UM-PP kontiert, 400 ST, $8.960,00 — ein sauberer Katalogtreffer. Es kam allerdings als Freitext, und das hätte nicht sein müssen: Der Artikel steht seit fünf Jahren im Katalog.",
  },
  "run.catalogue.2.agentName": {
    en: "Master Data agent",
    de: "Stammdaten-Agent",
  },
  "run.catalogue.2.title": {
    en: "Master data, duplicate & inventory",
    de: "Stammdaten, Duplikat & Bestand",
  },
  "run.catalogue.2.aiThought": {
    en: "Three questions before anyone buys: is the material real, has someone already asked for it, and do we already hold it. Then a fourth this one deserves — who else in the network buys the same bag.",
    de: "Drei Fragen vor jedem Kauf: Gibt es das Material, hat es schon jemand angefordert, halten wir es bereits. Und eine vierte, die dieser Fall verdient — wer im Netzwerk kauft denselben Beutel.",
  },
  "run.catalogue.2.reasoning.0": {
    en: "Confirming the catalogue item on the material master",
    de: "Bestätige den Katalogartikel im Materialstamm",
  },
  "run.catalogue.2.reasoning.1": {
    en: "Scanning open requisitions for a duplicate — none found",
    de: "Durchsuche offene Anforderungen auf Duplikate — keine gefunden",
  },
  "run.catalogue.2.reasoning.2": {
    en: "Reading stock at every plant — small buffers, none can cover a change",
    de: "Lese den Bestand jedes Werks — kleine Puffer, keiner deckt einen Wechsel",
  },
  "run.catalogue.2.reasoning.3": {
    en: "Pulling twelve months of consumption across the network",
    de: "Ziehe zwölf Monate Verbrauch über das gesamte Netzwerk",
  },
  "run.catalogue.2.recommendation": {
    en: "The item is real, no duplicate is open, and no plant holds enough to cover a change. The buy is justified — and the consumption history says four sites are buying the same bag separately.",
    de: "Der Artikel existiert, kein Duplikat ist offen, und kein Werk hält genug für einen Wechsel. Der Kauf ist begründet — und die Verbrauchshistorie zeigt: vier Standorte kaufen denselben Beutel getrennt.",
  },
  "run.catalogue.3.agentName": {
    en: "Sourcing & contract agent",
    de: "Beschaffung & Vertrag",
  },
  "run.catalogue.3.title": {
    en: "Supplier & price break",
    de: "Lieferant & Preisstaffel",
  },
  "run.catalogue.3.aiThought": {
    en: "We are on agreement with Apex for this bag, so the supplier is settled. The price is not quite settled: the agreement publishes four breaks, and where we land depends entirely on how much we put on one order.",
    de: "Für diesen Beutel besteht ein Vertrag mit Apex, der Lieferant ist also geklärt. Der Preis nicht ganz: Der Vertrag veröffentlicht vier Staffeln, und wo wir landen, hängt allein davon ab, wie viel auf eine Bestellung geht.",
  },
  "run.catalogue.3.reasoning.0": {
    en: "Confirming Apex is approved and on agreement SA-MRO-07",
    de: "Bestätige, dass Apex zugelassen und im Vertrag SA-MRO-07 ist",
  },
  "run.catalogue.3.reasoning.1": {
    en: "Reading the published breaks — four of them, $24.80 down to $18.10",
    de: "Lese die veröffentlichten Staffeln — vier Stück, von $24,80 bis $18,10",
  },
  "run.catalogue.3.reasoning.2": {
    en: "This order of 400 EA prices at $22.40 — correct for its size",
    de: "Diese Bestellung über 400 ST kostet $22,40 — für ihre Größe korrekt",
  },
  "run.catalogue.3.reasoning.3": {
    en: "Putting the network's annual volume against the same table",
    de: "Halte die Jahresmenge des Netzwerks gegen dieselbe Tabelle",
  },
  "run.catalogue.3.recommendation": {
    en: "Priced correctly at $22.40 / EA for a 400 EA order. Correct is not the same as best — at the volume this network already consumes, the agreement's own price list has two cheaper rows in it.",
    de: "Korrekt kalkuliert mit $22,40 je Stück für eine Bestellung über 400 ST. Korrekt ist nicht dasselbe wie bestmöglich — bei der Menge, die dieses Netzwerk ohnehin verbraucht, hat die Preisliste des Vertrags zwei günstigere Zeilen.",
  },
  "run.catalogue.4.agentName": {
    en: "Approval & routing agent",
    de: "Freigabe & Weiterleitung",
  },
  "run.catalogue.4.title": {
    en: "Approval, routing & how to place it",
    de: "Freigabe, Weiterleitung & wie bestellt wird",
  },
  "run.catalogue.4.aiThought": {
    en: "Every rule passes and nothing needs a signature, so this would normally just go. Before it does — the Winding Plant and the Electronics Works both have live requests for the same bag this week.",
    de: "Alle Regeln sind erfüllt, nichts braucht eine Unterschrift, das würde also normalerweise einfach rausgehen. Vorher aber: Harzanlage und Lackwerk haben diese Woche beide offene Anforderungen für denselben Beutel.",
  },
  "run.catalogue.4.reasoning.0": {
    en: "Confirming cost centre 10034 / GL 600420",
    de: "Bestätige Kostenstelle 10034 / Sachkonto 600420",
  },
  "run.catalogue.4.reasoning.1": {
    en: "On agreement — competitive bidding not required",
    de: "Auf Vertrag — kein Wettbewerbsverfahren erforderlich",
  },
  "run.catalogue.4.reasoning.2": {
    en: "$8,960.00 is inside the plant-maintenance limit",
    de: "$8.960,00 liegt innerhalb der Grenze der Werksinstandhaltung",
  },
  "run.catalogue.4.reasoning.3": {
    en: "Finding two more live requests for the same bag this week",
    de: "Finde zwei weitere offene Anforderungen für denselben Beutel diese Woche",
  },
  "run.catalogue.4.reasoning.4": {
    en: "Costing them as three orders, and as one",
    de: "Kalkuliere sie als drei Bestellungen und als eine",
  },
  "run.catalogue.4.recommendation": {
    en: "Released under the plant's own limit. The one thing worth deciding is not whether to buy, but how to place it — three plants want the same bag this week, and one order crosses a price break that three separate orders never reach.",
    de: "Innerhalb der werkseigenen Grenze freigegeben. Zu entscheiden ist nicht, ob gekauft wird, sondern wie bestellt wird — drei Werke wollen diese Woche denselben Beutel, und eine Bestellung erreicht eine Staffel, die drei getrennte nie erreichen.",
  },
  "phrase.Filtration consumables": {
    en: "Filtration consumables",
    de: "Filtrationsverbrauchsmaterial",
  },
  "phrase.This request is one of the 36% that arrives as free text for an item already on the catalogue. Coding it moved the needle; 312 more like it are sitting in the last twelve months of intake.": {
    en: "This request is one of the 36% that arrives as free text for an item already on the catalogue. Coding it moved the needle; 312 more like it are sitting in the last twelve months of intake.",
    de: "Diese Anforderung gehört zu den 36%, die als Freitext für einen bereits im Katalog gelisteten Artikel eingehen. Das Kontieren hat den Wert bewegt; 312 weitere dieser Art liegen in den letzten zwölf Monaten Eingang.",
  },
  "phrase.4,000 EA a year across the network": {
    en: "4,000 EA a year across the network",
    de: "4.000 ST pro Jahr im gesamten Netzwerk",
  },
  "phrase.Amberg · Electronics Works": {
    en: "Amberg · Electronics Works",
    de: "Amberg · Elektronikwerk",
  },
  "phrase.Amberg · Drive Systems Works": {
    en: "Amberg · Drive Systems Works",
    de: "Amberg · Antriebswerk",
  },
  "phrase.Lianhe · Electronics Works": {
    en: "Lianhe · Electronics Works",
    de: "Lianhe · Elektronikwerk",
  },
  "phrase.Riomar · Assembly & Packaging": {
    en: "Riomar · Assembly & Packaging",
    de: "Riomar · Montage & Verpackung",
  },
  "phrase.Four sites, one bag, four separate buying patterns. Each orders a quarter at a time, so each is priced as a small buyer — even though together they are not one.": {
    en: "Four sites, one bag, four separate buying patterns. Each orders a quarter at a time, so each is priced as a small buyer — even though together they are not one.",
    de: "Vier Standorte, ein Beutel, vier getrennte Einkaufsmuster. Jeder bestellt quartalsweise und wird deshalb wie ein Kleinabnehmer bepreist — obwohl sie zusammen keiner sind.",
  },
  "phrase.Where Riomar and Lianhe order today": {
    en: "Where Riomar and Lianhe order today",
    de: "Wo Riomar und Lianhe heute bestellen",
  },
  "phrase.This order · 400 EA": {
    en: "This order · 400 EA",
    de: "Diese Bestellung · 400 ST",
  },
  "phrase.One order for the three live requests": {
    en: "One order for the three live requests",
    de: "Eine Bestellung für die drei offenen Anforderungen",
  },
  "phrase.A year of network demand in one call-off": {
    en: "A year of network demand in one call-off",
    de: "Ein Jahr Netzwerkbedarf in einem Abruf",
  },
  "phrase.Network volume, last twelve months": {
    en: "Network volume, last twelve months",
    de: "Netzwerkmenge, letzte zwölf Monate",
  },
  "phrase.What it cost, bought site by site": {
    en: "What it cost, bought site by site",
    de: "Was es kostete, Standort für Standort gekauft",
  },
  "phrase.The same volume on one annual call-off": {
    en: "The same volume on one annual call-off",
    de: "Dieselbe Menge in einem Jahresabruf",
  },
  "phrase.Difference": {
    en: "Difference",
    de: "Differenz",
  },
  "phrase.Nobody is paying the wrong price — every site is paying the right price for the order it placed. The money is in the size of the orders, not the rate.": {
    en: "Nobody is paying the wrong price — every site is paying the right price for the order it placed. The money is in the size of the orders, not the rate.",
    de: "Niemand zahlt den falschen Preis — jeder Standort zahlt den richtigen Preis für die Bestellung, die er aufgegeben hat. Das Geld steckt in der Bestellgröße, nicht im Satz.",
  },
  "phrase.Three orders, as requested": {
    en: "Three orders, as requested",
    de: "Drei Bestellungen, wie angefordert",
  },
  "phrase.Amberg 400 · Winding 380 · Electronics 260": {
    en: "Amberg 400 · Winding 380 · Electronics 260",
    de: "Amberg 400 · Wicklung 380 · Elektronik 260",
  },
  "phrase.Each priced at the 250–999 EA break": {
    en: "Each priced at the 250–999 EA break",
    de: "Jede zur Staffel 250–999 ST bepreist",
  },
  "phrase.One order, 1,040 EA": {
    en: "One order, 1,040 EA",
    de: "Eine Bestellung, 1.040 ST",
  },
  "phrase.One purchase order, three delivery points": {
    en: "One purchase order, three delivery points",
    de: "Eine Bestellung, drei Lieferstellen",
  },
  "phrase.$2,750 saved · crosses the 1,000 EA break": {
    en: "$2,750 saved · crosses the 1,000 EA break",
    de: "$2.750 gespart · überschreitet die 1.000-ST-Staffel",
  },
  "phrase.Goods, three orders at $22.40": {
    en: "Goods, three orders at $22.40",
    de: "Ware, drei Bestellungen zu $22,40",
  },
  "phrase.Goods, one order at $19.90": {
    en: "Goods, one order at $19.90",
    de: "Ware, eine Bestellung zu $19,90",
  },
  "phrase.Order processing · 3 × $75": {
    en: "Order processing · 3 × $75",
    de: "Bestellabwicklung · 3 × $75",
  },
  "phrase.Order processing · 1 × $75": {
    en: "Order processing · 1 × $75",
    de: "Bestellabwicklung · 1 × $75",
  },
  "phrase.Same bags, same week, same supplier, same delivery dates. The only thing that changes is how many purchase orders carry them — and that is worth $2,750 without anyone negotiating anything.": {
    en: "Same bags, same week, same supplier, same delivery dates. The only thing that changes is how many purchase orders carry them — and that is worth $2,750 without anyone negotiating anything.",
    de: "Dieselben Beutel, dieselbe Woche, derselbe Lieferant, dieselben Liefertermine. Es ändert sich nur, wie viele Bestellungen sie tragen — und das ist $2.750 wert, ohne dass irgendjemand verhandelt hätte.",
  },
  "phrase.A trial drum quantity": {
    en: "A trial drum quantity",
    de: "Eine Versuchsmenge in Fässern",
  },
  "phrase.Half a truck": {
    en: "Half a truck",
    de: "Eine halbe Lkw-Ladung",
  },
  "phrase.This order · 12 t, a full truckload": {
    en: "This order · 12 t, a full truckload",
    de: "Diese Bestellung · 12 t, eine volle Lkw-Ladung",
  },
  "phrase.Annual call-off": {
    en: "Annual call-off",
    de: "Jahresabruf",
  },
  "phrase.Not offered": {
    en: "Not offered",
    de: "Nicht angeboten",
  },
  "phrase.No agreement exists — there is no annual rate to reach": {
    en: "No agreement exists — there is no annual rate to reach",
    de: "Es besteht kein Vertrag — es gibt keinen Jahressatz zu erreichen",
  },
  "phrase.This order · 12 t at the truckload break": {
    en: "This order · 12 t at the truckload break",
    de: "Diese Bestellung · 12 t zur Lkw-Staffel",
  },
  "phrase.If the formulation goes to full production": {
    en: "If the formulation goes to full production",
    de: "Wenn die Rezeptur in die Serienfertigung geht",
  },
  "phrase.60 t a year": {
    en: "60 t a year",
    de: "60 t pro Jahr",
  },
  "phrase.Bought as five more spot loads at this rate": {
    en: "Bought as five more spot loads at this rate",
    de: "Als fünf weitere Spot-Ladungen zu diesem Satz gekauft",
  },
  "phrase.What an agreement would be worth negotiating for": {
    en: "What an agreement would be worth negotiating for",
    de: "Wofür sich eine Vertragsverhandlung lohnen würde",
  },
  "phrase.This is the moment to ask": {
    en: "This is the moment to ask",
    de: "Jetzt ist der Moment zu fragen",
  },
  "flow.catalogue.contextTitle": {
    en: "Deburring Plant · Deburring Line 1 · quarterly filter change",
    de: "Amberg-Werk · Entgratlinie 1 · Quartals-Filterwechsel",
  },
  "flow.catalogue.contextSub": {
    en: "A catalogue line · bought again every quarter · four sites buying it apart",
    de: "Eine Katalogposition · jedes Quartal erneut gekauft · vier Standorte kaufen getrennt",
  },
  "flow.catalogue.reviewPill": {
    en: "Catalogue purchase · in review",
    de: "Katalogeinkauf · in Bearbeitung",
  },
  "run.catalogue.5.agentName": {
    en: "Invoice Matching agent",
    de: "Rechnungsprüfungs-Agent",
  },
  "run.catalogue.5.title": {
    en: "Invoice four-way match",
    de: "Rechnung im Vierfachabgleich",
  },
  "run.catalogue.5.aiThought": {
    en: "The bags landed at all three plants and Apex has invoiced. The question now is narrow but it is the one that matters: did they bill the consolidated break, or the price a single plant would have paid?",
    de: "Die Beutel sind an allen drei Standorten angekommen und Apex hat fakturiert. Die Frage ist jetzt eng, aber es ist die entscheidende: Wurde die konsolidierte Staffel berechnet oder der Preis, den ein einzelnes Werk gezahlt hätte?",
  },
  "run.catalogue.5.reasoning.4": {
    en: "Four-way match — every dimension agrees",
    de: "Vierfachabgleich — alle Dimensionen stimmen überein",
  },
  "phrase.Billed at the consolidated break, not the price any single plant would have paid alone — the saving survived all the way to the invoice.": {
    en: "Billed at the consolidated break, not the price any single plant would have paid alone — the saving survived all the way to the invoice.",
    de: "Zur konsolidierten Staffel berechnet, nicht zu dem Preis, den ein einzelnes Werk allein gezahlt hätte — die Ersparnis hat es bis auf die Rechnung geschafft.",
  },
  "insight.openRecord": {
    en: "Open the record",
    de: "Beleg öffnen",
  },
  "insight.recommended": {
    en: "Recommended",
    de: "Empfohlen",
  },
  "insight.showWorking": {
    en: "Show the calculation →",
    de: "Berechnung anzeigen →",
  },
};

/**
 * Look a phrase up in the reader's language, falling back to English.
 * `vars` fills `{slot}` placeholders — computed values only, never retyped.
 */
export function translate(key: string, lang: Lang, vars?: Record<string, string | number>): string {
  const phrase = DICT[key] ?? AP_DICT[key];
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
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap bg-surface-mint px-2.5 py-1 text-[12px] font-medium text-surface-deep">
      {src.flag} → {t("xlat.translated")}
    </span>
  );
}
