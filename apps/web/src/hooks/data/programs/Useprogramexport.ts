"use client";

import { useCallback, useState } from "react";
import type { ProgramSemesterDTO } from "@/services/ue/types";
import { ProgramPageData } from "@/components/programs/program/types";

// ==================== TYPES ====================

export type ExportFormat = "pdf" | "csv" | "json";
export type ExportStatus = "idle" | "loading" | "done" | "error";

type RGB = [number, number, number];

export interface UseProgramExportReturn {
  status: ExportStatus;
  exportAs: (format: ExportFormat) => Promise<void>;
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

async function buildAndDownloadPDF(data: ProgramPageData) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const PAGE_W = 297;
  const PAGE_H = 210;
  const MARGIN = 18;

  // Couleurs Grises plus saturées (plus sombres) pour éviter l'effet "trop clair"
  const C: Record<string, RGB> = {
    text: [20, 20, 22],
    muted: [80, 80, 85],
    border: [160, 160, 165],
    headerBg: [215, 215, 220], // Gris d'entête plus marqué
    ueBg: [230, 230, 235],     // Gris d'UE plus marqué
    rowAlt: [242, 242, 245],   // Gris alterné
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
        // 1. Logo à GAUCHE uniquement
        if (logoData) {
          doc.addImage(logoData, "PNG", MARGIN, yStart - 5, 16, 16);
        }

        
    // Info Université : Toujours centrées
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

  let y = drawHeader(18);
  y += 4;

  const centerX = PAGE_W / 2;
  const totalCredits = data.semesters.reduce((s, sem) => s + sem.totalCredits, 0);

  // Footer
  const drawFooter = (page: number, total: number) => {
    doc.setFontSize(7);
    doc.setTextColor(...C.muted);
    doc.text(`${org?.name || ""} · ${data.class.program}`, MARGIN, PAGE_H - 8);
    doc.text(`Page ${page} / ${total}`, PAGE_W - MARGIN, PAGE_H - 8, { align: "right" });
  };

  // Rectangle infos programme (Gris saturé, sans ombre)
  doc.setFillColor(...C.ueBg);
  doc.rect(centerX - 60, y - 6, 120, 10, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
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
  // LIGNE SÉPARATRICE RÉDUITE DE 70% (Largeur = 30% du contenu)
  const separatorWidth = (PAGE_W - MARGIN * 2) * 0.3; 
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.5);
  doc.line(centerX - (separatorWidth / 2), y, centerX + (separatorWidth / 2), y);
  
  y += 8;

  for (const sem of data.semesters) {
    if (y > PAGE_H - 40) {
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
      // Ligne UE (Hiérarchie visuelle)
      body.push([
        { content: pue.order ?? "", styles: { fontStyle: 'bold', fillColor: C.ueBg } },
        { content: pue.ue.code ?? "", styles: { fontStyle: 'bold', fillColor: C.ueBg } },
        { content: pue.ue.name.toUpperCase(), styles: { fontStyle: 'bold', fillColor: C.ueBg } },
        { content: `${pue.ueTotalDuration}h`, styles: { fontStyle: 'bold', halign: 'center', fillColor: C.ueBg } },
        { content: pue.ueTotalCredits, styles: { fontStyle: 'bold', halign: 'center', fillColor: C.ueBg } }
      ]);
      
      // Lignes Cours
      for (const course of pue.ue.ueCourses) {
        body.push([
          `${pue.order}.${course.order}`,
          course.code,
          `      ${course.name}`, // Indentation pour la hiérarchie
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
        0: { cellWidth: 18,  },
        1: { cellWidth: 30 },
        3: { cellWidth: 22, halign: "center" },
        4: { cellWidth: 18, halign: "center" },
      },
    });

    y = (doc as any).lastAutoTable.finalY + 12;
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }


  doc.save(`programme_${data.class.name}.pdf`);
}

// ==================== CSV / JSON / HOOK ====================

function buildCSV(semesters: ProgramSemesterDTO[]): string {
  const rows = flattenRows(semesters);
  const header = ["Semestre", "N° UE", "Code UE", "Intitulé UE", "Code Cours", "Intitulé Cours", "Volume", "Crédits"];
  const lines = rows.map(r =>
    [r.semesterLabel, r.ueOrder, r.ueCode, r.ueName, r.courseCode, r.courseName, r.duration, r.credits]
    .map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")
  );
  return [header.map(h => `"${h}"`).join(","), ...lines].join("\r\n");
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

  const exportAs = useCallback(async (format: ExportFormat) => {
    setStatus("loading");
    try {
      const filename = `programme_${data.class.name}`.replace(/\s+/g, "_").toLowerCase();
      if (format === "pdf") await buildAndDownloadPDF(data);
      else if (format === "csv") triggerDownload(new Blob(["\uFEFF" + buildCSV(data.semesters)], { type: "text/csv" }), `${filename}.csv`);
      else if (format === "json") triggerDownload(new Blob([buildJSON(data)], { type: "application/json" }), `${filename}.json`);
      setStatus("done");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }, [data]);

  return { status, exportAs };
}