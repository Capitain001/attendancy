  'use client'

  import { PCourse, PCourseCard } from '@/components/courses/direction/ui/PCourseCard'
  import { CoursesTab } from '@/components/tools/CoursesTab'


  const courses: PCourse[] = [
    {
      id: '1',
      name: 'Algorithmique et programmation',
      credits: 6,
      ueCode: 'INF101',
      semesterName: 'Semestre 1',
      durationDone: 18,
      durationTotal: 30,
      teacher: {
        firstName: 'Jean',
        lastName: 'Dupont',
      },
    },
    {
      id: '2',
      name: 'Bases de données',
      credits: 5,
      ueCode: 'INF102',
      semesterName: 'Semestre 1',
      durationDone: 24,
      durationTotal: 30,
      teacher: {
        firstName: 'Marie',
        lastName: 'Koffi',
      },
    },
    {
      id: '3',
      name: 'Réseaux informatiques',
      credits: 4,
      ueCode: 'INF201',
      semesterName: 'Semestre 2',
      durationDone: 12,
      durationTotal: 25,
      teacher: {
        firstName: 'Paul',
        lastName: 'Mensah',
      },
    },
    {
      id: '4',
      name: 'Génie logiciel',
      credits: 6,
      ueCode: 'INF202',
      semesterName: 'Semestre 2',
      durationDone: 20,
      durationTotal: 30,
      teacher: {
        firstName: 'Alice',
        lastName: 'Adjei',
      },
    },
      {
      id: '5',
      name: 'Trigonometrie',
      credits: 6,
      ueCode: 'INF203',
      semesterName: 'Semestre 2',
      durationDone: 20,
      durationTotal: 30,
      teacher: {
        firstName: 'Alice',
        lastName: 'Adjei',
      },
    },
      {
      id: '6',
      name: 'Anglais professionel',
      credits: 6,
      ueCode: 'INF204',
      semesterName: 'Semestre 2',
      durationDone: 20,
      durationTotal: 30,
      teacher: {
        firstName: 'Alice',
        lastName: 'Adjei',
      },
    },
        {
      id: '7',
      name: 'Latin',
      credits: 3,
      ueCode: 'INF300',
      semesterName: 'Semestre 2',
      durationDone: 20,
      durationTotal: 30,
      teacher: {
        firstName: 'Alice',
        lastName: 'Adjei',
      },
    },
      {
      id: '8',
      name: 'Algebre Relationel',
      credits: 4,
      ueCode: 'INF301',
      semesterName: 'Semestre 2',
      durationDone: 20,
      durationTotal: 30,
      teacher: {
        firstName: 'Alice',
        lastName: 'Adjei',
      },
    },
  ]

  export default function CoursesExample() {
    const semester1 = courses.filter(
      (course) => course.semesterName === 'Semestre 1',
    )

    const semester2 = courses.filter(
      (course) => course.semesterName === 'Semestre 2',
    )

    const tabs = [
      {
        label: 'Semestre 1',
        value: 'semester-1',
        count: semester1.length,
        content: (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {semester1.map((course) => (
              <PCourseCard key={course.id} course={course} />
            ))}
          </div>
        ),
      },
      {
        label: 'Semestre 2',
        value: 'semester-2',
        count: semester2.length,
        content: (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {semester2.map((course) => (
              <PCourseCard key={course.id} course={course} />
            ))}
          </div>
        ),
      },
      
    ]

    return (
      <CoursesTab
        className=""
        listClassName="gap-0.5"
        triggerClassName="px-2.5 py-1.5"
        contentClassName="p-3 bg-background"
        tabs={tabs}
      />
    )
  }
