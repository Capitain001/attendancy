import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient }      from '@/generated/prisma/client'
import { PrismaPg }          from '@prisma/adapter-pg'
import { checkAvailability } from './availability'
import { checkConflicts }    from './conflicts'

// ── Client de test ────────────────────────────────────────────────────────────

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const db      = new PrismaClient({ adapter })

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TS = Date.now()

type Fixture = {
  orgId:     string
  roomId:    string
  teacherId: string
  classId:   string
  courseId:  string
}

let fx: Fixture

async function createFixtures(): Promise<Fixture> {
  const org  = await db.organization.create({ data: { name: `__conflict_org_${TS}` } })
  const dept = await db.department.create({ data: { name: `__dept_${TS}`, orgId: org.id } })
  const pt   = await db.programTrack.create({ data: { name: `__pt_${TS}`, orgId: org.id, departmentId: dept.id } })
  const year = await db.academicYear.create({
    data: { name: `__year_${TS}`, startDate: new Date('2029-09-01'), endDate: new Date('2030-06-30'), orgId: org.id },
  })
  const cls  = await db.class.create({ data: { name: `__class_${TS}`, programTrackId: pt.id, academicYearId: year.id } })
  const room = await db.room.create({ data: { name: `__room_${TS}`, orgId: org.id } })
  const user = await db.user.create({ data: { email: `__conflict_${TS}@test.local` } })
  const teacher = await db.teacher.create({ data: { userId: user.id, orgId: org.id } })
  const ue   = await db.uE.create({ data: { name: `__ue_${TS}`, orgId: org.id } })
  const ueCourse = await db.uECourse.create({ data: { name: `__uec_${TS}`, orgId: org.id, ueId: ue.id } })
  const course   = await db.course.create({
    data: { name: `__course_${TS}`, orgId: org.id, classId: cls.id, ueCourseId: ueCourse.id, credits: 2 },
  })

  return { orgId: org.id, roomId: room.id, teacherId: teacher.id, classId: cls.id, courseId: course.id }
}

async function cleanupFixtures(f: Fixture) {
  await db.schedule.deleteMany({ where: { orgId: f.orgId } })
  await db.course.deleteMany({ where: { orgId: f.orgId } })
  await db.uECourse.deleteMany({ where: { orgId: f.orgId } })
  await db.uE.deleteMany({ where: { orgId: f.orgId } })
  await db.teacher.deleteMany({ where: { orgId: f.orgId } })
  await db.user.deleteMany({ where: { email: { contains: `_${TS}@test.local` } } })
  await db.room.deleteMany({ where: { orgId: f.orgId } })
  await db.class.deleteMany({ where: { academicYear: { orgId: f.orgId } } })
  await db.programTrack.deleteMany({ where: { orgId: f.orgId } })
  await db.department.deleteMany({ where: { orgId: f.orgId } })
  await db.academicYear.deleteMany({ where: { orgId: f.orgId } })
  await db.organization.deleteMany({ where: { id: f.orgId } })
}

beforeAll(async () => { fx = await createFixtures() }, 60_000)
afterAll(async () => {
  if (fx) await cleanupFixtures(fx)
  await db.$disconnect()
}, 30_000)

// ── checkAvailability — intégration DB ───────────────────────────────────────

