// src/lib/export/exporters.ts
//
// Exporters génériques opérant sur ExportConfig<T>. Pur client (DOM/Blob).
// Largeurs auto-ajustées au contenu (XLSX + PDF) — corrige le défaut « cellule
// ne s'adapte pas à son contenu ». Libs chargées en dynamic import (bundle léger).

import type { ExportColumn, ExportConfig, ExportFormat } from "./types";
import { buildPrintHtml, type PrintPayload } from "./print-template";

/* =========================
   HELPERS
========================= */

function headers<T>(cols: ExportColumn<T>[]): string[] {
  return cols.map((c) => c.header);
}

function matrix<T>(cfg: ExportConfig<T>): string[][] {
  return cfg.rows.map((row) => cfg.columns.map((c) => c.value(row) ?? ""));
}

/** Projection sérialisable (headers + matrice) pour les rendus HTML (print/serveur). */
export function toPrintPayload<T>(cfg: ExportConfig<T>): PrintPayload {
  return {
    filename: cfg.filename,
    title: cfg.title,
    subtitle: cfg.subtitle,
    headers: headers(cfg.columns),
    rows: matrix(cfg),
  };
}

/** Largeur (caractères) auto-ajustée : max(header, cellules), bornée. */
function autoWidth<T>(
  cfg: ExportConfig<T>,
  colIndex: number,
  min = 10,
  max = 60,
): number {
  const col = cfg.columns[colIndex];
  if (col.width) return col.width;
  let longest = col.header.length;
  for (const row of cfg.rows) {
    const len = (col.value(row) ?? "").length;
    if (len > longest) longest = len;
  }
  return Math.min(Math.max(longest + 2, min), max);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* =========================
   CSV (compatible Excel FR : séparateur ;, BOM UTF-8)
========================= */

export function exportCSV<T>(cfg: ExportConfig<T>) {
  const escape = (cell: string) => `"${cell.replace(/"/g, '""')}"`;
  const lines = [headers(cfg.columns), ...matrix(cfg)].map((row) =>
    row.map(escape).join(";"),
  );
  const csv = lines.join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${cfg.filename}.csv`);
}

/* =========================
   JSON
========================= */

export function exportJSON<T>(cfg: ExportConfig<T>) {
  const data = cfg.rows.map((row) => {
    const obj: Record<string, string> = {};
    for (const c of cfg.columns) obj[c.header] = c.value(row) ?? "";
    return obj;
  });
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  triggerDownload(blob, `${cfg.filename}.json`);
}

/* =========================
   XLSX (exceljs) — largeurs auto-ajustées
========================= */

export async function exportXLSX<T>(cfg: ExportConfig<T>) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = process.env.NEXT_PUBLIC_SITE_NAME ?? "App";
  wb.created = new Date();

  const ws = wb.addWorksheet(cfg.sheetName ?? "Export", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  ws.columns = cfg.columns.map((c, i) => ({
    header: c.header,
    key: String(i),
    width: autoWidth(cfg, i),
  }));

  const headerRow = ws.getRow(1);
  // Entête neutre : gris clair + texte gras foncé (pas de bandeau bleu).
  headerRow.font = { bold: true, color: { argb: "FF0F172A" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE2E8F0" },
  };
  headerRow.alignment = { vertical: "middle" };
  headerRow.height = 20;

  for (const row of matrix(cfg)) ws.addRow(row);

  ws.eachRow({ includeEmpty: false }, (row, n) => {
    if (n === 1) return;
    row.alignment = { vertical: "middle", wrapText: true };
    if (n % 2 === 0) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF1F5F9" },
      };
    }
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, `${cfg.filename}.xlsx`);
}

/* =========================
   DOCX (docx)
========================= */

export async function exportDOCX<T>(cfg: ExportConfig<T>) {
  const {
    Document,
    Packer,
    Paragraph,
    Table,
    TableRow,
    TableCell,
    TextRun,
    HeadingLevel,
    WidthType,
  } = await import("docx");

  const headerCells = cfg.columns.map(
    (c) =>
      new TableCell({
        // Entête neutre : gris clair + texte gras foncé.
        shading: { fill: "E2E8F0" },
        children: [
          new Paragraph({
            children: [new TextRun({ text: c.header, bold: true, color: "0F172A" })],
          }),
        ],
      }),
  );

  const bodyRows = matrix(cfg).map(
    (row) =>
      new TableRow({
        children: row.map(
          (cell) => new TableCell({ children: [new Paragraph(cell)] }),
        ),
      }),
  );

  const heading = [
    ...(cfg.title
      ? [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: cfg.title })],
          }),
        ]
      : []),
    ...(cfg.subtitle
      ? [
          new Paragraph({
            children: [new TextRun({ text: cfg.subtitle, italics: true })],
          }),
        ]
      : []),
    new Paragraph({ text: "" }),
  ];

  const doc = new Document({
    sections: [
      {
        children: [
          ...heading,
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [new TableRow({ children: headerCells }), ...bodyRows],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, `${cfg.filename}.docx`);
}

/* =========================
   PRINT (impression navigateur → PDF papier)
========================= */

export function exportPrint<T>(cfg: ExportConfig<T>) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  win.document.write(buildPrintHtml(toPrintPayload(cfg), { autoPrint: true }));
  win.document.close();
}

/* =========================
   DISPATCH
========================= */

export function runExport<T>(format: ExportFormat, cfg: ExportConfig<T>) {
  switch (format) {
    case "csv":
      return exportCSV(cfg);
    case "json":
      return exportJSON(cfg);
    case "xlsx":
      return exportXLSX(cfg);
    case "docx":
      return exportDOCX(cfg);
    case "print":
      return exportPrint(cfg);
  }
}
