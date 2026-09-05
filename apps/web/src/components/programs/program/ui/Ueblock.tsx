//src/components/programs/program/ui/Ueblock.tsx
"use client";

/**
 *
 * ActionMenu contextuel
 * quand useEditHandlers() retourne des handlers (mode Direction).
 *
 * En mode lecture (ProgramPage), useEditHandlers() retourne null
 * → le bouton ⋯ original s'affiche, aucune action disponible.
 *
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { ProgramUECourses, UeCourseDTO } from '@/services/ue/types';
import { getCourses } from '@/services/ue/utils';
import { useCourseDnd, makeUEId } from '@/hooks/data/programs/useProgramDnd';
import { useEditHandlers } from './Editcontext';

import { DropLine, OrderHandle, CourseGhost } from '../ui';
import { SortableCourseRow } from '../SortableCourseRow';
import { ActionMenu, IconPlus, IconUnlink } from './Actionmenu';

export function UEBlock({ ue, semesterIndex, isDragging, onCoursesChange, isEditing, showType = true }: {
  ue: ProgramUECourses;
  semesterIndex: number;
  isDragging: boolean;
  onCoursesChange: (programUEId: string, courses: UeCourseDTO[]) => void;
  isEditing?: boolean;
  showType?: boolean;
}) {
  const ueId = makeUEId(semesterIndex, ue.programUEId);
  const [expanded, setExpanded] = useState(true);

  // ── Cours DnD ──
  // `enabled` = !!isEditing : le hook gère lui-même sensors=[] quand désactivé
  const {
    sensors: courseSensors,
    activeCourse,
    courseIds,
    handlers: courseHandlers,
  } = useCourseDnd(ue, onCoursesChange, !!isEditing);

  // ── UE Sortable ──
  // `disabled: !isEditing` désactive proprement le handle (aria + cursor)
  // en cohérence avec les sensors vides côté DndContext parent
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging: isSelfDragging, isOver,
  } = useSortable({ id: ueId, disabled: !isEditing });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // ── Edit context (null en mode lecture) ──
  const edit = useEditHandlers();

  const COL = showType
    ? 'grid-cols-[24px_1fr_40px_52px_44px_32px] sm:grid-cols-[28px_90px_1fr_85px_72px_56px_44px]'
    : 'grid-cols-[24px_1fr_52px_44px_32px] sm:grid-cols-[28px_90px_1fr_72px_56px_44px]';
  const CELL = 'px-1.5 sm:px-2.5 py-0 flex items-center';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative transition-opacity ${isSelfDragging || isDragging ? 'opacity-30' : 'opacity-100'}`}
    >
      {isOver && !(isSelfDragging || isDragging) && <DropLine />}

      {/* UE header */}
      <div className={`grid ${COL} border-b border-dashed border-foreground/15 bg-foreground/[0.025]
        ${isOver && !(isSelfDragging || isDragging) ? 'bg-blue-50/40 dark:bg-blue-950/20' : 'hover:bg-foreground/[0.04]'}
        transition-colors`}
      >
        {/* N° — handle */}
        <div className={`${CELL} py-2 sm:py-2.5 justify-center`}>
          <OrderHandle
            order={ue.order ?? 0}
            dragProps={{ ...attributes, ...listeners } as React.HTMLAttributes<HTMLDivElement>}
            title="Déplacer cette UE"
          />
        </div>

        <div className={`hidden sm:flex ${CELL} py-2.5 justify-center`}>
          <span className="text-[9px] font-mono text-muted-foreground/70 border border-dashed border-foreground/20 px-1.5 py-0.5 rounded-sm truncate max-w-full">
            {ue.ue.code}
          </span>
        </div>

        {/* Name — toggle expand */}
        <button onClick={() => setExpanded(v => !v)} className={`${CELL} py-2 sm:py-2.5 gap-1.5 text-left`}>
          <svg className={`size-2.5 sm:size-3 text-muted-foreground/40 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="min-w-0">
            <span className="font-medium text-foreground">{ue.ue.name}</span>
            <span className="text-[9px] text-muted-foreground/50 ml-1">({getCourses(ue).length})</span>
            <p className="sm:hidden text-[9px] font-mono text-muted-foreground/50 mt-0.5">{ue.ue.code}</p>
          </div>
        </button>

        {/* Type */}
        {showType && (
          <div className={`${CELL} py-2.5`}>
            {/* Mobile (4 letters uppercase) */}
            <span className="sm:hidden text-[9px] font-medium text-muted-foreground/70 uppercase">
              {ue.ue.type?.substring(0, 4) ?? '—'}
            </span>
            {/* Desktop (full capitalized) */}
            <span className="hidden sm:inline text-[10px] font-medium text-muted-foreground/70 truncate max-w-full capitalize">
              {ue.ue.type?.toLowerCase() ?? '—'}
            </span>
          </div>
        )}

        {/* Duration */}
        <div className={`${CELL} py-2 sm:py-2.5 justify-center`}>
          <span className="font-medium">{ue.ueTotalDuration}h</span>
        </div>

        {/* Credits */}
        <div className={`${CELL} py-2 sm:py-2.5 justify-center`}>
          <span className="font-medium">{ue.ueTotalCredits}</span>
        </div>

        {/* Actions */}
        <div className={`${CELL} py-2 sm:py-2.5 justify-center ${edit ? '' : 'hidden'}`}>
          {edit ? (
            // Mode édition — menu contextuel
            <ActionMenu items={[
              {
                label: 'Ajouter un cours',
                icon: IconPlus,
                onClick: () => edit.onAddCourse(ue),
              },
              {
                label: 'Délier cette UE',
                icon: IconUnlink,
                onClick: () => edit.onDetachUE(ue),
                variant: 'danger',
              },
            ]} />
          ) : (
            // Mode lecture — bouton inerte
            <button className="size-5 sm:size-6 rounded-sm border border-dashed border-foreground/20 flex items-center justify-center text-muted-foreground/40 cursor-default" disabled>
              <svg className="size-2.5 sm:size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Courses */}
      <AnimatePresence initial={false}>
        {expanded && (
          // <motion.div
          //   initial={{ height: 0 }} animate={{ height: 'auto' }}
          //   exit={{ height: 0 }} transition={{ duration: 0.2, ease: 'easeInOut' }}
          //   className="overflow-hidden"
          // >
            <DndContext
              sensors={courseSensors}
              collisionDetection={closestCenter}
              onDragStart={courseHandlers.onDragStart}
              onDragEnd={courseHandlers.onDragEnd}
            >
              <SortableContext items={courseIds} strategy={verticalListSortingStrategy}>
                {getCourses(ue).map(course => (
                  <SortableCourseRow
                    key={course.id}
                    course={course}
                    ueOrder={ue.order}
                    programUEId={ue.programUEId}
                  // parentUE={ue}
                    showType={showType}
                  />
                ))}
              </SortableContext>

              {/* <DragOverlay dropAnimation={null}>
                {activeCourse && <CourseGhost course={activeCourse} />}
              </DragOverlay> */}
            </DndContext>
          // </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
