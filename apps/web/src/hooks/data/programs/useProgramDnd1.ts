"use client";

import { useState, useCallback } from "react";
import type { ProgramTable, ProgramSemesterDTO } from "@/services/ue/types";
import type { DragEndEvent } from "@dnd-kit/core";

export type DraggedUE = {
  type: "ue";
  programUEId: string;
  ueId: string;
  fromSemester: number;
  fromIndex: number;
};

export type DraggedCourse = {
  type: "course";
  ueCourseId: string;
  ueId: string;
  fromSemester: number;
  fromUeIndex: number;
  fromCourseIndex: number;
};

export type DraggedItem = DraggedUE | DraggedCourse;

export type DropTargetUE = {
  type: "ue";
  semester: number;
  index: number;
};

export type DropTargetCourse = {
  type: "course";
  ueId: string;
  semester: number;
  ueIndexInSemester: number;
  courseIndex: number;
};

export type DropTarget = DropTargetUE | DropTargetCourse;

// Types pour les rows du tableau (utilisés par dnd-kit)
export type UERow = {
  type: 'ue';
  id: string;
  programUEId: string;
  ueId: string;
  ueIndex: number;
  ueOrder: number | null;
  ueName: string;
  ueCode: string | null;
  ueTotalDuration: number;
  ueTotalCredits: number;
};

export type CourseRow = {
  type: 'course';
  id: string;
  ueId: string;
  ueIndex: number;
  courseIndex: number;
  ueOrder: number | null;
  order: number | null;
  code: string | null;
  name: string;
  duration: number;
  credits: number;
};

export type TableRow = UERow | CourseRow;

const DATA_TRANSFER_KEY = "application/x-program-dnd";

function parseDragData(data: string): DraggedItem | null {
  try {
    return JSON.parse(data) as DraggedItem;
  } catch {
    return null;
  }
}

export type OnProgramChange = (
  updater: (prev: ProgramTable) => ProgramTable
) => void;

