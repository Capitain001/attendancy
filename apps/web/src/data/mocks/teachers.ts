import { GetTeacherSchedulesInfoDto } from "@/services/schedule";
import { GetTeachersDto } from "@/services/teacher";

export const mockgetTeachers:GetTeachersDto = [
  {
    id: "teacher-001",
    _count: {
      courses: 4,
    },
    departmentId: "department-001",
    department: {
      id: "department-001",
      name: "Informatique",
    },
    user: {
      id: "user-001",
      email: "jean.dupont@example.com",
      avatar_url: null,
      status: "ACTIVE",
      firstName: "Jean",
      lastName: "Dupont",
    },
  },
  {
    id: "teacher-002",
    _count: {
      courses: 2,
    },
    departmentId: "department-001",
    department: {
      id: "department-001",
      name: "Informatique",
    },
    user: {
      id: "user-002",
      email: "marie.koffi@example.com",
      avatar_url: null,
      status: "ACTIVE",
      firstName: "Marie",
      lastName: "Koffi",
    },
  },
  {
    id: "teacher-003",
    _count: {
      courses: 6,
    },
    departmentId: "department-002",
    department: {
      id: "department-002",
      name: "Mathématiques",
    },
    user: {
      id: "user-003",
      email: "paul.ayivi@example.com",
      avatar_url: null,
      status: "ACTIVE",
      firstName: "Paul",
      lastName: "Ayivi",
    },
  },
  {
    id: "teacher-004",
    _count: {
      courses: 0,
    },
    departmentId: null,
    department: null,
    user: {
      id: "user-004",
      email: "sarah.mensah@example.com",
      avatar_url: null,
      status: "INACTIVE",
      firstName: "Sarah",
      lastName: "Mensah",
    },
  },
]


export const mockGetTeacherSchedulesInfo: GetTeacherSchedulesInfoDto = [
  {
    id: '1',
    startTime: new Date('2026-09-14T08:00:00'),
    endTime: new Date('2026-09-14T10:00:00'),
    status: 'COMPLETED',
    notes: 'Interrogation écrite de 15 minutes en début de cours.',
    class: { id: 'c1', name: 'Terminale S1' },
    course: { id: 'm1', name: 'Mathématiques' },
    group: { id: 'g1', name: 'Groupe A' },
    room: { id: 'r102', name: 'S. 102' },
  },
  {
    id: '2',
    startTime: new Date('2026-09-14T10:15:00'),
    endTime: new Date('2026-09-14T12:15:00'),
    status: 'COMPLETED',
    notes: null,
    class: { id: 'c2', name: '1ère STI2D' },
    course: { id: 'm2', name: 'Physique-Chimie' },
    group: null,
    room: { id: 'r3', name: 'Labo 3' },
  },
  {
    id: '3',
    startTime: new Date('2026-09-14T14:00:00'),
    endTime: new Date('2026-09-14T15:30:00'),
    status: 'PENDING',
    notes: 'Remplacement potentiel à confirmer par la direction.',
    class: { id: 'c3', name: '2nde 4' },
    course: { id: 'm3', name: 'Histoire-Géo' },
    group: { id: 'g2', name: 'Demi-groupe B' },
    room: { id: 'r204', name: 'S. 204' },
  },
  {
    id: '4',
    startTime: new Date('2026-09-14T15:45:00'),
    endTime: new Date('2026-09-14T17:15:00'),
    status: 'CANCELED',
    notes: 'Cours annulé — Sortie pédagogique.',
    class: { id: 'c4', name: '3ème B' },
    course: { id: 'm4', name: 'Anglais LV1' },
    group: null,
    room: { id: 'r105', name: 'S. 105' },
  },
  {
    id: '5',
    startTime: new Date('2026-09-14T17:30:00'),
    endTime: new Date('2026-09-14T18:30:00'),
    status: 'MISSED',
    notes: 'Absence de l\'enseignant.',
    class: { id: 'c1', name: 'Terminale S1' },
    course: { id: 'm1', name: 'Soutien Mathématiques' },
    group: { id: 'g3', name: 'Groupe Soutien' },
    room: { id: 'r102', name: 'S. 102' },
  },
]