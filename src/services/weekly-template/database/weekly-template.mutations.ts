import { prisma } from '@/lib/prisma'
import { invalidateEvent } from '@/cache/server/key'

export async function createWeeklyTemplate(orgId: string, name: string) {
  const template = await prisma.weeklyTemplate.create({
    data: { orgId, name },
  })
  await invalidateEvent('WEEKLY_TEMPLATE_CREATED', orgId)
  return template
}

export async function updateWeeklyTemplate(
  id: string,
  orgId: string,
  data: { name?: string; isActive?: boolean },
) {
  const template = await prisma.weeklyTemplate.update({
    where: { id },
    data,
  })
  await invalidateEvent('WEEKLY_TEMPLATE_UPDATED', orgId)
  return template
}

export async function removeWeeklyTemplate(id: string, orgId: string) {
  await prisma.weeklyTemplate.update({
    where: { id },
    data:  { deletedAt: new Date(), isActive: false },
  })
  await invalidateEvent('WEEKLY_TEMPLATE_REMOVED', orgId)
}

// ── WeeklySlot mutations ──────────────────────────────────────────────────────

export async function createWeeklySlot(
  templateId: string,
  orgId: string,
  data: {
    dayOfWeek: number
    startTime: string
    endTime:   string
    courseId:  string
    teacherId: string
    roomId:    string
  },
) {
  const slot = await prisma.weeklySlot.create({
    data: { templateId, ...data },
  })
  await invalidateEvent('WEEKLY_TEMPLATE_UPDATED', orgId)
  return slot
}

export async function removeWeeklySlot(slotId: string, orgId: string) {
  await prisma.weeklySlot.update({
    where: { id: slotId },
    data:  { deletedAt: new Date(), isActive: false },
  })
  await invalidateEvent('WEEKLY_TEMPLATE_UPDATED', orgId)
}

// ── WeekRecurence : apply template → generate Schedules ──────────────────────

export async function applyWeeklyTemplate(opts: {
  templateId:    string
  orgId:         string
  classId:       string
  startDate:     Date
  endDate:       Date
  interval:      number
  excludedDates: Date[]
}) {
  const { templateId, orgId, classId, startDate, endDate, interval, excludedDates } = opts

  const template = await prisma.weeklyTemplate.findFirst({
    where:   { id: templateId, orgId, deletedAt: null },
    include: { slots: { where: { deletedAt: null } } },
  })
  if (!template) throw new Error('Template introuvable')

  const recurrence = await prisma.weekRecurence.create({
    data: { templateId, orgId, startDate, endDate, interval, excludedDates, isActive: true },
  })

  const excludedSet = new Set(excludedDates.map(d => d.toDateString()))
  const schedules: { startTime: Date; endTime: Date; courseId: string; teacherId: string; roomId: string }[] = []

  // Walk weeks from startDate to endDate by interval
  let current = new Date(startDate)
  while (current <= endDate) {
    if (!excludedSet.has(current.toDateString())) {
      // current week: find day offset to Monday (weekStartsOn=1)
      const weekDay = current.getDay() // 0=Sun…6=Sat
      const monday  = new Date(current)
      monday.setDate(current.getDate() - ((weekDay + 6) % 7))

      for (const slot of template.slots) {
        const slotDate = new Date(monday)
        slotDate.setDate(monday.getDate() + slot.dayOfWeek)

        if (slotDate < startDate || slotDate > endDate) continue
        if (excludedSet.has(slotDate.toDateString())) continue

        const [sh, sm] = slot.startTime.split(':').map(Number)
        const [eh, em] = slot.endTime.split(':').map(Number)
        const slotStart = new Date(slotDate)
        slotStart.setHours(sh, sm, 0, 0)
        const slotEnd = new Date(slotDate)
        slotEnd.setHours(eh, em, 0, 0)

        schedules.push({
          startTime: slotStart,
          endTime:   slotEnd,
          courseId:  slot.courseId,
          teacherId: slot.teacherId,
          roomId:    slot.roomId,
        })
      }
    }
    // advance by interval weeks
    current.setDate(current.getDate() + interval * 7)
  }

  if (schedules.length > 0) {
    await prisma.schedule.createMany({
      data: schedules.map(s => ({
        ...s,
        orgId,
        classId,
        weekRecurrenceId: recurrence.id,
        status: 'PENDING',
      })),
      skipDuplicates: true,
    })
  }

  await invalidateEvent('WEEKLY_TEMPLATE_UPDATED', orgId)
  return { recurrenceId: recurrence.id, schedulesCreated: schedules.length }
}
