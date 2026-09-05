import type jsPDF from "jspdf";
import type { ProgramPageData } from "@/components/programs/types";
import type { ProgramExportConfig } from "../types";
import { PDF_COLORS, PDF_PAGE } from "./colors";

const { width: PAGE_W, height: PAGE_H, margin: MARGIN } = PDF_PAGE;

interface DrawHeaderParams {
  doc: jsPDF;
  yStart: number;
  organization?: ProgramPageData["organization"];
  logoData: string | null;
}

export function drawHeader({ doc, yStart, organization, logoData }: DrawHeaderParams): number {
  if (logoData) {
    doc.addImage(logoData, "PNG", MARGIN, yStart - 5, 16, 16);
  }

  const contact = organization?.details?.contact?.[0];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...PDF_COLORS.text);
  doc.text(organization?.name?.toUpperCase() || "", PAGE_W / 2, yStart, { align: "center" });

  const contactLine = [
    contact?.ville,
    contact?.["adresse-postale"],
    contact?.phones?.[0] ? `${contact.indicatif ? `+${contact.indicatif} ` : ""}${contact.phones[0]}` : null,
    contact?.emails?.[0],
  ]
    .filter(Boolean)
    .join("  ·  ");

  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.muted);
  doc.text(contactLine, PAGE_W / 2, yStart + 5, { align: "center" });

  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, yStart + 10, PAGE_W - MARGIN, yStart + 10);

  return yStart + 18;
}

export function drawFooter(doc: jsPDF, data: ProgramPageData, page: number, total: number) {
  doc.setFontSize(7);
  doc.setTextColor(...PDF_COLORS.muted);
  doc.text(`${data.organization?.name || ""} · ${data.class?.program ?? ""}`, MARGIN, PAGE_H - 8);
  doc.text(`Page ${page} / ${total}`, PAGE_W - MARGIN, PAGE_H - 8, { align: "right" });
}

// GState n'est pas exposé par les types officiels de jsPDF : le `as any`
// reste confiné à cette fonction plutôt que dispersé dans l'orchestrateur.
export function drawWatermark(doc: jsPDF, config: ProgramExportConfig) {
  if (!config.watermark) return;

  try {
    doc.setGState(new (doc as any).GState({ opacity: 0.07 }));
  } catch {
    // GState indisponible sur cette build de jsPDF — filigrane rendu opaque plutôt que bloquant
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(50);
  doc.setTextColor(160, 160, 170);
  doc.text(config.watermark.toUpperCase(), PAGE_W / 2, PAGE_H / 2, {
    align: "center",
    angle: 30,
  });

  try {
    doc.setGState(new (doc as any).GState({ opacity: 1 }));
  } catch {
    // idem
  }
}
