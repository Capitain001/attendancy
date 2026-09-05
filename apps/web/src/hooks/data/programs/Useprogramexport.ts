"use client";

import { useCallback, useState } from "react";
import type { ProgramPageData } from "@/components/programs/types";
import {
  ExportFormat,
  ExportStatus,
  ProgramExportConfig,
  buildAndDownloadPDF,
  buildAndDownloadXLSX,
  buildCSV,
  buildJSON,
  buildExportFilename,
  triggerDownload,
} from "@/lib/export/programs";

export type { ExportFormat, ExportStatus, ProgramExportConfig };

export interface UseProgramExportReturn {
  status: ExportStatus;
  exportAs: (formatOrConfig: ExportFormat | ProgramExportConfig) => Promise<void>;
}

export function useProgramExport(data: ProgramPageData): UseProgramExportReturn {
  const [status, setStatus] = useState<ExportStatus>("idle");

  const exportAs = useCallback(
    async (formatOrConfig: ExportFormat | ProgramExportConfig) => {
      setStatus("loading");
      try {
        const config: ProgramExportConfig =
          typeof formatOrConfig === "string" ? { format: formatOrConfig } : formatOrConfig;

        switch (config.format) {
          case "pdf":
            await buildAndDownloadPDF(data, config);
            break;
          case "xlsx":
            await buildAndDownloadXLSX(data, config);
            break;
          case "csv":
            triggerDownload(
              new Blob([buildCSV(data.semesters ?? [], config)], { type: "text/csv" }),
              buildExportFilename(data, "csv"),
            );
            break;
          case "json":
            triggerDownload(
              new Blob([buildJSON(data)], { type: "application/json" }),
              buildExportFilename(data, "json"),
            );
            break;
        }

        setStatus("done");
        setTimeout(() => setStatus("idle"), 2000);
      } catch (err) {
        console.error(err);
        setStatus("error");
      }
    },
    [data],
  );

  return { status, exportAs };
}
