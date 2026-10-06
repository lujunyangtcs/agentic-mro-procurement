import { useEffect, useRef, useState } from "react";

type Options = {
  /** Total number of steps (e.g. 5). */
  total: number;
  /** Step index (0-based) at which the timeline should pause and wait for the user. */
  pauseAt: number;
  /** Delay between automatic step advances, in ms. */
  perStepMs?: number;
  /** Delay before the very first step appears. */
  initialDelayMs?: number;
  /**
   * Optional external state source. If provided, the hook persists progress
   * across remounts (e.g. when the user navigates to a doc preview and back).
   */
  external?: {
    activeStep: number;
    approved: boolean;
    set: (next: { activeStep?: number; approved?: boolean }) => void;
  };
};

export type AdvanceState = {
  /** Number of fully-revealed steps (0-indexed → step `done` count). */
  activeStep: number;
  /** True once the timeline reaches pauseAt and is waiting for a click. */
  awaitingApproval: boolean;
  /** Has the timeline finished (advanced past total-1)? */
  finished: boolean;
  /** Called by the workspace when the user clicks Approve — releases the pause. */
  approve: () => void;
};

/**
 * Drives an auto-advancing workspace timeline:
 *
 *   step 0 → step 1 → step 2 → step 3 (pause here, awaitingApproval=true)
 *   …user clicks Approve…
 *   step 4 (final fan-out)
 */
export function useAutoAdvance({
  total,
  pauseAt,
  perStepMs = 2400,
  initialDelayMs = 2400,
  external,
}: Options): AdvanceState {
  const [localStep, setLocalStep] = useState(0);
  const [localApproved, setLocalApproved] = useState(false);

  const activeStep = external ? external.activeStep : localStep;
  const approved = external ? external.approved : localApproved;

  const setActiveStep = (updater: number | ((s: number) => number)) => {
    if (external) {
      const next = typeof updater === "function" ? updater(external.activeStep) : updater;
      external.set({ activeStep: next });
    } else {
      setLocalStep(updater as number | ((s: number) => number));
    }
  };
  const setApproved = (v: boolean) => {
    if (external) external.set({ approved: v });
    else setLocalApproved(v);
  };

  // Keep refs in sync so the timeout callbacks always see the latest values.
  const stepRef = useRef(activeStep);
  const approvedRef = useRef(approved);
  stepRef.current = activeStep;
  approvedRef.current = approved;

  useEffect(() => {
    if (activeStep < pauseAt) {
      const t = window.setTimeout(
        () => setActiveStep(stepRef.current + 1),
        activeStep === 0 ? initialDelayMs : perStepMs,
      );
      return () => window.clearTimeout(t);
    }
    if (activeStep === pauseAt && approved) {
      const t = window.setTimeout(() => setActiveStep(stepRef.current + 1), 700);
      return () => window.clearTimeout(t);
    }
    if (activeStep > pauseAt && activeStep < total - 1) {
      const t = window.setTimeout(() => setActiveStep(stepRef.current + 1), 900);
      return () => window.clearTimeout(t);
    }
    return;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, approved, pauseAt, total, perStepMs, initialDelayMs]);

  return {
    activeStep,
    awaitingApproval: activeStep === pauseAt && !approved,
    finished: activeStep >= total - 1 && approved,
    approve: () => setApproved(true),
  };
}
