/**
 * Whether a chart should animate itself in.
 *
 * Recharts grows its bars and arcs with requestAnimationFrame, and a browser
 * throttles rAF to nothing while its tab is in the background. A chart that
 * mounts on a hidden tab therefore starts at zero height and never finishes —
 * the presenter switches back to a page of empty axes.
 *
 * So: animate only when the tab is actually visible at mount, and draw the
 * final shape immediately otherwise. The decision is made once and kept, since
 * flipping it later would restart the growth from zero on a chart the viewer
 * is already looking at.
 */

import * as React from "react";

export function useChartAnimation(): boolean {
  const [animate] = React.useState(() => !document.hidden);
  return animate;
}
