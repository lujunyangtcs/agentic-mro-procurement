/**
 * ST03 · UC4 guided playback. Three agents, each playing its work as beats,
 * and three people: the Category Lead approves the onboarding exception with
 * the panel match beside it and the reason the agent drafted, the Buy Desk
 * Analyst reviews and sends the gap e-mail the Onboarding Agent drafted, and
 * the Risk Analyst confirms or edits the conditions the Risk Screening Agent
 * proposed. Figures come from `IO`.
 */

import { IO } from "@/mro/data/stories/io";
import type { TheatreScript } from "@/mro/components/story/theatre/script";
import { D4, GAP_DRAFT, GAP_FROM, GAP_SUBJECT, PROPOSED_CAP, PROPOSED_YEARS, UC04_DOCS, UC04_TASK } from "@/mro/components/story/theatre/uc04Docs";
import { UC04_BEATS } from "@/mro/components/story/theatre/uc04Beats";

const gbp = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;
const gbpDe = (n: number) => `£${Math.round(n).toLocaleString("de-DE")}`;

const mi = IO.uc04.supplierMatch.input;
const mo = IO.uc04.supplierMatch.output;
const oi = IO.uc04.onboarding.input;
const oo = IO.uc04.onboarding.output;
const ri = IO.uc04.riskScreening.input;
const ro = IO.uc04.riskScreening.output;

const req = mi.request;
const rec = mo.recommendation;
const kestrel = mi.panel[0];
const named = mi.named_supplier_profile;
const SUP = oi.supplier;
const kName = kestrel.supplier.split(" ").slice(1).join(" ");
const kId = kestrel.supplier.split(" ")[0];
const DAYS = rec.estimated_cost_gbp / kestrel.day_rate;
const HEADROOM = kestrel.utilisation_commitment!.committed_gbp - kestrel.utilisation_commitment!.used_gbp;
const PCT = ((1 - kestrel.day_rate / named.day_rate_quoted) * 100).toFixed(1);
const SAVING = rec.saving_vs_named_gbp;
const CAPS = req.required.length;
const accepted = oo.document_validation.filter((d) => d.status === "VALID" || d.status === "N/A").length;
const credit = ro.results.financial_health;
const cyber = ro.results.cyber;

