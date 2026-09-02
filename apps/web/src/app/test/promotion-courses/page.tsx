



'use client'

import PromotionCoursesSectionExample from "@/components/classes/direction/section/ui/Promotioncoursessection.example"
import { PCourseCard } from "@/components/courses/direction/ui/PCourseCard"
import type { PCourse } from "@/components/courses/direction/ui/PCourseCard"
import ExampleTabs from "@/components/tools/TabsContainer"
import CoursesExample from "./CoursesExample"

const mockCourses: PCourse[] = [
  {
    id: 'course-1',
    name: 'Algorithmique et structures de données',
    credits: 6,
    ueCode: 'INF101',
    semesterName: 'Semestre 1',
    durationDone: 24,
    durationTotal: 36,
    teacher: {
      firstName: 'Jean',
      lastName: 'Koffi',
    },
  },
  {
    id: 'course-2',
    name: 'Bases de données',
    credits: 5,
    ueCode: 'INF203',
    semesterName: 'Semestre 2',
    durationDone: 18,
    durationTotal: 30,
    teacher: {
      firstName: 'Marie',
      lastName: 'Mensah',
    },
  },
  {
    id: 'course-3',
    name: 'Développement web',
    credits: 4,
    ueCode: 'INF205',
    semesterName: 'Semestre 2',
    durationDone: 28,
    durationTotal: 40,
    teacher: {
      firstName: 'Koffi',
      lastName: 'Adjei',
    },
  },
  {
    id: 'course-4',
    name: 'Mathématiques discrètes',
    credits: 3,
    ueCode: 'MAT102',
    semesterName: 'Semestre 1',
    durationDone: 30,
    durationTotal: 30,
    teacher: {
      firstName: 'Paul',
      lastName: 'Tchalla',
    },
  },
  {
    id: 'course-5',
    name: 'Anglais technique',
    credits: 2,
    ueCode: 'ANG101',
    semesterName: 'Semestre 1',
    durationDone: 12,
    durationTotal: 20,
    teacher: null,
  },
  {
    id: 'course-6',
    name: 'Architecture des systèmes',
    credits: 5,
    ueCode: 'INF301',
    semesterName: 'Semestre 3',
    durationDone: 0,
    durationTotal: 30,
    teacher: {
      firstName: 'David',
      lastName: 'Assogba',
    },
  },
]

export default function PCourseList() {
  return (
    <div className="flex flex-col gap-8">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {mockCourses.map((course) => (
        <PCourseCard key={course.id} course={course} />
      ))}

       {/* <PromotionCoursesSectionExample/> */}
    </div>

    <CoursesExample/>
    </div>
  )
}

// import PromotionCoursesSectionExample from '@/components/classes/direction/section/ui/Promotioncoursessection.example'
// import React from 'react'

// export default function page() {
//   return (
//     <div>
//       <PromotionCoursesSectionExample/>
//     </div>
//   )
// }
