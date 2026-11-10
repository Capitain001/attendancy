// apps\web\src\data\mocks\mock.schedule.ts
import { ScheduleStatus, SessionStatus, Level } from '@/generated/prisma/browser';
import { GetTeacherNextScheduleDto } from '@/services/schedule';

const now = new Date();

export const mockGetTeacherNextSchedule: GetTeacherNextScheduleDto = {
  id: 'sched-101',
  status: ScheduleStatus.PENDING,
  startTime: new Date(now.getTime()),
  endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // + 2 heures
  confirmed: true,
  notes: 'Prévoir du matériel pour le TP de physique.',
  class: {
    name: 'Master 1 Informatique',
    level: Level.M1,
    _count: {
      studentEnrollments: 32,
    },
  },
  course: {
    name: 'Algorithmique Avancée',
    ueCourse: {
      code: 'UE-INF401',
    },
  },
  group: {
    name: 'Groupe A',
    _count: {
      studentGroups: 16,
    },
  },
  room: {
    name: 'Amphi B',
    locationId: 'loc-batiment-c',
  },
  session: {
    id: 'sess-202',
    status: SessionStatus.ACTIVE,
    checkIn: new Date(now.getTime() - 15 * 60 * 1000), // Check-in effectué il y a 15 min
  },
};

import {
  ScheduleType,
  ScheduleNotifyState,
} from '@/generated/prisma/browser';
import { GetTeacherSchedulesDto } from '@/services/schedule';



export const mockGetTeacherSchedules: GetTeacherSchedulesDto = [
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    // orgId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    courseId: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    classId: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    groupId: 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    roomId: 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
    teacherId: 'a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77',
    weekRecurrenceId: null,

    startTime: new Date(now.getTime() + 1 * 60 * 60 * 1000), // Dans 1h
    endTime: new Date(now.getTime() + 3 * 60 * 60 * 1000),   // Dans 3h
    status: ScheduleStatus.PENDING,
    scheduleType: ScheduleType.CM,
    statusChangedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),

    confirmed: true,
    isLocked: false,
    notes: 'Prévoir du matériel pour le TP de physique.',

    notifyState: ScheduleNotifyState.SENT,
    notifiedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),

    deletedAt: null,
    createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),

    class: {
      id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
      name: 'Master 1 Informatique',
    },
    course: {
      id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      name: 'Algorithmique Avancée',
    },
    group: {
      id: 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
      name: 'Groupe A',
    },
    room: {
      id: 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
      name: 'Amphi B',
    },
    teacher: {
      id: 'a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77',
      user: {
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jean',
        firstName: 'Jean',
        lastName: 'Dupont',
      },
    },
  },
  {
    id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a88',
    // orgId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    courseId: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a34',
    classId: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    groupId: null,
    roomId: 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a67',
    teacherId: 'a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77',
    weekRecurrenceId: 'w1eebc99-9c0b-4ef8-bb6d-6bb9bd380a99',

    startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Demain
    endTime: new Date(now.getTime() + 26 * 60 * 60 * 1000),
    status: ScheduleStatus.COMPLETED, // Remplacé CONFIRMED par COMPLETED (ou PENDING)
    scheduleType: ScheduleType.TD,
    statusChangedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),

    confirmed: true,
    isLocked: false,
    notes: null,

    notifyState: null,
    notifiedAt: null,

    deletedAt: null,
    createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),

    class: {
      id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
      name: 'Master 1 Informatique',
    },
    course: {
      id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a34',
      name: 'Bases de Données Avancées',
    },
    group: null,
    room: {
      id: 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a67',
      name: 'Salle TP 12',
    },
    teacher: {
      id: 'a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77',
      user: {
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jean',
        firstName: 'Jean',
        lastName: 'Dupont',
      },
    },
  },
];



import type { GetTeacherDailyScheduleDto, getTeacherSchedulesInfoAction, GetTeacherSchedulesInfoDto } from '@/services/schedule';
import { GetStudentSchedulesDto } from '@/services/student';

export const mockGetTeacherSchedulesInfo: GetTeacherSchedulesInfoDto = [
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    status: ScheduleStatus.PENDING,
    startTime: new Date(now.getTime() + 1 * 60 * 60 * 1000), // Dans 1h
    endTime: new Date(now.getTime() + 3 * 60 * 60 * 1000),   // Dans 3h
    notes: 'Prévoir du matériel pour le TP de physique.',
    class: {
      id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
      name: 'Master 1 Informatique',
    },
    course: {
      id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      name: 'Algorithmique Avancée',
    },
    group: {
      id: 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
      name: 'Groupe A',
    },
    room: {
      id: 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
      name: 'Amphi B',
    },
  },
  {
    id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a88',
    status: ScheduleStatus.COMPLETED,
    startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Demain
    endTime: new Date(now.getTime() + 26 * 60 * 60 * 1000),
    notes: null,
    class: {
      id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
      name: 'Master 1 Informatique',
    },
    course: {
      id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a34',
      name: 'Bases de Données Avancées',
    },
    group: null, // Classe entière
    room: {
      id: 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a67',
      name: 'Salle TP 12',
    },
  },
];




