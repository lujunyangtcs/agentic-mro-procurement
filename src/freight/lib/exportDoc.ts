/**
 * Export a rendered SAP/ServiceNow document as a self-contained HTML file.
 *
 * The demo's documents are pixel-faithful ERP reconstructions, so the most
 * convincing "export" is a snapshot of exactly what's on screen. We clone the
 * document's DOM subtree, inline every stylesheet rule the app loaded (Tailwind
 * utilities + theme variables), and wrap it in a standalone HTML page that opens
 * looking identical — and prints straight to PDF. No server, real Blob download.
 */

/** Collect all same-origin CSS rules currently applied on the page. */
function collectCss(): string {
  let css = "";
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules;
      if (!rules) continue;
      for (const rule of Array.from(rules)) css += rule.cssText + "\n";
    } catch {
      // Cross-origin stylesheet — cssRules access throws; skip it.
    }
  }
  return css;
}

/**
 * Download `el` (a document shell) as a standalone .html file named `filename`.
 * Any node marked `data-export-control` (e.g. the Export button itself) is
 * stripped from the snapshot so the file shows only the document.
 */
export function exportElementAsHtml(el: HTMLElement, filename: string): void {
  const clone = el.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("[data-export-control]").forEach((n) => n.remove());

  const css = collectCss();
  const title = filename.replace(/\.html?$/i, "");
  const stamp = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>${css}</style>
<style>
  html, body { margin: 0; background: #eef1f5; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; padding: 24px; }
  .export-wrap { max-width: 920px; margin: 0 auto; }
  .export-meta { max-width: 920px; margin: 0 auto 12px; color: #5b6b7b; font-size: 11px;
    display: flex; justify-content: space-between; }
  @media print { body { background: #fff; padding: 0; } .export-meta { display: none; } }
</style>
</head>
<body>
<div class="export-meta"><span>${title}</span><span>Exported ${stamp}</span></div>
<div class="export-wrap">${clone.outerHTML}</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Sanitise a document number into a safe filename stem. */
export function fileStem(docNumber: string): string {
  return docNumber.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}
