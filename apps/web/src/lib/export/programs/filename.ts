import type { ProgramPageData } from "@/components/programs/types";

// Source unique du nom de fichier — avant, le PDF utilisait
// `programme_${data.class.name}.pdf` sans sanitize (espaces/slashes non
// échappés) alors que le XLSX sanitizait correctement. On centralise pour
// que les deux formats produisent des noms cohérents.
export function buildExportFilename(data: ProgramPageData, extension: string): string {
  const base = `programme_${data.class?.name ?? "export"}`
    .replace(/\s+/g, "_")
    .toLowerCase();

  return `${base}.${extension}`;
}
