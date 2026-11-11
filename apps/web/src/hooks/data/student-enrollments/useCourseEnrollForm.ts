// src/hooks/data/student-enrollments/useCourseEnrollForm.ts
// useCourseEnrollForm.ts
"use client";

import { useMemo } from "react";

import { getAvailableEnrollments } from "@/components/personal/teacher/utils";
import type { PersonalCourseItem } from "@/features/personal/services/course";
import { useSelection } from "@/hooks/utils/use-selection";
import { useClassEnrollments } from "./useClassEnrollments";
import { useCourseEnrollAction } from "./useCourseEnrollAction";
import { useStudentEnrollmentFilter } from "./useStudentEnrollmentFilter";

interface Params {
  classId: string;
  course: PersonalCourseItem;
  onClose: () => void;
}

export function useCourseEnrollForm({ classId, course, onClose }: Params) {
  const { enrollments } = useClassEnrollments(classId); // cache partagé avec l'écran
  const { enrollStudentsInCourse, isEnrolling } = useCourseEnrollAction(classId);
  const selection = useSelection();

  const groupId = course.group?.id ?? null;
  const availableEnrollments = useMemo(
    () => getAvailableEnrollments(enrollments, groupId),
    [enrollments, groupId],
  );
  const { query, setQuery, filteredEnrollments } = useStudentEnrollmentFilter(availableEnrollments);

  const filteredIds = useMemo(
    () => filteredEnrollments.map((e) => e.student.id),
    [filteredEnrollments],
  );
  const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selection.has(id));

  // « Tout sélectionner » agit sur le résultat filtré : les ids cochés hors
  // filtre sont conservés (le Set interne de replace évite les doublons).
  const toggleAll = () =>
    selection.replace(
      allSelected
        ? selection.ids.filter((id) => !filteredIds.includes(id))
        : [...selection.ids, ...filteredIds],
    );

  const submit = async () => {
    if (selection.count === 0) return;

    const failed = await enrollStudentsInCourse(course, selection.ids);
    if (failed === null) return; // erreur : le modal reste ouvert
    if (failed.length > 0) return selection.replace(failed); // restent cochés pour réessayer
    onClose();
  };

  const emptyReason: "no-students" | "all-enrolled" | null =
    enrollments.length === 0
      ? "no-students"
      : availableEnrollments.length === 0
        ? "all-enrolled"
        : null;

  return {
    query, setQuery,
    filteredEnrollments,
    selectedCount: selection.count,
    isSelected: selection.has,
    allSelected,
    toggle: selection.toggle,
    toggleAll,
    submit,
    isEnrolling,
    emptyReason,
  };
}