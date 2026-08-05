"use client";

import { useState, useCallback } from "react";
import {
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import type { ProgramUECourses, UeCourseDTO } from "@/services/ue/types";
import { getCourses } from "@/services/ue/utils";

// Ce que le hook expose pour le niveau UE (SemesterTable)
export interface UseUEDndReturn {
  /** Sensors partagés (Pointer + Touch + Keyboard) */
  sensors: ReturnType<typeof useSensors>;
  /** UE en cours de drag — null si aucun drag actif */
  activeUE: ProgramUECourses | null;
  /** Ids dnd-kit pour SortableContext */
  ueIds: string[];
  /** Handlers à passer au DndContext des UEs */
  handlers: {
    onDragStart: (event: DragStartEvent) => void;
    onDragEnd: (event: DragEndEvent) => void;
  };
  /** Callback à appeler quand les cours d'une UE changent (depuis UEBlock) */
  handleCoursesChange: (programUEId: string, newCourses: UeCourseDTO[]) => void;
}

// Ce que le hook expose pour le niveau cours (UEBlock)
export interface UseCourseDndReturn {
  /** Sensors partagés (Pointer + Touch + Keyboard) */
  sensors: ReturnType<typeof useSensors>;
  /** Cours en cours de drag — null si aucun drag actif */
  activeCourse: UeCourseDTO | null;
  /** Ids dnd-kit pour SortableContext */
  courseIds: string[];
  /** Handlers à passer au DndContext des cours */
  handlers: {
    onDragStart: (event: DragStartEvent) => void;
    onDragEnd: (event: DragEndEvent) => void;
  };
}

// ==================== ID HELPERS ====================
// Conventions d'ID stables utilisées dans les deux niveaux.
export function makeUEId(semesterIndex: number, programUEId: string) {
  return `ue::${semesterIndex}::${programUEId}`;
}

export function makeCourseId(programUEId: string, courseId: string) {
  return `course::${programUEId}::${courseId}`;
}

// ==================== SENSORS FACTORY ====================
function useProgramSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}

// ==================== HOOK : UE LEVEL ====================
export function useUEDnd(
  ues: ProgramUECourses[],
  semesterIndex: number,
  onUEsChange: (newUEs: ProgramUECourses[]) => void,
): UseUEDndReturn {
  const sensors = useProgramSensors();
  const [activeUE, setActiveUE] = useState<ProgramUECourses | null>(null);

  const ueIds = ues.map(ue => makeUEId(semesterIndex, ue.programUEId));

  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      const found = ues.find(u => makeUEId(semesterIndex, u.programUEId) === id);
      setActiveUE(found ?? null);
    },
    [ues, semesterIndex],
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveUE(null);

      if (!over || active.id === over.id) return;

      const fromIdx = ues.findIndex(u => makeUEId(semesterIndex, u.programUEId) === active.id);
      const toIdx   = ues.findIndex(u => makeUEId(semesterIndex, u.programUEId) === over.id);
      if (fromIdx === -1 || toIdx === -1) return;

      const next = [...ues];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);

      // Recalcule order après le déplacement
      onUEsChange(next.map((ue, i) => ({ ...ue, order: i + 1 })));
    },
    [ues, semesterIndex, onUEsChange],
  );

  const handleCoursesChange = useCallback(
    (programUEId: string, newCourses: UeCourseDTO[]) => {
      onUEsChange(
        ues.map(ue => 
          ue.programUEId === programUEId 
            ? { 
                ...ue, 
                ue: { ...ue.ue, ueCourses: newCourses },
                ueTotalCredits: newCourses.reduce((sum, c) => sum + c.credits, 0),
                ueTotalDuration: newCourses.reduce((sum, c) => sum + c.duration, 0)
              } 
            : ue
        ),
      );
    },
    [ues, onUEsChange],
  );

  return {
    sensors,
    activeUE,
    ueIds,
    handlers: { onDragStart, onDragEnd },
    handleCoursesChange,
  };
}

// ==================== HOOK : COURSE LEVEL ====================
export function useCourseDnd(
  ue: ProgramUECourses,
  onCoursesChange: (programUEId: string, newCourses: UeCourseDTO[]) => void,
): UseCourseDndReturn {
  const sensors = useProgramSensors();
  const [activeCourse, setActiveCourse] = useState<UeCourseDTO | null>(null);

  const courses = getCourses(ue);
  const courseIds = courses.map(c => makeCourseId(ue.programUEId, c.id));

  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      const found = courses.find(c => makeCourseId(ue.programUEId, c.id) === id);
      setActiveCourse(found ?? null);
    },
    [courses, ue.programUEId],
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveCourse(null);

      if (!over || active.id === over.id) return;

      const fromIdx = courses.findIndex(c => makeCourseId(ue.programUEId, c.id) === active.id);
      const toIdx   = courses.findIndex(c => makeCourseId(ue.programUEId, c.id) === over.id);
      if (fromIdx === -1 || toIdx === -1) return;

      const next = [...courses];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);

      // Recalcule order après le déplacement
      onCoursesChange(ue.programUEId, next.map((c, i) => ({ ...c, order: i + 1 })));
    },
    [courses, ue.programUEId, onCoursesChange],
  );

  return {
    sensors,
    activeCourse,
    courseIds,
    handlers: { onDragStart, onDragEnd },
  };
}