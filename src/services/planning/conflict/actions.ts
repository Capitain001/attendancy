'use server'
import { getUserInfo } from '@/services/user/userInfo'
import { ERRORS } from '@/config'

export interface CheckAvailabilityActionParams {
  start: Date
  end: Date
  rooms?: { id: string }[]
  teachers?: { id: string }[]
  classes?: { id: string }[]
  groups?: { id: string }[]
  excludeScheduleId?: string
}

export interface AvailabilityCheckResult {
  rooms: { id: string; available: boolean }[]
  teachers: { id: string; available: boolean }[]
  classes: { id: string; available: boolean }[]
  groups: { id: string; available: boolean }[]
}

export async function checkAvailabilityAction(
  _params: CheckAvailabilityActionParams
): Promise<{ data: AvailabilityCheckResult } | { error: string }> {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    return {
      data: {
        rooms: (_params.rooms ?? []).map((r) => ({ ...r, available: true })),
        teachers: (_params.teachers ?? []).map((t) => ({ ...t, available: true })),
        classes: (_params.classes ?? []).map((c) => ({ ...c, available: true })),
        groups: (_params.groups ?? []).map((g) => ({ ...g, available: true })),
      },
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export interface ConflictCheckInput {
  date: string
  startTime: string
  endTime: string
  teacherId?: string
  roomId?: string
  classId?: string
  groupId?: string
  excludeScheduleId?: string
}

export interface ConflictResult {
  hasConflict: boolean
  conflicts: Array<{
    type: 'teacher' | 'room' | 'class' | 'group'
    scheduleId: string
    description: string
  }>
}

export async function checkConflictsAction(
  _input: ConflictCheckInput
): Promise<{ data: ConflictResult } | { error: string }> {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    return { data: { hasConflict: false, conflicts: [] } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getAvailableTeachersAction(_input: ConflictCheckInput): Promise<{ data: string[] } | { error: string }> {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    return { data: [] }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getAvailableRoomsAction(_input: ConflictCheckInput): Promise<{ data: string[] } | { error: string }> {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    return { data: [] }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export interface FilterAvailabilityInput {
  start: Date
  end: Date
  excludeScheduleId?: string
  rooms: Array<{ id: string; name: string }>
  courses: Array<{ id: string; name: string }>
  teachers: Array<{ id: string }>
}

export interface FilterAvailabilityResult {
  availableRooms: Array<{ id: string; name: string; available: boolean }>
  availableCourses: Array<{ id: string; name: string; available: boolean }>
  availableTeachers: Array<{ id: string; available: boolean }>
}

export async function filterAvailabilityAction(
  _input: FilterAvailabilityInput
): Promise<{ data: FilterAvailabilityResult } | { error: string }> {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    return {
      data: {
        availableRooms: _input.rooms.map((r) => ({ ...r, available: true })),
        availableCourses: _input.courses.map((c) => ({ ...c, available: true })),
        availableTeachers: _input.teachers.map((t) => ({ ...t, available: true })),
      },
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
