// src/lib/export/session-attendance/pdf.ts
// apps/web/src/lib/export/session-attendance/pdf.ts
import { jsPDF } from "jspdf";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type SessionAttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "EXCUSED";

export interface SessionAttendanceReportData {
  schedule: {
    id: string;
    teacherId: string;
    startTime: Date | string;
    endTime: Date | string;
    scheduleType: string;
    status: string;
    notes: string | null;
    courseName: string;
    courseCode: string;
    roomName: string | null;
    className: string;
    classLevel: string | null;
    groupName: string | null;
    teacher: { firstName: string; lastName: string; email: string };
  };
  organization: {
    name: string;
    /** Data URL (data:image/png;base64,...) — optionnel */
    logo: string | null;
  };
  session: {
    id: string;
    status: string;
    checkIn: Date | string | null;
    checkOut: Date | string | null;
    durationMinutes: number | null;
    isLate: boolean;
  } | null;
  summary: {
    total: number;
    attended: number;
    rate: number;
    present: number;
    late: number;
    absent: number;
    excused: number;
  };
  attendances: Array<{
    id: string;
    status: SessionAttendanceStatus;
    recordedAt: Date | string | null;
    notes: string | null;
    student: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
}

/* -------------------------------------------------------------------------- */
/*  Design tokens (alignés sur la maquette validée)                           */
/* -------------------------------------------------------------------------- */

type RGB = [number, number, number];

const INK: RGB = [17, 17, 17]; // #111
const INK_2: RGB = [68, 68, 68]; // #444
const INK_3: RGB = [138, 138, 142]; // #8a8a8e
const LINE: RGB = [228, 228, 230]; // #e4e4e6
const LINE_STRONG: RGB = [200, 200, 204]; // #c8c8cc
const TINT: RGB = [245, 245, 246]; // #f5f5f6

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_X = 15;
const CONTENT_W = PAGE_W - MARGIN_X * 2; // 180
const TOP_Y = 14;
const CONTINUATION_Y = 26; // début du contenu sur les pages 2+
const FOOTER_LINE_Y = PAGE_H - 16;
const CONTENT_BOTTOM = PAGE_H - 22;

const HEADER_H = 8;
const ROW_H = 7.1;
const GROUP_H = 7;

const TIMEZONE = "Africa/Lome";

const STATUS_ORDER: SessionAttendanceStatus[] = ["PRESENT", "LATE", "EXCUSED", "ABSENT"];

const STATUS_LABEL: Record<SessionAttendanceStatus, string> = {
  PRESENT: "Présent",
  LATE: "En retard",
  EXCUSED: "Excusé",
  ABSENT: "Absent",
};

const GROUP_LABEL: Record<SessionAttendanceStatus, string> = {
  PRESENT: "Présents",
  LATE: "Retards",
  EXCUSED: "Excusés",
  ABSENT: "Absents",
};

// Largeurs de colonnes (somme = 180 mm)
const COLS = [
  { key: "n", label: "N°", w: 9 },
  { key: "name", label: "Nom et prénom", w: 46 },
  { key: "email", label: "Email", w: 52 },
  { key: "status", label: "Statut", w: 23 },
  { key: "time", label: "Heure", w: 14 },
  { key: "note", label: "Justification", w: 36 },
] as const;

const COL_X: number[] = COLS.reduce<number[]>((acc, col, i) => {
  acc.push(i === 0 ? MARGIN_X : acc[i - 1] + COLS[i - 1].w);
  return acc;
}, []);

const CELL_PAD = 2;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: TIMEZONE,
});

const timeFmt = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: TIMEZONE,
});

const toDate = (v: Date | string) => (v instanceof Date ? v : new Date(v));
const formatDate = (v: Date | string) => dateFmt.format(toDate(v));
const formatTime = (v: Date | string) => timeFmt.format(toDate(v));

const collator = new Intl.Collator("fr", { sensitivity: "base" });

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const setText = (doc: jsPDF, color: RGB) => doc.setTextColor(color[0], color[1], color[2]);
const setDraw = (doc: jsPDF, color: RGB) => doc.setDrawColor(color[0], color[1], color[2]);
const setFill = (doc: jsPDF, color: RGB) => doc.setFillColor(color[0], color[1], color[2]);

/** Tronque un texte avec « … » pour qu'il tienne dans maxW (mm). */
function fit(doc: jsPDF, text: string, maxW: number): string {
  if (!text || doc.getTextWidth(text) <= maxW) return text;
  let out = text;
  while (out.length > 1 && doc.getTextWidth(out + "…") > maxW) {
    out = out.slice(0, -1);
  }
  return out.trimEnd() + "…";
}

