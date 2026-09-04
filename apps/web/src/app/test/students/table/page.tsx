'use client'

import { useState } from 'react'
import { StudentsTable } from '@/components/direction/students/table/StudentsTable'
import { mockGetDirectionStudents } from '@/data/mocks/students'

export default function TestStudentsTablePage() {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const handleToggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Test Table Étudiants</h1>
        <p className="text-sm text-muted-foreground">
          Page de test avec données mockées consommées via GetDirectionStudentsDto
        </p>
      </div>

      <StudentsTable
        data={mockGetDirectionStudents}
        rates={{
          'std-1': { rate: 95, absences: 1, denominator: 20 },
          'std-2': { rate: 82, absences: 3, denominator: 20 },
          'std-3': { rate: 68, absences: 6, denominator: 20 },
        }}
        selected={selected}
        onToggle={handleToggle}
        onOpen={(student) => console.log('Open student:', student)}
        hrefFor={(id) => `#`}
        /* /test/students/${id} */
      />
    </div>
  )
}
