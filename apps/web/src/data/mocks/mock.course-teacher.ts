import { CourseDetailView } from "@/components/teacher/courses/CoursePage"

export const mockCourse: CourseDetailView = {
  id: 'a1e4f2c0-1234-4a9b-8f21-000000000001',
  name: 'Algorithmique avancée',
  description:
    "Structures de données, complexité algorithmique et introduction aux algorithmes gloutons. Le cours alterne cours magistral et séances de TP sur machine.",
  credits: 4,
  durationDone: 18,
  durationTotal: 30,
  class: {
    id: 'c1e4f2c0-1234-4a9b-8f21-000000000010',
    name: 'L2 Informatique A',
  },
  term: {
    id: 't1e4f2c0-1234-4a9b-8f21-000000000020',
    name: 'Semestre 1',
  },
  teachers: [
    {
      id: 'ct-001',
      isMain: true,
      hours: 20,
      teacher: {
        id: 'te-001',
        user: { firstName: 'Amélie', lastName: 'Kouassi' },
      },
    },
    {
      id: 'ct-002',
      isMain: false,
      hours: 10,
      teacher: {
        id: 'te-002',
        user: { firstName: 'Jonas', lastName: 'Mensah' },
      },
    },
  ],
  lastSession: {
    date: new Date('2026-09-15T10:00:00'),
    status: 'COMPLETED',
    presentCount: 28,
    totalCount: 30,
  },
  nextSession: {
    date: new Date('2026-09-22T10:00:00'),
  },
}

// Variantes utiles pour tester les cas limites du visuel

export const mockCourseNoDescription: CourseDetailView = {
  ...mockCourse,
  id: 'a1e4f2c0-1234-4a9b-8f21-000000000002',
  description: null,
}

export const mockCourseNoProgress: CourseDetailView = {
  ...mockCourse,
  id: 'a1e4f2c0-1234-4a9b-8f21-000000000003',
  durationDone: 0,
  durationTotal: 0,
}

export const mockCourseSoloTeacher: CourseDetailView = {
  ...mockCourse,
  id: 'a1e4f2c0-1234-4a9b-8f21-000000000004',
  teachers: [mockCourse.teachers[0]],
}

export const mockCourseNoTerm: CourseDetailView = {
  ...mockCourse,
  id: 'a1e4f2c0-1234-4a9b-8f21-000000000005',
  term: null,
}

export const mockCourseUnknownTeacher: CourseDetailView = {
  ...mockCourse,
  id: 'a1e4f2c0-1234-4a9b-8f21-000000000006',
  teachers: [
    { id: 'ct-003', isMain: true, hours: null, teacher: null },
  ],
}