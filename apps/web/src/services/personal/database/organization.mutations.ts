// src/services/personal/databases/organization.mutations.ts
import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'

import { buildOrgSlug } from '@/lib/slug'
import type { PersonalRole } from '@/modules/auth/constants'

import { createPersonalClassTx, invalidatePersonalClassEvents } from './classe.mutations'
import { createRoleSpecificEntity } from '@/modules/auth/members/utils'
import { invalidateEvent } from '@/cache/server/graph'
import { findPersonalProfileId } from '@/services/organization/database'
import { PERSONAL } from '../constants'
// createRoleSpecificEntity, findPersonalProfileId : imports inchangés

// Quota gratuit d'un espace personnel (le défaut générique est pensé pour les institutions)
const PERSONAL_MAX_CLASSES = 5

// Bootstrap atomique, appelé une seule fois : org + settings + usage + membership
// + premier profil (+ première classe si TEACHER).
export async function createPersonalOrgWithProfile(params: {
  userId: string
  role: PersonalRole
  userName?: string | null
}) {
  const { slug, name } = buildOrgSlug('PERSONAL', params.userName)
  const isTeacher = params.role === 'TEACHER'

  const result = await tryConstraint(
    prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name, slug, type: 'PERSONAL' },
        select: { id: true, name: true, slug: true },
      })
      await tx.organizationSettings.create({ data: { orgId: org.id, maxClasses: PERSONAL_MAX_CLASSES } })
      await tx.organizationUsage.create({ data: { orgId: org.id } })

      await tx.userOrganization.create({
        data: {
          userId: params.userId,
          orgId: org.id,
          role: params.role,
          isMainOrg: true,
          isResponsable: true,
          status: 'ACTIVE',
        },
      })

      const entity = await createRoleSpecificEntity(tx, params.userId, params.role, org.id)
      if (!entity) throw new Error(`Création du profil ${params.role} impossible`)

      await tx.user.updateMany({ where: { id: params.userId, status: 'PENDING' }, data: { status: 'ACTIVE' } })

      if (isTeacher) {
        await createPersonalClassTx(tx, { orgId: org.id, name: PERSONAL.NAME })
      }

      return { org, profileId: entity.id }
    }),
  )

  await invalidateEvent('ORG_CREATED', result.org.id)
  if (isTeacher) await invalidatePersonalClassEvents(result.org.id)
  return result
}

// Ajoute un rôle à un espace perso existant. `created` : le profil vient d'être créé
// (false si le rôle existait déjà et que seul le rôle actif a changé).
export async function createPersonalProfile(params: {
  userId: string
  orgId: string
  role: PersonalRole
}) {
  const { userId, orgId, role } = params

  const result = await tryConstraint(
    prisma.$transaction(async (tx) => {
      const existing = await findPersonalProfileId(userId, orgId, role)

      await tx.userOrganization.update({
        where: { userId_orgId: { userId, orgId } },
        data: { role, status: 'ACTIVE' },
      })

      if (existing) return { profileId: existing, created: false }

      const entity = await createRoleSpecificEntity(tx, userId, role, orgId)
      if (!entity) throw new Error(`Création du profil ${role} impossible`)

      if (role === 'TEACHER') {
        await createPersonalClassTx(tx, { orgId, name: PERSONAL.NAME })
      }

      return { profileId: entity.id, created: true }
    }),
  )

  if (result.created && role === 'TEACHER') await invalidatePersonalClassEvents(orgId)
  return result
}