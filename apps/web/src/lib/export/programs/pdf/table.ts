import type { ProgramSemesterDTO, ProgramUECourses } from "@/services/ue/types";
import type { ProgramExportConfig } from "../types";
import { PDF_COLORS } from "./colors";

type AutoTableCell = string | number | { content: string | number; styles?: Record<string, unknown> };

export function buildTableHead(config: ProgramExportConfig): string[][] {
  return config.showType
    ? [["N°", "Code", "Intitulé", "Type", "Volume", "Crédits"]]
    : [["N°", "Code", "Intitulé", "Volume", "Crédits"]];
}

export function buildTableBody(sem: ProgramSemesterDTO, config: ProgramExportConfig): AutoTableCell[][] {
  const body: AutoTableCell[][] = [];

  for (const pue of sem.ues ?? []) {
    body.push(buildUeRow(pue, config));
    for (const course of pue.ue?.ueCourses ?? []) {
      body.push(buildCourseRow(pue, course, config));
    }
  }

  return body;
}

function buildUeRow(pue: ProgramUECourses, config: ProgramExportConfig): AutoTableCell[] {
  const bold = { fontStyle: "bold" as const, fillColor: PDF_COLORS.ueBg };

  return [
    { content: pue.order ?? "", styles: bold },
    { content: pue.ue?.code ?? "", styles: bold },
    { content: (pue.ue?.name ?? "").toUpperCase(), styles: bold },
    ...(config.showType
      ? [{ content: (pue.ue?.type ?? "").toUpperCase(), styles: { ...bold, halign: "center" as const } }]
      : []),
    { content: `${pue.ueTotalDuration ?? 0}h`, styles: { ...bold, halign: "center" as const } },
    { content: pue.ueTotalCredits ?? 0, styles: { ...bold, halign: "center" as const } },
  ];
}

function buildCourseRow(
  pue: ProgramUECourses,
  course: ProgramUECourses["ue"]["ueCourses"][number],
  config: ProgramExportConfig,
): AutoTableCell[] {
  return [
    `${pue.order ?? ""}${pue.order && course.order ? "." : ""}${course.order ?? ""}`,
    course.code ?? "",
    `      ${course.name ?? ""}`,
    ...(config.showType ? [""] : []),
    `${course.duration ?? 0}h`,
    course.credits ?? 0,
  ];
}

export function buildColumnStyles(
  config: ProgramExportConfig,
): Record<number, { cellWidth: number; halign?: "center" }> {
  return config.showType
    ? {
        0: { cellWidth: 16 },
        1: { cellWidth: 26 },
        3: { cellWidth: 28, halign: "center" },
        4: { cellWidth: 18, halign: "center" },
        5: { cellWidth: 16, halign: "center" },
      }
    : {
        0: { cellWidth: 18 },
        1: { cellWidth: 30 },
        3: { cellWidth: 22, halign: "center" },
        4: { cellWidth: 18, halign: "center" },
      };
}
