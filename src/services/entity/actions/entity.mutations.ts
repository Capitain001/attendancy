// src/services/entity/actions/entity.mutations.ts
// =============================================================================
// REFERENCE COMMENTEE - voir database/entity.queries.ts pour le mode d'emploi.
// =============================================================================
//
// Mutation actions. Pattern complet :
//   'use server' -> v.safeParse (Valibot) -> authAccess (role + orgId token) ->
//   database/ -> audit si critique -> { data }/{ error }
//
// Audit (logAuditAsync, fire-and-forget) : DELETE toujours ; UPDATE sensible ;
// CREATE critique. Jamais sur les queries.
//
// Ordre des opérations :
//   1. Validation des données (hors try/catch)
//   2. Authentification et autorisation
//   3. Opération métier + audit (dans try/catch)
//
// 'use server'
// import * as v from 'valibot'
// import { authAccess } from '@/modules/auth'
// import { ERRORS } from '@/config'
// import { createEntitySchema } from '../validation'
// import { createEntity, removeEntity } from '../database'
// import { logAuditAsync } from '@/utils/server/audit'
//
// export async function createEntityAction(input: unknown) {
//   // 1. Validation des données (hors try/catch)
//   const parsed = v.safeParse(createEntitySchema, input)
//   if (!parsed.success) {
//     return { error: parsed.issues[0]?.message ?? 'Donnees invalides' }
//   }
//
//   // 2. Authentification et autorisation
//   const auth = await authAccess({ requiredRole: 'ADMIN' })
//   if (!auth.data) return { error: auth.error }
//   const { orgId } = auth.data
//
//   // 3. Opération métier (dans try/catch)
//   try {
//     const entity = await createEntity({ ...parsed.output, orgId })
//     return { data: entity }
//   } catch (error) {
//     return { error: error instanceof Error ? error.message : ERRORS.SERVER }
//   }
// }
//
// export async function removeEntityAction(entityId: string) {
//   // 1. Authentification et autorisation (pas de validation pour un ID simple)
//   const auth = await authAccess({ requiredRole: 'ADMIN' })
//   if (!auth.data) return { error: auth.error }
//   const { user, orgId } = auth.data
//
//   // 2. Opération métier + audit (dans try/catch)
//   try {
//     const result = await removeEntity(entityId, orgId)
//
//     // Audit (fire-and-forget) - DELETE toujours audité
//     logAuditAsync({
//       userId: user.id,
//       orgId,
//       action: 'DELETE',
//       resource: 'ENTITY',
//       resourceId: entityId,
//       actor: { name: user.name, email: user.email },
//     })
//
//     return { data: result }
//   } catch (error) {
//     return { error: error instanceof Error ? error.message : ERRORS.SERVER }
//   }
// }

export {}