export function useProgramDnd(
  program: ProgramTable,
  onProgramChange: OnProgramChange
) {
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);

  const applyUEMove = useCallback(
    (payload: DraggedUE, target: DropTargetUE) => {
      onProgramChange((prev) => {
        const next = prev.map((b) => ({ ...b, ues: [...b.ues] }));
        const fromBlock = next.find((b) => b.semester === payload.fromSemester);
        const toBlock = next.find((b) => b.semester === target.semester);
        if (!fromBlock) return prev;

        const fromIdx = fromBlock.ues.findIndex((u) => u.programUEId === payload.programUEId);
        if (fromIdx === -1) return prev;

        // Vérifier si le déplacement est nécessaire
        if (payload.fromSemester === target.semester && fromIdx === target.index) {
          return prev; // Pas de déplacement nécessaire
        }

        const [moved] = fromBlock.ues.splice(fromIdx, 1);

        if (toBlock) {
          // Calculer l'index d'insertion correct
          let insertIdx = target.index;
          
          // Si on déplace dans le même bloc, ajuster l'index car l'élément source a été retiré
          if (payload.fromSemester === target.semester) {
            // Si on déplace vers le bas (fromIdx < target.index), l'index de destination doit être réduit de 1
            // car l'élément source a été retiré avant l'insertion
            if (fromIdx < target.index) {
              insertIdx = target.index - 1;
            }
            // Si on déplace vers le haut (fromIdx > target.index), l'index reste le même
          }
          
          // S'assurer que l'index est dans les limites valides
          insertIdx = Math.min(Math.max(0, insertIdx), toBlock.ues.length);
          toBlock.ues.splice(insertIdx, 0, moved);
          
          // Recalculer les ordres de toutes les UEs dans le bloc de destination
          toBlock.ues.forEach((ue, idx) => {
            ue.order = idx + 1;
            ue.semester = target.semester;
          });
        } else {
          // Créer un nouveau bloc si nécessaire
          const movedWithSemester = {
            ...moved,
            semester: target.semester,
            order: 1,
          };
          next.push({
            semester: target.semester,
            totalCredits: 0,
            totalDuration: 0,
            ues: [movedWithSemester],
          });
        }

        // Recalculer les ordres dans le bloc source si ce n'est pas le même bloc
        if (payload.fromSemester !== target.semester) {
          fromBlock.ues.forEach((ue, idx) => {
            ue.order = idx + 1;
          });
        }

        const recalcTotals = (block: ProgramSemesterDTO) => {
          let totalCredits = 0;
          let totalDuration = 0;
          block.ues.forEach((ueItem) => {
            ueItem.ue.ueCourses.forEach((c) => {
              totalCredits += c.credits;
              totalDuration += c.duration;
            });
          });
          return { ...block, totalCredits, totalDuration };
        };

        return next.map(recalcTotals).sort((a, b) => a.semester - b.semester);
      });
    },
    [onProgramChange]
  );

  const applyCourseReorder = useCallback(
    (payload: DraggedCourse, target: DropTargetCourse) => {
      if (payload.ueId !== target.ueId) return;
      if (payload.fromSemester === target.semester && payload.fromUeIndex === target.ueIndexInSemester && payload.fromCourseIndex === target.courseIndex) return;

      onProgramChange((prev) => {
        return prev.map((block) => {
          if (block.semester !== target.semester) return block;
          const ueIdx = block.ues.findIndex((u) => u.ue.id === target.ueId);
          if (ueIdx === -1) return block;

          const ueItem = block.ues[ueIdx];
          const courses = [...ueItem.ue.ueCourses];
          const fromIdx = courses.findIndex((c) => c.id === payload.ueCourseId);
          if (fromIdx === -1) return block;

          const [moved] = courses.splice(fromIdx, 1);
          const toIdx = Math.min(target.courseIndex, courses.length);
          courses.splice(toIdx, 0, moved);

          const ueCoursesWithOrder = courses.map((c, i) => ({ ...c, order: i + 1 }));
          const newUes = [...block.ues];
          newUes[ueIdx] = {
            ...ueItem,
            ue: { ...ueItem.ue, ueCourses: ueCoursesWithOrder },
          };

          let totalCredits = 0;
          let totalDuration = 0;
          newUes.forEach((u) => {
            u.ue.ueCourses.forEach((c) => {
              totalCredits += c.credits;
              totalDuration += c.duration;
            });
          });

          return { ...block, ues: newUes, totalCredits, totalDuration };
        });
      });
    },
    [onProgramChange]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDropUE = useCallback(
    (e: React.DragEvent, target: DropTargetUE) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData(DATA_TRANSFER_KEY);
      const payload = parseDragData(raw);
      if (payload?.type === "ue") {
        applyUEMove(payload, target);
      }
      setDraggedItem(null);
    },
    [applyUEMove]
  );

  const handleDropCourse = useCallback(
    (e: React.DragEvent, target: DropTargetCourse) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData(DATA_TRANSFER_KEY);
      const payload = parseDragData(raw);
      if (payload?.type === "course") {
        applyCourseReorder(payload, target);
      }
      setDraggedItem(null);
    },
    [applyCourseReorder]
  );

  const setDragData = useCallback((e: React.DragEvent, item: DraggedItem) => {
    e.dataTransfer.setData(DATA_TRANSFER_KEY, JSON.stringify(item));
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const onDragStartUE = useCallback(
    (e: React.DragEvent, programUEId: string, ueId: string, semester: number, index: number) => {
      const item: DraggedUE = { type: "ue", programUEId, ueId, fromSemester: semester, fromIndex: index };
      setDraggedItem(item);
      setDragData(e, item);
    },
    [setDragData]
  );

  const onDragStartCourse = useCallback(
    (
      e: React.DragEvent,
      ueCourseId: string,
      ueId: string,
      semester: number,
      ueIndexInSemester: number,
      courseIndex: number
    ) => {
      const item: DraggedCourse = {
        type: "course",
        ueCourseId,
        ueId,
        fromSemester: semester,
        fromUeIndex: ueIndexInSemester,
        fromCourseIndex: courseIndex,
      };
      setDraggedItem(item);
      setDragData(e, item);
    },
    [setDragData]
  );

  // Gère les événements de drag and drop de dnd-kit
  const handleDndKitDragEnd = useCallback(
    (event: DragEndEvent, rows: TableRow[], semester: number) => {
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      const from = rows.find((r) => r.id === active.id);
      const to = rows.find((r) => r.id === over.id);

      if (!from || !to) return;

      // Ne permettre le drop d'une UE que sur une autre UE
      if (from.type === 'ue' && to.type === 'ue') {
        // Calculer l'index de destination en fonction de la direction du déplacement
        // Si on déplace vers le bas (from.ueIndex < to.ueIndex), insérer après (to.ueIndex + 1)
        // Si on déplace vers le haut (from.ueIndex > to.ueIndex), insérer avant (to.ueIndex)
        let targetIndex: number;
        if (from.ueIndex < to.ueIndex) {
          // Déplacement vers le bas : insérer après l'UE cible
          targetIndex = to.ueIndex + 1;
        } else {
          // Déplacement vers le haut : insérer avant l'UE cible (à sa position)
          targetIndex = to.ueIndex;
        }

        const payload: DraggedUE = {
          type: 'ue',
          programUEId: from.programUEId,
          ueId: from.ueId,
          fromSemester: semester,
          fromIndex: from.ueIndex,
        };

        applyUEMove(payload, {
          type: 'ue',
          semester,
          index: targetIndex,
        });
        setDraggedItem(null);
        return;
      }

      // Ne permettre le drop d'un cours que sur un autre cours de la même UE
      if (
        from.type === 'course' &&
        to.type === 'course' &&
        from.ueId === to.ueId
      ) {
        const payload: DraggedCourse = {
          type: 'course',
          ueCourseId: from.id,
          ueId: from.ueId,
          fromSemester: semester,
          fromUeIndex: from.ueIndex,
          fromCourseIndex: from.courseIndex,
        };

        applyCourseReorder(payload, {
          type: 'course',
          ueId: to.ueId,
          semester,
          ueIndexInSemester: to.ueIndex,
          courseIndex: to.courseIndex,
        });
        setDraggedItem(null);
      }
    },
    [applyUEMove, applyCourseReorder]
  );

  return {
    draggedItem,
    onDragStartUE,
    onDragStartCourse,
    handleDragEnd,
    handleDragOver,
    handleDropUE,
    handleDropCourse,
    handleDndKitDragEnd,
  };
}
