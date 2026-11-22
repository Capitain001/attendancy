// src/services/function/cache.ts
import { CACHE } from '@/cache/server/key';

// Changer les fonctions d'un utilisateur change SES droits effectifs (hérités des fonctions) :
// on expire donc aussi son tag de permissions. userId est obligatoire : un oubli à l'appel
// laisserait des droits périmés en cache, la compilation doit l'empêcher.
const userFunctionTags = (orgId: string, userId: string) => [
  CACHE.FUNCTION(orgId),
  CACHE.USER_FUNCTIONS(orgId, userId),
  CACHE.PERMISSION(orgId, userId),
]

export const FUNCTION_GRAPH = {
  FUNCTION_CREATED: (orgId: string) => [CACHE.FUNCTION(orgId)],
  FUNCTION_UPDATED: (orgId: string) => [CACHE.FUNCTION(orgId)],
  // Supprimer une fonction retire ses permissions et ses assignations : les droits effectifs
  // de TOUS ses membres changent, dont la liste n'est pas connue ici → tag d'organisation.
  FUNCTION_DELETED: (orgId: string) => [CACHE.FUNCTION(orgId), CACHE.PERMISSION(orgId)],
  FUNCTION_ASSIGNED: userFunctionTags,
  FUNCTION_UNASSIGNED: userFunctionTags,
  // Remplacement ou retrait en lot des fonctions d'un utilisateur (service direction)
  USER_FUNCTIONS_UPDATED: userFunctionTags,
} as const