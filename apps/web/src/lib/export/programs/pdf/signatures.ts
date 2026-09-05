import type jsPDF from "jspdf";
import { PDF_COLORS, PDF_PAGE } from "./colors";

const { width: PAGE_W, margin: MARGIN } = PDF_PAGE;

export function drawSignatures(doc: jsPDF, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.text);

  const sigW = (PAGE_W - MARGIN * 2) / 3;
  doc.text("Le Chef de Département", MARGIN + 10, y);
  doc.text("Le Directeur des Études", MARGIN + sigW + 10, y);
  doc.text("Le Recteur / Directeur", MARGIN + sigW * 2 + 10, y);

  y += 18;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.muted);
  doc.text("(Signature et Cachet)", MARGIN + 10, y);
  doc.text("(Signature et Cachet)", MARGIN + sigW + 10, y);
  doc.text("(Signature et Cachet)", MARGIN + sigW * 2 + 10, y);

  return y;
}
