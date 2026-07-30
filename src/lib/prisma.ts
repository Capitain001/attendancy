// src/lib/db.ts
// Singleton Prisma — adapter pg (driver natif, requis par Prisma v7).
// Le client est généré dans src/generated/prisma/ (gitignored) :
// ce fichier ne compile qu'après `npx prisma generate` (voir prisma/schemas/README.md).
//
// Le singleton global évite d'épuiser le pool de connexions en dev (HMR
// recharge les modules mais pas globalThis).
import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
