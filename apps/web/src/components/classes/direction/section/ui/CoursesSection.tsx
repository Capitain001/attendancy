'use client'

import { motion } from 'framer-motion'
import type { ClassProfileData } from './types'
import { getInitials } from './helpers'
import { GridDeco } from './GridDeco'
import Link from 'next/link'

type Course = ClassProfileData['courses'][number]

function CourseCard({ course }: { course: Course }) {
  const pct = course.duration[1] > 0
    ? Math.round((course.duration[0] / course.duration[1]) * 100)
    : 0

  const teacher = course.teachers.find((t) => t.isMain)?.teacher.user

  return (
    <div className="relative p-4 border border-dashed dark:border-border rounded-2xl bg-card overflow-hidden">
      <GridDeco />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-3">
          <Link href={`../../courses/${course.id}`} className="text-sm font-semibold">
            {course.name}
          </Link>
          <span className="text-[10px] font-mono dark:opacity-80">{course.credits} CREDITS</span>
        </div>

        <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
          <div className="size-6 rounded-full bg-foreground/10 flex items-center justify-center border border-dashed border-foreground/20 overflow-hidden">
            <span className="text-[9px]">
              {getInitials(teacher?.firstName, teacher?.lastName)}
            </span>
          </div>
          <span>{teacher?.firstName} {teacher?.lastName}</span>
        </div>

        <div className="h-1 bg-foreground/10 rounded-full overflow-hidden mb-1">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-foreground/60"
          />
        </div>

        <div className="flex justify-between text-[9px] opacity-80">
          <span>Progression</span>
          <span>{course.duration[0]}h / {course.duration[1]}h</span>
        </div>
      </div>
    </div>
  )
}

export function CoursesSection({ courses }: { courses: Course[] }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {courses.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}
      </div>
      <Link
        href="#"
        className="flex justify-center w-full text-sm font-semibold text-muted-foreground tracking-wide underline"
      >
        voir plus ...
      </Link>
    </div>
  )
}
