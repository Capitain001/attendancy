'use client';

import type { CSSProperties } from 'react';
import { useState } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2 } from "lucide-react";

import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';

import { CSS } from '@dnd-kit/utilities';

import { CreateUECourseDialog } from "./create-uecourse-dialog";
import type { ProgramUECourses } from "@/services/ue/types";
import type { CreateUECourseInput } from "@/services/ue/validation";
import type { useProgramDnd, TableRow as DndTableRow, UERow, CourseRow } from "@/hooks/data/programs/useProgramDnd1";

interface SemesterTableProps {
  semester: number;
  ues: ProgramUECourses[];
  onCreateCourse: (data: CreateUECourseInput) => Promise<{ success: boolean; error?: string }>;
  onRemoveCourse: (ueCourseId: string) => Promise<{ success: boolean; error?: string }>;
  dnd: ReturnType<typeof useProgramDnd>;
  isEditing?: boolean;
}

function buildRows(ues: ProgramUECourses[]) {
  let totalDuration = 0;
  let totalCredits = 0;

  const rows: DndTableRow[] = ues.flatMap((ueItem, ueIndex) => {
    const courses = ueItem.ue.ueCourses;

    const ueTotalDuration = courses.reduce((s, c) => s + c.duration, 0);
    const ueTotalCredits = courses.reduce((s, c) => s + c.credits, 0);

    totalDuration += ueTotalDuration;
    totalCredits += ueTotalCredits;

    const ueRow: UERow = {
      type: 'ue' as const,
      id: `ue-${ueItem.ue.id}`,
      programUEId: ueItem.programUEId,
      ueId: ueItem.ue.id,
      ueIndex,
      ueOrder: ueItem.order,
      ueName: ueItem.ue.name,
      ueCode: ueItem.ue.code,
      ueTotalDuration,
      ueTotalCredits,
    };

    const courseRows: CourseRow[] = courses.map((course, courseIndex) => ({
      type: 'course' as const,
      id: course.id,
      ueId: ueItem.ue.id,
      ueIndex,
      courseIndex,
      ueOrder: ueItem.order,
      order: course.order,
      code: course.code,
      name: course.name,
      duration: course.duration,
      credits: course.credits,
    }));

    return [ueRow, ...courseRows];
  });

  return { rows, totalDuration, totalCredits };
}

interface OrderCellProps {
  label: string | number | null;
  bg: string;
  attributes: ReturnType<typeof useSortable>['attributes'];
  listeners: ReturnType<typeof useSortable>['listeners'];
  isEditing?: boolean;
}

function OrderCell({ label, bg, attributes, listeners, isEditing }: OrderCellProps) {
  return (
    <TableCell className="w-12 relative select-none">
      <span className={isEditing ? "group-hover:opacity-0 transition-opacity" : ""}>{label}</span>

      {isEditing && (
        <button
          className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-60 transition-opacity cursor-grab active:cursor-grabbing touch-none ${bg}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
    </TableCell>
  );
}

interface SortableRowProps {
  row: DndTableRow;
  onCreateCourse: (data: CreateUECourseInput) => Promise<{ success: boolean; error?: string }>;
  onRemoveCourse: (ueCourseId: string) => Promise<{ success: boolean; error?: string }>;
  isEditing?: boolean;
}

function SortableRow({ row, onCreateCourse, onRemoveCourse, isEditing }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id, disabled: !isEditing });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  if (row.type === 'ue') {
    return (
      <TableRow
        ref={setNodeRef}
        style={style}
        className="bg-white dark:bg-neutral-950 border-t-2 border-neutral-300 dark:border-neutral-700 font-bold group"
      >
        <OrderCell
          label={row.ueOrder}
          bg="bg-white dark:bg-neutral-950"
          attributes={attributes}
          listeners={listeners}
          isEditing={isEditing}
        />

        <TableCell>{row.ueCode}</TableCell>
        <TableCell>{row.ueName}</TableCell>
        <TableCell className="text-right">{row.ueTotalDuration}</TableCell>
        <TableCell className="text-right">{row.ueTotalCredits}</TableCell>

        <TableCell className="text-right">
          {isEditing && (
            <CreateUECourseDialog
              ueId={row.ueId}
              ueName={row.ueName}
              onCreateCourse={onCreateCourse}
            />
          )}
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className="bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 group"
    >
      <OrderCell
        label={`${row.ueOrder}.${row.order}`}
        bg="bg-neutral-50 dark:bg-neutral-900"
        attributes={attributes}
        listeners={listeners}
        isEditing={isEditing}
      />

      <TableCell>{row.code}</TableCell>
      <TableCell>{row.name}</TableCell>
      <TableCell className="text-right">{row.duration}</TableCell>
      <TableCell className="text-right">{row.credits}</TableCell>

      <TableCell className="text-right">
        {isEditing && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemoveCourse(row.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

export function SemesterTable({
  semester,
  ues,
  onCreateCourse,
  onRemoveCourse,
  dnd,
  isEditing = false,
}: SemesterTableProps) {
  const { handleDndKitDragEnd } = dnd;

  const { rows, totalDuration, totalCredits } = buildRows(ues);

  const [activeRow, setActiveRow] = useState<DndTableRow | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  );

  function onDragStart(event: DragStartEvent) {
    setActiveRow(rows.find((r) => r.id === event.active.id) ?? null);
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveRow(null);
    handleDndKitDragEnd(event, rows, semester);
  }

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      <DndContext
        sensors={isEditing ? sensors : []}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">N°</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Intitulé</TableHead>
                <TableHead className="text-right">Volume horaire</TableHead>
                <TableHead className="text-right">Crédits</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((row) => (
                <SortableRow
                  key={row.id}
                  row={row}
                  onCreateCourse={onCreateCourse}
                  onRemoveCourse={onRemoveCourse}
                  isEditing={isEditing}
                />
              ))}

              <TableRow className="bg-neutral-100 dark:bg-neutral-800 font-bold">
                <TableCell colSpan={3}>
                  TOTAL SEMESTRE {semester}
                </TableCell>

                <TableCell className="text-right">
                  {totalDuration}
                </TableCell>

                <TableCell className="text-right">
                  {totalCredits}
                </TableCell>

                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activeRow && (
            <table className="w-full border-collapse table-fixed">
              <tbody>
                <SortableRow
                  row={activeRow}
                  onCreateCourse={onCreateCourse}
                  onRemoveCourse={onRemoveCourse}
                />
              </tbody>
            </table>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}