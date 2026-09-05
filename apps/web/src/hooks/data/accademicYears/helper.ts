import type { AcademicYear } from "@/generated/prisma/client";
// Helper pour le statut
export const getYearStatus = (year: AcademicYear) => {
  const now = new Date();
  if (year.startDate > now) return 'upcoming';
  if (year.endDate < now) return 'completed';
  return 'active';
};
