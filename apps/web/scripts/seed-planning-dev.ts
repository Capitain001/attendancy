/**
 * Seed de planning pour dev/test.
 * Usage : bun run scripts/seed-planning-dev.ts
 *
 * Crée (si inexistants) : Room, UE, UECourse, Course, User(teacher), Teacher
 * Puis génère 2 semaines de séances pour la classe cible.
 */
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const ORG_ID   = '565294dc-64f3-4614-ac42-484bab76abb7'
const CLASS_ID = 'b588e534-16b0-47e5-9bf8-8e7313fbdf7d'

// ── helpers ──────────────────────────────────────────────────────────────────

function nextMonday(): Date {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? 1 : 8 - day
  d.setDate(d.getDate() + (day === 1 ? 0 : diff))
  d.setHours(0, 0, 0, 0)
  return d
}

function slot(base: Date, dayOffset: number, startH: number, endH: number): [Date, Date] {
  const s = new Date(base)
  s.setDate(s.getDate() + dayOffset)
  s.setHours(startH, 0, 0, 0)
  const e = new Date(s)
  e.setHours(endH, 0, 0, 0)
  return [s, e]
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seed planning dev')
  console.log(`   org   : ${ORG_ID}`)
  console.log(`   class : ${CLASS_ID}`)

  // 1. Vérifier que la classe existe
  const cls = await prisma.class.findUnique({ where: { id: CLASS_ID } })
  if (!cls) throw new Error(`Classe ${CLASS_ID} introuvable en DB`)
  console.log(`✓ Classe trouvée : ${cls.name}`)

  // 2. Room
  let room = await prisma.room.findFirst({ where: { orgId: ORG_ID, deletedAt: null } })
  if (!room) {
    room = await prisma.room.create({
      data: { name: 'Amphi A', capacity: 120, orgId: ORG_ID },
    })
    console.log(`✓ Room créée : ${room.name}`)
  } else {
    console.log(`✓ Room existante : ${room.name}`)
  }

  // 3. UE
  let ue = await prisma.uE.findFirst({ where: { orgId: ORG_ID, deletedAt: null } })
  if (!ue) {
    ue = await prisma.uE.create({
      data: { name: 'Informatique', code: 'INF', orgId: ORG_ID },
    })
    console.log(`✓ UE créée : ${ue.name}`)
  } else {
    console.log(`✓ UE existante : ${ue.name}`)
  }

  // 4. UECourse
  let ueCourse = await prisma.uECourse.findFirst({ where: { orgId: ORG_ID } })
  if (!ueCourse) {
    ueCourse = await prisma.uECourse.create({
      data: { name: 'Algorithmique', credits: 3, duration: 30, orgId: ORG_ID, ueId: ue.id },
    })
    console.log(`✓ UECourse créée : ${ueCourse.name}`)
  } else {
    console.log(`✓ UECourse existante : ${ueCourse.name}`)
  }

  // 5. Course (liée à la classe)
  let course = await prisma.course.findFirst({
    where: { classId: CLASS_ID, orgId: ORG_ID, deletedAt: null },
  })
  if (!course) {
    course = await prisma.course.create({
      data: {
        name:       ueCourse.name,
        credits:    ueCourse.credits,
        classId:    CLASS_ID,
        orgId:      ORG_ID,
        ueCourseId: ueCourse.id,
      },
    })
    console.log(`✓ Course créée : ${course.name}`)
  } else {
    console.log(`✓ Course existante : ${course.name}`)
  }

  // 6. Teacher (+ User seed si nécessaire)
  let teacher = await prisma.teacher.findFirst({
    where: { orgId: ORG_ID, deletedAt: null },
  })
  if (!teacher) {
    const user = await prisma.user.create({
      data: {
        email:     'prof.seed@attendancy.dev',
        firstName: 'Jean',
        lastName:  'Dupont',
      },
    })
    teacher = await prisma.teacher.create({
      data: { userId: user.id, orgId: ORG_ID },
    })
    console.log(`✓ Teacher créé : Jean Dupont`)
  } else {
    console.log(`✓ Teacher existant : ${teacher.id}`)
  }

  // 7. Schedules — 2 semaines à partir de lundi prochain
  const monday = nextMonday()

  // Supprime les séances seed existantes pour cette classe (évite doublons)
  await prisma.schedule.deleteMany({
    where: { classId: CLASS_ID, orgId: ORG_ID, notes: 'seed-dev' },
  })

  const sessions: Array<[Date, Date]> = [
    // Semaine 1
    slot(monday, 0, 8, 10),   // lundi   08h-10h
    slot(monday, 0, 14, 16),  // lundi   14h-16h
    slot(monday, 1, 10, 12),  // mardi   10h-12h
    slot(monday, 2, 8, 10),   // mercredi 08h-10h
    slot(monday, 3, 13, 15),  // jeudi   13h-15h
    slot(monday, 4, 9, 11),   // vendredi 09h-11h
    // Semaine 2
    slot(monday, 7, 8, 10),
    slot(monday, 7, 14, 16),
    slot(monday, 8, 10, 12),
    slot(monday, 9, 8, 10),
    slot(monday, 10, 13, 15),
    slot(monday, 11, 9, 11),
  ]

  let created = 0
  for (const [start, end] of sessions) {
    await prisma.schedule.create({
      data: {
        courseId:  course.id,
        teacherId: teacher.id,
        roomId:    room.id,
        classId:   CLASS_ID,
        orgId:     ORG_ID,
        startTime: start,
        endTime:   end,
        status:    'PENDING',
        notes:     'seed-dev',
      },
    })
    created++
  }

  console.log(`✓ ${created} séances créées`)
  console.log('\n🎉 Seed terminé — relance le planning dans le desktop.')
}

main()
  .catch((e) => { console.error('❌', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
