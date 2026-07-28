// src/services/entity/actions/entity.mutations.ts
// ═══════════════════════════════════════════════════════════════════════════
// RÉFÉRENCE COMMENTÉE — voir database/entity.queries.ts pour le mode d'emploi.
// ═══════════════════════════════════════════════════════════════════════════
//
// Mutation actions. Pattern complet :
//   'use server' → getUserInfo → orgId (token) → getAuthorization (rôle) →
//   v.parse (Valibot) → database/ → audit si critique → { data }/{ error }
//
// Audit (logAuditAsync, fire-and-forget) : DELETE toujours ; UPDATE sensible ;
// CREATE critique. Jamais sur les queries.
//
// 'use server'
// import * as v from 'valibot'
// import { getUserInfo } from '@/services/user/userInfo'
// import { getAuthorization } from '@/services/auth/authorization'
// import { ERRORS } from '@/config'
// import { createEntitySchema } from '../validation'
// import { createEntity, removeEntity } from '../database'
// import { logAuditAsync } from '@/utils/server/audit'
//
// export async function createEntityAction(input: unknown) {
//   try {
//     const user = await getUserInfo()
//     if (!user?.id) throw new Error(ERRORS.AUTH.UNAUTHORIZED)
//
//     const orgId = user.organization?.id
//     if (!orgId) throw new Error(ERRORS.ORG.NOT_FOUND)
//
//     const auth = getAuthorization(user, 'ADMIN')
//     if (!auth.success) throw new Error(auth.error)
//
//     const parsed = v.parse(createEntitySchema, input)
//
//     const entity = await createEntity({ ...parsed, orgId })
//     return { data: entity }
//   } catch (error) {
//     return { error: error instanceof Error ? error.message : ERRORS.SERVER }
//   }
// }
//
// export async function removeEntityAction(entityId: string) {
//   try {
//     const user = await getUserInfo()
//     if (!user?.id) throw new Error(ERRORS.AUTH.UNAUTHORIZED)
//
//     const orgId = user.organization?.id
//     if (!orgId) throw new Error(ERRORS.ORG.NOT_FOUND)
//
//     const auth = getAuthorization(user, 'ADMIN')
//     if (!auth.success) throw new Error(auth.error)
//
//     const result = await removeEntity(entityId, orgId)
//     logAuditAsync({
//       userId: user.id,
//       orgId,
//       action: 'DELETE',
//       resource: 'ENTITY',
//       resourceId: entityId,
//       actor: { name: user.name, email: user.email },
//     })
//     return { data: result }
//   } catch (error) {
//     return { error: error instanceof Error ? error.message : ERRORS.SERVER }
//   }
// }

export {}
