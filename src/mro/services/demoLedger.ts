/**
 * Everything the story runs decide that is not a domain command: where each
 * story's agent chain stands, which value records Finance has signed, which
 * opportunities a Category Lead accepted, which rule changes the Value Council
 * approved and which agents are paused. One external store, persisted next to
 * the domain snapshot, so every page reads the same answer and a refresh
 * mid-approval comes back where it stopped.
 */

import * as React from "react";
import type { Role, StoryId } from "@/mro/domain/types";

type Bi = { en: string; de: string };

export type RunState = {
  reached: number;
  selected: number;
  revealed: number[];
  decisions: Record<string, string>;
  finished: boolean;
  endedBy?: Bi;
  /** Option id that ended the run, so value and supplier pages can branch on it. */
  endedWith?: string;
};

export type Signoff = { by: string; role: Role; at: string };

export type LedgerState = {
  version: 1;
  runs: Partial<Record<StoryId, RunState>>;
  /** Value record id → invoice / receipt evidence posted. */
  evidenced: Record<string, string>;
  /** Value record id → Finance sign-off. */
  signoffs: Record<string, Signoff>;
  /** Opportunity id → accepted by Category Lead. */
  opportunities: Record<string, { state: "live" | "declined"; by: string; at: string }>;
  /** Rule change id → Value Council decision. */
  ruleChanges: Record<string, { state: "approved" | "rejected"; by: string; at: string }>;
  paused: string[];
};

const KEY = "ap-demo:ledger:v1";

const fresh = (): LedgerState => ({ version: 1, runs: {}, evidenced: {}, signoffs: {}, opportunities: {}, ruleChanges: {}, paused: [] });

function load(): LedgerState {
  if (typeof window === "undefined") return fresh();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return fresh();
    const parsed = JSON.parse(raw) as LedgerState;
    return parsed.version === 1 ? { ...fresh(), ...parsed } : fresh();
  } catch {
    return fresh();
  }
}

let state: LedgerState = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* Private mode: the demo still runs, it just won't survive reload. */
  }
}

export function updateLedger(fn: (s: LedgerState) => LedgerState) {
  state = fn(state);
  persist();
  listeners.forEach((l) => l());
}

export function getLedger() {
  return state;
}

export function resetLedger() {
  updateLedger(() => fresh());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const serverSnapshot = fresh();

export function useLedger(): LedgerState {
  return React.useSyncExternalStore(subscribe, () => state, () => serverSnapshot);
}

export const freshRun = (): RunState => ({ reached: 0, selected: 0, revealed: [], decisions: {}, finished: false });
