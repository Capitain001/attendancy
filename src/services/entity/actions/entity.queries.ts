// src/services/entity/actions/entity.queries.ts
// ═══════════════════════════════════════════════════════════════════════════
// RÉFÉRENCE COMMENTÉE — voir database/entity.queries.ts pour le mode d'emploi.
// ═══════════════════════════════════════════════════════════════════════════
//
// Query actions = la SEULE porte d'entrée du frontend (pages RSC incluses)
// vers les données. Pattern :
//   'use server' en tête de fichier
//   getUserInfo() → orgId depuis le token UNIQUEMENT
//   retour { data } / { error: string } — jamais de throw vers le client
//   suffixe Action, préfixe get (jamais list)
//
// Les données MÉTIER (entityId…) arrivent en paramètre depuis l'appelant —
// une action ne résout jamais son propre contexte métier en interne
// (voir SERVICE_CONTEXT.md §4-5).
//
// 'use server'
// import { getUserInfo } from '@/services/user/userInfo'
// import { ERRORS } from '@/config'
// import { getEntities, getEntity } from '../database'
//
// export async function getEntitiesAction() {
//   try {
//     const user = await getUserInfo()
//     const orgId = user?.organization?.id
//     if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
//     return { data: await getEntities(orgId) }
//   } catch (e) {
//     return { error: e instanceof Error ? e.message : ERRORS.SERVER }
//   }
// }
//
// export async function getEntityAction(entityId: string) {
//   try {
//     const user = await getUserInfo()
//     const orgId = user?.organization?.id
//     if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
//     return { data: await getEntity(entityId, orgId) }
//   } catch (e) {
//     return { error: e instanceof Error ? e.message : ERRORS.SERVER }
//   }
// }

export {}
