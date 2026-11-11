// src/components/personal/teacher/screen/TCourseEnrollScreen.tsx
// screen/TCourseEnrollScreen.tsx
"use client";

import { useState } from "react";

import { CourseEnrollList } from "@/components/personal/teacher/courses/CourseEnrollList";
import { CourseEnrollModal } from "@/components/personal/teacher/courses/CourseEnrollModal";
import { StudentAvatar } from "@/components/personal/teacher/student/StudentAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { PersonalCourseItem } from "@/features/personal/services/course";
import { useClassEnrollments } from "@/hooks/data/student-enrollments/useClassEnrollments";

const MAX_AVATARS = 12;

interface Props {
  classId: string;
  courses: PersonalCourseItem[];
}

export function TCourseEnrollScreen({ classId, courses }: Props) {
  const { enrollments, isLoading } = useClassEnrollments(classId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedCourse = courses.find((c) => c.id === selectedId) ?? null;

  const shown = enrollments.slice(0, MAX_AVATARS);
  const extra = enrollments.length - shown.length;

  return (
    <div className="space-y-6">
      {/* En-tête : étudiants de la classe */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium">
          Étudiants de la classe {!isLoading && `(${enrollments.length})`}
        </h2>
        {isLoading ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <div className="flex items-center -space-x-2">
            {shown.map(({ student }) => (
              <StudentAvatar
                key={student.id}
                user={student.user}
                className="size-8 border-2 border-background"
              />
            ))}
            {extra > 0 && <span className="pl-4 text-sm text-muted-foreground">+{extra}</span>}
          </div>
        )}
      </section>

      <CourseEnrollList
        courses={courses}
        enrollments={enrollments}
        isLoading={isLoading}
        onSelect={setSelectedId}
      />

      {selectedCourse && (
        <CourseEnrollModal
          key={selectedCourse.id}
          classId={classId}
          course={selectedCourse}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}