



'use client'

import PromotionCoursesSectionExample from "@/components/classes/direction/section/ui/Promotioncoursessection.example"
import { PCourseCard } from "@/components/courses/direction/ui/PCourseCard"
import type { PCourse } from "@/components/courses/direction/ui/PCourseCard"
import ExampleTabs from "@/components/tools/TabsContainer"
import CoursesExample from "./CoursesExample"
import CoursesDndExample from "@/components/courses/dnd/CoursesDndExample"

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
    id: 'course-3',
    name: 'Anglais technique',
    credits: 2,
    ueCode: 'ANG101',
    semesterName: 'Semestre 1',
    durationDone: 12,
    durationTotal: 20,
    teacher: null,
  },
  {
    id: 'course-4',
    name: 'Introduction à la programmation',
    credits: 5,
    ueCode: 'INF102',
    semesterName: 'Semestre 1',
    durationDone: 20,
    durationTotal: 36,
    teacher: {
      firstName: 'David',
      lastName: 'Assogba',
    },
  },
  {
    id: 'course-5',
    name: 'Architecture des ordinateurs',
    credits: 4,
    ueCode: 'INF103',
    semesterName: 'Semestre 1',
    durationDone: 16,
    durationTotal: 30,
    teacher: {
      firstName: 'Sophie',
      lastName: 'Amegan',
    },
  },
  {
    id: 'course-6',
    name: 'Systèmes logiques',
    credits: 3,
    ueCode: 'ELE101',
    semesterName: 'Semestre 1',
    durationDone: 28,
    durationTotal: 30,
    teacher: {
      firstName: 'Thomas',
      lastName: 'Kodjo',
    },
  },
  {
    id: 'course-7',
    name: 'Communication professionnelle',
    credits: 2,
    ueCode: 'COM101',
    semesterName: 'Semestre 1',
    durationDone: 10,
    durationTotal: 18,
    teacher: null,
  },
  {
    id: 'course-8',
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
    id: 'course-9',
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
    id: 'course-10',
    name: 'Programmation orientée objet',
    credits: 6,
    ueCode: 'INF202',
    semesterName: 'Semestre 2',
    durationDone: 22,
    durationTotal: 36,
    teacher: {
      firstName: 'Nadia',
      lastName: 'Kouassi',
    },
  },
  {
    id: 'course-11',
    name: 'Systèmes d’exploitation',
    credits: 5,
    ueCode: 'INF204',
    semesterName: 'Semestre 2',
    durationDone: 15,
    durationTotal: 30,
    teacher: {
      firstName: 'Marc',
      lastName: 'Yao',
    },
  },
  {
    id: 'course-12',
    name: 'Réseaux informatiques',
    credits: 5,
    ueCode: 'INF206',
    semesterName: 'Semestre 2',
    durationDone: 30,
    durationTotal: 36,
    teacher: {
      firstName: 'Alex',
      lastName: 'Afi',
    },
  },
  {
    id: 'course-13',
    name: 'Probabilités et statistiques',
    credits: 4,
    ueCode: 'MAT201',
    semesterName: 'Semestre 2',
    durationDone: 20,
    durationTotal: 30,
    teacher: {
      firstName: 'Claire',
      lastName: 'Mensah',
    },
  },
  {
    id: 'course-14',
    name: 'Conception de logiciels',
    credits: 4,
    ueCode: 'INF207',
    semesterName: 'Semestre 2',
    durationDone: 12,
    durationTotal: 30,
    teacher: {
      firstName: 'Daniel',
      lastName: 'Togbé',
    },
  },
  {
    id: 'course-15',
    name: 'Génie logiciel',
    credits: 5,
    ueCode: 'INF208',
    semesterName: 'Semestre 2',
    durationDone: 8,
    durationTotal: 36,
    teacher: null,
  },
  {
    id: 'course-16',
    name: 'Sécurité des systèmes',
    credits: 3,
    ueCode: 'INF209',
    semesterName: 'Semestre 2',
    durationDone: 24,
    durationTotal: 30,
    teacher: {
      firstName: 'Kevin',
      lastName: 'Agbeko',
    },
  },
  {
    id: 'course-17',
    name: 'Analyse numérique',
    credits: 3,
    ueCode: 'MAT202',
    semesterName: 'Semestre 2',
    durationDone: 18,
    durationTotal: 24,
    teacher: {
      firstName: 'Estelle',
      lastName: 'Amouzou',
    },
  },
  {
    id: 'course-18',
    name: 'Projet informatique',
    credits: 4,
    ueCode: 'INF210',
    semesterName: 'Semestre 2',
    durationDone: 6,
    durationTotal: 30,
    teacher: null,
  },
]

export default function PCourseList() {
  return (
    <div className="flex flex-col gap-8">
    {/* <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {mockCourses.map((course) => (
        <PCourseCard key={course.id} course={course} />
      ))}

       <PromotionCoursesSectionExample/>
    </div> */}

    {/* <CoursesExample/> */}
    <CoursesDndExample courses={mockCourses}/>
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
