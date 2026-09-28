// src/app/api/planning/route.ts
import { type NextRequest, NextResponse } from 'next/server'
import { authAccess } from '@/services/auth'
import { extractBearerToken, verifyBearerToken } from '@/utils/supabase/api'
import { getSchedules } from '@/services/schedule/database'
import { prisma } from '@/lib/prisma'
import type { DayScheduleDto, ScheduleSlot } from '@attendancy/types'

function corsHeaders(req: NextRequest) {
  const origin = req.headers.get('origin') ?? '*'
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) })
}

async function resolveOrgId(req: NextRequest): Promise<string | null> {
  // Tauri : Bearer token
  const token = extractBearerToken(req)
  if (token) {
    const user = await verifyBearerToken(token)
    const meta = (user?.user_metadata ?? {}) as { organization?: { id?: string } }
    return meta.organization?.id ?? null
  }

  // Web : cookie SSR
  const auth = await authAccess()
  if ('error' in auth || !auth.data) return null
  return auth.data.orgId
}

async function resolveBearerUser(req: NextRequest) {
  const token = extractBearerToken(req)
  if (!token) return null
  return verifyBearerToken(token)
}

export async function GET(req: NextRequest) {
  const cors = corsHeaders(req)

  const orgId = await resolveOrgId(req)
  if (!orgId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401, headers: cors })
  }

  const { searchParams } = req.nextUrl
  const scope   = searchParams.get('scope') ?? 'class'
  const classId = searchParams.get('classId')
  const from    = searchParams.get('from')
  const to      = searchParams.get('to')

  if (!from || !to) {
    return NextResponse.json({ error: 'from et to sont requis' }, { status: 400, headers: cors })
  }
  if (scope === 'class' && !classId) {
    return NextResponse.json({ error: 'classId est requis' }, { status: 400, headers: cors })
  }

  const rangeStart = new Date(from)
  const rangeEnd   = new Date(to)

  if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
    return NextResponse.json({ error: 'Dates invalides' }, { status: 400, headers: cors })
  }

  try {
    let schedules
    if (scope === 'teacher') {
      // teacherId résolu depuis le token UNIQUEMENT — jamais du query
      const user = await resolveBearerUser(req)
      const meta = (user?.user_metadata ?? {}) as { organization?: { id?: string }; role?: string }
      if (!user || !orgId || meta.role !== 'TEACHER') {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401, headers: cors })
      }
      const teacher = await prisma.teacher.findFirst({
        where: { userId: user.id, orgId },
        select: { id: true },
      })
      if (!teacher) {
        return NextResponse.json({ error: 'Teacher introuvable' }, { status: 403, headers: cors })
      }
      schedules = await getSchedules({ orgId, teacherId: teacher.id, rangeStart, rangeEnd })
    } else {
      schedules = await getSchedules({ orgId, classId: classId!, rangeStart, rangeEnd })
    }

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
      .map(([date, slots]) => ({
        date,
        dayOfWeek: slots[0].dayOfWeek,
        slots,
      }))

    return NextResponse.json({ data }, { headers: cors })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur serveur' },
      { status: 500, headers: cors },
    )
  }
}
