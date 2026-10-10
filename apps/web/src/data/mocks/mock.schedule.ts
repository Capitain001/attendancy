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
    orgId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
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
    orgId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
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
  {
    id: 'sched-daily-01',
    status: ScheduleStatus.PENDING,
    startTime: new Date(now.getTime() + 1 * 60 * 60 * 1000), // Dans 1h
    endTime: new Date(now.getTime() + 3 * 60 * 60 * 1000),   // Dans 3h
    confirmed: true,
    notes: 'Prévoir les polycopiés de TD.',
    class: {
      name: 'Master 1 Informatique',
      level: Level.M1,
      _count: {
        studentEnrollments: 32,
      },
    },
    course: {
      name: 'Algorithmique Avancée',
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
      id: 'sess-301',
      status: SessionStatus.ACTIVE,
      checkIn: new Date(now.getTime() - 10 * 60 * 1000), // Check-in il y a 10 min
    },
  },
  {
    id: 'sched-daily-02',
    status: ScheduleStatus.COMPLETED,
    startTime: new Date(now.getTime() + 4 * 60 * 60 * 1000), // Dans 4h
    endTime: new Date(now.getTime() + 6 * 60 * 60 * 1000),   // Dans 6h
    confirmed: true,
    notes: null,
    class: {
      name: 'Licence 3 Informatique',
      level: Level.L3,
      _count: {
        studentEnrollments: 45,
      },
    },
    course: {
      name: 'Bases de Données Avancées',
    },
    group: null, // Classe entière
    room: {
      name: 'Salle TP 12',
      locationId: 'loc-batiment-a',
    },
    session: null, // Session non démarrée / absente
  },
];