describe('checkAvailability — intégration DB', () => {
  const start = new Date('2030-06-01T08:00:00Z')
  const end   = new Date('2030-06-01T10:00:00Z')

  it('aucun schedule → toutes ressources disponibles', async () => {
    const result = await checkAvailability({
      start, end,
      orgId:        fx.orgId,
      prismaClient: db,
      rooms:        [{ id: fx.roomId }],
      teachers:     [{ id: fx.teacherId }],
      classes:      [{ id: fx.classId }],
    })

    expect(result.error).toBeUndefined()
    expect(result.data?.rooms).toEqual([{ id: fx.roomId, available: true }])
    expect(result.data?.teachers).toEqual([{ id: fx.teacherId, available: true }])
    expect(result.data?.classes).toEqual([{ id: fx.classId, available: true }])
  })

  it('UUID inconnu → disponible (aucun schedule pour cet UUID)', async () => {
    const unknownRoom = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
    const result = await checkAvailability({
      start, end,
      orgId:        fx.orgId,
      prismaClient: db,
      rooms:        [{ id: unknownRoom }],
      teachers:     [],
      classes:      [],
    })

    expect(result.error).toBeUndefined()
    expect(result.data?.rooms).toEqual([{ id: unknownRoom, available: true }])
  })

  it('start >= end → error (validation sans appel DB)', async () => {
    const result = await checkAvailability({
      start: end, end: start,
      orgId:        fx.orgId,
      prismaClient: db,
      rooms:        [{ id: fx.roomId }],
      teachers:     [],
      classes:      [],
    })

    expect(result).toEqual({ error: "L'heure de fin doit être après l'heure de début." })
  })

  it('aucune ressource → retour vide sans appel DB', async () => {
    const result = await checkAvailability({
      start, end,
      orgId:        fx.orgId,
      prismaClient: db,
      rooms:        [],
      teachers:     [],
      classes:      [],
    })

    expect(result).toEqual({ data: { rooms: [], teachers: [], classes: [], groups: [] } })
  })
})

// ── checkConflicts — intégration DB ──────────────────────────────────────────

describe('checkConflicts — intégration DB', () => {
  const baseOcc = () => ({
    courseId:  fx.courseId,
    roomId:    fx.roomId,
    teacherId: fx.teacherId,
    classId:   fx.classId,
    orgId:     fx.orgId,
  })

  it('occurrences vides → rapport vide, isValid=true', async () => {
    const report = await checkConflicts({ occurrences: [], prismaClient: db })
    expect(report.isValid).toBe(true)
    expect(report.total).toBe(0)
    expect(report.checked).toBe(0)
    expect(report.conflicts).toEqual([])
  })

  it('occurrences passées uniquement → toutes skipped, isValid=true', async () => {
    const past = new Date('2020-01-01T08:00:00Z')
    const report = await checkConflicts({
      prismaClient: db,
      occurrences: [
        { ...baseOcc(), startTime: past, endTime: new Date('2020-01-01T10:00:00Z') },
        { ...baseOcc(), startTime: past, endTime: new Date('2020-01-01T10:00:00Z') },
      ],
    })
    expect(report.isValid).toBe(true)
    expect(report.total).toBe(2)
    expect(report.skipped).toBe(2)
    expect(report.checked).toBe(0)
    expect(report.conflicts).toEqual([])
  })

  it('occurrence future sans conflit → isValid=true, checked=1', async () => {
    const start = new Date('2031-01-15T08:00:00Z')
    const end   = new Date('2031-01-15T10:00:00Z')
    const report = await checkConflicts({
      prismaClient: db,
      occurrences: [{ ...baseOcc(), startTime: start, endTime: end }],
    })
    expect(report.isValid).toBe(true)
    expect(report.checked).toBe(1)
    expect(report.conflicts).toEqual([])
  })

  it('schedule PENDING en DB → conflit ROOM_OVERLAP détecté', async () => {
    const start = new Date('2031-02-10T08:00:00Z')
    const end   = new Date('2031-02-10T10:00:00Z')

    // Crée un schedule qui bloque la salle (sans weekRecurrenceId → non supprimé par la simulation)
    await db.schedule.create({
      data: {
        courseId:  fx.courseId,
        roomId:    fx.roomId,
        teacherId: fx.teacherId,
        classId:   fx.classId,
        orgId:     fx.orgId,
        startTime: start,
        endTime:   end,
        status:    'PENDING',
      },
    })

    // Même salle, créneau chevauchant → ROOM_OVERLAP
    const overlapping = { ...baseOcc(), startTime: new Date('2031-02-10T09:00:00Z'), endTime: new Date('2031-02-10T11:00:00Z') }
    const report = await checkConflicts({ prismaClient: db, occurrences: [overlapping] })

    expect(report.isValid).toBe(false)
    expect(report.conflicts).toHaveLength(1)
    expect(report.conflicts[0]!.reason).toBe('ROOM_OVERLAP')
    expect(report.conflicts[0]!.dbConstraint).toBe('no_room_overlap')
    expect(report.conflicts[0]!.conflictsWith).not.toBeNull()
    expect(report.conflicts[0]!.conflictsWith?.roomId).toBe(fx.roomId)
  })
})
