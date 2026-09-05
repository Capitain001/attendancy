import type { ProgramPageData } from "@/components/programs/types";
import type { ProgramExportConfig } from "../types";
import { buildExportFilename } from "../filename";
import { triggerDownload } from "../download";
import { setupColumns } from "./columns";
import { writeSemesterRows } from "./rows";

export async function buildAndDownloadXLSX(data: ProgramPageData, config: ProgramExportConfig) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Programme");

  setupColumns(sheet, config);
  writeSemesterRows(sheet, data.semesters ?? [], config);
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();

  triggerDownload(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    buildExportFilename(data, "xlsx"),
  );
}
