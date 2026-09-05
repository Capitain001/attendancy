import type { Worksheet } from "exceljs";
import type { ProgramExportConfig } from "../types";
import { XLSX_BORDER, XLSX_FILLS } from "./styles";

export function setupColumns(sheet: Worksheet, config: ProgramExportConfig) {
  sheet.columns = [
    { header: "Semestre", key: "semesterLabel", width: 14 },
    { header: "N° UE", key: "ueOrder", width: 8 },
    { header: "Code UE", key: "ueCode", width: 14 },
    { header: "Intitulé UE", key: "ueName", width: 42 },
    ...(config.showType ? [{ header: "Type UE", key: "ueType", width: 14 }] : []),
    { header: "N° Cours", key: "courseOrder", width: 10 },
    { header: "Code Cours", key: "courseCode", width: 16 },
    { header: "Intitulé Cours", key: "courseName", width: 42 },
    { header: "Volume", key: "duration", width: 10 },
    { header: "Crédits", key: "credits", width: 10 },
  ];

  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, size: 11, name: "Calibri" };
    cell.alignment = { horizontal: "left", vertical: "middle" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: XLSX_FILLS.headerBg } };
    cell.border = XLSX_BORDER;
  });
  sheet.getRow(1).height = 20;
}
