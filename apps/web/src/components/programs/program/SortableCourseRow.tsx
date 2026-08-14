import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { makeCourseId } from '@/hooks/data/programs/useProgramDnd';
import type { UeCourseDTO } from '@/services/ue/types';
import { getHoursFromSettings } from '@/utils/hours';
import { DropLine, OrderHandle, ActionMenu, IconTrash } from './ui';

export function SortableCourseRow({ course, ueOrder, programUEId, isEditing, onDelete, onEdit }: {
  course: UeCourseDTO; ueOrder: number | null; programUEId: string;
  isEditing?: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
}) {
  const id = makeCourseId(programUEId, course.id);
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging, isOver,
  } = useSortable({ id});

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const COL  = 'grid-cols-[24px_1fr_52px_44px_32px] sm:grid-cols-[28px_90px_1fr_72px_56px_44px]';
  const CELL = 'px-1.5 sm:px-2.5 py-0 flex items-center';

  const hoursBreakdown = (course as any).settings?.hours ? getHoursFromSettings((course as any).settings) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative grid ${COL} border-b border-dashed border-foreground/10 last:border-b-0 transition-colors
        ${isDragging ? 'opacity-30 bg-foreground/[0.02]' : ''}
        ${isEditing && isOver && !isDragging ? 'bg-blue-50/50 dark:bg-blue-950/20' : 'hover:bg-foreground/[0.015]'}
      `}
    >
      {isEditing && isOver && !isDragging && <DropLine />}

      {/* N° — handle */}
      <div className={`${CELL} py-1.5 sm:py-2 justify-center`}>
        <OrderHandle
          order={`${ueOrder || 0}.${course.order || 0}`}
          isEditing={isEditing}
          dragProps={{ ...attributes, ...listeners } as React.HTMLAttributes<HTMLDivElement>}
          title="Déplacer ce cours"
        />
      </div>

      {/* Code */}
      <div className={`hidden sm:flex ${CELL} py-2 justify-center`}>
        <span className="text-[9px] font-mono text-muted-foreground/50 truncate max-w-full">{course.code}</span>
      </div>

      {/* Name */}
      <div className={`${CELL} py-1.5 sm:py-2 pl-4 sm:pl-7`}>
        <div className="min-w-0 flex items-center flex-wrap gap-1.5">
          <span className="text-foreground/80 leading-tight">{course.name}</span>
          {hoursBreakdown && hoursBreakdown.display !== 'Non défini' && (
            <span className="text-[9px] text-muted-foreground bg-muted/70 px-1.5 py-0.5 rounded-sm border border-dashed border-foreground/15 font-mono">
              {hoursBreakdown.display}
            </span>
          )}
          <p className="sm:hidden text-[9px] font-mono text-muted-foreground/40 w-full mt-0.5">{course.code}</p>
        </div>
      </div>

      {/* Duration */}
      <div className={`${CELL} py-1.5 sm:py-2 justify-center`}>
        {course.duration > 0
          ? <span className="text-muted-foreground">{course.duration}h</span>
          : <span className="text-muted-foreground/30">—</span>
        }
      </div>

      {/* Credits */}
      <div className={`${CELL} py-1.5 sm:py-2 justify-center`}>
        <span className="text-muted-foreground">{course.credits}</span>
      </div>

      {/* Actions */}
      <div className={`${CELL} py-1.5 sm:py-2 justify-center`}>
        {isEditing && (onDelete || onEdit) ? (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <ActionMenu actions={[
              ...(onEdit ? [{ label: 'Modifier', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-full"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/></svg>, onClick: onEdit }] : []),
              ...(onDelete ? [{ label: 'Supprimer', icon: IconTrash, danger: true, onClick: onDelete }] : [])
            ]} />
          </div>
        ) : (
          <button className="size-5 sm:size-6 rounded-sm border border-dashed border-foreground/20 flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground hover:border-foreground/40 transition-colors">
            <svg className="size-2.5 sm:size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
