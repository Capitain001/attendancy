import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { card } from '@/styles'
import { cn } from '@/lib/utils'

import type { GetTeacherDto, GetTeacherSchedulesDto, GetTeacherCoursesDto } from '@/services/teacher'
import type { GetTeacherUnavailabilitiesDto } from '@/services/teacher-unavailability'

import { TeacherProfileHeader } from './teacher/ui/TeacherProfileHeader'
import { TeacherStatsSection } from './teacher/sections/TeacherStatsSection'
import { TeacherCoursesSection } from './teacher/sections/TeacherCoursesSection'
import { TeacherSchedulesSection } from './teacher/sections/TeacherSchedulesSection'
import { TeacherUnavailabilitiesSection } from './teacher/sections/TeacherUnavailabilitiesSection'

export function TeacherDetailPage({
  teacher,
  courses,
  schedules,
  unavailabilities,
  backHref,
}: {
  teacher: GetTeacherDto
  courses: GetTeacherCoursesDto
  schedules: GetTeacherSchedulesDto | []
  unavailabilities: GetTeacherUnavailabilitiesDto | []
  backHref: string
}) {
  if (!teacher) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Button variant="ghost" size="sm" className="w-fit gap-1 px-2 h-8" asChild>
          <Link href={backHref}>
            <ChevronLeft className="size-4" />
            Retour
          </Link>
        </Button>
        <div className={cn(card.base, 'p-6 text-sm text-muted-foreground')}>
          Enseignant introuvable.
        </div>
      </div>
    )
  }

  const now = new Date()
  const upcomingCount = (schedules ?? []).filter((s) => new Date(s.startTime) >= now).length
  const pastCount = (schedules ?? []).filter((s) => new Date(s.startTime) < now).length

  return (
    <div className="flex flex-col gap-6">
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-1 px-2 h-8" asChild>
          <Link href={backHref}>
            <ChevronLeft className="size-4" />
            Retour
          </Link>
        </Button>
      </div>

      <TeacherProfileHeader teacher={teacher} />
      
      <TeacherStatsSection 
        teacher={teacher} 
        upcomingCount={upcomingCount} 
        pastCount={pastCount} 
        unavailabilitiesCount={unavailabilities.length} 
      />

      <TeacherCoursesSection courses={courses} />

      <TeacherSchedulesSection schedules={schedules} />

      <TeacherUnavailabilitiesSection unavailabilities={unavailabilities} />
    </div>
  )
}
