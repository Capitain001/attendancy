import type { getTeacherStats } from './database'

export type TeacherStats = Awaited<ReturnType<typeof getTeacherStats>>
