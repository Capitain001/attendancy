// src/app/api/teacher/schedule-days/route.ts
import { type NextRequest, NextResponse } from 'next/server'
import { extractBearerToken, verifyBearerToken } from '@/utils/supabase/api'
import { getScheduleDays } from '@/services/schedule/database'
import { prisma } from '@/lib/prisma'

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

  const month = req.nextUrl.searchParams.get('month')
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'month (yyyy-MM) est requis' }, { status: 400, headers: cors })
  }

  try {
    const days = await getScheduleDays(orgId, month, { teacherId: teacher.id })
    return NextResponse.json({ data: days }, { headers: cors })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur serveur' },
      { status: 500, headers: cors },
    )
  }
}
