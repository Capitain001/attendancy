import { describe, it, expect, vi } from 'vitest'
import type { PrismaClient }       from '@/generated/prisma/client'
import { checkAvailability, MAX_ITEMS } from './availability'

// ── Mock minimal PrismaClient ─────────────────────────────────────────────────

function makeClient(rows: { roomId: string; teacherId: string | null; classId: string; groupId: string | null }[]) {
  return {
    $queryRaw: vi.fn().mockResolvedValue(rows),
  } as unknown as PrismaClient
}

const BASE = {
  start:        new Date('2025-09-01T08:00:00Z'),
  end:          new Date('2025-09-01T10:00:00Z'),
  orgId:        'org-1',
  prismaClient: makeClient([]),
}

// ── Validation ────────────────────────────────────────────────────────────────

describe('checkAvailability — validation', () => {
  it('start >= end → error', async () => {
    const result = await checkAvailability({
      ...BASE,
      start: new Date('2025-09-01T10:00:00Z'),
      end:   new Date('2025-09-01T08:00:00Z'),
      rooms: [], teachers: [], classes: [],
    })
    expect(result).toEqual({ error: "L'heure de fin doit être après l'heure de début." })
  })

  it('start === end → error', async () => {
    const t = new Date('2025-09-01T09:00:00Z')
    const result = await checkAvailability({
      ...BASE, start: t, end: t,
      rooms: [], teachers: [], classes: [],
    })
    expect(result.error).toBeDefined()
  })

  it('too many rooms → error', async () => {
    const rooms = Array.from({ length: MAX_ITEMS + 1 }, (_, i) => ({ id: `r-${i}` }))
    const result = await checkAvailability({ ...BASE, rooms, teachers: [], classes: [] })
    expect(result).toEqual({ error: "Trop d'éléments transmis." })
  })

  it('too many teachers → error', async () => {
    const teachers = Array.from({ length: MAX_ITEMS + 1 }, (_, i) => ({ id: `t-${i}` }))
    const result = await checkAvailability({ ...BASE, rooms: [], teachers, classes: [] })
    expect(result.error).toBeDefined()
  })

  it('invalid excludeScheduleId UUID → error', async () => {
    const result = await checkAvailability({
      ...BASE,
      excludeScheduleId: 'not-a-uuid',
      rooms: [], teachers: [], classes: [],
    })
    expect(result).toEqual({ error: 'excludeScheduleId invalide.' })
  })

  it('valid excludeScheduleId UUID → ok', async () => {
    const result = await checkAvailability({
      ...BASE,
      excludeScheduleId: '11111111-1111-1111-1111-111111111111',
      rooms: [], teachers: [], classes: [],
    })
    expect(result.error).toBeUndefined()
  })
})

// ── Court-circuit — tableaux vides ────────────────────────────────────────────

describe('checkAvailability — court-circuit', () => {
  it('no resources → empty result without DB call', async () => {
    const client = makeClient([])
    const result = await checkAvailability({
      ...BASE, prismaClient: client,
      rooms: [], teachers: [], classes: [],
    })
    expect(result).toEqual({ data: { rooms: [], teachers: [], classes: [], groups: [] } })
    expect(client.$queryRaw).not.toHaveBeenCalled()
  })
})

// ── Disponibilité / indisponibilité ───────────────────────────────────────────

const UUID_ROOM_A    = 'aaaaaaaa-0000-0000-0000-000000000001'
const UUID_ROOM_B    = 'aaaaaaaa-0000-0000-0000-000000000002'
const UUID_TEACHER_1 = 'bbbbbbbb-0000-0000-0000-000000000001'
const UUID_CLASS_1   = 'cccccccc-0000-0000-0000-000000000001'
const UUID_GROUP_1   = 'dddddddd-0000-0000-0000-000000000001'
const UUID_GROUP_2   = 'dddddddd-0000-0000-0000-000000000002'

describe('checkAvailability — mapping disponibilité', () => {
  const roomA    = { id: UUID_ROOM_A }
  const roomB    = { id: UUID_ROOM_B }
  const teacher1 = { id: UUID_TEACHER_1 }
  const class1   = { id: UUID_CLASS_1 }

  it('no overlapping schedules → all available', async () => {
    const client = makeClient([])
    const result = await checkAvailability({
      ...BASE, prismaClient: client,
      rooms: [roomA, roomB],
      teachers: [teacher1],
      classes:  [class1],
    })
    expect(result.data).toEqual({
      rooms:    [{ id: UUID_ROOM_A, available: true }, { id: UUID_ROOM_B, available: true }],
      teachers: [{ id: UUID_TEACHER_1, available: true }],
      classes:  [{ id: UUID_CLASS_1, available: true }],
      groups:   [],
    })
  })

  it('overlapping schedule for room-a → room-a busy, room-b free', async () => {
    const client = makeClient([
      { roomId: UUID_ROOM_A, teacherId: null, classId: 'cccccccc-0000-0000-0000-000000000099', groupId: null },
    ])
    const result = await checkAvailability({
      ...BASE, prismaClient: client,
      rooms: [roomA, roomB],
      teachers: [teacher1],
      classes:  [class1],
    })
    expect(result.data?.rooms).toEqual([
      { id: UUID_ROOM_A, available: false },
      { id: UUID_ROOM_B, available: true },
    ])
    expect(result.data?.teachers).toEqual([{ id: UUID_TEACHER_1, available: true }])
  })

  it('overlapping schedule for teacher-1 → teacher busy', async () => {
    const client = makeClient([
      { roomId: 'aaaaaaaa-0000-0000-0000-000000000099', teacherId: UUID_TEACHER_1, classId: 'cccccccc-0000-0000-0000-000000000099', groupId: null },
    ])
    const result = await checkAvailability({
      ...BASE, prismaClient: client,
      rooms: [roomA],
      teachers: [teacher1],
      classes:  [class1],
    })
    expect(result.data?.teachers).toEqual([{ id: UUID_TEACHER_1, available: false }])
    expect(result.data?.rooms).toEqual([{ id: UUID_ROOM_A, available: true }])
  })

  it('null teacherId in row → teacher not marked busy', async () => {
    const client = makeClient([
      { roomId: 'aaaaaaaa-0000-0000-0000-000000000099', teacherId: null, classId: 'cccccccc-0000-0000-0000-000000000099', groupId: null },
    ])
    const result = await checkAvailability({
      ...BASE, prismaClient: client,
      rooms: [roomA],
      teachers: [teacher1],
      classes:  [class1],
    })
    expect(result.data?.teachers).toEqual([{ id: UUID_TEACHER_1, available: true }])
  })

  it('group availability', async () => {
    const group1 = { id: UUID_GROUP_1 }
    const group2 = { id: UUID_GROUP_2 }
    const client = makeClient([
      { roomId: 'aaaaaaaa-0000-0000-0000-000000000099', teacherId: null, classId: 'cccccccc-0000-0000-0000-000000000099', groupId: UUID_GROUP_1 },
    ])
    const result = await checkAvailability({
      ...BASE, prismaClient: client,
      rooms: [], teachers: [], classes: [],
      groups: [group1, group2],
    })
    expect(result.data?.groups).toEqual([
      { id: UUID_GROUP_1, available: false },
      { id: UUID_GROUP_2, available: true },
    ])
  })
})
