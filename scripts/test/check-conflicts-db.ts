/**
 * Diagnostic : est-ce que checkConflicts peut s'exécuter sur le test DB ?
 * Si Schedule.notifyState manque → Prisma 7 échouera à créer le schedule interne.
 */

import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg }     from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const db      = new PrismaClient({ adapter })

// checkConflicts utilise le singleton @/lib/db — on redéfinit DATABASE_URL avant l'import
// (déjà fait par vitest.config, ici on le fait manuellement)

async function main() {
  // Chercher un org existant dans le test DB
  const org = await db.organization.findFirst({ where: { name: { startsWith: '__' } } })
  if (!org) {
    console.log('Aucun org de test trouvé — créer les fixtures manuellement d\'abord')
    return
  }
  console.log('Test org:', org.id)

  // Tenter de créer un schedule minimal via Prisma (pour voir quelles colonnes il envoie)
  try {
    await db.schedule.create({
      data: {
        courseId:  '00000000-0000-0000-0000-000000000001',
        roomId:    '00000000-0000-0000-0000-000000000001',
        teacherId: '00000000-0000-0000-0000-000000000001',
        orgId:     org.id,
        classId:   '00000000-0000-0000-0000-000000000001',
        startTime: new Date('2030-01-01T08:00:00Z'),
        endTime:   new Date('2030-01-01T10:00:00Z'),
        status:    'PENDING',
      },
    })
    console.log('✅ Schedule.create fonctionne sur le test DB')
  } catch (e: any) {
    console.log('❌ Schedule.create échoue :', e.message?.slice(0, 200))
    if (e.meta?.driverAdapterError?.cause?.originalMessage) {
      console.log('   DB error:', e.meta.driverAdapterError.cause.originalMessage)
    }
  }

  await db.$disconnect()
}

main().catch(console.error)
