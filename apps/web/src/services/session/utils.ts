// Logique pure — classification des séances du jour par état métier dérivé.
// Aucune dépendance React. Testable unitairement.

import { differenceInMinutes } from "date-fns";
import { sessionConfig } from "@/config/session";
import { GetOrgDaySchedulesWithSessionDto } from "./types";


type OrgDaySessionRow = GetOrgDaySchedulesWithSessionDto[number]
/** Buckets métier (≠ statut DB) — par temporalité / urgence. */
export type SessionBucket =
  | "ongoing" // session ACTIVE
  | "late" // créneau commencé, pas de session, encore récupérable
  | "missed" // fenêtre passée sans session
  | "upcoming" // pas encore commencé
  | "done"; // session COMPLETED ou schedule COMPLETED

const CHECKIN = sessionConfig.thresholds.checkIn;
const CHECKOUT = sessionConfig.thresholds.checkOut;

/**
 * Classe une séance selon sa session + le temps présent.
 * Réutilise la même logique de phase que policy.ts / use-session-countdown.
 */
export function classifyDaySession(
  row: OrgDaySessionRow,
  now: Date = new Date()
): SessionBucket {
  const start = new Date(row.startTime);
  const end = new Date(row.endTime);
  const status = row.session?.status ?? null;

  // Session clôturée (DB session ou schedule terminé).
  if (status === "COMPLETED" || row.status === "COMPLETED") return "done";

  // Session ouverte.
  if (status === "ACTIVE") return "ongoing";

  // Pas de session active → on raisonne par fenêtre temporelle.
  const minsToStart = differenceInMinutes(start, now); // >0 = futur
  const minsAfterEnd = differenceInMinutes(now, end); // >0 = fini

  // Avant l'ouverture du check-in.
  if (minsToStart > CHECKIN) return "upcoming";

  // Fenêtre dépassée (end + seuil checkout) sans session → manquée.
  if (minsAfterEnd > CHECKOUT || row.status === "MISSED") return "missed";

  // Entre check-in et fin de fenêtre, pas de session → démarrage en retard
  // (récupérable). Avant startTime mais dans la fenêtre check-in → à venir imminent.
  if (now >= start) return "late";
  return "upcoming";
}

export interface SessionBuckets {
  ongoing: OrgDaySessionRow[];
  late: OrgDaySessionRow[];
  missed: OrgDaySessionRow[];
  upcoming: OrgDaySessionRow[];
  done: OrgDaySessionRow[];
}

export function bucketize(
  rows: OrgDaySessionRow[],
  now: Date = new Date()
): SessionBuckets {
  const buckets: SessionBuckets = {
    ongoing: [],
    late: [],
    missed: [],
    upcoming: [],
    done: [],
  };
  for (const row of rows) buckets[classifyDaySession(row, now)].push(row);
  return buckets;
}

/* =========================
   PRÉSENCE / EFFECTIF
========================= */

/** Effectif théorique : groupe si présent, sinon classe entière. */
export function effectiveCount(row: OrgDaySessionRow): number {
  return (
    row.group?._count.studentGroups ?? row.class._count.studentEnrollments ?? 0
  );
}

export interface PresenceStats {
  present: number; // PRESENT + LATE
  absent: number;
  pending: number;
  total: number; // effectif théorique
  rate: number; // % présence sur effectif (0 si effectif nul)
}

export function presenceStats(row: OrgDaySessionRow): PresenceStats {
  let present = 0;
  let absent = 0;
  let pending = 0;

  for (const a of row.attendances) {
    if (a.status === "PRESENT" || a.status === "LATE") present += 1;
    else if (a.status === "ABSENT") absent += 1;
    else if (a.status === "PENDING") pending += 1;
  }

  const total = effectiveCount(row);
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;

  return { present, absent, pending, total, rate };
}

export function teacherName(row: OrgDaySessionRow): string {
  const u = row.teacher?.user;
  if (!u) return "—";
  return [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || "—";
}
