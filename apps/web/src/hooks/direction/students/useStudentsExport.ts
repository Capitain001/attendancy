// src/hooks/direction/students/useStudentsExport.ts
"use client";

import { useMemo } from "react";

import {
  type StudentRow,
  fullName,
} from "@/components/direction/students/ui/studentDirectory.helpers";
import type { ExportColumn } from "@/lib/export";
import type { getOrgStudentAttendanceRates } from "@/services/attendance/database";
import type { UserStatus } from "@/generated/prisma/client";

type AttendanceRates = Awaited<ReturnType<typeof getOrgStudentAttendanceRates>>;

const STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: "Actif",
  INACTIVE: "Désactivé",
  SUSPENDED: "Suspendu",
  ON_LEAVE: "En congé",
  PENDING: "En attente",
};

const rateLabel = (r: AttendanceRates[string] | undefined) =>
  r && r.rate !== null ? `${r.rate}%` : "—";

/**
 * Préoccupation unique : sérialisation des étudiants pour l'export.
 * `organizationName` n'intervient qu'ici, comme sous-titre du document —
 * d'où son isolement dans ce hook plutôt qu'au niveau de l'annuaire.
 * Exporte la sélection si présente, sinon l'effectif complet.
 */
export function useStudentsExport({
  students,
  selectedRows,
  attendanceRates,
  organizationName,
}: {
  students: StudentRow[];
  selectedRows: StudentRow[];
  attendanceRates: AttendanceRates;
  organizationName: string;
}) {
  const columns = useMemo<ExportColumn<StudentRow>[]>(
    () => [
      { header: "Nom", value: fullName },
      { header: "Email", value: (s) => s.user.email },
      { header: "Téléphone", value: (s) => s.phone ?? "" },
      { header: "Filière", value: (s) => s.programTrack?.name ?? "" },
      { header: "Classe", value: (s) => s.className ?? "" },
      { header: "Statut", value: (s) => STATUS_LABEL[s.status] ?? s.status },
      { header: "Présence", value: (s) => rateLabel(attendanceRates[s.id]) },
      { header: "Parents", value: (s) => String(s.parentCount ?? 0) },
    ],
    [attendanceRates],
  );

  function exportConfig() {
    const rows = selectedRows.length > 0 ? selectedRows : students;
    return {
      columns,
      rows,
      filename: `etudiants-${new Date().toISOString().slice(0, 10)}`,
      title: "Étudiants",
      subtitle: organizationName || undefined,
      sheetName: "Étudiants",
    };
  }

  return { exportConfig };
}
