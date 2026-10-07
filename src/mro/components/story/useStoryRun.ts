/**
 * Progress through one story's agent chain. Kept per story for the session so
 * leaving the workspace and coming back resumes where the presenter stopped.
 * A step finishes only when every task its lane created is decided; a
 * decision that ends the run (UC4 redirect, risk rejection) closes the case.
 */

import * as React from "react";
import type { StoryId } from "@/mro/domain/types";
import type { StoryRun } from "@/mro/data/stories/runModel";

type Bi = { en: string; de: string };

export type RunState = {
  reached: number;
  selected: number;
  revealed: number[];
  decisions: Record<string, string>;
  finished: boolean;
  endedBy?: Bi;
};

const memory = new Map<StoryId, RunState>();

const fresh = (): RunState => ({ reached: 0, selected: 0, revealed: [], decisions: {}, finished: false });

export function hasProgress(id: StoryId) {
  const s = memory.get(id);
  return Boolean(s && (s.revealed.length > 0 || s.finished));
}

export function resetStory(id: StoryId) {
  memory.delete(id);
}

const RUN_MS = 1600;

export function useStoryRun(run: StoryRun) {
  const id = run.story.id;
  const [state, setState] = React.useState<RunState>(() => memory.get(id) ?? fresh());

  const update = React.useCallback(
    (fn: (s: RunState) => RunState) =>
      setState((s) => {
        const next = fn(s);
        memory.set(id, next);
        return next;
      }),
    [id],
  );

  /* The agent at the frontier "works" briefly before its output appears. */
  const running = !state.revealed.includes(state.reached) && !state.finished;
  React.useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(() => update((s) => ({ ...s, revealed: [...s.revealed, s.reached] })), RUN_MS);
    return () => window.clearTimeout(t);
  }, [running, state.reached, update]);

  const pendingTasks = (i: number) => run.steps[i].tasks.filter((t) => !state.decisions[t.id]);
  const stepDone = (i: number) => state.revealed.includes(i) && pendingTasks(i).length === 0;

  const decide = (taskId: string, optionId: string) => {
    const step = run.steps.find((s) => s.tasks.some((t) => t.id === taskId));
    const option = step?.tasks.find((t) => t.id === taskId)?.options.find((o) => o.id === optionId);
    update((s) => ({
      ...s,
      decisions: { ...s.decisions, [taskId]: optionId },
      ...(option?.endsRun ? { finished: true, endedBy: option.endsRun } : {}),
    }));
  };

  const handOff = () =>
    update((s) =>
      s.reached < run.steps.length - 1 ? { ...s, reached: s.reached + 1, selected: s.reached + 1 } : { ...s, finished: true },
    );

  const select = (i: number) => update((s) => (i <= s.reached ? { ...s, selected: i } : s));

  const restart = () => update(() => fresh());

  const humanDecisions = Object.keys(state.decisions).length;
  const waiting = !state.finished && state.revealed.includes(state.reached) && pendingTasks(state.reached).length > 0;
  const status: "running" | "waiting" | "ready" | "done" | "ended" = state.finished
    ? state.endedBy
      ? "ended"
      : "done"
    : waiting
      ? "waiting"
      : running
        ? "running"
        : "ready";

  return { state, running, stepDone, pendingTasks, decide, handOff, select, restart, humanDecisions, status };
}
