// src/components/courses/direction/PromotionCoursesPage.tsx
'use client'

import { ClassTerms } from '@/components/term/ClassTerms'
import { PromotionCoursesSection, type RawCourse } from './sections/PromotionCoursesSection'
import { usePromotionCoursesState } from './hooks/usePromotionCoursesState'

interface PromotionCoursesPageProps {
  classId: string
  courses: RawCourse[]
  classTerms?: { id: string; name: string }[]
}

export function PromotionCoursesPage({ classId, courses, classTerms }: PromotionCoursesPageProps) {
  const {
    selectedTermId,
    setSelectedTermId,
    isEditing,
    setIsEditing,
    pendingChanges,
    isSubmitting,
    handleToggleCourse,
    handleReset,
    handleSave,
  } = usePromotionCoursesState()

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* En-tête */}
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold tracking-tight">Cours</h1>
        <p className="text-sm text-muted-foreground">
          {courses.length === 0
            ? 'Aucun cours pour cette promotion.'
            : `${courses.length} cours répartis par semestre.`}
        </p>
      </div>

      {/* Sélecteur de semestre unique via ClassTerms */}
      <ClassTerms
        classId={classId}
        selectedTermId={selectedTermId}
        onSelectTerm={setSelectedTermId}
      />

      {/* Section des cours avec vue consultation ou édition */}
      <PromotionCoursesSection
        courses={courses}
        classTerms={classTerms}
        selectedTermId={selectedTermId}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        pendingChanges={pendingChanges}
        isSubmitting={isSubmitting}
        onToggleCourse={handleToggleCourse}
        onSave={handleSave}
        onReset={handleReset}
      />
    </div>
  )
}
