
import { prisma } from '@/lib/prisma'
import { PersonalSignupRole } from '@/modules/auth/constants';
import { getActiveClassesCount } from '@/services/class/database';
import { ERRORS } from '@/config';


 
// fn légère demandée : lecture pure, aucune écriture. Empêche un doublon
// (Teacher/Student/Parent ont @@unique([userId, orgId]) — un 2e create sur le
// même triplet planterait sinon). C'est aussi le SEUL point d'entrée où une
// vérification de quota/abonnement s'insérera plus tard (billing, hors scope
// ici) — d'où son isolement dans sa propre fonction plutôt qu'inlinée.
export async function findPersonalProfileId(
  userId: string,
  orgId: string,
  role: PersonalSignupRole,
) {
  switch (role) {
    case 'TEACHER':
      return (await prisma.teacher.findFirst({ where: { userId, orgId }, select: { id: true } }))?.id ?? null
    case 'STUDENT':
      return (await prisma.student.findFirst({ where: { userId, orgId }, select: { id: true } }))?.id ?? null
    case 'PARENT':
      return (await prisma.parent.findFirst({ where: { userId, orgId }, select: { id: true } }))?.id ?? null
  }
}
 

