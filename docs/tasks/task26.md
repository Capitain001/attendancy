type GetTeacherSchedulesInfoDto = {
    id: string;
    startTime: Date;
    endTime: Date;
    status: ScheduleStatus;
    notes: string | null;
    class: {
        id: string;
        name: string;
    };
    course: {
        id: string;
        name: string;
    };
    group: {
        id: string;
        name: string;
    } | null;
    room: {
        id: string;
        name: string;
    };
}[]


adate l UI suivant pour ce typage 

// src/components/schedule/MinimalDailySchedule.tsx
import React, { useState } from 'react'

const MOCK_COURSES = [
  { id: '1', name: 'Mathématiques', time: '08:00 - 10:00', room: 'S. 102', teacher: 'Mme Dupont', status: 'confirmed' },
  { id: '2', name: 'Physique-Chimie', time: '10:15 - 12:15', room: 'Labo 3', teacher: 'M. Martin', status: 'confirmed' },
  { id: '3', name: 'Histoire-Géo', time: '14:00 - 15:30', room: 'S. 204', teacher: 'Mme Leroy', status: 'pending' },
  { id: '4', name: 'Anglais LV1', time: '15:45 - 17:15', room: 'S. 105', teacher: 'M. Smith', status: 'confirmed' },
]

export function DailyScheduleView() {
  const [selectedId, setSelectedId] = useState<string>('1')
  const selectedCourse = MOCK_COURSES.find((c) => c.id === selectedId)

  return (
    <div className="w-full max-w-6xl mx-auto p-4 lg:p-6 text-slate-900 dark:text-slate-100">
      
      {/* En-tête sobre */}
      <div className="flex items-baseline justify-between mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
        <h1 className="text-lg font-medium tracking-tight">Aujourd'hui</h1>
        <span className="text-xs text-slate-400 font-mono">14 Sept.</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Liste minimaliste (100% mobile, 7/12 desktop) */}
        <div className="lg:col-span-7 space-y-1">
          {MOCK_COURSES.map((course) => {
            const isSelected = selectedId === course.id

            return (
              <div
                key={course.id}
                onClick={() => setSelectedId(course.id)}
                className={`group flex items-center justify-between p-3 rounded-lg text-sm cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-slate-100 dark:bg-slate-800/80 font-medium'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                {/* Heure + Nom */}
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-xs font-mono text-slate-400 w-24 shrink-0">
                    {course.time}
                  </span>
                  <span className="truncate text-slate-700 dark:text-slate-200">
                    {course.name}
                  </span>
                </div>

                {/* Statut discret + Salle */}
                <div className="flex items-center gap-3 shrink-0 text-xs text-slate-400">
                  <span>{course.room}</span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      course.status === 'confirmed' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Détail latéral (Desktop uniquement, 5/12) */}
        <aside className="hidden lg:block lg:col-span-5 border-l border-slate-100 dark:border-slate-800 pl-8 space-y-4">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Détails du créneau
          </div>

          {selectedCourse ? (
            <div className="space-y-3 pt-1">
              <div>
                <h3 className="text-base font-semibold">{selectedCourse.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedCourse.teacher}</p>
              </div>

              <div className="pt-2 text-xs space-y-1.5 text-slate-500 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Horaire</span>
                  <span className="font-mono font-medium text-slate-700 dark:text-slate-200">{selectedCourse.time}</span>
                </div>
                <div className="flex justify-between">
                  <span>Salle</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{selectedCourse.room}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Sélectionnez un cours.</p>
          )}
        </aside>

      </div>
    </div>
  )
}




reture les couleur en dure pr le bg utilise tokken shadcn 


le texte est conserver 