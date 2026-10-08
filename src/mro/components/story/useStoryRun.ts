/**
 * Progress through one story's agent chain, held in the shared demo ledger so
 * My Desk, the workbenches and Value Assurance read the same position, and a
 * refresh at a pending decision restores the hold. A step finishes only when
 * every task its lane created is decided; a decision that ends the run (UC4
 * redirect, risk rejection) closes the case.
 */

import * as React from "react";
import type { StoryId } from "@/mro/domain/types";
import type { StoryRun } from "@/mro/data/stories/runModel";
import { freshRun, getLedger, updateLedger, useLedger, type RunState, type TaskInput } from "@/mro/services/demoLedger";

export type { RunState, TaskInput };

export type StoryStatus = "new" | "running" | "waiting" | "ready" | "done" | "ended";

/** Agent display name → stable key used by pause controls ("Bid Scoring Agent" → "bid-scoring"). */
export function agentKey(name: string): string {
  return name
    .replace(/\(.*\)/, "")
    .replace(/agent/i, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function hasProgress(id: StoryId) {
  const s = getLedger().runs[id];
  return Boolean(s && (s.revealed.length > 0 || s.finished));
}

export function resetStory(id: StoryId) {
  updateLedger((l) => {
    const runs = { ...l.runs };
    delete runs[id];
    return { ...l, runs };
  });
}

function pendingOf(run: StoryRun, s: RunState, i: number) {
  return run.steps[i]?.tasks.filter((t) => !s.decisions[t.id]) ?? [];
}

/** Where a story stands, readable from any page without mounting its workspace. */
export function storyStatus(run: StoryRun, s: RunState | undefined): { status: StoryStatus; waitingOn?: string; taskId?: string } {
  if (!s || (s.revealed.length === 0 && !s.finished && s.reached === 0)) return { status: "new" };
  if (s.finished) return { status: s.endedBy ? "ended" : "done" };
  if (!s.revealed.includes(s.reached)) return { status: "running" };
  const open = pendingOf(run, s, s.reached)[0];
  if (open) return { status: "waiting", waitingOn: open.persona, taskId: open.id };
  return { status: "ready" };
}

const RUN_MS = 1600;

export function useStoryRun(run: StoryRun, opts: { guided?: boolean; runMs?: (step: number) => number } = {}) {
  const id = run.story.id;
  const ledger = useLedger();
  const state = ledger.runs[id] ?? freshRun();
  /* Guided runs wait for the arrival to be acknowledged before the first agent starts. */
  const held = Boolean(opts.guided && !state.opened);

  const update = React.useCallback(
    (fn: (s: RunState) => RunState) =>
      updateLedger((l) => ({ ...l, runs: { ...l.runs, [id]: fn(l.runs[id] ?? freshRun()) } })),
    [id],
  );

  const frontierAgent = run.steps[state.reached]?.run.agent ?? "";
  const paused = ledger.paused.includes(agentKey(frontierAgent));

  /* The agent at the frontier "works" briefly before its output appears. */
  const running = !state.revealed.includes(state.reached) && !state.finished && !paused && !held;
  const runMs = opts.runMs?.(state.reached) ?? RUN_MS;
  React.useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(
      () => update((s) => (s.revealed.includes(s.reached) ? s : { ...s, revealed: [...s.revealed, s.reached] })),
      runMs,
    );
    return () => window.clearTimeout(t);
  }, [running, state.reached, update, runMs]);

  const open = () => update((s) => ({ ...s, opened: true }));
  const beatOf = (i: number) => state.beats?.[i] ?? 0;
  const advanceBeat = (i: number, to: number) =>
    update((s) => ((s.beats?.[i] ?? 0) >= to ? s : { ...s, beats: { ...s.beats, [i]: to } }));

  const pendingTasks = (i: number) => pendingOf(run, state, i);
  const stepDone = (i: number) => state.revealed.includes(i) && pendingTasks(i).length === 0;

  const decide = (taskId: string, optionId: string, input?: TaskInput) => {
    const step = run.steps.find((s) => s.tasks.some((t) => t.id === taskId));
    const option = step?.tasks.find((t) => t.id === taskId)?.options.find((o) => o.id === optionId);
    update((s) =>
      s.decisions[taskId]
        ? s
        : {
            ...s,
            decisions: { ...s.decisions, [taskId]: optionId },
            ...(input ? { inputs: { ...s.inputs, [taskId]: input } } : {}),
            ...(option?.endsRun ? { finished: true, endedBy: option.endsRun, endedWith: option.id } : {}),
          },
    );
  };

  const handOff = () =>
    update((s) =>
      s.finished
        ? s
        : s.reached < run.steps.length - 1
          ? { ...s, reached: s.reached + 1, selected: s.reached + 1 }
          : { ...s, finished: true },
    );

  const select = (i: number) => update((s) => (i <= s.reached ? { ...s, selected: i } : s));

  const restart = () => update(() => freshRun());

  const humanDecisions = Object.keys(state.decisions).length;
  const derived = storyStatus(run, state);
  const status: Exclude<StoryStatus, "new"> = paused && !state.finished ? "waiting" : derived.status === "new" ? "running" : derived.status;

  return { state, running, paused, held, stepDone, pendingTasks, decide, handOff, select, restart, humanDecisions, status, open, beatOf, advanceBeat };
}
