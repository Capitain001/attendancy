import { type NextRequest, NextResponse } from 'next/server'
import { authAccess } from '@/services/auth'
import { getSchedules } from '@/services/schedule/database'
import type { DayScheduleDto, ScheduleSlot } from '@attendancy/types'

export async function GET(req: NextRequest) {
  const auth = await authAccess()
  if (!auth.data) return NextResponse.json({ error: auth.error }, { status: 401 })
  const { orgId } = auth.data

  const { searchParams } = req.nextUrl
  const classId = searchParams.get('classId')
  const from    = searchParams.get('from')
  const to      = searchParams.get('to')

  if (!classId || !from || !to) {
    return NextResponse.json({ error: 'classId, from et to sont requis' }, { status: 400 })
  }

  const rangeStart = new Date(from)
  const rangeEnd   = new Date(to)

  if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
    return NextResponse.json({ error: 'Dates invalides' }, { status: 400 })
  }

  try {
    const schedules = await getSchedules({ orgId, classId, rangeStart, rangeEnd })

    // Grouper par jour
    const byDay = new Map<string, ScheduleSlot[]>()
    for (const s of schedules) {
      const date = s.startTime.toISOString().slice(0, 10)
      if (!byDay.has(date)) byDay.set(date, [])
      byDay.get(date)!.push({
        id:          s.id,
        courseId:    s.course.id,
        courseName:  s.course.name,
        teacherId:   s.teacher?.id ?? null,
        teacherName: s.teacher
          ? `${s.teacher.user.firstName} ${s.teacher.user.lastName}`
          : null,
        roomId:    s.room?.id ?? null,
        roomName:  s.room?.name ?? null,
        classId:   s.classId,
        className: s.class.name,
        startTime: s.startTime.toISOString().slice(11, 16),
        endTime:   s.endTime.toISOString().slice(11, 16),
        dayOfWeek: s.startTime.getDay(),
        date:      date,
      })
    }

    const data: DayScheduleDto[] = Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, slots]) => ({
        date,
        dayOfWeek: slots[0].dayOfWeek,
        slots,
      }))

    return NextResponse.json({ data })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur serveur' },
      { status: 500 },
    )
  }
}
