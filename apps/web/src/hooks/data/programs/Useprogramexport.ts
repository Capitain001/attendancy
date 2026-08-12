"use client";

import { useCallback, useState } from "react";
import type { ProgramSemesterDTO } from "@/services/ue/types";
import { ProgramPageData } from "@/components/programs/types";

// ==================== TYPES ====================

export type ExportFormat = "pdf" | "xlsx" | "json";
export type ExportTemplate = "official" | "synthetic" | "teaching_load";
export type ExportStatus = "idle" | "loading" | "done" | "error";

export interface ProgramExportConfig {
  format: ExportFormat;
  template?: ExportTemplate;
  watermark?: string;
  showSignatures?: boolean;
  showHoursBreakdown?: boolean;
}

type RGB = [number, number, number];

export interface UseProgramExportReturn {
  status: ExportStatus;
  exportAs: (formatOrConfig: ExportFormat | ProgramExportConfig) => Promise<void>;
}

// ==================== HELPERS ====================

function flattenRows(semesters: ProgramSemesterDTO[]) {
  const rows: any[] = [];
  for (const sem of semesters) {
    for (const pue of sem.ues) {
      for (const course of pue.ue.ueCourses) {
        rows.push({
          semesterLabel: `Semestre ${sem.semester}`,
          ueOrder: pue.order,
          ueCode: pue.ue.code,
          ueName: pue.ue.name,
          courseOrder: course.order,
          courseCode: course.code,
          courseName: course.name,
          duration: course.duration,
          credits: course.credits,
        });
      }
    }
  }
  return rows;
}

// ==================== PDF ====================

