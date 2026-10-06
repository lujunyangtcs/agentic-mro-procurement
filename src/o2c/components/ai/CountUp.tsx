import * as React from "react";

type Props = {
  to: number;
  /** Animation duration in ms. */
  duration?: number;
  /** Number of decimals to format with. */
  decimals?: number;
  /** Prefix and suffix to render around the number (e.g. "€", "%"). */
  prefix?: string;
  suffix?: string;
  /** Use locale-grouped thousands separators. */
  grouped?: boolean;
  /** Delay before the count starts (ms). */
  delay?: number;
  className?: string;
};

/**
 * Count-up number animation. Used for KPI metrics (147 employees affected,
 * 412 hours saved, €420K/yr) on first render and on scenario change.
 */
export function CountUp({
  to,
  duration = 900,
  decimals = 0,
  prefix = "",
  suffix = "",
  grouped = true,
  delay = 0,
  className,
}: Props) {
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    // Hidden / frozen tabs don't run requestAnimationFrame or timers reliably,
    // which can leave the count stuck near 0. When the tab isn't visible, skip
    // the animation and show the final value outright.
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      setValue(to);
      return;
    }
    setValue(0);
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now + delay;
      const t = Math.max(0, Math.min(1, (now - start) / duration));
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(eased * to);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Safety net: requestAnimationFrame is throttled in background / just-loaded
    // tabs, which can leave the count frozen near 0. Guarantee the final value
    // lands regardless of RAF scheduling.
    const settle = window.setTimeout(() => setValue(to), delay + duration + 120);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
    };
  }, [to, duration, delay]);

  const rounded = Number(value.toFixed(decimals));
  const formatted = grouped
    ? rounded.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : rounded.toFixed(decimals);

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
