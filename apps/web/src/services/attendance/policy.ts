// src/services/attendance/policy.ts

//
// Fichier de référence  logique métier de la gestion de présence.
// Branché sur les types et constantes du projet pour rester vivant.

import type { AttendanceStatus, SessionStatus } from "@/generated/prisma/browser";
import {
  SESSION_ATTENDANCE_URL,
  buildSessionUrl,
} from "@/config/url";

// -----------------------------------------------------------------------------
// STATUTS Attendance
// -----------------------------------------------------------------------------
//
// Valeurs de AttendanceStatus (Prisma) :
//
//   "PENDING"  ? étudiant a scanné le QR, en attente de validation prof
//   "PRESENT"  ? présence confirmée par prof ou direction
//   "LATE"     ? présent mais après startTime (saisie manuelle)
//   "ABSENT"   ? absent  pas de scan, ou marqué manuellement
//   "EXCUSED"  ? absence justifiée a posteriori
//
// Transitions autorisées :
//   PENDING  ? PRESENT   confirmAttendanceAction / confirmAllAttendancesAction (prof)
//   PENDING  ? ABSENT    à la CLÔTURE (completeSession)  PENDING non validés.
//                        Non silencieux : l'UI prof avertit avant confirmation.
//   PRESENT  ? LATE      correction manuelle (Phase 2)
//   ABSENT   ? EXCUSED   justification a posteriori
//
// Création (pas une transition d'état) :
//   (aucune ligne) ? ABSENT   à la CLÔTURE  inscrits attendus n'ayant jamais scanné.
//                             Ligne ABSENT matérialisée (cf. markScheduleAbsences).

export type AttendanceStatusValue = AttendanceStatus;

// -----------------------------------------------------------------------------
// FLOW GLOBAL
// -----------------------------------------------------------------------------
//
// TEACHER                                STUDENT
//   ¦                                       ¦
//   ¦  1. check-in (GPS best-effort)         ¦
//   ¦     startSessionAction(scheduleId,     ¦
//   ¦       coords | null)                   ¦
//   ¦     ? teacher_check_in() RPC           ¦
//   ¦     ? Session { status: "ACTIVE" }     ¦
//   ¦                                        ¦
//   ¦  2. génère QR token (15 min)           ¦
//   ¦     generateTokenAction(sessionId)     ¦
//   ¦     ? create_session_token() SQL       ¦
//   ¦     ? buildSessionUrl(token)           ¦
//   ¦       = SESSION_ATTENDANCE_URL         ¦
//   ¦         + ?token=<uuid>                ¦
//   ¦     ? SessionQRDisplay                 ¦
//   ¦                                        ¦
//   ¦                         3. scan QR    ¦
//   ¦                            SESSION_   ¦
//   ¦                            ATTENDANCE ¦
//   ¦                            _URL       ¦
//   ¦                                        ¦
//   ¦                         4. attendAction(token, coords?)
//   ¦                            ? validateSessionToken()
//   ¦                            ? recordStudentAttendance()
//   ¦                            ? Attendance { status: "PENDING" }
//   ¦                                        ¦
//   ¦  5. AttendanceList (poll 10s)          ¦
//   ¦     getPendingAttendancesAction()      ¦
//   ¦     ? liste PENDING visible            ¦
//   ¦                                        ¦
//   ¦  6. confirmation                       ¦
//   ¦     confirmAttendanceAction()     ---- ¦ un par un
//   ¦     confirmAllAttendancesAction() ---- ¦ en lot
//   ¦     ? Attendance { status: "PRESENT" } ¦
//   ¦                                        ¦
//   ¦  7. clôture (fige les présences)       ¦
//   ¦     completeSessionAction(scheduleId)  ¦
//   ¦     ? completeSession (transaction) :  ¦
//   ¦       endSession ? Session/Schedule    ¦
//   ¦         COMPLETED                       ¦
//   ¦       markScheduleAbsences :           ¦
//   ¦         PENDING restants ? ABSENT       ¦
//   ¦         non-scanneurs    ? ABSENT       ¦
//   ¦     ? notif ABSENCE (best-effort,      ¦
//   ¦       hors transaction)                ¦
//   ¦                                        ¦

// -----------------------------------------------------------------------------
// URLS  config/url.ts
// -----------------------------------------------------------------------------

// Route frontend de la page de scan étudiant
export { SESSION_ATTENDANCE_URL };
// ? `${SITE_URL}/session/attendance`

