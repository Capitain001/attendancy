import { GetTeacherAttendanceOverviewDto } from "@/services/attendance"


/**
 * Génère des données fictives cohérentes pour la vue d'ensemble des présences d'un enseignant.
 */
export function mockGetTeacherAttendanceOverview(
  overrides?: Partial<GetTeacherAttendanceOverviewDto>
): GetTeacherAttendanceOverviewDto {
  return {
    totals: {
      present: 142,
      late: 8,
      absent: 10,
      excused: 5,
      denominator: 160,
      rate: 93.75, // (142 + 8) / 160 * 100
      sessions: 12,
      ...overrides?.totals,
    },
    byCourse: overrides?.byCourse ?? [
      {
        courseId: 'course_1',
        courseName: 'Mathématiques',
        classId: 'class_3a',
        className: 'Terminale A',
        present: 75,
        late: 3,
        absent: 4,
        excused: 2,
        denominator: 82,
        rate: 95.12,
        sessions: 6,
      },
      {
        courseId: 'course_2',
        courseName: 'Physique-Chimie',
        classId: 'class_3b',
        className: 'Terminale B',
        present: 67,
        late: 5,
        absent: 6,
        excused: 3,
        denominator: 78,
        rate: 92.3,
        sessions: 6,
      },
    ],
    absentees: overrides?.absentees ?? [
      {
        studentId: 'student_101',
        firstName: 'Lucas',
        lastName: 'Moreau',
        present: 4,
        late: 1,
        absent: 5,
        excused: 1,
        denominator: 10,
        rate: 50.0,
      },
      {
        studentId: 'student_102',
        firstName: 'Emma',
        lastName: 'Bernard',
        present: 5,
        late: 2,
        absent: 4,
        excused: 0,
        denominator: 11,
        rate: 63.64,
      },
    ],
  }
}

/**
 * Mock async simulant l'appel réseau
 */
export async function mockGetTeacherAttendanceOverviewAction(
  userId: string = 'user_1',
  orgId: string = 'org_1'
): Promise<GetTeacherAttendanceOverviewDto> {
  // Optionnel : simuler un délai réseau
  // await new Promise((resolve) => setTimeout(resolve, 300))
  return mockGetTeacherAttendanceOverview()
}