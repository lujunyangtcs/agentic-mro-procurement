/**
 * Automotive Procurement phrase book (EN + DE). New copy lands here, not in
 * the legacy dictionary; `translate()` reads both.
 */

export const AP_DICT: Record<string, { en: string; de: string }> = {
  "brand.name": { en: "Automotive Procurement", de: "Automotive Procurement" },
  "brand.demo": { en: "Demo environment", de: "Demoumgebung" },

  "cases.title": { en: "Cases", de: "Vorgänge" },
  "cases.sub": { en: "Procurement cases on the domain record", de: "Beschaffungsvorgänge im Domänenbestand" },
  "cases.empty": { en: "No cases yet", de: "Noch keine Vorgänge" },
  "cases.audit": { en: "Audit trail · {id}", de: "Prüfpfad · {id}" },
  "cases.showAudit": { en: "Show audit trail", de: "Prüfpfad anzeigen" },
  "cases.hideAudit": { en: "Hide audit trail", de: "Prüfpfad ausblenden" },

  "col.case": { en: "Case", de: "Vorgang" },
  "col.pr": { en: "Request", de: "Anforderung" },
  "col.site": { en: "Site", de: "Standort" },
  "col.qty": { en: "Quantity", de: "Menge" },
  "col.lane": { en: "Lane", de: "Pfad" },
  "col.po": { en: "PO", de: "Bestellung" },
  "col.when": { en: "When", de: "Zeitpunkt" },
  "col.actor": { en: "Actor", de: "Ausführend" },
  "col.event": { en: "Event", de: "Ereignis" },
  "col.refs": { en: "References", de: "Referenzen" },

  "lane.touchless": { en: "Touchless", de: "Ohne Eingriff" },
  "lane.tcs-review": { en: "TCS review", de: "TCS-Prüfung" },
  "lane.client-decision": { en: "Client decision", de: "Kundenentscheidung" },

  "caseStatus.open": { en: "Open", de: "Offen" },
  "caseStatus.held": { en: "On hold", de: "Angehalten" },
  "caseStatus.po-dispatched": { en: "PO dispatched", de: "Bestellung übermittelt" },
  "caseStatus.closed": { en: "Closed", de: "Abgeschlossen" },

  "uom.PACK": { en: "packs", de: "Packungen" },
  "uom.PAIR": { en: "pairs", de: "Paar" },
  "uom.EA": { en: "each", de: "Stück" },
  "uom.LOT": { en: "lot", de: "Los" },
  "uom.SEAT_YEAR": { en: "seat-years", de: "Lizenzjahre" },

  "actor.policy": { en: "Policy {version}", de: "Richtlinie {version}" },
  "actor.agent": { en: "Agent · {id}", de: "Agent · {id}" },

  "event.request.submitted": { en: "Request submitted", de: "Anforderung eingereicht" },
  "event.request.revised": { en: "Request revised", de: "Anforderung überarbeitet" },
  "event.gate.evaluated": { en: "Gate evaluated", de: "Prüfregeln ausgewertet" },
  "event.approval.requested": { en: "Approval requested", de: "Genehmigung angefordert" },
  "event.approval.decided": { en: "Approval decided", de: "Genehmigung entschieden" },
  "event.request.approved": { en: "Request approved", de: "Anforderung genehmigt" },
  "event.po.dispatched": { en: "PO dispatched", de: "Bestellung übermittelt" },
  "event.po.dispatch-failed": { en: "PO dispatch failed", de: "Bestellübermittlung fehlgeschlagen" },
  "event.exception.opened": { en: "Exception opened", de: "Ausnahme eröffnet" },
  "event.value.validated": { en: "Value validated", de: "Wert bestätigt" },
  "event.clock.advanced": { en: "Clock advanced", de: "Uhr vorgestellt" },
};
