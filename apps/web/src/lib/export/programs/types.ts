export type ExportFormat = "pdf" | "xlsx" | "json" | "csv";
export type ExportTemplate = "official" | "synthetic" | "teaching_load";
export type ExportStatus = "idle" | "loading" | "done" | "error";

export interface ProgramExportConfig {
  format: ExportFormat;
  template?: ExportTemplate;
  watermark?: string;
  showSignatures?: boolean;
  showHoursBreakdown?: boolean;
  showType?: boolean;
}

// Couleur RGB consommée par jsPDF (setTextColor(...rgb), setFillColor(...rgb))
export type RGB = [number, number, number];