// Builder : génère le lien encodé dans le QR
export { buildSessionUrl };
// ? `${SESSION_ATTENDANCE_URL}?token=${token}`

// Page étudiant :
//   - non connecté ? redirect login ? retour sur la page (token préservé en query param)
//   - connecté     ? attendAction(token, coords?)

// -----------------------------------------------------------------------------
// CALCUL DU TAUX DE PRÉSENCE
// -----------------------------------------------------------------------------
//
// Formule :
//   attendanceRate = (PRESENT + LATE) / (PRESENT + LATE + ABSENT + EXCUSED)
//
// Règles d'inclusion :
//   PENDING  ? exclu du dénominateur (non encore validé, ne pénalise pas)
//   EXCUSED  ? inclus au dénominateur (absent même si justifié)
//   LATE     ? compté comme présent au numérateur
//
// Exemple :
//   PRESENT=28, LATE=3, ABSENT=4, EXCUSED=1, PENDING=2
//   ? (28+3) / (28+3+4+1) = 31/36 = 86%
//
// Dénominateur "séances effectives" :
//   = Schedule avec Session { status: "COMPLETED" }
//   Exclut les séances CANCELED et les séances sans session (prof absent)
//
//   ? Après clôture (completeSession), une séance COMPLETED n'a PLUS de PENDING
//   résiduels NI d'absent implicite : tous les inscrits attendus ont une ligne
//   Attendance matérialisée (PRESENT/LATE/EXCUSED, ou ABSENT créé à la clôture).
//   L'ancienne notion "étudiant sans Attendance = ABSENT implicite" ne s'applique
//   donc qu'aux séances NON encore clôturées. Voir markScheduleAbsences / §7 ATTENDANCE_CONTEXT.md.
//
// Trois niveaux :
//   Par séance   ? (PRESENT+LATE) / nb inscrits à la séance
//   Par étudiant ? ses (PRESENT+LATE) / total séances effectives du cours
//   Par cours    ? moyenne des taux par séance

export type EffectiveSessionStatus = Extract<SessionStatus, "COMPLETED">;

export const ATTENDANCE_NUMERATOR_STATUSES = [
  "PRESENT",
  "LATE",
] satisfies AttendanceStatus[];

export const ATTENDANCE_DENOMINATOR_STATUSES = [
  "PRESENT",
  "LATE",
  "ABSENT",
  "EXCUSED",
] satisfies AttendanceStatus[];

// PENDING exclu intentionnellement des deux

// -----------------------------------------------------------------------------
// ABSENTÉISME  seuil de pilotage direction (P-23)
// -----------------------------------------------------------------------------
//
// Un étudiant est « en absentéisme » si son taux de présence (hors PENDING) est
// strictement sous le seuil, ET qu'il a un minimum de séances décomptées (évite
// de signaler un élève avec 1-2 séances). Pur  réutilisable UI + serveur.

export const ABSENTEEISM_RATE_THRESHOLD = 75; // %
export const ABSENTEEISM_MIN_SESSIONS = 4;

export function isAbsenteeism(input: {
  rate: number | null;
  denominator: number;
}): boolean {
  return (
    input.rate !== null &&
    input.denominator >= ABSENTEEISM_MIN_SESSIONS &&
    input.rate < ABSENTEEISM_RATE_THRESHOLD
  );
}

// -----------------------------------------------------------------------------
// TOKEN QR  règles
// -----------------------------------------------------------------------------
//
// Durée fixe : TOKEN_DURATION_MINUTES = 15 (token.mutations.ts)
// Un seul token actif par session à la fois
//   ? create_session_token() expire les anciens avant d'insérer
// Auto-refresh : useGenerateToken régénère 30s avant expiry
//
// Idempotence :
//   Double scan ? recordStudentAttendance retourne { alreadyRecorded: true }
//   Aucun doublon créé en DB

export const TOKEN_DURATION_MINUTES = 15;
export const TOKEN_AUTO_REFRESH_BEFORE_SECONDS = 30;

// -----------------------------------------------------------------------------
// VÉRIFICATION GPS  règles
// -----------------------------------------------------------------------------
//
// TEACHER (check-in session) :
//   room.locationId && location.active = true
//     ? ST_DWithin(location.geog, teacherPoint, radius) via PostGIS
//     ? hors zone ? erreur, session bloquée
//   room.locationId absent OU location.active = false
//     ? session créée sans vérification
//     ? coords enregistrées dans Session.position (log silencieux)
//
// STUDENT (scan QR) :
//   coords capturées en best-effort (navigator.geolocation)
//   non bloquantes  GPS indoor imprécis
//   présence validée par QR + confirmation prof
//
// location.active = false :
//   Gère les situations imprévues sans bloquer :
//   cours en ligne, panne GPS, salle changée, désactivation volontaire

