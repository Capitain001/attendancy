import { notFound } from 'next/navigation'
import { getClassAction } from '@/services/class'
import { getCoursesAction } from '@/services/course'
import { getEnrolledStudentsAction } from '@/services/student'
import { getClassAttendanceRatesAction } from '@/services/attendance'
import { getTodayClassSchedulesAction } from '@/services/schedule'
import { ButtonX } from '@/components/design/ButtonX'
import { CollapseSection, CoursesSection, ScheduleSection } from './section/ui'
import { StudentsSection } from '@/components/student/sections'
import { AttendanceSheetButton } from './AttendanceSheetButton'
import { mapCoursesForClassSection, mapSchedulesForClassSection } from './mapClassProfile'

import { UsersGroup } from "@mynaui/icons-react";


export interface DirectionPromotionDetailPageProps {
  classId: string
  slug: string
}


export async function DirectionPromotionDetailPage({ classId, slug }: DirectionPromotionDetailPageProps) {
  const { data: class_, error } = await getClassAction(classId)
  if (error || !class_) notFound()


  const [coursesRes, enrollRes, ratesRes, schedRes] = await Promise.all([
    getCoursesAction(classId),
    getEnrolledStudentsAction(classId),
    getClassAttendanceRatesAction({ classId }),
    getTodayClassSchedulesAction(classId),
  ])


  const courses = coursesRes.data ? mapCoursesForClassSection(coursesRes.data) : []
  const enrollments = enrollRes.data ?? []
  const attendanceRates = ratesRes.data ? Object.fromEntries(ratesRes.data) : {}


  const roster = enrollments.map((e) => ({
    fullName:
      [e.student.user.firstName, e.student.user.lastName].filter(Boolean).join(' ') || 'Étudiant',
    groupName: e.studentGroups?.[0]?.group?.name ?? null,
  }))


  const schedules = schedRes.data ? mapSchedulesForClassSection(schedRes.data) : []


  const programHref     = `/${slug}/direction/academic/programs/${class_.programId}`
  const planningHref    = `/${slug}/direction/planning/promotions/${classId}`
  const invitationsHref = `./${classId}/invitations`
  const enrollmentHref  = `/${slug}/direction/academic/promotions/${classId}/enrollment`
  const groupsHref      = `/${slug}/direction/academic/promotions/${classId}/groups`


  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 w-full flex-wrap items-center justify-between">
        <div className="flex scrollbar-hidden rounded-lg gap-2 max-w-98 md:max-w-full overflow-x-auto">
          <ButtonX className="w-fit" href={programHref}>Programme</ButtonX>
          <ButtonX className="w-fit" href={planningHref}>Planning</ButtonX>
          <ButtonX className="w-fit" href={invitationsHref}>Invitations</ButtonX>
          <ButtonX className="w-fit" href={enrollmentHref}>Enrôlement</ButtonX>
          <ButtonX icon={<UsersGroup />} className="w-fit" href={groupsHref}>Groupes</ButtonX>
        </div>
        <AttendanceSheetButton className={class_?.name ?? ""} students={roster} />
      </div>


      {coursesRes.error && (
        <p className="text-sm text-destructive px-1">{coursesRes.error}</p>
      )}
      {enrollRes.error && (
        <p className="text-sm text-destructive px-1">{enrollRes.error}</p>
      )}
      {schedRes.error && (
        <p className="text-sm text-destructive px-1">{schedRes.error}</p>
      )}


      <section>
        <CollapseSection label="Cours" count={courses.length}>
          <CoursesSection courses={courses} />
        </CollapseSection>


        <CollapseSection label="Étudiants" count={enrollments.length}>
          <StudentsSection
            enrollments={enrollments}
            attendanceRates={attendanceRates}
            slug={slug}
          />
        </CollapseSection>


        <CollapseSection label="Planning" count={schedules.length}>
          <ScheduleSection planningHref={planningHref} schedules={schedules} />
        </CollapseSection>
      </section>
    </div>
  )
}