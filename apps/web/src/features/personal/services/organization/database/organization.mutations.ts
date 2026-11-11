// src/features/personal/services/organization/database/organization.mutations.ts
import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/graph'
import { buildOrgSlug } from '@/lib/slug'
import type { PersonalRole } from '@/modules/auth/constants'
import { createRoleSpecificEntity } from '@/modules/auth/members/utils'
import { PERSONAL } from '@/features/personal/constants'
import { invalidatePersonalClassEvents } from '@/features/personal/services/class/database'
import { findPersonalProfileId } from './organization.queries'


// Bootstrap atomique, appelé une seule fois : org + settings + usage + membership
// + premier profil (+ classe d'accueil si TEACHER).
export async function createPersonalOrgWithProfile(params: {
  userId: string
  role: PersonalRole
  userName?: string | null
}) {
  const { userId, role, userName } = params
  const { slug, name } = buildOrgSlug('PERSONAL', userName)
  const isTeacher = role === 'TEACHER'

  const result = await tryConstraint(
    prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name, slug, type: 'PERSONAL' },
        select: { id: true, name: true, slug: true },
      })
      await tx.organizationSettings.create({ data: { orgId: org.id, maxClasses: PERSONAL.CLASS.MAX } })
      await tx.organizationUsage.create({ data: { orgId: org.id } })

      await tx.userOrganization.create({
        data: { userId, orgId: org.id, role, isMainOrg: true, isResponsable: true, status: 'ACTIVE' },
      })

      const entity = await createRoleSpecificEntity(tx, userId, role, org.id)
      if (!entity) throw new Error(`Création du profil ${role} impossible`)

      await tx.user.updateMany({ where: { id: userId, status: 'PENDING' }, data: { status: 'ACTIVE' } })

//pas de creation de class
    //   if (isTeacher) await createPersonalClassTx(tx, { orgId: org.id, name: PERSONAL.NAME })

      return { org, profileId: entity.id }
    }),
  )

  await invalidateEvent('ORG_CREATED', result.org.id)
  if (isTeacher) await invalidatePersonalClassEvents(result.org.id)
  return result
}

// Ajoute un rôle à un espace perso existant. Ne crée aucune classe.
export async function createPersonalProfile(params: { userId: string; orgId: string; role: PersonalRole }) {
  const { userId, orgId, role } = params

  return tryConstraint(
    prisma.$transaction(async (tx) => {
      const existing = await findPersonalProfileId(userId, orgId, role, tx)

      await tx.userOrganization.update({
        where: { userId_orgId: { userId, orgId } },
        data: { role, status: 'ACTIVE' },
      })

      if (existing) return { profileId: existing, created: false }

      const entity = await createRoleSpecificEntity(tx, userId, role, orgId)
      if (!entity) throw new Error(`Création du profil ${role} impossible`)

      return { profileId: entity.id, created: true }
    }),
  )
}