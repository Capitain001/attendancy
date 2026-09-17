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