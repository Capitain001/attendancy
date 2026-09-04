'use client'

import { PCourse, PCourseCard } from '../direction/ui/PCourseCard'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { memo } from 'react'

export interface SortablePCourseCardProps {
  course: PCourse
  className?: string
}

export const SortablePCourseCard = memo(function SortablePCourseCard({ course, className }: SortablePCourseCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: course.id,
  })

  return (
    <PCourseCard
      course={course}
      className={className}
      dragRef={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      dragHandleProps={{ ...attributes, ...listeners }}
      isDragging={isDragging}
    />
  )
})