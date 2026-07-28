// src/services/entity/database/entity.mutations.ts
// ═══════════════════════════════════════════════════════════════════════════
// RÉFÉRENCE COMMENTÉE — voir entity.queries.ts pour le mode d'emploi.
// ═══════════════════════════════════════════════════════════════════════════
//
// Couche database/ mutations :
//   - tryConstraint() autour de chaque appel Prisma → erreurs DB lisibles
//   - invalidateEvent('EVENT', …) APRÈS chaque mutation réussie
//   - orgId dans le where (multi-tenant strict) — jamais en confiance aveugle
//   - remove* = soft delete (deletedAt) ; delete* = hard delete (rare)
//   - types payload : Pick<ModelGroupByOutputType, …> & { orgId: string }
//   - pas de Promise<> explicite — TypeScript infère
//
// import { prisma } from '@/lib/db'
// import { tryConstraint } from '@/utils/server/prisma'
// import { invalidateEvent } from '@/cache/server/key'
// import type { EntityGroupByOutputType } from '@/generated/prisma/models/Entity'
//
// export type CreateEntityData =
//   Pick<EntityGroupByOutputType, 'name'> & { orgId: string }
//
// export async function createEntity({ orgId, ...data }: CreateEntityData) {
//   const result = await tryConstraint(
//     prisma.entity.create({
//       data: { ...data, orgId },
//       select: { id: true },
//     })
//   )
//   await invalidateEvent('ENTITY_CREATED', orgId)
//   return result
// }
//
// export async function removeEntity(entityId: string, orgId: string) {
//   const result = await tryConstraint(
//     prisma.entity.update({
//       where: { id: entityId, orgId, deletedAt: null },
//       data: { deletedAt: new Date() },
//       select: { id: true },
//     })
//   )
//   await invalidateEvent('ENTITY_REMOVED', orgId, entityId)
//   return result
// }

export {}