export const mockGetTeacherDailySchedule: GetTeacherDailyScheduleDto = [
  // 1. Séance PASSÉE et TERMINÉE (Il y a 4 heures)
  {
    id: 'sched-daily-01',
    status: ScheduleStatus.COMPLETED,
    startTime: new Date(now.getTime() - 4 * 60 * 60 * 1000), // Il y a 4h
    endTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),   // Il y a 2h
    confirmed: true,
    notes: 'Cours terminé. Bonne participation.',
    class: {
      name: 'Master 1 Informatique',
      level: Level.M1,
      _count: { studentEnrollments: 32 },
    },
    course: { name: 'Algorithmique Avancée' },
    group: {
      name: 'Groupe A',
      _count: { studentGroups: 16 },
    },
    room: {
      name: 'Amphi B',
      locationId: 'loc-batiment-c',
    },
    session: {
      id: 'sess-301',
      status: SessionStatus.COMPLETED, // ou CLOSED selon ton enum
      checkIn: new Date(now.getTime() - 4 * 60 * 60 * 1000), 
    },
  },

  // 2. Séance PASSÉE mais MANQUÉE/ANNULÉE (Il y a 2 heures)
  {
    id: 'sched-daily-02',
    status: ScheduleStatus.MISSED, // ou CANCELED
    startTime: new Date(now.getTime() - 1.5 * 60 * 60 * 1000), // Il y a 1h30
    endTime: new Date(now.getTime() - 0.5 * 60 * 60 * 1000),   // Il y a 30 min
    confirmed: false,
    notes: 'Enseignant absent (retard transport).',
    class: {
      name: 'Licence 2 Mathématiques',
      level: Level.L2,
      _count: { studentEnrollments: 45 },
    },
    course: { name: 'Probabilités et Statistiques' },
    group: null, // Classe entière
    room: {
      name: 'Salle TD 4',
      locationId: 'loc-batiment-b',
    },
    session: null, // Aucune session ouverte car le cours n'a pas eu lieu
  },

// 3. Séance EN RETARD (Débutée il y a 15 min, pas de check-in)
  {
    id: 'sched-daily-03',
    status: ScheduleStatus.PENDING,
    startTime: new Date(now.getTime() - 10 * 60 * 1000), // A débuté il y a 10 min
    endTime: new Date(now.getTime() + 105 * 60 * 1000),  // Finit dans 1h45 (pour un cours de 2h)
    confirmed: true,
    notes: 'Prévoir les polycopiés de TD.',
    class: {
      name: 'Licence 3 Informatique',
      level: Level.L3,
      _count: { studentEnrollments: 45 },
    },
    course: { name: 'Bases de Données Avancées' },
    group: {
      name: 'Groupe B',
      _count: { studentGroups: 20 },
    },
    room: {
      name: 'Salle TP 12',
      locationId: 'loc-batiment-a',
    },
    session: null, // Pas de session ouverte / aucun check-in
  },

  // 4. Séance À VENIR (Dans 4 heures)
  {
    id: 'sched-daily-04',
    status: ScheduleStatus.PENDING,
    startTime: new Date(now.getTime() + 4 * 60 * 60 * 1000), // Dans 4h
    endTime: new Date(now.getTime() + 6 * 60 * 60 * 1000),   // Dans 6h
    confirmed: true,
    notes: null,
    class: {
      name: 'Master 2 IA',
      level: Level.M2,
      _count: { studentEnrollments: 25 },
    },
    course: { name: 'Machine Learning' },
    group: null,
    room: {
      name: 'Amphi A',
      locationId: 'loc-batiment-c',
    },
    session: null,
  },

  // 5. Séance À VENIR (Dans 6h30 - Fin de journée)
  {
    id: 'sched-daily-05',
    status: ScheduleStatus.PENDING,
    startTime: new Date(now.getTime() + 6.5 * 60 * 60 * 1000), // Dans 6h30
    endTime: new Date(now.getTime() + 8 * 60 * 60 * 1000),     // Dans 8h
    confirmed: true,
    notes: 'Soutenance de projets, préparer le projecteur.',
    class: {
      name: 'Licence 1 Physique',
      level: Level.L1,
      _count: { studentEnrollments: 120 },
    },
    course: { name: 'Mécanique du point' },
    group: {
      name: 'Groupe 3',
      _count: { studentGroups: 30 },
    },
    room: {
      name: 'Amphi C',
      locationId: 'loc-batiment-d',
    },
    session: null,
  },
];





//




