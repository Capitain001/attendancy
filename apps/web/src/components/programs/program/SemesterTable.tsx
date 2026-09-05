//src/components/programs/program/SemesterTable.tsx
import React from 'react';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import type { ProgramUECourses, UeCourseDTO } from '@/services/ue/types';
import { useUEDnd } from '@/hooks/data/programs/useProgramDnd';

import { UEGhost } from './ui';
import { UEBlock } from './ui/Ueblock';

export interface SemesterTableProps {
  ues: ProgramUECourses[];
  semesterTotalDuration: number;
  semesterTotalCredits: number;
  semesterIndex: number;
  onUEsChange: (ues: ProgramUECourses[]) => void;
  isEditing?: boolean;
  onAddUE?: (semester: number) => void;
  onUnlinkUE?: (programUEId: string) => void;
  onAddCourse?: (ueId: string) => void;
  onDeleteCourse?: (courseId: string) => void;
  onEditUE?: (ue: ProgramUECourses) => void;
  onEditCourse?: (course: UeCourseDTO, ueId: string) => void;
  showType?: boolean;
}

export function SemesterTable({
  ues, semesterTotalDuration, semesterTotalCredits, semesterIndex, onUEsChange,
  isEditing, onAddUE, onUnlinkUE, onAddCourse, onDeleteCourse, onEditUE, onEditCourse, showType = true
}: SemesterTableProps) {

  // ── UE DnD — via hook ──
  // `enabled` = !!isEditing : le hook gère lui-même sensors=[] quand désactivé
  const {
    sensors,
    activeUE,
    ueIds,
    handlers: ueHandlers,
    handleCoursesChange,
  } = useUEDnd(ues, semesterIndex, onUEsChange, !!isEditing);

  const COL = showType
    ? 'grid-cols-[24px_1fr_40px_52px_44px_32px] sm:grid-cols-[28px_90px_1fr_85px_72px_56px_44px]'
    : 'grid-cols-[24px_1fr_52px_44px_32px] sm:grid-cols-[28px_90px_1fr_72px_56px_44px]';
  const CELL = 'px-1.5 sm:px-2.5 py-0 flex items-center';

  return (
    <div className="border border-dashed border-foreground/25 overflow-hidden text-[11px] sm:text-[12px]">

      {/* Header */}
      <div className={`grid ${COL} border-b  border-dashed border-foreground/20 bg-foreground/5`}>
        <div className={`${CELL} py-2 text-[9px] sm:text-[10px] font-medium uppercase tracking-widest text-muted-foreground justify-center`}>N°</div>
        <div className={`hidden sm:flex ${CELL} py-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground justify-center`}>Code</div>
        <div className={`${CELL} py-2 ml-4 text-[9px] sm:text-[10px] font-medium uppercase tracking-widest text-muted-foreground`}>Intitulé</div>
        {showType && <div className={`${CELL} py-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground`}>Type</div>}
        <div className={`${CELL} py-2 text-[9px] sm:text-[10px] font-medium uppercase tracking-widest text-muted-foreground justify-center`}>
          <span className="hidden sm:inline">Vol. horaire</span><span className="sm:hidden">VH</span>
        </div>
        <div className={`${CELL} py-2 text-[9px] sm:text-[10px] font-medium uppercase tracking-widest text-muted-foreground justify-center`}>
          <span className="hidden sm:inline">Crédits</span><span className="sm:hidden">Cr.</span>
        </div>
        <div />
      </div>

      {/* UE rows — outer DnD context */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={ueHandlers.onDragStart}
        onDragEnd={ueHandlers.onDragEnd}
      >
        <SortableContext items={ueIds} strategy={verticalListSortingStrategy}>
          {ues.map(ue => (
            <UEBlock
              key={ue.programUEId}
              ue={ue}
              semesterIndex={semesterIndex}
              isDragging={activeUE?.programUEId === ue.programUEId}
              onCoursesChange={handleCoursesChange}
              isEditing={isEditing}
              showType={showType}
            />
          ))}
        </SortableContext>

        {/* Ghost UE floating overlay */}
        <DragOverlay dropAnimation={null}>
          {activeUE && <UEGhost ue={activeUE} />}
        </DragOverlay>
      </DndContext>

      {/* Add UE button */}
      {isEditing && onAddUE && (
        <button
          onClick={() => onAddUE(ues[0]?.semester ?? semesterIndex + 1)}
          className="w-full h-8 flex items-center justify-center gap-2 text-[11px] font-medium text-muted-foreground hover:bg-foreground/[0.03] transition-colors border-t border-dashed border-foreground/15"
        >
          <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Ajouter une UE au semestre
        </button>
      )}

      {/* Total row */}
      <div className={`grid ${COL} border-t border-dashed border-foreground/25 bg-foreground/[0.03]`}>
        <div className={`${CELL} py-2 sm:py-2.5`} />
        <div className="hidden sm:block" />
        <div className={`${CELL} py-2 sm:py-2.5`}>
          <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Total semestre</span>
        </div>
        {showType && <div className="" />}
        <div className={`${CELL} py-2 sm:py-2.5 justify-center`}>
          <span className="font-medium text-[12px] sm:text-[13px]">{semesterTotalDuration}h</span>
        </div>
        <div className={`${CELL} py-2 sm:py-2.5 justify-center`}>
          <span className="font-medium text-[12px] sm:text-[13px]">{semesterTotalCredits}</span>
        </div>
        <div />
      </div>
    </div>
  );
}