async function buildAndDownloadPDF(data: ProgramPageData, config: ProgramExportConfig) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const PAGE_W = 297;
  const PAGE_H = 210;
  const MARGIN = 18;

  const C: Record<string, RGB> = {
    text: [20, 20, 22],
    muted: [80, 80, 85],
    border: [160, 160, 165],
    headerBg: [215, 215, 220],
    ueBg: [230, 230, 235],
    rowAlt: [242, 242, 245],
  };

  const org = data.organization;
  const contact = org?.details?.contact?.[0];

  let logoData: string | null = null;
  if (org?.logo) {
    try {
      const res = await fetch(org.logo);
      const blob = await res.blob();
      logoData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch {}
  }

  const drawHeader = (yStart: number) => {
    if (logoData) {
      doc.addImage(logoData, "PNG", MARGIN, yStart - 5, 16, 16);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...C.text);
    doc.text(org?.name?.toUpperCase() || "", PAGE_W / 2, yStart, { align: "center" });

    const contactLine = [
      contact?.ville,
      contact?.["adresse-postale"],
      contact?.phones?.[0] ? `+${contact.indicatif} ${contact.phones[0]}` : null,
      contact?.emails?.[0],
    ].filter(Boolean).join("  ·  ");

    doc.setFontSize(8);
    doc.setTextColor(...C.muted);
    doc.text(contactLine, PAGE_W / 2, yStart + 5, { align: "center" });

    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, yStart + 10, PAGE_W - MARGIN, yStart + 10);

    return yStart + 18;
  };

  const drawWatermark = () => {
    if (!config.watermark) return;
    try {
      const gState = new (doc as any).GState({ opacity: 0.07 });
      doc.setGState(gState);
    } catch {}

    doc.setFont("helvetica", "bold");
    doc.setFontSize(50);
    doc.setTextColor(160, 160, 170);
    doc.text(config.watermark.toUpperCase(), PAGE_W / 2, PAGE_H / 2, {
      align: "center",
      angle: 30,
    });

    try {
      const resetGState = new (doc as any).GState({ opacity: 1 });
      doc.setGState(resetGState);
    } catch {}
  };

  let y = drawHeader(18);
  y += 4;

  const centerX = PAGE_W / 2;
  const totalCredits = data.semesters.reduce((s, sem) => s + sem.totalCredits, 0);

  const drawFooter = (page: number, total: number) => {
    doc.setFontSize(7);
    doc.setTextColor(...C.muted);
    doc.text(`${org?.name || ""} · ${data.class.program}`, MARGIN, PAGE_H - 8);
    doc.text(`Page ${page} / ${total}`, PAGE_W - MARGIN, PAGE_H - 8, { align: "right" });
  };

  // En-tête programme
  doc.setFillColor(...C.ueBg);
  doc.rect(centerX - 70, y - 6, 140, 10, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...C.text);
  doc.text(data.class.program.toUpperCase(), centerX, y, { align: "center" });

  y += 10;
  doc.setFontSize(9);
  doc.setTextColor(...C.muted);
  doc.text(`Parcours : ${data.class.programTrack || "-"}`, centerX - 50, y);
  doc.text(`Niveau : ${data.class.level}`, centerX + 50, y, { align: "right" });

  y += 5;
  doc.text(`Classe : ${data.class.name}`, centerX - 50, y);
  doc.text(`Année : ${data.class.academicYear}`, centerX + 50, y, { align: "right" });

  y += 7;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.text);
  doc.text(`Total de crédits : ${totalCredits}`, centerX, y, { align: "center" });

  y += 6;
  const separatorWidth = (PAGE_W - MARGIN * 2) * 0.3; 
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.5);
  doc.line(centerX - (separatorWidth / 2), y, centerX + (separatorWidth / 2), y);
  
  y += 8;

  for (const sem of data.semesters) {
    if (y > PAGE_H - 45) {
      doc.addPage();
      y = drawHeader(18) + 6;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...C.text);
    doc.text(`SEMESTRE ${sem.semester}`, MARGIN, y);
    y += 5;

    const body: any[] = [];
    for (const pue of sem.ues) {
      body.push([
        { content: pue.order ?? "", styles: { fontStyle: 'bold', fillColor: C.ueBg } },
        { content: pue.ue.code ?? "", styles: { fontStyle: 'bold', fillColor: C.ueBg } },
        { content: pue.ue.name.toUpperCase(), styles: { fontStyle: 'bold', fillColor: C.ueBg } },
        { content: `${pue.ueTotalDuration}h`, styles: { fontStyle: 'bold', halign: 'center', fillColor: C.ueBg } },
        { content: pue.ueTotalCredits, styles: { fontStyle: 'bold', halign: 'center', fillColor: C.ueBg } }
      ]);
      
      for (const course of pue.ue.ueCourses) {
        body.push([
          `${pue.order}.${course.order}`,
          course.code,
          `      ${course.name}`,
          `${course.duration}h`,
          course.credits
        ]);
      }
    }

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [["N°", "Code", "Intitulé", "Volume", "Crédits"]],
      body,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        lineColor: C.border,
        lineWidth: 0.1,
        textColor: C.text,
      },
      headStyles: {
        fillColor: C.headerBg,
        textColor: C.text,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 30 },
        3: { cellWidth: 22, halign: "center" },
        4: { cellWidth: 18, halign: "center" },
      },
    });

    y = (doc as any).lastAutoTable.finalY + 12;
  }

  // Grille de signatures si demandée (Modèle Officiel)
  if (config.showSignatures) {
    if (y > PAGE_H - 45) {
      doc.addPage();
      y = drawHeader(18) + 10;
    }
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.text);

    const sigW = (PAGE_W - MARGIN * 2) / 3;
    doc.text("Le Chef de Département", MARGIN + 10, y);
    doc.text("Le Directeur des Études", MARGIN + sigW + 10, y);
    doc.text("Le Recteur / Directeur", MARGIN + sigW * 2 + 10, y);

    y += 18;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...C.muted);
    doc.text("(Signature et Cachet)", MARGIN + 10, y);
    doc.text("(Signature et Cachet)", MARGIN + sigW + 10, y);
    doc.text("(Signature et Cachet)", MARGIN + sigW * 2 + 10, y);
  }

  // Appliquer le filigrane et les pieds de page sur toutes les pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawWatermark();
    drawFooter(i, totalPages);
  }

  doc.save(`programme_${data.class.name}.pdf`);
}

// ==================== CSV / JSON / HOOK ====================

