// src/data/mocks/mock.teacher-attendance-fiche.ts
import type { TeacherAttendanceFicheProps } from "@/components/teacher/attendance/teacher-attendance/teacher-attendance-fiche"
import { CLASS_DETAIL_MOCK } from "@/components/teacher/attendance/teacher-attendance/mocks/class-detail.mock"
import { CLASSES_MOCK } from "@/components/teacher/attendance/teacher-attendance/mocks/classes.mock"
import { HOME_MOCK } from "@/components/teacher/attendance/teacher-attendance/mocks/home.mock"
import { JUSTIFICATIONS_MOCK } from "@/components/teacher/attendance/teacher-attendance/mocks/justifications.mock"
import { OWN_ATTENDANCE_MOCK } from "@/components/teacher/attendance/teacher-attendance/mocks/own-attendance.mock"
import { PERIOD_MOCK } from "@/components/teacher/attendance/teacher-attendance/mocks/period.mock"
import { SESSIONS_MOCK } from "@/components/teacher/attendance/teacher-attendance/mocks/sessions.mock"

/**
 * Mock dédié à la fiche de présence enseignant : assemble les mocks
 * par vue (home, séances, classes, détail classe, assiduité, justificatifs)
 * en un objet de props prêt à passer à <TeacherAttendanceFiche />.
 */
export function mockGetTeacherAttendanceFicheProps(): TeacherAttendanceFicheProps {
  return {
    period: PERIOD_MOCK,
    home: HOME_MOCK,
    sessions: SESSIONS_MOCK,
    classes: CLASSES_MOCK,
    classDetail: CLASS_DETAIL_MOCK,
    ownAttendance: OWN_ATTENDANCE_MOCK,
    justifications: JUSTIFICATIONS_MOCK,
  }
}
