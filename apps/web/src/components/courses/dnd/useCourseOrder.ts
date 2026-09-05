'use client'

import { PCourse } from '../direction/ui/PCourseCard'
import { useState } from 'react'

export function useCourseOrder(initialCourses: PCourse[]) {
  const [courses, setCourses] = useState(initialCourses)
  return { courses, reorder: setCourses }
}
