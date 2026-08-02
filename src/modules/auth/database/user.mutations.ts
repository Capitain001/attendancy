// src/services/auth/database/user.mutations.ts
// Création du record User applicatif après le signup Supabase.
// L'id Supabase Auth est la source de vérité — jamais généré côté appli.
import { UserStatus } from  '@/prisma'
import { prisma } from '@/lib/prisma'


// Idempotent — re-signup ou état partiel ne lève pas de violation d'unicité.
export async function createUserRecord(params: { id: string; email: string;firstName?: string; lastName?: string }) {
  return prisma.user.upsert({
    where: { id: params.id },
    create: {
      id: params.id,
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      status: UserStatus.PENDING,
    },
    update: {},
  })
}

