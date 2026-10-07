/**
 * Versioned demo snapshot (PRD §17.3). Holds demo records only — never real
 * account data. A version mismatch or unreadable payload is discarded and the
 * demo reseeds, so a stale browser can never resurrect an old shape.
 */

import type { DomainState, Role } from "@/mro/domain/types";
import type { Lang } from "@/mro/data/procurement";

export const SNAPSHOT_KEY = "ap-demo:snapshot:v2";
const SNAPSHOT_VERSION = 2;

export type Session = {
  reviewAs: Role;
  supplierSeat: string;
  lastCaseId?: string;
};

export type Snapshot = {
  version: typeof SNAPSHOT_VERSION;
  domain: DomainState;
  session: Session;
  lang: Lang;
};

export const DEFAULT_SESSION: Session = { reviewAs: "buy-desk-analyst", supplierSeat: "SUP-10418" };

function storage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

export function loadSnapshot(): Snapshot | undefined {
  const raw = storage()?.getItem(SNAPSHOT_KEY);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as Partial<Snapshot>;
    if (parsed.version !== SNAPSHOT_VERSION || parsed.domain?.schemaVersion !== 2) return undefined;
    if (parsed.lang !== "en" && parsed.lang !== "de") parsed.lang = "en";
    return parsed as Snapshot;
  } catch {
    return undefined;
  }
}

export function saveSnapshot(s: Omit<Snapshot, "version">): void {
  try {
    storage()?.setItem(SNAPSHOT_KEY, JSON.stringify({ version: SNAPSHOT_VERSION, ...s }));
  } catch {
    /* Quota or private mode: the demo still runs, it just won't survive reload. */
  }
}

export function clearSnapshot(): void {
  storage()?.removeItem(SNAPSHOT_KEY);
}
