'use client'


import { cn } from '@/lib/utils'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToParentElement } from '@dnd-kit/modifiers'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { useState } from 'react'
import { PCourse, PCourseCard } from '../direction/ui/PCourseCard'
import { SortablePCourseCard } from './SortablePCourseCard'

export interface SortableCourseGridProps {
  courses: PCourse[]
  onReorder: (courses: PCourse[]) => void
  className?: string
}

export function SortableCourseGrid({ courses, onReorder, className }: SortableCourseGridProps) {
  const [activeCourse, setActiveCourse] = useState<PCourse | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveCourse(courses.find((c) => c.id === event.active.id) ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveCourse(null)
    if (!over || active.id === over.id) return

    const oldIndex = courses.findIndex((c) => c.id === active.id)
    const newIndex = courses.findIndex((c) => c.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    onReorder(arrayMove(courses, oldIndex, newIndex))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToParentElement]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveCourse(null)}
    >
      <SortableContext items={courses.map((c) => c.id)} strategy={rectSortingStrategy}>
        <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3', className)}>
          {courses.map((course) => (
            <SortablePCourseCard key={course.id} course={course} />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeCourse && <PCourseCard course={activeCourse} isOverlay />}
      </DragOverlay>
    </DndContext>
  )
}