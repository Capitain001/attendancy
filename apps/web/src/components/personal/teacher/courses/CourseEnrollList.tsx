// courses/CourseEnrollList.tsx
"use client";

import { Plus } from "lucide-react";

import { getEnrolledStudentIds } from "@/components/personal/teacher/utils";
import { Button } from "@/components/ui/button";
import type { PersonalCourseItem } from "@/features/personal/services/course";
import type { StudentEnrollmentsItem } from "@/services/student-enrollment";

interface Props {
  courses: readonly PersonalCourseItem[];
  enrollments: readonly StudentEnrollmentsItem[];
  isLoading: boolean;
  onSelect: (courseId: string) => void;
}

export function CourseEnrollList({ courses, enrollments, isLoading, onSelect }: Props) {
  return (
    <ul className="divide-y rounded-lg border">
      {courses.map((course) => {
        const count = getEnrolledStudentIds(enrollments, course.group?.id).length;
        return (
          <li key={course.id} className="flex items-center justify-between p-3">
            <div>
              <p className="font-medium">{course.name}</p>
              <p className="text-xs text-muted-foreground">
                {isLoading ? "…" : `${count} / ${enrollments.length} inscrits`}
              </p>
            </div>
            <Button
              size="icon"
              variant="outline"
              disabled={isLoading}
              title="Ajouter des étudiants"
              onClick={() => onSelect(course.id)}
            >
              <Plus className="size-4" />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}