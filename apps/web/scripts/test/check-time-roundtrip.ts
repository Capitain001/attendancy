// scripts/check-time-roundtrip.ts
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

const prisma = new PrismaClient({ adapter });
async function main() {
  console.log('TZ process:', process.env.TZ, '| offset local (min):', new Date().getTimezoneOffset());

  const teacher = await prisma.teacher.findFirst();
  if (!teacher) throw new Error("No teacher found in the database to run this test");
  
  const row = await prisma.teacherUnavailability.create({
    data: {
      teacherId: teacher.id,
      orgId: teacher.orgId,
      type: 'WEEKLY',
      dayOfWeek: 1,
      startTime: new Date(Date.UTC(1970, 0, 1, 8, 0, 0)), // 08:00 explicite en UTC
      endTime: new Date(Date.UTC(1970, 0, 1, 10, 0, 0)),
    },
  });

if (!row.startTime) throw new Error('startTime devrait être défini pour ce test');
console.log('Écrit via Client (UTC getters):', row.startTime.getUTCHours(), row.startTime.getUTCMinutes());
  // Lecture brute, indépendante du mapping JS de Prisma
  const raw = await prisma.$queryRaw<{ t: string }[]>`
    SELECT "startTime"::text AS t FROM "TeacherUnavailability" WHERE id = ${row.id}::uuid
  `;
  console.log('Valeur brute stockée en DB:', raw[0].t); // doit afficher "08:00:00"

  await prisma.teacherUnavailability.delete({ where: { id: row.id } });
}
main().finally(() => prisma.$disconnect());