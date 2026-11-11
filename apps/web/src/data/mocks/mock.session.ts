// src/data/mocks/mock.session.ts
// apps\web\src\data\mocks\mock.session.ts
import { SessionStatus, AttendanceStatus } from '@/generated/prisma/browser';
import { GetTeacherPastSessionsDto } from '@/services/session';

const now = new Date();

export const mockGetTeacherPastSessions: GetTeacherPastSessionsDto = {
  sessions: [
    {
      id: 'sess-301',
      status: SessionStatus.COMPLETED,
      schedule: {
        startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Hier (-24h)
        endTime: new Date(now.getTime() - 22 * 60 * 60 * 1000), // Hier (-22h)
        attendances: [
          { status: AttendanceStatus.PRESENT },
          { status: AttendanceStatus.PRESENT },
          { status: AttendanceStatus.ABSENT },
          { status: AttendanceStatus.LATE },
        ],
        class: {
          name: 'Master 1 Informatique',
        },
        course: {
          name: 'Algorithmique Avancée',
        },
        group: {
          name: 'Groupe A',
        },
        room: {
          name: 'Amphi B',
        },
      },
    },
    {
      id: 'sess-302',
      status: SessionStatus.COMPLETED,
      schedule: {
        startTime: new Date(now.getTime() - 48 * 60 * 60 * 1000), // Il y a 2 jours
        endTime: new Date(now.getTime() - 46 * 60 * 60 * 1000),
        attendances: [
          { status: AttendanceStatus.PRESENT },
          { status: AttendanceStatus.PRESENT },
          { status: AttendanceStatus.PRESENT },
        ],
        class: {
          name: 'Licence 3 Informatique',
        },
        course: {
          name: 'Bases de Données',
        },
        group: null,
        room: {
          name: 'Salle 204',
        },
      },
    },
  ],
  hasNext: true,
};