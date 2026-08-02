// src/services/entity/actions/entity.queries.ts
// =============================================================================
// REFERENCE COMMENTEE - voir database/entity.queries.ts pour le mode d'emploi.
// =============================================================================
//
// Query actions = la SEULE porte d'entree du frontend (pages RSC incluses)
// vers les donnees. Pattern :
//   'use server' en tete de fichier
//   authAccess() -> orgId depuis le token UNIQUEMENT
//   retour { data } / { error: string } - jamais de throw vers le client
//   suffixe Action, prefixe get (jamais list)
//
// Les donnees METIER (entityId...) arrivent en parametre depuis l'appelant.
// Une action ne resout jamais son propre contexte metier en interne
// (voir SERVICE_CONTEXT.md sections 4-5).
//
// Ordre des opérations pour les queries :
//   1. Authentification et autorisation
//   2. Opération métier (dans try/catch)
//
// Note : Pas de validation pour les queries car les paramètres sont
// typés et proviennent de l'appelant (pas de saisie utilisateur directe).
//
// 'use server'
// import { authAccess } from '@/modules/auth'
// import { ERRORS } from '@/config'
// import { getEntities, getEntity } from '../database'
//
// export async function getEntitiesAction() {
//   // 1. Authentification et autorisation
//   const auth = await authAccess()
//   if (!auth.data) return { error: auth.error }
//   const { orgId } = auth.data
//
//   // 2. Opération métier (dans try/catch)
//   try {
//     return { data: await getEntities(orgId) }
//   } catch (error) {
//     return { error: error instanceof Error ? error.message : ERRORS.SERVER }
//   }
// }
//
// export async function getEntityAction(entityId: string) {
//   // 1. Authentification et autorisation
//   const auth = await authAccess()
//   if (!auth.data) return { error: auth.error }
//   const { orgId } = auth.data
//
//   // 2. Opération métier (dans try/catch)
//   try {
//     return { data: await getEntity(entityId, orgId) }
//   } catch (error) {
//     return { error: error instanceof Error ? error.message : ERRORS.SERVER }
//   }
// }

export {}