import { describe, expect, it } from "vitest";
import { AP_DICT } from "@/mro/lib/i18n-ap";
import { seedDomain } from "@/mro/data/seedDomain";
import { londonDateTime } from "@/mro/domain/clock";

describe("EN/DE phrase book for the domain", () => {
  it("every phrase has non-empty English and German", () => {
    for (const [key, phrase] of Object.entries(AP_DICT)) {
      expect(phrase.en.trim(), key).not.toBe("");
      expect(phrase.de.trim(), key).not.toBe("");
    }
  });

  it("every seeded audit event type, actor role and unit has a phrase", () => {
    const domain = seedDomain();
    const keys = new Set<string>();
    for (const e of domain.audit) {
      keys.add(`event.${e.type}`);
      if (e.actor.kind === "human") keys.add(`role.${e.actor.role}`);
    }
    for (const r of Object.values(domain.requests).flatMap((req) => req.revisions)) {
      for (const l of r.lines) {
        keys.add(`uom.${l.uom}`);
        if (l.entered) keys.add(`uom.${l.entered.uom}`);
      }
    }
    for (const k of keys) expect(AP_DICT[k], k).toBeDefined();
  });

  it("formats London wall time in either language", () => {
    expect(londonDateTime("2026-10-07T08:00:00.000Z", "en")).toBe("07 Oct 2026, 09:00");
    expect(londonDateTime("2026-10-07T08:00:00.000Z", "de")).toContain("09:00");
    expect(londonDateTime("2026-10-07T08:00:00.000Z", "de")).toContain("Okt");
  });
});
