// scripts/backfill-personal-rooms.ts
//apps\web\scripts\backfill-personal-rooms.ts
// Rattrapage one-shot : crée la salle par défaut des orgs PERSONAL qui n'en ont aucune.
// Idempotent (relançable). Usage : npx tsx scripts/backfill-personal-rooms.ts [--dry]
import { prisma } from '@/lib/prisma'
import { PERSONAL } from '@/features/personal/constants'

async function main() {
  const dry = process.argv.includes('--dry')
  const orgs = await prisma.organization.findMany({
    where: { type: 'PERSONAL' },
    select: { id: true },
  })

  let created = 0
  for (const { id: orgId } of orgs) {
    const hasRoom = (await prisma.room.count({ where: { orgId, deletedAt: null } })) > 0
    if (hasRoom) continue
    if (!dry) {
      await prisma.room.upsert({
        where: { name_orgId: { name: PERSONAL.ROOM_NAME, orgId } },
        update: { deletedAt: null },
        create: { name: PERSONAL.ROOM_NAME, orgId },
      })
    }
    created++
  }

  console.log(`${dry ? '[dry] ' : ''}${created} salle(s) à créer / créée(s) sur ${orgs.length} org(s) perso.`)
  // Les caches "use cache" (rooms / planning resources) expirent via leur cacheLife ;
  // si besoin, redéployer ou invalider ROOM_CREATED par org après le script.
}

main().finally(() => prisma.$disconnect())