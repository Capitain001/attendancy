// src/services/course-teacher/cache.ts
//
// Les affectations sont lues sous le tag COURSE_TEACHER (scopé par courseId),
// mais le DÉTAIL cours (service course) embarque les enseignants dans son
// `select` → toute mutation invalide AUSSI les tags COURSE (cross-service).
import { CACHE } from '@/cache/server/key'

const tags = (orgId: string, courseId: string, classId: string) => [
  CACHE.COURSE_TEACHER(orgId, courseId),
  CACHE.COURSE(orgId),
  CACHE.COURSE(orgId, classId),
]

export const COURSE_TEACHER_GRAPH = {
  COURSE_TEACHER_CREATED: tags,
  COURSE_TEACHER_UPDATED: tags,
  COURSE_TEACHER_DELETED: tags,
} as const
