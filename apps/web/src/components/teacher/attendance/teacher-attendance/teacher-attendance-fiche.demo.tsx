import { CLASS_DETAIL_MOCK } from "./mocks/class-detail.mock"
import { CLASSES_MOCK } from "./mocks/classes.mock"
import { HOME_MOCK } from "./mocks/home.mock"
import { JUSTIFICATIONS_MOCK } from "./mocks/justifications.mock"
import { OWN_ATTENDANCE_MOCK } from "./mocks/own-attendance.mock"
import { PERIOD_MOCK } from "./mocks/period.mock"
import { SESSIONS_MOCK } from "./mocks/sessions.mock"
import { TeacherAttendanceFiche } from "./teacher-attendance-fiche"

/** Exemple d'utilisation : chaque vue reçoit uniquement ses propres données. */
export default function TeacherAttendanceFicheDemo() {
    return (
        <TeacherAttendanceFiche
            period={PERIOD_MOCK}
            home={HOME_MOCK}
            sessions={SESSIONS_MOCK}
            classes={CLASSES_MOCK}
            classDetail={CLASS_DETAIL_MOCK}
            ownAttendance={OWN_ATTENDANCE_MOCK}
            justifications={JUSTIFICATIONS_MOCK}
        />
    )
}
