// src/services/session/__tests__/past-sessions.unit.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as v from 'valibot'

const { findManyMock, authAccessMock, cacheTagMock, cacheLifeMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  authAccessMock: vi.fn(),
  cacheTagMock: vi.fn(),
  cacheLifeMock: vi.fn(),
}))

vi.mock('next/cache', () => ({
  cacheTag: cacheTagMock,
  cacheLife: cacheLifeMock,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    session: {
      findMany: findManyMock,
    },
  },
}))

vi.mock('@/services/auth', () => ({
  authAccess: authAccessMock,
}))

import { getTeacherPastSessionsSchema } from '../validation'
import {
  getTeacherPastSessions,
  PAST_SESSIONS_PAGE_SIZE,
} from '../database/session.queries'
import { getTeacherPastSessionsAction } from '../actions/session.queries'

const VALID_TEACHER_ID = 'a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77'
const VALID_ORG_ID = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'

function makeFakeSessionRow(index: number) {
  return {
    id: `sess-${index}`,
    status: 'COMPLETED' as const,
    schedule: {
      startTime: new Date(Date.UTC(2026, 10, 8, 10, 0)),
      endTime: new Date(Date.UTC(2026, 10, 8, 12, 0)),
      course: { name: `Cours ${index}` },
      class: { name: 'Master 1 Informatique' },
      group: { name: 'Groupe A' },
      room: { name: 'Amphi B' },
      attendances: [{ status: 'PRESENT' as const }, { status: 'ABSENT' as const }],
    },
  }
}

describe('getTeacherPastSessionsSchema (validation)', () => {
  it('accepte un teacherId UUID valide et une page entière >= 1', () => {
    const parsed = v.safeParse(getTeacherPastSessionsSchema, {
      teacherId: VALID_TEACHER_ID,
      page: 1,
    })

    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.output).toEqual({
        teacherId: VALID_TEACHER_ID,
        page: 1,
      })
    }
  })

  it('rejette un teacherId qui nest pas un UUID', () => {
    const parsed = v.safeParse(getTeacherPastSessionsSchema, {
      teacherId: 'not-a-uuid',
      page: 1,
    })

    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(parsed.issues[0]?.message).toBe('ID invalide')
    }
  })

  it('rejette une page < 1 ou non entière', () => {
    const zeroPage = v.safeParse(getTeacherPastSessionsSchema, {
      teacherId: VALID_TEACHER_ID,
      page: 0,
    })
    const floatPage = v.safeParse(getTeacherPastSessionsSchema, {
      teacherId: VALID_TEACHER_ID,
      page: 1.5,
    })

    expect(zeroPage.success).toBe(false)
    if (!zeroPage.success) {
      expect(zeroPage.issues[0]?.message).toBe('Page invalide')
    }
    expect(floatPage.success).toBe(false)
  })
})

describe('getTeacherPastSessions (database query)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('filtre par orgId, teacherId, statuts COMPLETED/CANCELED et calcule skip/take selon la page', async () => {
    const rows = [makeFakeSessionRow(1), makeFakeSessionRow(2)]
    findManyMock.mockResolvedValue(rows)

    const result = await getTeacherPastSessions(VALID_TEACHER_ID, VALID_ORG_ID, 2)

    expect(findManyMock).toHaveBeenCalledWith({
      where: {
        status: { in: ['COMPLETED', 'CANCELED'] },
        schedule: {
          orgId: VALID_ORG_ID,
          teacherId: VALID_TEACHER_ID,
          deletedAt: null,
        },
      },
      orderBy: [{ schedule: { startTime: 'desc' } }, { id: 'desc' }],
      skip: PAST_SESSIONS_PAGE_SIZE,
      take: PAST_SESSIONS_PAGE_SIZE + 1,
      select: {
        id: true,
        status: true,
        schedule: {
          select: {
            startTime: true,
            endTime: true,
            course: { select: { name: true } },
            class: { select: { name: true } },
            group: { select: { name: true } },
            room: { select: { name: true } },
            attendances: { select: { status: true } },
          },
        },
      },
    })
    expect(result).toEqual({
      sessions: rows,
      hasNext: false,
    })
  })

  it('tronque à PAST_SESSIONS_PAGE_SIZE et retourne hasNext=true quand 21 lignes sont retournées', async () => {
    const rows = Array.from({ length: PAST_SESSIONS_PAGE_SIZE + 1 }, (_, i) =>
      makeFakeSessionRow(i + 1),
    )
    findManyMock.mockResolvedValue(rows)

    const result = await getTeacherPastSessions(VALID_TEACHER_ID, VALID_ORG_ID, 1)

    expect(result.sessions).toHaveLength(PAST_SESSIONS_PAGE_SIZE)
    expect(result.hasNext).toBe(true)
  })
})

describe('getTeacherPastSessionsAction (server action)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authAccessMock.mockResolvedValue({
      data: {
        orgId: VALID_ORG_ID,
        user: { id: 'user-1', role: 'TEACHER' },
      },
    })
  })

  it('retourne une erreur si authAccess échoue sans interroger la base', async () => {
    authAccessMock.mockResolvedValue({ error: 'Non authentifié' })

    const res = await getTeacherPastSessionsAction({
      teacherId: VALID_TEACHER_ID,
      page: 1,
    })

    expect(res).toEqual({ error: 'Non authentifié' })
    expect(findManyMock).not.toHaveBeenCalled()
  })

  it("retourne une erreur de validation si l'input est invalide sans interroger la base", async () => {
    const res = await getTeacherPastSessionsAction({
      teacherId: 'invalid-uuid',
      page: 1,
    })

    expect(res).toEqual({ error: 'ID invalide' })
    expect(findManyMock).not.toHaveBeenCalled()
  })

  it("utilise l'orgId du token auth et retourne les sessions paginées", async () => {
    const rows = [makeFakeSessionRow(1)]
    findManyMock.mockResolvedValue(rows)

    const res = await getTeacherPastSessionsAction({
      teacherId: VALID_TEACHER_ID,
      page: 1,
    })

    expect(res).toEqual({
      data: {
        sessions: rows,
        hasNext: false,
      },
    })
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          schedule: {
            orgId: VALID_ORG_ID,
            teacherId: VALID_TEACHER_ID,
            deletedAt: null,
          },
        }),
      }),
    )
  })

  it('capture les erreurs Prisma et retourne un objet { error }', async () => {
    findManyMock.mockRejectedValue(new Error('DB connection lost'))

    const res = await getTeacherPastSessionsAction({
      teacherId: VALID_TEACHER_ID,
      page: 1,
    })

    expect(res).toEqual({ error: 'DB connection lost' })
  })
})