// -----------------------------------------------------------------------------
// ARCHITECTURE FICHIERS
// -----------------------------------------------------------------------------
//
// services/session/
//   database/
//     session.mutations.ts     startSession(scheduleId, coords)
//                              endSession(scheduleId, tx?)        ? primitive clôture, tx-aware
//                              completeSession(scheduleId)        ? clôture métier atomique (tx) :
//                                                                   endSession + markScheduleAbsences
//     token.mutations.ts       createSessionToken, validateSessionToken
//                              recordStudentAttendance, confirmAttendance
//                              confirmAllAttendances, getPendingAttendances
//   session.actions.ts         startSessionAction
//                              completeSessionAction              ? remplace endSessionAction :
//                                                                   completeSession + notif ABSENCE (best-effort)
//   token.actions.ts           generateTokenAction, attendAction
//                              confirmAttendanceAction
//                              confirmAllAttendancesAction
//                              getPendingAttendancesAction
//
// services/attendance/
//   database/
//     attendance.mutations.ts  recordAttendance, createAttendance
//                              confirmAttendance, confirmAllAttendances
//                              markScheduleAbsences(scheduleId, tx?)  ? PENDING?ABSENT + non-scanneurs?ABSENT
//     attendance.queries.ts    getScheduleAttendances
//                              getExpectedAttendees(scheduleId, tx?)  ? attendus (groupe/classe + soft-delete)
//   (where partagé : activeEnrollmentWhere / activeGroupMemberWhere  filtre "inscrit actif")
//
// services/location/
//   database/
//     location.queries.ts      getLocations(orgId, roomId?)
//                              getLocationById(locationId, orgId)
//     location.mutations.ts    createLocation, updateLocation
//                              deleteLocation  ? bloque si rooms liées
//                              assignLocationToRoom
//                              unlinkRoomFromLocation
//                              verifyUserLocation (PostGIS $queryRaw)
//   location.actions.ts
//
// hooks/
//   pratical/
//     use-session-countdown.ts  timer pur, phases temporelles (TimePhase)
//     use-session-state.ts      adaptateur UI ? CombinedSessionState
//   data/sessions/
//     use-start-session.ts      mutations start/end + GPS best-effort
//     use-generate-token.ts     génération QR + countdown + auto-refresh
//
// lib/
//   session-policy.ts           deriveSessionPresence, deriveUISessionStatus
//   attendance-policy.ts        ? ce fichier
//
// config/
//   url.ts                      SESSION_ATTENDANCE_URL, buildSessionUrl
//
// components/session/
//   SessionQRDisplay.tsx        QR canvas + progress expiry + copy link
//   AttendanceList.tsx          liste PENDING/PRESENT + confirmation
//
// migrations/
//   add_postgis_location_points.sql
//     Location.geog + index GIST + trigger sync latitude/longitude ? geog
//     Session.position geography(Point, 4326)
//     verify_user_in_location() ? { is_within, distance_m, radius_m }
//     teacher_check_in()        ? JSON  (RPC atomique)
//     session_presence_map      VIEW
//   add_session_token.sql
//     create_session_token()    ? { token, expiresAt }
//     validate_session_token()  ? { sessionId, scheduleId, isExpired }

// -----------------------------------------------------------------------------
// ROADMAP
// -----------------------------------------------------------------------------
//
// Phase 1  QR présence
//   ? Token QR + scan étudiant (/session/attendance)
//   ? Liste PENDING + confirmation manuelle / en lot
//   ? Intégration SessionQRDisplay + AttendanceList dans TeacherSessionPage
//   ? Redirection login ? /session/attendance?token=xxx
//      (config dans : src/config/url.ts | SESSION_ATTENDANCE_URL)
//
// Phase 1.bis  Clôture & marquage des absences
//   ? completeSession (tx) : endSession + markScheduleAbsences
//   ? getExpectedAttendees (règle groupe/classe + filtre soft-delete)
//   ? Notif ABSENCE à la clôture (best-effort, hors tx)
//   ? Notif confirmation PRESENT au moment de confirmAttendance (à câbler)