// ─── Identifiants partagés (même classe) ─────────────────────────────────────
const CLASS = { id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', name: 'Master 1 Informatique' };
const GROUP_A = { id: 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', name: 'Groupe A' };

const TEACHER_DUPONT = {
  id: 'a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77',
  user: {
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jean',
    firstName: 'Jean',
    lastName: 'Dupont',
  },
};
const TEACHER_MARTIN = {
  id: 'a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a78',
  user: { avatar_url: null, firstName: 'Claire', lastName: 'Martin' },
};

const hours = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000);

/** Champs techniques communs à toutes les séances du mock. */
const base = {
  classId: CLASS.id,
  class: CLASS,
  weekRecurrenceId: null,
  isLocked: false,
  notifyState: ScheduleNotifyState.SENT,
  notifiedAt: hours(-24),
  deletedAt: null,
  createdAt: hours(-7 * 24),
  updatedAt: hours(-24),
};

export const mockGetStudentSchedules: GetStudentSchedulesDto = [
  // 1. TERMINÉ (il y a 5h)
  {
    ...base,
    id: 'sched-stu-01',
    courseId: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    course: { id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', name: 'Algorithmique Avancée' },
    groupId: null,
    group: null,
    roomId: 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
    room: { id: 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', name: 'Amphi B' },
    teacherId: TEACHER_DUPONT.id,
    teacher: TEACHER_DUPONT,
    startTime: hours(-5),
    endTime: hours(-3),
    status: ScheduleStatus.COMPLETED,
    scheduleType: ScheduleType.CM,
    statusChangedAt: hours(-3),
    confirmed: true,
    notes: null,
  },

  // 2. MANQUÉ (il y a 2h30)
  {
    ...base,
    id: 'sched-stu-02',
    courseId: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a35',
    course: { id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a35', name: 'Probabilités et Statistiques' },
    groupId: null,
    group: null,
    roomId: 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a68',
    room: { id: 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a68', name: 'Salle TD 4' },
    teacherId: TEACHER_MARTIN.id,
    teacher: TEACHER_MARTIN,
    startTime: hours(-2.5),
    endTime: hours(-1.5),
    status: ScheduleStatus.MISSED,
    scheduleType: ScheduleType.TD,
    statusChangedAt: hours(-1.5),
    confirmed: false,
    notes: 'Enseignant absent.',
  },

  // 3. EN COURS (a débuté il y a 30 min, finit dans 1h30)
  {
    ...base,
    id: 'sched-stu-03',
    courseId: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a34',
    course: { id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a34', name: 'Bases de Données Avancées' },
    groupId: GROUP_A.id,
    group: GROUP_A,
    roomId: 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a67',
    room: { id: 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a67', name: 'Salle TP 12' },
    teacherId: TEACHER_DUPONT.id,
    teacher: TEACHER_DUPONT,
    startTime: hours(-0.5),
    endTime: hours(1.5),
    status: ScheduleStatus.PENDING,
    scheduleType: ScheduleType.TD,
    statusChangedAt: hours(-24),
    confirmed: true,
    notes: 'Prévoir les polycopiés de TD.',
  },

  // 4. ANNULÉ (dans 2h : ne doit jamais devenir « prochain cours »)
  {
    ...base,
    id: 'sched-stu-04',
    courseId: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a36',
    course: { id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a36', name: 'Anglais Technique' },
    groupId: null,
    group: null,
    roomId: 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a69',
    room: { id: 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a69', name: 'Salle 201' },
    teacherId: TEACHER_MARTIN.id,
    teacher: TEACHER_MARTIN,
    startTime: hours(2),
    endTime: hours(3),
    status: ScheduleStatus.CANCELED,
    scheduleType: ScheduleType.TD,
    statusChangedAt: hours(-6),
    confirmed: false,
    notes: 'Cours annulé par l’enseignant.',
  },

  // 5. À VENIR (dans 4h) → devient le « prochain cours »
  {
    ...base,
    id: 'sched-stu-05',
    courseId: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a37',
    course: { id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a37', name: 'Machine Learning' },
    groupId: null,
    group: null,
    roomId: 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a70',
    room: { id: 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a70', name: 'Amphi A' },
    teacherId: TEACHER_DUPONT.id,
    teacher: TEACHER_DUPONT,
    startTime: hours(4),
    endTime: hours(6),
    status: ScheduleStatus.PENDING,
    scheduleType: ScheduleType.CM,
    statusChangedAt: null,
    confirmed: true,
    notes: null,
  },

  // 6. DEMAIN
  {
    ...base,
    id: 'sched-stu-06',
    weekRecurrenceId: 'w1eebc99-9c0b-4ef8-bb6d-6bb9bd380a99',
    courseId: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    course: { id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', name: 'Algorithmique Avancée' },
    groupId: GROUP_A.id,
    group: GROUP_A,
    roomId: 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
    room: { id: 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', name: 'Amphi B' },
    teacherId: TEACHER_DUPONT.id,
    teacher: TEACHER_DUPONT,
    startTime: hours(24),
    endTime: hours(26),
    status: ScheduleStatus.PENDING,
    scheduleType: ScheduleType.TD,
    statusChangedAt: null,
    confirmed: true,
    notes: null,
  },
];