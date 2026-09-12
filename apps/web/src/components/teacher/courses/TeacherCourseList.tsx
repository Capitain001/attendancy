"use client"
import React from 'react';

export type Course = {
  id: string;
  name: string;
  isMain: boolean;
  class: {
    id: string;
    name: string;
  };
};

interface TeacherCourseListProps {
  courses: Course[];
  onSelectCourse?: (courseId: string) => void;
}

export const TeacherCourseList: React.FC<TeacherCourseListProps> = ({
  courses,
  onSelectCourse,
}) => {
  if (!courses || courses.length === 0) {
    return (
      <div className="w-full p-8 text-center text-muted-foreground border-y border-border bg-card">
        Aucun cours assigné.
      </div>
    );
  }

  return (
    <div className="w-full border-y-2 border-border bg-card text-card-foreground">
      {/* En-tête de colonnes */}
      <div className="grid grid-cols-12 px-6 py-3 border-b border-border text-xs font-mono uppercase tracking-wider text-muted-foreground bg-muted/20">
        <div className="col-span-1">N°</div>
        <div className="col-span-5 md:col-span-6">Matière / Intitulé</div>
        <div className="col-span-4 md:col-span-3">Classe</div>
        <div className="col-span-2 md:col-span-2 text-right">Type</div>
      </div>

      {/* Lignes horizontales */}
      <div className="divide-y divide-border">
        {courses.map((course, index) => {
          const indexFormatted = String(index + 1).padStart(2, '0');

          return (
            <div
              key={course.id}
              onClick={() => onSelectCourse?.(course.id)}
              className={`grid grid-cols-12 px-6 py-4 items-center text-sm transition-colors ${
                onSelectCourse ? 'cursor-pointer hover:bg-accent/40' : ''
              }`}
            >
              {/* Index */}
              <div className="col-span-1 font-mono text-xs text-muted-foreground">
                {indexFormatted}
              </div>

              {/* Nom du cours */}
              <div className="col-span-5 md:col-span-6 font-medium text-foreground pr-4 truncate">
                {course.name}
              </div>

              {/* Classe */}
              <div className="col-span-4 md:col-span-3 font-mono text-xs text-muted-foreground truncate">
                {course.class.name}
              </div>

              {/* Statut (Principal / Secondaire) */}
              <div className="col-span-2 md:col-span-2 flex items-center justify-end gap-3">
                {course.isMain ? (
                  <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 border border-primary/30 bg-primary/10 text-primary">
                    Principal
                  </span>
                ) : (
                  <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/60">
                    Secondaire
                  </span>
                )}

                {onSelectCourse && (
                  <span className="text-xs font-mono text-muted-foreground">
                    →
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeacherCourseList;