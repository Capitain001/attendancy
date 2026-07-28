// src/hooks/logic/useAssignTeacherLogic.ts
import { useMemo } from "react";
import { useTeachers } from '@/hooks/data/teachers/useTeachers';
import { useCourseAssignments } from "./useCourseAssignments";



export const useAssignement = (courseId: string) => {
  // Récupérer tous les enseignants actifs
  const { data: teachersData, loading: isLoadingTeachers } = useTeachers({
    status: "ACTIVE"
  });
  
  // Récupérer les assignations avec le hook
  const {
    assignments,
    assignTeacher,
    unassignTeacher,
    setMainTeacher,
    isLoading: isLoadingAssignments,
    isAssigning,
    isUnassigning,
    isSettingMain,
  } = useCourseAssignments(courseId);
  
  const teachers = teachersData?.items || [];
  
  // Calcul optimisé des enseignants assignés et disponibles
const { assignedTeachers, availableTeachers } = useMemo(() => {
  const assignedIds = new Set(assignments.map(a => a.id));

  type Teacher = NonNullable<typeof teachers[number]>;

  const assigned = (teachers.filter((t): t is Teacher => t != null && assignedIds.has(t.id)))
    .map(teacher => {
      const assignment = assignments.find(a => a.id === teacher.id);
      return {
        ...teacher,
        isMain: assignment?.isMain ?? false,
      };
    })
    .sort((a, b) => {
      if (a.isMain && !b.isMain) return -1;
      if (!a.isMain && b.isMain) return 1;
      return (a.user.lastName ?? "").localeCompare(b.user.lastName ?? "");
    });

  const available = (teachers.filter((t): t is Teacher => t != null && !assignedIds.has(t.id)))
    .sort((a, b) => (a.user.lastName ?? "").localeCompare(b.user.lastName ?? ""));

  return { assignedTeachers: assigned, availableTeachers: available };
}, [teachers, assignments]);
  
  const isLoading = isLoadingTeachers || isLoadingAssignments;
  
  return {
    assignedTeachers,
    availableTeachers,
    isLoading,
    isAssigning,
    isUnassigning,
    isSettingMain,
    assignTeacher: (teacherId: string, isMain?: boolean) => 
      assignTeacher({ teacherId, isMain }),
    unassignTeacher: (courseTeacherId: string) => unassignTeacher({ courseTeacherId }),
    setMainTeacher,
  };
};