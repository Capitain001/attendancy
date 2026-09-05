import type { ProgramSemesterDTO } from "@/services/ue/types";

export interface ProgramExportRow {
  semesterLabel: string;
  ueOrder: number | null;
  ueCode: string | null;
  ueName: string;
  ueType: string;
  courseOrder: number | null;
  courseCode: string | null;
  courseName: string;
  duration: number;
  credits: number;
}

export function flattenRows(semesters: ProgramSemesterDTO[]): ProgramExportRow[] {
  const rows: ProgramExportRow[] = [];

  for (const sem of semesters) {
    for (const pue of sem.ues) {
      for (const course of pue.ue.ueCourses) {
        rows.push({
          semesterLabel: `Semestre ${sem.semester}`,
          ueOrder: pue.order,
          ueCode: pue.ue.code,
          ueName: pue.ue.name,
          ueType: pue.ue.type,
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