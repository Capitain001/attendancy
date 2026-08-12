import { CACHE } from '@/cache/server/key'

export const UE_TEMPLATE_GRAPH = {
  // L'importation d'un programme invalide la liste des programmes et UEs
  // de l'organisation concernée, pour rafraîchir l'interface (Program, UE).
  // La liste des templates n'est jamais invalidée car elle est globale
  // et immutable côté utilisateur.
  PROGRAM_TEMPLATE_APPLIED: (orgId: string) => [
    CACHE.ORG_PROGRAM_TEMPLATE(orgId),
    CACHE.ORG_UE_TEMPLATE(orgId),
    CACHE.PROGRAM(orgId),
    CACHE.UE(orgId),
    CACHE.DEPARTMENT(orgId),
    CACHE.PROGRAM_TRACK(orgId),
  ],
} as const
