import type { ProgramPageData } from "@/components/programs/types";
import type { ProgramExportConfig } from "../types";
import { buildExportFilename } from "../filename";
import { PDF_COLORS, PDF_PAGE } from "./colors";
import { loadLogoAsBase64 } from "./logo";
import { drawHeader, drawFooter, drawWatermark } from "./layout";
import { buildTableHead, buildTableBody, buildColumnStyles } from "./table";
import { drawSignatures } from "./signatures";

const { width: PAGE_W, height: PAGE_H, margin: MARGIN } = PDF_PAGE;

export async function buildAndDownloadPDF(data: ProgramPageData, config: ProgramExportConfig) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const logoData = await loadLogoAsBase64(data.organization?.logo);

  let y = drawHeader({ doc, yStart: 18, organization: data.organization, logoData }) + 4;

  const centerX = PAGE_W / 2;
  const totalCredits = (data.semesters ?? []).reduce((sum, sem) => sum + (sem?.totalCredits ?? 0), 0);

  // En-tête programme
  doc.setFillColor(...PDF_COLORS.ueBg);
  doc.rect(centerX - 70, y - 6, 140, 10, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...PDF_COLORS.text);
  doc.text((data.class?.program ?? "").toUpperCase(), centerX, y, { align: "center" });

  y += 10;
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.muted);
  doc.text(`Parcours : ${data.class?.programTrack ?? "-"}`, centerX - 50, y);
  doc.text(`Niveau : ${data.class?.level ?? "-"}`, centerX + 50, y, { align: "right" });

  y += 5;
  doc.text(`Classe : ${data.class?.name ?? "-"}`, centerX - 50, y);
  doc.text(`Année : ${data.class?.academicYear ?? "-"}`, centerX + 50, y, { align: "right" });

  y += 7;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PDF_COLORS.text);
  doc.text(`Total de crédits : ${totalCredits}`, centerX, y, { align: "center" });

  y += 6;
  const separatorWidth = (PAGE_W - MARGIN * 2) * 0.3;
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(centerX - separatorWidth / 2, y, centerX + separatorWidth / 2, y);

  y += 8;

  for (const sem of data.semesters ?? []) {
    if (y > PAGE_H - 45) {
      doc.addPage();
      y = drawHeader({ doc, yStart: 18, organization: data.organization, logoData }) + 6;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...PDF_COLORS.text);
    doc.text(`SEMESTRE ${sem.semester ?? ""}`, MARGIN, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: buildTableHead(config),
      body: buildTableBody(sem, config),
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        lineColor: PDF_COLORS.border,
        lineWidth: 0.1,
        textColor: PDF_COLORS.text,
      },
      headStyles: {
        fillColor: PDF_COLORS.headerBg,
        textColor: PDF_COLORS.text,
        fontStyle: "bold",
      },
      columnStyles: buildColumnStyles(config),
    });

    y = (doc as any).lastAutoTable.finalY + 12;
  }

  // Grille de signatures si demandée (modèle officiel)
  if (config.showSignatures) {
    if (y > PAGE_H - 45) {
      doc.addPage();
      y = drawHeader({ doc, yStart: 18, organization: data.organization, logoData }) + 10;
    }
    drawSignatures(doc, y + 5);
  }

  // Filigrane et pied de page sur toutes les pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawWatermark(doc, config);
    drawFooter(doc, data, i, totalPages);
  }

  doc.save(buildExportFilename(data, "pdf"));
}
