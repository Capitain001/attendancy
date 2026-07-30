import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

for (const line of readFileSync(resolve(process.cwd(), '.env'), 'utf-8').split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const [key, ...rest] = trimmed.split('=')
  if (key && rest.length) process.env[key] = rest.join('=').replace(/^["']|["']$/g, '')
}

const directUrl = (process.env.TEST_DATABASE_URL ?? '').replace(/-pooler\./, '.')
const adapter   = new PrismaPg({ connectionString: directUrl })
const db        = new PrismaClient({ adapter })

async function main() {
  const triggers = await db.$queryRaw<{ trigger_name: string }[]>`
    SELECT trigger_name FROM information_schema.triggers
    WHERE event_object_schema = 'public'
      AND event_object_table  = 'Schedule'
  `
  console.log('Triggers on Schedule:', triggers.map(t => t.trigger_name))

  const constraints = await db.$queryRaw<{ conname: string }[]>`
    SELECT conname FROM pg_constraint
    WHERE conrelid = '"public"."Schedule"'::regclass
      AND conname IN ('no_room_overlap', 'no_teacher_overlap', 'no_class_overlap_global', 'no_group_overlap')
  `
  console.log('GiST constraints:', constraints.map(c => c.conname))

  // Check `during` value on a recent schedule
  const sched = await db.$queryRaw<{ id: string; during: string | null }[]>`
    SELECT id, during::text FROM "Schedule" ORDER BY "createdAt" DESC LIMIT 1
  `
  if (sched.length) {
    console.log('Latest schedule during:', sched[0])
  } else {
    console.log('No schedules found in DB')
  }

  await db.$disconnect()
}

main().catch(console.error)
