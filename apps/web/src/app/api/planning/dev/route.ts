import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { DayScheduleDto, ScheduleSlot } from '@attendancy/types'

function corsHeaders(req: NextRequest) {
  const origin = req.headers.get('origin') ?? 'http://localhost:1420'
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) })
}

// Route de test sans auth — dev uniquement
export async function GET(req: NextRequest) {
  const cors = corsHeaders(req)
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: cors })
  }

  const { searchParams } = req.nextUrl
  const classId = searchParams.get('classId')
  const from    = searchParams.get('from')
  const to      = searchParams.get('to')

  if (!classId || !from || !to) {
    return NextResponse.json({ error: 'classId, from et to sont requis' }, { status: 400, headers: cors })
  }

  const rangeStart = new Date(from)
  const rangeEnd   = new Date(to)

  if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
    return NextResponse.json({ error: 'Dates invalides' }, { status: 400, headers: cors })
  }

  try {
    const schedules = await prisma.schedule.findMany({
      where: {
        classId,
        deletedAt: null,
        startTime: { gte: rangeStart, lte: rangeEnd },
      },
      include: {
        course:  { select: { id: true, name: true } },
        room:    { select: { id: true, name: true } },
        class:   { select: { id: true, name: true } },
        teacher: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    })

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
        date,
      })
    }

    const data: DayScheduleDto[] = Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, slots]) => ({ date, dayOfWeek: slots[0].dayOfWeek, slots }))

    return NextResponse.json({ data }, { headers: cors })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur serveur' },
      { status: 500, headers: cors },
    )
  }
}
