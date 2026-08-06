import { type NextRequest, NextResponse } from 'next/server'
import { authAccess } from '@/services/auth'
import { extractBearerToken, verifyBearerToken } from '@/utils/supabase/api'
import { getActiveSessions } from '@/services/session/database'
import type { ActiveSessionDto } from '@attendancy/types'

function corsHeaders(req: NextRequest) {
  return {
    'Access-Control-Allow-Origin': req.headers.get('origin') ?? '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) })
}

async function resolveOrgId(req: NextRequest): Promise<string | null> {
  const token = extractBearerToken(req)
  if (token) {
    const user = await verifyBearerToken(token)
    const meta = (user?.user_metadata ?? {}) as { organization?: { id?: string } }
    return meta.organization?.id ?? null
  }
  const auth = await authAccess()
  if ('error' in auth || !auth.data) return null
  return auth.data.orgId
}

export async function GET(req: NextRequest) {
  const cors = corsHeaders(req)

  const orgId = await resolveOrgId(req)
  if (!orgId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401, headers: cors })
  }

  try {
    const sessions = await getActiveSessions(orgId)
    const raw = sessions[0] ?? null

    if (!raw) {
      return NextResponse.json({ data: null }, { headers: cors })
    }

    const dto: ActiveSessionDto = {
      id:          raw.id,
      status:      'ACTIVE',
      startedAt:   raw.schedule.startTime.toISOString(),
      completedAt: null,
      courseId:    raw.schedule.course.id,
      courseName:  raw.schedule.course.name,
      classId:     raw.schedule.classId,
      className:   raw.schedule.class.name,
      teacherId:   raw.schedule.teacher?.id ?? '',
      teacherName: raw.schedule.teacher
        ? `${raw.schedule.teacher.user.firstName ?? ''} ${raw.schedule.teacher.user.lastName ?? ''}`.trim()
        : '',
      roomId:   raw.schedule.room?.id   ?? null,
      roomName: raw.schedule.room?.name ?? null,
    }

    return NextResponse.json({ data: dto }, { headers: cors })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur serveur' },
      { status: 500, headers: cors },
    )
  }
}