export const UC04: TheatreScript = {
  docs: UC04_DOCS,
  arrival: { title: { en: "Request for a supplier who is not on the panel", de: "Anforderung für einen Lieferanten außerhalb des Panels" }, doc: D4.req },
  steps: [
    {
      fetch: [
        { label: { en: `Reading request ${req.request_id}`, de: `Lese Anforderung ${req.request_id}` }, doc: D4.req },
        { label: { en: `Reading NovaOps quotation ${D4.quote}`, de: `Lese NovaOps-Angebot ${D4.quote}` }, doc: D4.quote },
        { label: { en: `Loading consulting panel ${D4.panel}`, de: `Lade Beratungs-Panel ${D4.panel}` }, doc: D4.panel },
        { label: { en: `Matching ${CAPS} mandatory capabilities against ${mi.panel.length} panel suppliers`, de: `Gleiche ${CAPS} Pflichtanforderungen mit ${mi.panel.length} Panel-Lieferanten ab` } },
        { label: { en: `Reading ${kName} scorecard ${D4.perf}`, de: `Lese Scorecard ${D4.perf} von ${kName}` }, doc: D4.perf },
        { label: { en: `Checking commitment headroom on ${D4.agr}`, de: `Prüfe Restvolumen in ${D4.agr}` }, doc: D4.agr },
        { label: { en: `Checking the approval band in ${D4.doa}`, de: `Prüfe das Freigabeband in ${D4.doa}` }, doc: D4.doa },
      ],
      beats: UC04_BEATS[0],
      signalDocs: { capability_match: D4.panel, performance: D4.perf, capacity: D4.panel, commercial: D4.agr },
      guardDocs: { "Panels first": D4.panel, "No duplicate supplier": D4.panel, "Value band": D4.doa },
      tasks: [
        {
          kind: "approve",
          cta: { en: "Open the exception approval", de: "Ausnahmefreigabe öffnen" },
          prep: [
            {
              en: `${kName} meets all ${CAPS} mandatory capabilities and is ${gbp(SAVING)} (${PCT}%) cheaper over ${DAYS} days`,
              de: `${kName} erfüllt alle ${CAPS} Pflichtanforderungen und ist über ${DAYS} Tage ${gbpDe(SAVING)} (${PCT.replace(".", ",")} %) günstiger`,
            },
            {
              en: `Only NovaOps offers the paint-line simulation tool the request depends on (${req.request_id} §4)`,
              de: `Nur NovaOps bietet das Lackierlinien-Simulationstool, auf dem die Anforderung beruht (${req.request_id} §4)`,
            },
            {
              en: `Approving starts onboarding: ${oi.required_documents.length} documents, risk screening and a Finance bank call-back — the PO stays blocked until NovaOps is active`,
              de: `Die Freigabe startet das Onboarding: ${oi.required_documents.length} Dokumente, Risikoprüfung und Finance-Rückruf — die Bestellung bleibt gesperrt, bis NovaOps aktiv ist`,
            },
            { en: `Above £30K the supplier choice is yours (${D4.doa} §4.2)`, de: `Über £30K entscheiden Sie über den Lieferanten (${D4.doa} §4.2)` },
          ],
          option: "exception",
          reason: {
            label: { en: "Reason for the exception", de: "Begründung der Ausnahme" },
            draft: {
              en: oi.human_decision.reason,
              de: "Anforderer benötigt das proprietäre Lackierlinien-Simulationstool von NovaOps; Kestrel kann es nicht bereitstellen",
            },
          },
          approve: { en: "Approve onboarding exception", de: "Onboarding-Ausnahme freigeben" },
          compare: [
            {
              id: "redirect",
              recommended: true,
              tag: { en: "Panel match", de: "Panel-Treffer" },
              title: `${kName} · ${kId}`,
              figure: gbp(rec.estimated_cost_gbp),
              figureNote: { en: `${DAYS} days × ${gbp(kestrel.day_rate)}`, de: `${DAYS} Tage × ${gbpDe(kestrel.day_rate)}` },
              facts: [
                { label: { en: "Panel", de: "Panel" }, value: { en: `On ${D4.panel}`, de: `In ${D4.panel}` } },
                { label: { en: "Capabilities", de: "Anforderungen" }, value: { en: `${CAPS} of ${CAPS}`, de: `${CAPS} von ${CAPS}` } },
                { label: { en: "Performance", de: "Leistung" }, value: { en: `${kestrel.performance_score} / 5 · 9 engagements`, de: `${String(kestrel.performance_score).replace(".", ",")} / 5 · 9 Einsätze` } },
                { label: { en: "Onboarding", de: "Onboarding" }, value: { en: "None — active supplier", de: "Keins — aktiver Lieferant" } },
                { label: { en: "Commitment", de: "Rahmenvolumen" }, value: { en: `${gbp(HEADROOM)} headroom to rebate tier`, de: `${gbpDe(HEADROOM)} bis zur Rabattstufe` } },
              ],
              docs: [D4.panel, D4.perf, D4.agr],
            },
            {
              id: "exception",
              tag: { en: "Requester's choice", de: "Wahl des Anforderers" },
              title: SUP.name,
              figure: gbp(DAYS * named.day_rate_quoted),
              figureNote: { en: `${DAYS} days × ${gbp(named.day_rate_quoted)}`, de: `${DAYS} Tage × ${gbpDe(named.day_rate_quoted)}` },
              facts: [
                { label: { en: "Panel", de: "Panel" }, value: { en: "Not on panel", de: "Nicht im Panel" } },
                { label: { en: "Capabilities", de: "Anforderungen" }, value: { en: `${CAPS} of ${CAPS} claimed · not verified`, de: `${CAPS} von ${CAPS} laut Angebot · ungeprüft` } },
                { label: { en: "Performance", de: "Leistung" }, value: { en: "No history with Client", de: "Keine Historie beim Client" } },
                { label: { en: "Onboarding", de: "Onboarding" }, value: { en: `${named.onboarding_effort_days} days · new-supplier checks`, de: `${named.onboarding_effort_days} Tage · Neulieferantenprüfung` } },
                { label: { en: "Risk", de: "Risiko" }, value: { en: "Unknown — not screened", de: "Unbekannt — nicht geprüft" } },
              ],
              docs: [D4.req, D4.quote],
            },
          ],
          produces: [D4.decision],
        },
      ],
      handover: [
        { en: "Onboarding exception approved · reason on record", de: "Onboarding-Ausnahme freigegeben · Grund dokumentiert" },
        { en: `${SUP.name} · Companies House ${SUP.companies_house}`, de: `${SUP.name} · Companies House ${SUP.companies_house}` },
        {
          en: `${oi.required_documents.length} documents to collect · bank letter for Finance only`,
          de: `${oi.required_documents.length} Dokumente anfordern · Bankbestätigung nur für Finance`,
        },
      ],
    },
    {
      fetch: [
        { label: { en: `Reading the Category Lead decision ${D4.decision}`, de: `Lese die Entscheidung ${D4.decision}` }, doc: D4.decision },
        { label: { en: `Sending portal invitation ${D4.invite}`, de: `Sende Portal-Einladung ${D4.invite}` }, doc: D4.invite },
        { label: { en: "Downloading the certificate of incorporation", de: "Lade die Gründungsurkunde" }, doc: D4.coi },
        { label: { en: "Downloading the VAT registration certificate", de: "Lade die USt-Registrierung" }, doc: D4.vat },
        { label: { en: "Downloading the insurance certificate", de: "Lade das Versicherungszertifikat" }, doc: D4.ins },
        { label: { en: "Downloading the security questionnaire", de: "Lade den Sicherheitsfragebogen" }, doc: D4.isq },
        { label: { en: "Downloading the bank confirmation letter", de: "Lade die Bankbestätigung" }, doc: D4.bank },
      ],
      beats: UC04_BEATS[1],
      signalDocs: { completeness: D4.ins, validity: D4.coi },
      guardDocs: { "Requester cannot approve own supplier": D4.decision, "Bank details verified by a person": D4.bank },
      produces: [D4.invite],
      tasks: [
        {
          kind: "email",
          cta: { en: "Review the agent's draft", de: "Entwurf des Agenten prüfen" },
          option: "return",
          from: GAP_FROM,
          to: SUP.contact,
          subject: GAP_SUBJECT,
          body: GAP_DRAFT,
          attach: [D4.ins],
          send: { en: "Send gap list to supplier", de: "Lückenliste senden" },
          produces: [D4.gap],
        },
      ],
      handover: [
        { en: `${accepted} of ${oo.document_validation.length} documents accepted · PI gap returned (round 1 of 2)`, de: `${accepted} von ${oo.document_validation.length} Dokumenten akzeptiert · PI-Lücke zurückgemeldet (Runde 1 von 2)` },
        { en: "Bank letter held for the Finance call-back", de: "Bankbestätigung liegt für den Finance-Rückruf bereit" },
        {
          en: `Directors ${ri.supplier.directors.join(", ")} · ${ri.screens_requested.length} screens to run`,
          de: `Geschäftsführer ${ri.supplier.directors.join(", ")} · ${ri.screens_requested.length} Prüfungen`,
        },
      ],
    },
    {
      fetch: [
        {
          label: { en: `Screening NovaOps and ${ri.supplier.directors.length} directors against UK, EU and OFAC lists`, de: `Prüfe NovaOps und ${ri.supplier.directors.length} Geschäftsführer gegen UK-, EU- und OFAC-Listen` },
          doc: D4.san,
        },
        { label: { en: "Searching adverse media and PEP registers", de: "Durchsuche Negativpresse und PEP-Register" } },
        { label: { en: `Pulling credit report ${D4.credit}`, de: `Lade Kreditauskunft ${D4.credit}` }, doc: D4.credit },
        { label: { en: "Reading the external cyber rating", de: "Lese das externe Cyber-Rating" }, doc: D4.cyber },
        { label: { en: "Checking the Companies House filing history", de: "Prüfe die Einreichungen bei Companies House" }, doc: D4.coi },
      ],
      beats: UC04_BEATS[2],
      signalDocs: { sanctions: D4.san, financial: D4.credit, cyber: D4.cyber, filings: D4.coi },
      guardDocs: { "No activation with sanctions hit": D4.san, "Medium risk needs human review": D4.credit },
      tasks: [
        {
          kind: "form",
          cta: { en: "Review the proposed conditions", de: "Vorgeschlagene Auflagen prüfen" },
          lead: {
            en: `Risk tier ${ro.proposed_risk_tier}: sanctions clear, credit ${credit.score}/100, cyber ${cyber.rating}. Accept NovaOps with these conditions — confirm or change them.`,
            de: `Risikostufe ${ro.proposed_risk_tier}: Sanktionen unauffällig, Bonität ${credit.score}/100, Cyber ${cyber.rating}. NovaOps mit diesen Auflagen annehmen — bestätigen oder ändern.`,
          },
          fields: [
            {
              key: "cap",
              kind: "money",
              label: { en: "Value cap", de: "Wertgrenze" },
              proposed: PROPOSED_CAP,
              min: req.starting_cost_gbp,
              minError: {
                en: `Below this engagement's ${gbp(req.starting_cost_gbp)} — the PO could not be raised`,
                de: `Unter dem Auftragswert von ${gbpDe(req.starting_cost_gbp)} — die Bestellung wäre nicht möglich`,
              },
              why: {
                en: `Credit score ${credit.score}/100 (${credit.tier}). A cap limits exposure while only abridged accounts are on file.`,
                de: `Bonität ${credit.score}/100 (${credit.tier}). Eine Grenze begrenzt das Risiko, solange nur verkürzte Abschlüsse vorliegen.`,
              },
              doc: D4.credit,
            },
            {
              key: "years",
              kind: "number",
              label: { en: "Lift the cap after", de: "Grenze aufheben nach" },
              proposed: PROPOSED_YEARS,
              min: 1,
              minError: { en: "At least one year of full accounts is needed", de: "Mindestens ein Jahr vollständiger Abschlüsse nötig" },
              suffix: { en: "years' accounts", de: "Jahren Abschluss" },
              why: { en: "Two full years show a trend, not a snapshot.", de: "Zwei volle Jahre zeigen einen Trend, keine Momentaufnahme." },
              doc: D4.coi,
            },
            {
              key: "mfa",
              kind: "check",
              label: { en: "MFA evidence before system access", de: "MFA-Nachweis vor Systemzugang" },
              proposed: true,
              why: { en: `Cyber rating ${cyber.rating} — ${cyber.note.toLowerCase()}.`, de: `Cyber-Rating ${cyber.rating} — kein MFA-Nachweis für den Fernzugriff.` },
              doc: D4.cyber,
            },
          ],
          accept: "accept",
          reject: "reject",
          produces: [D4.riskRec],
        },
      ],
      handover: [
        { en: `Risk tier ${ro.proposed_risk_tier} · accepted with conditions`, de: `Risikostufe ${ro.proposed_risk_tier} · mit Auflagen angenommen` },
        { en: "Create the vendor record, then the Finance bank call-back", de: "Kreditor anlegen, danach Finance-Rückruf zur Bankverbindung" },
        { en: "PO stays blocked until the supplier is active", de: "Bestellung bleibt gesperrt, bis der Lieferant aktiv ist" },
      ],
      finalOwner: { en: "Master Data Agent · Finance call-back", de: "Master Data Agent · Finance-Rückruf" },
    },
  ],
  completion: (lang, ctx) => {
    const en = lang === "en";
    const money = en ? gbp : gbpDe;
    const risk = ctx.inputs[UC04_TASK.risk];
    const cap = Number(risk?.cap ?? PROPOSED_CAP);
    const mfa = risk?.mfa ?? true;
    const reason = String(ctx.inputs[UC04_TASK.fit]?.reason ?? oi.human_decision.reason);
    const shortReason = reason.length > 96 ? `${reason.slice(0, 93)}…` : reason;
    if (ctx.endedWith === "reject") {
      return {
        hero: { value: gbp(req.starting_cost_gbp), label: en ? "commitment stopped at risk screening" : "Vergabe in der Risikoprüfung gestoppt" },
        metrics: [
          { value: "3", label: en ? "Human decisions" : "Menschliche Entscheidungen" },
          { value: "1", label: en ? "Document gap caught" : "Dokumentlücke erkannt" },
          { value: `${credit.score}/100`, label: en ? "Credit score" : "Bonität" },
          { value: en ? "None" : "Keine", label: en ? "PO raised" : "Bestellung" },
        ],
        impact: en
          ? [
              `The Risk Analyst rejected NovaOps after screening; no vendor record was created and no PO was raised.`,
              `The ${kName} panel offer at ${gbp(rec.estimated_cost_gbp)} is still on file — ${gbp(SAVING)} below the named quote.`,
              `Every decision and reason stays on ${mo.meta.case_id} for audit.`,
            ]
          : [
              "Die Risikoanalyse hat NovaOps nach der Prüfung abgelehnt; kein Kreditor, keine Bestellung.",
              `Das Panel-Angebot von ${kName} über ${gbpDe(rec.estimated_cost_gbp)} liegt weiter vor — ${gbpDe(SAVING)} unter dem Angebot.`,
              `Alle Entscheidungen und Gründe bleiben für das Audit an ${mo.meta.case_id}.`,
            ],
      };
    }
    return {
      hero: {
        value: gbp(SAVING),
        label: en ? "price gap surfaced before commitment — exception approved on the record" : "Preisdifferenz vor der Vergabe sichtbar — Ausnahme dokumentiert freigegeben",
      },
      metrics: [
        { value: "3", label: en ? "Human decisions" : "Menschliche Entscheidungen" },
        { value: "1", label: en ? "Document gap caught" : "Dokumentlücke erkannt" },
        { value: money(cap), label: en ? "Value cap set" : "Wertgrenze gesetzt" },
        { value: en ? "Blocked" : "Gesperrt", label: en ? "PO until bank call-back" : "Bestellung bis Rückruf" },
      ],
      impact: en
        ? [
            `The Category Lead chose NovaOps knowing the ${gbp(SAVING)} premium over ${kName}; the reason is saved against the case: “${shortReason}”`,
            `Professional indemnity of £1M against the £2M requirement was caught and returned to the supplier (round 1 of 2) before any PO.`,
            `${credit.tier.charAt(0)}${credit.tier.slice(1).toLowerCase()} financial risk (${credit.score}/100) accepted with a ${gbp(cap)} cap${mfa ? " and MFA before system access" : ""}; the PO stays blocked until Finance verifies the bank details by call-back.`,
          ]
        : [
            `Die Category Lead hat NovaOps trotz ${gbpDe(SAVING)} Aufpreis gegenüber ${kName} gewählt; der Grund ist am Fall gespeichert: „${shortReason}“`,
            "Berufshaftpflicht von £1M statt der geforderten £2M wurde erkannt und vor jeder Bestellung an den Lieferanten zurückgemeldet (Runde 1 von 2).",
            `Mittleres Finanzrisiko (${credit.score}/100) mit Wertgrenze ${gbpDe(cap)}${mfa ? " und MFA vor Systemzugang" : ""} akzeptiert; die Bestellung bleibt bis zum Finance-Rückruf gesperrt.`,
          ],
    };
  },
};
