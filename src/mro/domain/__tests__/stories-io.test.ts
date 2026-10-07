import { describe, expect, it } from "vitest";
import { IO, agentRuns, type UseCaseKey } from "@/mro/data/stories/io";
import { STORIES } from "@/mro/data/stories/registry";
import { LAST_PAID, SUPPLIERS, siteById } from "@/mro/data/masterData";
import { DEMO_POLICY } from "@/mro/data/policies";
import { laneFor, scoreConfidence } from "@/mro/domain/evaluateGate";

const UCS: UseCaseKey[] = ["uc06", "uc09", "uc04", "uc10", "uc02"];

describe("story registry follows the I/O manifests", () => {
  it("keeps sheet order and the I/O case IDs", () => {
    expect(STORIES.map((s) => [s.id, s.ucLabel, s.caseId])).toEqual([
      ["ST01", "UC6", "TSM-2026-104387"],
      ["ST02", "UC9", "TSM-2026-104512"],
      ["ST03", "UC4", "TSM-2026-104588"],
      ["ST04", "UC10", "TSM-2026-104611"],
      ["ST05", "UC2", "TSM-2026-104640"],
    ]);
  });

  it("resolves each requester site to a seeded site", () => {
    expect(STORIES.map((s) => (s.site ? siteById[s.site].name : null))).toEqual(["Gaydon", "Castle Bromwich", "Solihull", null, "Halewood"]);
  });

  it.each(UCS)("%s: every agent step carries the manifest case ID", (uc) => {
    for (const run of agentRuns(uc)) expect(run.caseId).toBe(IO[uc].manifest.case_id);
  });
});

describe("confidence in the I/O is reproducible under CONF-v1.0", () => {
  const runs = UCS.flatMap((uc) => agentRuns(uc).map((r) => [uc, r] as const)).filter(([, r]) => r.confidence);

  it.each(runs.map(([uc, r]) => [`${uc} ${r.agent}`, r] as const))("%s: weighted signals equal the stated score", (_name, r) => {
    const c = scoreConfidence(DEMO_POLICY, { signals: r.confidence!.signals, pattern: "io" });
    expect(c.blocks).toEqual([]);
    expect(c.score).toBe(r.confidence!.score);
  });

  it.each(runs.map(([uc, r]) => [`${uc} ${r.agent}`, r] as const))("%s: lane matches the stated band", (_name, r) => {
    const lane = r.lane!;
    if (lane.band === "HARD_CONSTRAINT") {
      expect(lane.lane).toBe("HiTL");
      return;
    }
    const computed = laneFor(DEMO_POLICY, r.confidence!.score);
    expect(lane.band === "≥0.90" ? "touchless" : "tcs-review").toBe(computed);
    expect(lane.lane).toBe(computed === "touchless" ? "TOUCHLESS" : "HiTL");
  });
});

describe("story arithmetic matches the I/O", () => {
  it("UC6: 12 × £1,200 last paid = £14,400, all reused, no PO", () => {
    const req = IO.uc06.intake.input.request;
    expect(LAST_PAID["SW-CADV-PRO-12M"].unitPrice * 12).toBe(req.starting_cost_gbp);
    const reuse = IO.uc06.spendIntelligence.output.reuse_assessment;
    expect(reuse.reuse_recommended_qty).toBe(12);
    expect(reuse.new_purchase_qty).toBe(0);
    expect(reuse.unassigned_available).toBe(IO.uc06.spendIntelligence.input.pool.unassigned);
    expect(reuse.inactive_reclaimable).toBe(IO.uc06.spendIntelligence.input.pool.inactive_90d.length);
    expect(IO.uc06.channelDecision.output.route.po_required).toBe(false);
    expect(IO.uc06.channelDecision.output.value_record.avoided_gbp).toBe(14_400);
    expect(IO.uc06.channelDecision.input.auto_approve_limit_gbp * 100).toBe(DEMO_POLICY.autoApproveLimit);
  });

  it("UC9: PressCare lines sum to its total; target is 15.9% under starting cost", () => {
    const press = IO.uc09.bidScoring.input.bids[0];
    expect(press.lines!.reduce((t, l) => t + l.qty * l.unit_price, 0)).toBe(press.total);
    const pos = IO.uc09.bidScoring.output.negotiation_position;
    const start = IO.uc09.bidScoring.input.starting_cost_gbp;
    expect(Math.round(((start - pos.target_gbp) / start) * 1000) / 10).toBe(pos.expected_saving_vs_starting_cost_pct);
    expect(pos.walk_away_gbp).toBe(IO.uc09.bidScoring.output.ranking[0].total);
  });

  it("UC4: 30 days at £1,400 vs £1,150 → £7,500 redirect saving", () => {
    const named = IO.uc04.supplierMatch.input.named_supplier_profile.day_rate_quoted;
    const kestrel = IO.uc04.supplierMatch.input.panel[0].day_rate;
    const rec = IO.uc04.supplierMatch.output.recommendation;
    expect(30 * named).toBe(IO.uc04.supplierMatch.input.request.starting_cost_gbp);
    expect(30 * kestrel).toBe(rec.estimated_cost_gbp);
    expect(30 * named - 30 * kestrel).toBe(rec.saving_vs_named_gbp);
  });

  it("UC10: band counts match the clause assessment", () => {
    const rows = IO.uc10.clauseCompare.output.clause_assessment;
    const count = (b: string) => rows.filter((r) => r.band === b).length;
    expect({ green: count("GREEN"), amber: count("AMBER"), red: count("RED") }).toEqual({
      green: IO.uc10.clauseCompare.output.summary.green,
      amber: IO.uc10.clauseCompare.output.summary.amber,
      red: IO.uc10.clauseCompare.output.summary.red,
    });
  });

  it("UC2: 40 × £96 = £3,840; award £2,760 saves £1,080 (28.1%)", () => {
    const req = IO.uc02.intake.input.request;
    expect(req.qty * LAST_PAID["MAT-SNS-BRANDX-PX30"].unitPrice).toBe(req.starting_cost_gbp);
    for (const b of IO.uc02.sourcing.output.bids) expect(b.unit * req.qty).toBe(b.total);
    const award = IO.uc02.sourcing.output.award;
    expect(req.starting_cost_gbp - award.total_gbp).toBe(award.saving_vs_starting_cost_gbp);
    expect(Math.round((award.saving_vs_starting_cost_gbp / req.starting_cost_gbp) * 1000) / 10).toBe(award.saving_pct);
  });
});

describe("master data carries every I/O supplier verbatim", () => {
  const named = [
    ...IO.uc09.sourcing.input.panel,
    ...IO.uc02.sourcing.input.panel,
    ...IO.uc04.supplierMatch.input.panel.map((p) => p.supplier),
  ];
  it.each(named)("%s", (entry) => {
    const [id, ...name] = entry.split(" ");
    const s = SUPPLIERS.find((x) => x.id === id);
    expect(s?.name).toBe(name.join(" "));
  });
});

describe("neutral identity", () => {
  it("the bundled I/O never names the client", () => {
    const files = import.meta.glob("../../data/stories/io/**/*", { eager: true, query: "?raw", import: "default" }) as Record<string, string>;
    expect(Object.keys(files).length).toBeGreaterThan(20);
    for (const text of Object.values(files)) expect(text).not.toMatch(/JLR|Jaguar|Land Rover/i);
  });
});
