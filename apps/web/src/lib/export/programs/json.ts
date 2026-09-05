import type { ProgramPageData } from "@/components/programs/types";

export function buildJSON(data: ProgramPageData): string {
  return JSON.stringify(data, null, 2);
}
