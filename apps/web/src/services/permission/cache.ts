// src/services/permission/cache.ts
import { CACHE } from '@/cache/server/key';

// Tout changement de droits expire DEUX tags : celui de l'organisation (permissions effectives,
// qui agrègent droits directs et droits hérités des fonctions) et celui de la cible
// (utilisateur ou fonction) pour les lectures ciblées.
const permissionTags = (orgId: string, scopeId?: string) => [
  CACHE.PERMISSION(orgId),
  ...(scopeId ? [CACHE.PERMISSION(orgId, scopeId)] : []),
]

export const PERMISSION_GRAPH = {
  PERMISSION_GRANTED: permissionTags,
  PERMISSION_REVOKED: permissionTags,
} as const