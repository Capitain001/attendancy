// src/lib/export/print-template.ts
//
// Template HTML PUR (aucun DOM) — source unique du rendu « document ».
// Utilisé par :
//  - exportPrint (client, window.print → PDF papier)
//  - la route /api/export/pdf (serveur, headless Chrome → PDF téléchargé)
// Même HTML/CSS des deux côtés = rendu cohérent garanti.

/** Payload sérialisable (pas de fonctions) pour le rendu serveur. */
export interface PrintPayload {
  filename: string;
  title?: string;
  subtitle?: string;
  headers: string[];
  rows: string[][];
}

export function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Construit le document HTML imprimable.
 * @param autoPrint true (client) → déclenche window.print() au chargement.
 *                  false (serveur) → headless Chrome appelle page.pdf().
 */
export function buildPrintHtml(
  p: PrintPayload,
  { autoPrint = false }: { autoPrint?: boolean } = {},
): string {
  const thead = p.headers.map((h) => `<th>${escHtml(h)}</th>`).join("");
  const tbody = p.rows
    .map((row) => `<tr>${row.map((c) => `<td>${escHtml(c)}</td>`).join("")}</tr>`)
    .join("");

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" />
<title>${escHtml(p.filename)}</title>
<style>
  * { font-family: system-ui, sans-serif; }
  body { padding: 24px; color: #0f172a; }
  h1 { font-size: 18px; margin: 0 0 2px; }
  p.sub { color: #64748b; margin: 0 0 16px; font-size: 12px; text-transform: capitalize; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid #e2e8f0; }
  thead th { background: #1e293b; color: #fff; }
  tbody tr:nth-child(even) { background: #f1f5f9; }
  @media print { body { padding: 0; } }
</style></head>
<body>
  ${p.title ? `<h1>${escHtml(p.title)}</h1>` : ""}
  ${p.subtitle ? `<p class="sub">${escHtml(p.subtitle)}</p>` : ""}
  <table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>
  ${autoPrint ? `<script>window.onload = () => { window.print(); };</script>` : ""}
</body></html>`;
}
