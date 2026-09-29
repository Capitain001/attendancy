// src/app/api/teacher/schedules/route.ts
import { type NextRequest, NextResponse } from 'next/server'
import { extractBearerToken, verifyBearerToken } from '@/utils/supabase/api'
import { getTeacherSchedules } from '@/services/schedule/database'
import { prisma } from '@/lib/prisma'
import type { TeacherScheduleItemDto } from '@attendancy/types'

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

export async function GET(req: NextRequest) {
  const cors = corsHeaders(req)

  const token = extractBearerToken(req)
  if (!token) {
    return NextResponse.json({ error: 'Token manquant' }, { status: 401, headers: cors })
  }

  const user = await verifyBearerToken(token)
  const meta = (user?.user_metadata ?? {}) as {
    organization?: { id?: string }
    role?: string
  }
  const orgId = meta.organization?.id ?? null
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

  const { searchParams } = req.nextUrl
  const from = searchParams.get('from')
  const to   = searchParams.get('to')
  if (!from || !to) {
    return NextResponse.json({ error: 'from et to sont requis' }, { status: 400, headers: cors })
  }

  const rangeStart = new Date(from)
  const rangeEnd   = new Date(to)
  if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
    return NextResponse.json({ error: 'Dates invalides' }, { status: 400, headers: cors })
  }

  try {
    const schedules = await getTeacherSchedules({
      orgId,
      teacherId: teacher.id,
      rangeStart,
      rangeEnd,
    })

    const data: TeacherScheduleItemDto[] = schedules.map((s) => ({
      id: s.id,
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
      status: s.status,
      notes: s.notes,
      isLocked: s.isLocked,
      courseName: s.course.name,
      roomName: s.room?.name ?? '',
      className: s.class.name,
      groupName: s.group?.name ?? null,
    }))

    return NextResponse.json({ data }, { headers: cors })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur serveur' },
      { status: 500, headers: cors },
    )
  }
}