function buildCSV(semesters: ProgramSemesterDTO[]): string {
  const rows = flattenRows(semesters);
  const header = ["Semestre", "N° UE", "Code UE", "Intitulé UE", "Code Cours", "Intitulé Cours", "Volume", "Crédits"];
  const escape = (v: any) => {
    const s = String(v ?? "");
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map(r =>
    [r.semesterLabel, r.ueOrder, r.ueCode, r.ueName, r.courseCode, r.courseName, r.duration, r.credits]
      .map(escape).join(";")
  );
  return [header.map(escape).join(";"), ...lines].join("\r\n");
}

// ==================== XLSX ====================
async function buildAndDownloadXLSX(data: ProgramPageData) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Programme");

  sheet.columns = [
    { header: "Semestre",       key: "semesterLabel", width: 14 },
    { header: "N° UE",          key: "ueOrder",        width: 8  },
    { header: "Code UE",        key: "ueCode",         width: 14 },
    { header: "Intitulé UE",    key: "ueName",         width: 42 },
    { header: "N° Cours",       key: "courseOrder",    width: 10 },
    { header: "Code Cours",     key: "courseCode",     width: 16 },
    { header: "Intitulé Cours", key: "courseName",     width: 42 },
    { header: "Volume",         key: "duration",        width: 10 },
    { header: "Crédits",        key: "credits",         width: 10 },
  ];

  const THIN_BORDER = {
    top:    { style: "thin", color: { argb: "FFB0B0B5" } },
    bottom: { style: "thin", color: { argb: "FFB0B0B5" } },
    left:   { style: "thin", color: { argb: "FFB0B0B5" } },
    right:  { style: "thin", color: { argb: "FFB0B0B5" } },
  } as const;

  // Style de l'en-tête
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: "left", vertical: "middle" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD7D7DC" } };
    cell.border = THIN_BORDER;
  });

  let rowIndex = 2;

  for (const sem of data.semesters) {
    const semStartRow = rowIndex;

    for (const pue of sem.ues) {
      const ueStartRow = rowIndex;

      for (const course of pue.ue.ueCourses) {
        const row = sheet.addRow({
          semesterLabel: sem.semester ? `Semestre ${sem.semester}` : "",
          ueOrder: pue.order,
          ueCode: pue.ue.code,
          ueName: pue.ue.name,
          courseOrder: `${pue.order}.${course.order}`,
          courseCode: course.code,
          courseName: course.name,
          duration: course.duration,
          credits: course.credits,
        });
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          // Colonnes A, B, C, D = Semestre, N° UE, Code UE, Intitulé UE (cellules fusionnées)
          const isMergedGroupColumn = colNumber >= 1 && colNumber <= 4;
          cell.alignment = {
            horizontal: "left",
            vertical: isMergedGroupColumn ? "top" : "middle",
          };
          cell.border = THIN_BORDER;
        });
        rowIndex++;
      }

      const ueEndRow = rowIndex - 1;
      if (ueEndRow > ueStartRow) {
        sheet.mergeCells(`B${ueStartRow}:B${ueEndRow}`);
        sheet.mergeCells(`C${ueStartRow}:C${ueEndRow}`);
        sheet.mergeCells(`D${ueStartRow}:D${ueEndRow}`);
      }
    }

    const semEndRow = rowIndex - 1;
    if (semEndRow > semStartRow) {
      sheet.mergeCells(`A${semStartRow}:A${semEndRow}`);
    }

    // Ligne "total" du semestre
    const totalRow = sheet.addRow({
      semesterLabel: "total",
      ueOrder: "",
      ueCode: "",
      ueName: "",
      courseOrder: "",
      courseCode: "",
      courseName: "",
      duration: sem.totalDuration,
      credits: sem.totalCredits,
    });
    totalRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.alignment = { horizontal: "left", vertical: "middle" };
      cell.border = THIN_BORDER;
      cell.font = { bold: true };
    });
    rowIndex++;
  }

  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `programme_${data.class.name}`.replace(/\s+/g, "_").toLowerCase();
  triggerDownload(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${filename}.xlsx`
  );
}

function buildJSON(data: ProgramPageData): string {
  return JSON.stringify(data, null, 2);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function useProgramExport(data: ProgramPageData): UseProgramExportReturn {
  const [status, setStatus] = useState<ExportStatus>("idle");

  const exportAs = useCallback(async (formatOrConfig: ExportFormat | ProgramExportConfig) => {
    setStatus("loading");
    try {
      const config: ProgramExportConfig = typeof formatOrConfig === "string"
        ? { format: formatOrConfig }
        : formatOrConfig;

      const filename = `programme_${data.class.name}`.replace(/\s+/g, "_").toLowerCase();

      if (config.format === "pdf") await buildAndDownloadPDF(data, config);
      else if (config.format === "xlsx") await buildAndDownloadXLSX(data);
      else if (config.format === "json") triggerDownload(new Blob([buildJSON(data)], { type: "application/json" }), `${filename}.json`);

      setStatus("done");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }, [data]);

  return { status, exportAs };
}