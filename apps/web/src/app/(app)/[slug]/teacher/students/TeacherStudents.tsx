'use client'

import { useState } from 'react'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { getInitials } from '@/lib/utils'

interface StudentUser {
  email: string
  avatar_url: string | null
  phone: string | null
  status: string
  firstName: string | null
  lastName: string | null
  sex: string
  dateOfBirth: Date | null
}

interface Enrollment {
  id: string
  createdAt: Date
  studentId: string
  student: { id: string; user: StudentUser }
  studentGroups: { id: string; group: { id: string; name: string } }[]
}

interface ClassGroup {
  classId: string
  className: string
  students: Enrollment[]
}

interface TeacherStudentsProps {
  groups: ClassGroup[]
}

function studentName(user: StudentUser) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return name || 'Étudiant sans nom'
}

export function TeacherStudents({ groups }: TeacherStudentsProps) {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)

  const totalStudents = groups.reduce((acc, g) => acc + g.students.length, 0)
  const selectedClass = groups.find((g) => g.classId === selectedClassId) ?? null

  if (selectedClass) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setSelectedClassId(null)}
            className="inline-flex w-fit items-center gap-1 text-xs text-foreground/40 transition-colors hover:text-foreground/70"
          >
            <ArrowLeft className="size-3" />
            Mes classes
          </button>
          <h1 className="text-2xl font-bold tracking-tight">{selectedClass.className}</h1>
          <p className="text-sm text-foreground/40">
            {selectedClass.students.length} étudiant{selectedClass.students.length > 1 ? 's' : ''}.
          </p>
        </div>

        {selectedClass.students.length === 0 ? (
          <EmptyStudents />
        ) : (
          <div className="overflow-hidden rounded-xl border border-foreground/10">
            <div className="p-1">
              {selectedClass.students.map((enrollment, index, arr) => {
                const user = enrollment.student.user
                const groupLabel = enrollment.studentGroups.map((sg) => sg.group.name).join(', ')

                return (
                  <div
                    key={enrollment.id}
                    className={`flex h-12 items-center gap-3 px-3 text-sm bg-foreground/[0.02] sm:h-10 sm:rounded-lg sm:bg-transparent sm:hover:bg-foreground/5 ${
                      index !== arr.length - 1 ? 'border-b border-foreground/[0.06] sm:border-b-0' : ''
                    }`}
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-medium text-foreground/60">
                      {getInitials(user.firstName, user.lastName)}
                    </span>
                    <span className="truncate text-foreground/70">{studentName(user)}</span>
                    <span className="h-px flex-1 bg-foreground/10" />
                    {groupLabel && (
                      <span className="shrink-0 text-xs text-foreground/30">{groupLabel}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Mes étudiants</h1>
        <p className="text-sm text-foreground/40">
          {totalStudents === 0
            ? 'Aucun étudiant inscrit.'
            : `${totalStudents} étudiant${totalStudents > 1 ? 's' : ''} dans ${groups.length} classe${groups.length > 1 ? 's' : ''}.`}
        </p>
      </div>

      {groups.length === 0 ? (
        <EmptyClasses />
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {groups.map((group) => (
            <button
              key={group.classId}
              type="button"
              onClick={() => setSelectedClassId(group.classId)}
              className="group/card flex items-center gap-3 rounded-md bg-foreground/5 px-4 py-3.5 text-left transition-colors hover:bg-foreground/[0.07]"
            >
              <p className="truncate text-sm font-medium text-foreground/70">{group.className}</p>
              <span className="h-px flex-1 bg-foreground/10" />
              <span className="shrink-0 text-xs text-foreground/30">
                {group.students.length} étudiant{group.students.length > 1 ? 's' : ''}
              </span>
              <ChevronRight className="size-3.5 shrink-0 text-foreground/20 transition-transform group-hover/card:translate-x-0.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyClasses() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-xl border border-dashed border-foreground/15 px-6 py-16 text-center">
      <svg width="140" height="104" viewBox="0 0 140 104" fill="none" className="text-foreground">
        <rect x="8" y="8" width="58" height="40" rx="10" fill="currentColor" fillOpacity="0.07" />
        <rect x="74" y="8" width="58" height="40" rx="10" fill="currentColor" fillOpacity="0.05" />
        <rect x="8" y="56" width="58" height="40" rx="10" fill="currentColor" fillOpacity="0.04" />
        <rect x="74" y="56" width="58" height="40" rx="10" fill="currentColor" fillOpacity="0.03" />
        <circle cx="70" cy="52" r="18" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="3 4" />
      </svg>
      <div className="grid gap-1">
        <p className="text-sm font-medium text-foreground/70">Aucune classe assignée</p>
        <p className="text-xs text-foreground/40">Les classes qui vous sont attribuées apparaîtront ici.</p>
      </div>
    </div>
  )
}

function EmptyStudents() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-xl border border-dashed border-foreground/15 px-6 py-16 text-center">
      <svg width="140" height="104" viewBox="0 0 140 104" fill="none" className="text-foreground">
        <rect x="10" y="8" width="120" height="22" rx="7" fill="currentColor" fillOpacity="0.08" />
        <circle cx="18" cy="19" r="1.5" fill="currentColor" fillOpacity="0.15" />
        <rect x="10" y="35" width="120" height="22" rx="7" fill="currentColor" fillOpacity="0.05" />
        <circle cx="18" cy="46" r="1.5" fill="currentColor" fillOpacity="0.1" />
        <rect x="10" y="62" width="120" height="22" rx="7" fill="currentColor" fillOpacity="0.03" />
        <circle cx="18" cy="73" r="1.5" fill="currentColor" fillOpacity="0.06" />
        <circle cx="70" cy="46" r="16" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="3 4" />
      </svg>
      <div className="grid gap-1">
        <p className="text-sm font-medium text-foreground/70">Aucun étudiant inscrit</p>
        <p className="text-xs text-foreground/40">Les étudiants inscrits dans cette classe apparaîtront ici.</p>
      </div>
    </div>
  )
}