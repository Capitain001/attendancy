import { type NextRequest, NextResponse } from 'next/server'
import { extractBearerToken, verifyBearerToken } from '@/utils/supabase/api'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const token = extractBearerToken(req)
  if (!token) {
    return NextResponse.json({ error: 'Token manquant' }, { status: 401 })
  }

  const user = await verifyBearerToken(token)
  if (!user) {
    return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
  }

  const meta = (user.user_metadata ?? {}) as {
    name?: string
    organization?: { id?: string }
    role?: string
  }

  const orgId = meta.organization?.id ?? null

  // Récupère la première classe associée au teacher (si role TEACHER)
  let classId: string | null = null
  if (orgId && meta.role === 'TEACHER') {
    const teacher = await prisma.teacher.findFirst({
      where: { userId: user.id, orgId },
      select: {
        schedules: {
          where: { deletedAt: null, startTime: { gte: new Date() } },
          orderBy: { startTime: 'asc' },
          select: { classId: true },
          take: 1,
        },
      },
    })
    classId = teacher?.schedules[0]?.classId ?? null
  }

  return NextResponse.json({
    data: {
      userId: user.id,
      email:  user.email,
      name:   meta.name ?? user.email,
      orgId,
      role:   meta.role ?? null,
      classId,
    },
  })
}
