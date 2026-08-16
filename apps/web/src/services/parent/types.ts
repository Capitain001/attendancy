// src/services/parent/types.ts
//
// Types publics du domaine Parent.
// L'identité enfant est INFÉRÉE du retour réel de getParentStudents (pas de
// redéclaration manuelle qui dériverait). Les types overview (supervision du
// hub) sont des DTO de composition, déclarés ici car ils fusionnent plusieurs
// domaines (session/attendance/schedule).

import type { getParentStudents } from "./database";

/** Forme à plat d'un enfant lié au parent (identité : nom/classe/âge). */
export type ParentStudent = Awaited<
  ReturnType<typeof getParentStudents>
>[number];

/** Carte d'observation d'un enfant sur le hub (supervision, lecture pure). */
export type ParentChildOverview = {
  studentId: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  className: string | null;
  age: number | null; // dérivé de dateOfBirth
  current: {
    kind: "ongoing" | "absent" | "idle";
    courseName: string | null;
  };
  nextCourse: { startTime: Date; courseName: string } | null;
  dayProgress: { done: number; total: number };
  attendanceRate: number; // % hors PENDING (cf. policy)
};

/** Identité parent affichée en en-tête du hub. */
export type ParentHeaderData = {
  name: string | null;
  avatarUrl: string | null;
  orgName: string | null;
  childrenCount: number;
};

/** Agrégat de supervision (source du hub /parent). */
export type ParentOverview = {
  header: ParentHeaderData;
  metrics: {
    attendanceRate: number; // présence moyenne 30 j (intra-établissement)
    pendingCount: number; // file "En attente" (Phase 2 — 0 au MVP)
    monthAbsences: number; // absences du mois
  };
  alert: { studentId: string; message: string } | null;
  children: ParentChildOverview[];
};

export * from './generated.types'