function detectImageFormat(dataUrl: string): "PNG" | "JPEG" | null {
  const m = /^data:image\/(png|jpe?g);base64,/i.exec(dataUrl);
  if (!m) return null;
  return m[1].toLowerCase() === "png" ? "PNG" : "JPEG";
}

/* -------------------------------------------------------------------------- */
/*  Blocs de dessin                                                           */
/* -------------------------------------------------------------------------- */

/** En-tête (page 1) : logo, organisation, titre, filet. Retourne le y suivant. */
function drawHeader(doc: jsPDF, data: SessionAttendanceReportData, y: number): number {
  let textX = MARGIN_X;
  const logoSize = 14;

  if (data.organization.logo) {
    const fmt = detectImageFormat(data.organization.logo);
    if (fmt) {
      try {
        doc.addImage(data.organization.logo, fmt, MARGIN_X, y, logoSize, logoSize);
        textX = MARGIN_X + logoSize + 5;
      } catch {
        // logo illisible : on continue sans
      }
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  setText(doc, INK);
  doc.text(data.organization.name.toUpperCase(), textX, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setText(doc, INK_2);
  doc.text("FEUILLE D’ÉMARGEMENT — RAPPORT DE SÉANCE", textX, y + 10.5);

  const lineY = y + logoSize + 7;
  setDraw(doc, LINE_STRONG);
  doc.setLineWidth(0.2);
  doc.line(MARGIN_X, lineY, PAGE_W - MARGIN_X, lineY);

  return lineY + 9;
}

/** Cartouche séance (page 1). Retourne le y suivant. */
function drawInfo(doc: jsPDF, data: SessionAttendanceReportData, y: number): number {
  const { schedule } = data;
  const rightX = PAGE_W - MARGIN_X;
  const rowPitch = 14;

  const label = (text: string, x: number, yy: number, align: "left" | "right" = "left") => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setText(doc, INK_3);
    doc.text(text.toUpperCase(), x, yy, { align });
  };
  const value = (text: string, x: number, yy: number, align: "left" | "right" = "left", maxW = 85) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    setText(doc, INK);
    doc.text(fit(doc, text, maxW), x, yy, { align });
  };

  const course = `${schedule.courseCode} — ${schedule.courseName} (${schedule.scheduleType})`;
  const classLabel = schedule.groupName
    ? `${schedule.className} · ${schedule.groupName}`
    : `${schedule.className} · Classe entière`;
  const teacher = `${capitalize(schedule.teacher.firstName)} ${schedule.teacher.lastName}`;
  const hours = `${formatTime(schedule.startTime)} – ${formatTime(schedule.endTime)}`;

  // Ligne 1 : Cours (pleine largeur)
  label("Cours", MARGIN_X, y);
  value(course, MARGIN_X, y + 4.8, "left", CONTENT_W);

  // Ligne 2 : Classe | Salle (à droite)
  let yy = y + rowPitch;
  label("Classe", MARGIN_X, yy);
  value(classLabel, MARGIN_X, yy + 4.8);
  label("Salle", rightX, yy, "right");
  value(schedule.roomName ?? "—", rightX, yy + 4.8, "right");

  // Ligne 3 : Enseignant | Heure (à droite)
  yy += rowPitch;
  label("Enseignant", MARGIN_X, yy);
  value(teacher, MARGIN_X, yy + 4.8);
  label("Heure", rightX, yy, "right");
  value(hours, rightX, yy + 4.8, "right");

  return yy + 4.8 + 11;
}

/** En-tête de tableau. Retourne le y suivant. */
function drawTableHeader(doc: jsPDF, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setText(doc, INK_3);
  COLS.forEach((col, i) => {
    doc.text(col.label.toUpperCase(), COL_X[i] + CELL_PAD, y + 5.2);
  });
  setDraw(doc, LINE_STRONG);
  doc.setLineWidth(0.25);
  doc.line(MARGIN_X, y + HEADER_H, PAGE_W - MARGIN_X, y + HEADER_H);
  return y + HEADER_H;
}

/** Bandeau de groupe (Présents / Retards / Excusés / Absents). */
function drawGroupRow(doc: jsPDF, status: SessionAttendanceStatus, count: number, y: number): number {
  setFill(doc, TINT);
  doc.rect(MARGIN_X, y, CONTENT_W, GROUP_H, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  setText(doc, INK_2);
  const label = GROUP_LABEL[status].toUpperCase();
  const x = MARGIN_X + CELL_PAD;
  doc.text(label, x, y + 4.7);

  doc.setFont("helvetica", "normal");
  setText(doc, INK_3);
  doc.text(String(count), x + doc.getTextWidth(label) + 2.5, y + 4.7);

  return y + GROUP_H;
}

/** Pictogramme de statut (sans couleur : forme uniquement). */
function drawStatusIcon(doc: jsPDF, status: SessionAttendanceStatus, cx: number, cy: number) {
  const r = 1.1;
  doc.setLineWidth(0.3);

  switch (status) {
    case "PRESENT": {
      setFill(doc, INK);
      doc.circle(cx, cy, r, "F");
      break;
    }
    case "LATE": {
      setDraw(doc, INK);
      doc.circle(cx, cy, r, "S");
      // demi-disque gauche plein
      const pts: Array<[number, number]> = [];
      for (let a = 90; a <= 270; a += 15) {
        const rad = (a * Math.PI) / 180;
        pts.push([cx + r * Math.cos(rad), cy - r * Math.sin(rad)]);
      }
      const rel: Array<[number, number]> = [];
      for (let i = 1; i < pts.length; i++) {
        rel.push([pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]]);
      }
      setFill(doc, INK);
      doc.lines(rel, pts[0][0], pts[0][1], [1, 1], "F", true);
      break;
    }
    case "EXCUSED": {
      setDraw(doc, INK_3);
      doc.circle(cx, cy, r, "S");
      break;
    }
    case "ABSENT": {
      setDraw(doc, INK_3);
      doc.circle(cx, cy, r, "S");
      doc.line(cx - r - 0.5, cy, cx + r + 0.5, cy);
      break;
    }
  }
}

/** Ligne étudiant. Retourne le y suivant. */
function drawStudentRow(
  doc: jsPDF,
  att: SessionAttendanceReportData["attendances"][number],
  index: number,
  y: number,
): number {
  const baseline = y + 4.7;
  const isAbsent = att.status === "ABSENT";
  const mainColor = isAbsent ? INK_3 : INK;

  doc.setFontSize(8.5);

  // N°
  doc.setFont("helvetica", "normal");
  setText(doc, INK_3);
  doc.text(String(index), COL_X[0] + CELL_PAD, baseline);

  // Nom et prénom : NOM en gras + Prénom
  const lastName = att.student.lastName.toUpperCase();
  const firstName = capitalize(att.student.firstName);
  const nameX = COL_X[1] + CELL_PAD;
  const nameMaxW = COLS[1].w - CELL_PAD * 2;
  doc.setFont("helvetica", "bold");
  setText(doc, mainColor);
  const lastFit = fit(doc, lastName, nameMaxW);
  doc.text(lastFit, nameX, baseline);
  const lastW = doc.getTextWidth(lastFit) + 1.5;
  doc.setFont("helvetica", "normal");
  const firstMax = nameMaxW - lastW;
  if (firstMax > 4) doc.text(fit(doc, firstName, firstMax), nameX + lastW, baseline);

  // Email
  setText(doc, INK_3);
  doc.text(fit(doc, att.student.email, COLS[2].w - CELL_PAD * 2), COL_X[2] + CELL_PAD, baseline);

  // Statut (icône + libellé)
  drawStatusIcon(doc, att.status, COL_X[3] + CELL_PAD + 1.1, y + ROW_H / 2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setText(doc, mainColor);
  doc.text(STATUS_LABEL[att.status], COL_X[3] + CELL_PAD + 4.2, baseline);

  // Heure
  const hasScan = (att.status === "PRESENT" || att.status === "LATE") && att.recordedAt;
  setText(doc, mainColor);
  doc.text(hasScan ? formatTime(att.recordedAt as Date | string) : "—", COL_X[4] + CELL_PAD, baseline);

  // Justification
  setText(doc, INK_2);
  if (att.notes) {
    doc.text(fit(doc, att.notes, COLS[5].w - CELL_PAD * 2), COL_X[5] + CELL_PAD, baseline);
  }

  // Filet de ligne
  setDraw(doc, LINE);
  doc.setLineWidth(0.2);
  doc.line(MARGIN_X, y + ROW_H, PAGE_W - MARGIN_X, y + ROW_H);

  return y + ROW_H;
}

/** Bloc validation : horodatage + cadre de signature. Retourne le y suivant. */
function drawSignature(doc: jsPDF, y: number): number {
  const boxW = 65;
  const boxH = 22;
  const boxX = PAGE_W - MARGIN_X - boxW;

  setDraw(doc, LINE_STRONG);
  doc.setLineWidth(0.25);
  doc.roundedRect(boxX, y, boxW, boxH, 1, 1, "S");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setText(doc, INK_3);
  doc.text("Signature de l’enseignant", boxX + 3, y + 5.5);

  const now = new Date();
  doc.text(`Rapport généré le ${formatDate(now)} à ${formatTime(now)}`, MARGIN_X, y + boxH);

  return y + boxH;
}

/** Date en haut de page, mention de document, pied de page et pagination. */
function drawPageDecorations(doc: jsPDF, data: SessionAttendanceReportData) {
  const total = doc.getNumberOfPages();
  const { schedule, organization } = data;

  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setText(doc, INK_3);

    // Haut de page : date de la séance (gauche) + mention (droite)
    doc.text(formatDate(schedule.startTime), MARGIN_X, TOP_Y);
    doc.text("Rapport de séance", PAGE_W - MARGIN_X, TOP_Y, { align: "right" });

    // Pied de page
    setDraw(doc, LINE);
    doc.setLineWidth(0.2);
    doc.line(MARGIN_X, FOOTER_LINE_Y, PAGE_W - MARGIN_X, FOOTER_LINE_Y);
    doc.setFontSize(7.5);
    const context = `${organization.name} · ${schedule.courseName} (${schedule.className})`;
    doc.text(fit(doc, context, CONTENT_W - 30), MARGIN_X, FOOTER_LINE_Y + 5);
    doc.text(`Page ${p} / ${total}`, PAGE_W - MARGIN_X, FOOTER_LINE_Y + 5, { align: "right" });
  }
}

/* -------------------------------------------------------------------------- */
/*  API publique                                                              */
/* -------------------------------------------------------------------------- */

export async function buildSessionAttendancePDFDoc(
  data: SessionAttendanceReportData,
): Promise<{ doc: jsPDF; filename: string }> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });

  doc.setProperties({
    title: `Feuille d'émargement — ${data.schedule.courseName}`,
    subject: `${data.schedule.className} — ${formatDate(data.schedule.startTime)}`,
    author: data.organization.name,
    creator: "Attendancy",
  });

  // Groupes par statut (Présents → Retards → Excusés → Absents), tri par nom
  const groups = STATUS_ORDER.map((status) => ({
    status,
    rows: data.attendances
      .filter((a) => a.status === status)
      .sort(
        (a, b) =>
          collator.compare(a.student.lastName, b.student.lastName) ||
          collator.compare(a.student.firstName, b.student.firstName),
      ),
  })).filter((g) => g.rows.length > 0);

  // Page 1 : en-tête + cartouche + tableau
  let y = drawHeader(doc, data, 22);
  y = drawInfo(doc, data, y);
  y = drawTableHeader(doc, y);

  const ensureSpace = (needed: number) => {
    if (y + needed > CONTENT_BOTTOM) {
      doc.addPage();
      y = drawTableHeader(doc, CONTINUATION_Y);
    }
  };

  if (groups.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setText(doc, INK_3);
    doc.text("Aucun étudiant inscrit à cette séance.", MARGIN_X + CELL_PAD, y + 8);
    y += 14;
  }

  let index = 0;
  for (const group of groups) {
    // Évite un bandeau de groupe orphelin en bas de page
    ensureSpace(GROUP_H + ROW_H);
    y = drawGroupRow(doc, group.status, group.rows.length, y);

    for (const att of group.rows) {
      ensureSpace(ROW_H);
      index += 1;
      y = drawStudentRow(doc, att, index, y);
    }
  }

  // Validation (dernière page)
  if (y + 10 + 22 > CONTENT_BOTTOM) {
    doc.addPage();
    y = CONTINUATION_Y - 10;
  }
  drawSignature(doc, y + 10);

  drawPageDecorations(doc, data);

  const filename = `emargement-${slugify(data.schedule.courseCode)}-${slugify(
    data.schedule.className,
  )}-${toDate(data.schedule.startTime).toISOString().slice(0, 10)}.pdf`;

  return { doc, filename };
}

export async function buildAndDownloadSessionAttendancePDF(
  data: SessionAttendanceReportData,
): Promise<void> {
  const { doc, filename } = await buildSessionAttendancePDFDoc(data);
  doc.save(filename);
}
