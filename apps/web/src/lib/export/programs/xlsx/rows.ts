import type { Row, Worksheet } from "exceljs";
import type { ProgramSemesterDTO } from "@/services/ue/types";
import type { ProgramExportConfig } from "../types";
import { XLSX_BORDER, XLSX_FILLS } from "./styles";

export function writeSemesterRows(sheet: Worksheet, semesters: ProgramSemesterDTO[], config: ProgramExportConfig) {
  let rowIndex = 2;
  let ueZebraToggle = false;

  for (const sem of semesters) {
    const semStartRow = rowIndex;

    for (const pue of sem.ues) {
      const ueStartRow = rowIndex;
      ueZebraToggle = !ueZebraToggle;
      const zebraFill = ueZebraToggle ? XLSX_FILLS.rowA : XLSX_FILLS.rowB;

      for (const course of pue.ue.ueCourses) {
        const row = sheet.addRow({
          semesterLabel: sem.semester ? `Semestre ${sem.semester}` : "",
          ueOrder: pue.order,
          ueCode: pue.ue.code,
          ueName: pue.ue.name,
          ...(config.showType ? { ueType: pue.ue.type ?? "" } : {}),
          courseOrder: `${pue.order}.${course.order}`,
          courseCode: course.code,
          courseName: course.name,
          duration: course.duration,
          credits: course.credits,
        });

        styleDataRow(row, zebraFill, config);
        row.getCell(8).numFmt = "0";
        rowIndex++;
      }

      mergeUeColumns(sheet, ueStartRow, rowIndex - 1, config);
    }

    mergeSemesterColumn(sheet, semStartRow, rowIndex - 1);
    writeTotalRow(sheet, rowIndex, sem, config);
    rowIndex++;
  }
}

function styleDataRow(row: Row, zebraFill: string, config: ProgramExportConfig) {
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    // Colonnes fusionnées par UE : Semestre, N° UE, Code UE, Intitulé UE (+ Type UE)
    const isMergedGroupColumn = config.showType ? colNumber >= 1 && colNumber <= 5 : colNumber >= 1 && colNumber <= 4;

    cell.alignment = { horizontal: "left", vertical: isMergedGroupColumn ? "top" : "middle" };
    cell.border = XLSX_BORDER;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: zebraFill } };
    cell.font = { size: 10.5, name: "Calibri" };
  });
}

function mergeUeColumns(sheet: Worksheet, startRow: number, endRow: number, config: ProgramExportConfig) {
  if (endRow <= startRow) return;
  sheet.mergeCells(`B${startRow}:B${endRow}`);
  sheet.mergeCells(`C${startRow}:C${endRow}`);
  sheet.mergeCells(`D${startRow}:D${endRow}`);
  if (config.showType) sheet.mergeCells(`E${startRow}:E${endRow}`);
}

function mergeSemesterColumn(sheet: Worksheet, startRow: number, endRow: number) {
  if (endRow > startRow) sheet.mergeCells(`A${startRow}:A${endRow}`);
}

function writeTotalRow(sheet: Worksheet, rowIndex: number, sem: ProgramSemesterDTO, config: ProgramExportConfig) {
  const mergeEnd = config.showType ? 8 : 7;
  sheet.mergeCells(rowIndex, 1, rowIndex, mergeEnd);

  const totalRow = sheet.getRow(rowIndex);
  totalRow.getCell(1).value = "Total";
  totalRow.getCell(mergeEnd + 1).value = sem.totalDuration;
  totalRow.getCell(mergeEnd + 1).numFmt = "0";
  totalRow.getCell(mergeEnd + 2).value = sem.totalCredits;

  const colCount = sheet.columns?.length ?? mergeEnd + 2;
  for (let c = 1; c <= colCount; c++) {
    const cell = totalRow.getCell(c);
    cell.font = { bold: true, size: 10.5, name: "Calibri" };
    cell.alignment = { horizontal: "left", vertical: "middle" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: XLSX_FILLS.total } };
    cell.border = { ...XLSX_BORDER, top: { style: "medium", color: { argb: "FFA0A0A5" } } };
  }
}
