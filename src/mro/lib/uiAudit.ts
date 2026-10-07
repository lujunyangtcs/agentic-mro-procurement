/**
 * Development check for UI01–UI04: lists one-line labels and buttons that
 * wrapped onto a second line, and equal-height rows whose cards differ by
 * more than 1px. Run `window.__uiAudit()` in the console.
 */

type AuditReport = { wrapped: string[]; unequalRows: string[] };

function lineCount(el: Element): number {
  const range = document.createRange();
  range.selectNodeContents(el);
  const tops = new Set(Array.from(range.getClientRects()).filter((r) => r.width > 0).map((r) => Math.round(r.top)));
  return tops.size;
}

function describe(el: Element): string {
  return `${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 60)}"`;
}

export function uiAudit(): AuditReport {
  const wrapped: string[] = [];
  document.querySelectorAll("[data-one-line], button, label").forEach((el) => {
    const h = el as HTMLElement;
    if (h.offsetParent === null || !(h.textContent ?? "").trim()) return;
    if (lineCount(el) > 1) wrapped.push(describe(el));
  });
  const unequalRows: string[] = [];
  document.querySelectorAll("[data-equal-row]").forEach((row, i) => {
    const hs = Array.from(row.children).map((c) => (c as HTMLElement).getBoundingClientRect().height);
    if (hs.length > 1 && Math.max(...hs) - Math.min(...hs) > 1) unequalRows.push(`row ${i}: ${hs.map((x) => Math.round(x)).join(" / ")}`);
  });
  return { wrapped, unequalRows };
}

export function installUiAudit() {
  if (typeof window === "undefined" || !import.meta.env.DEV) return;
  (window as unknown as { __uiAudit: typeof uiAudit }).__uiAudit = uiAudit;
}
