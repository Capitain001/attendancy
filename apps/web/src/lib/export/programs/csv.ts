import type { ProgramSemesterDTO } from "@/services/ue/types";
import type { ProgramExportConfig } from "./types";
import { flattenRows } from "./flatten";

function escapeCsvValue(value: unknown): string {
  const str = String(value ?? "");
  return /[;"\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function buildCSV(semesters: ProgramSemesterDTO[], config: ProgramExportConfig): string {
  const rows = flattenRows(semesters);

  const header = config.showType
    ? ["Semestre", "N° UE", "Code UE", "Intitulé UE", "Type UE", "Code Cours", "Intitulé Cours", "Volume", "Crédits"]
    : ["Semestre", "N° UE", "Code UE", "Intitulé UE", "Code Cours", "Intitulé Cours", "Volume", "Crédits"];

  const lines = rows.map((r) =>
    (config.showType
      ? [r.semesterLabel, r.ueOrder, r.ueCode, r.ueName, r.ueType, r.courseCode, r.courseName, r.duration, r.credits]
      : [r.semesterLabel, r.ueOrder, r.ueCode, r.ueName, r.courseCode, r.courseName, r.duration, r.credits]
    )
      .map(escapeCsvValue)
      .join(";"),
  );

  return [header.map(escapeCsvValue).join(";"), ...lines].join("\r\n");
}
