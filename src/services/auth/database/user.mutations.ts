// src/services/auth/database/user.mutations.ts
// Création du record User applicatif après le signup Supabase.
// L'id Supabase Auth est la source de vérité — jamais généré côté appli.
import { UserStatus } from  '@/prisma'
import { prisma } from '@/lib/db'


// Idempotent — re-signup ou état partiel ne lève pas de violation d'unicité.
export async function createUserRecord(params: { id: string; email: string }) {
  return prisma.user.upsert({
    where: { id: params.id },
    create: {
      id: params.id,
      email: params.email,
      firstName: null,
      lastName: null,
      status: UserStatus.PENDING,
    },
    update: {},
  })
}

// Upsert du responsable/principal — nom vide au signup, complété au ProfileStepper.
// La ligne User doit exister AVANT /auth/org-setup (FK userId → User.id).
export async function createOrgResponsableDB(params: {
  id: string
  email: string
  firstName: string
  lastName: string
}) {
  return prisma.user.upsert({
    where: { id: params.id },
    create: {
      id: params.id,
      email: params.email,
      firstName: params.firstName || null,
      lastName: params.lastName || null,
      status: UserStatus.PENDING,
    },
    update: {},
  })
}
