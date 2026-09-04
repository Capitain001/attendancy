"use client"
import { CoursesTab } from "@/components/tools/CoursesTab"
import { SortableCourseGrid } from "./SortableCourseGrid"
import { useCourseOrder } from "./useCourseOrder"
import { PCourse } from "./PCourseCard"

export default function CoursesDndExample({courses}: {courses: PCourse[]}) {
  const semester1 = useCourseOrder(courses.filter((c) => c.semesterName === 'Semestre 1'))
  const semester2 = useCourseOrder(courses.filter((c) => c.semesterName === 'Semestre 2'))

  const tabs = [
    {
      label: 'Semestre 1',
      value: 'semester-1',
      count: semester1.courses.length,
      content: <SortableCourseGrid courses={semester1.courses} onReorder={semester1.reorder} />,
    },
    {
      label: 'Semestre 2',
      value: 'semester-2',
      count: semester2.courses.length,
      content: <SortableCourseGrid courses={semester2.courses} onReorder={semester2.reorder} />,
    },
  ]

  return (
    <CoursesTab
      listClassName="gap-0.5"
      triggerClassName="px-2.5 py-1.5"
      contentClassName="p-3 bg-background"
      tabs={tabs}
    />
  )
}