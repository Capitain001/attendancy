// src/services/entity/cache.ts
// ═══════════════════════════════════════════════════════════════════════════
// RÉFÉRENCE COMMENTÉE — voir database/entity.queries.ts pour le mode d'emploi.
// ═══════════════════════════════════════════════════════════════════════════
//
// <SERVICE>_GRAPH : événement métier → tags à invalider.
// À enregistrer dans src/cache/server/key.ts (import + spread dans CACHE_GRAPH).
//
// Cross-service : si la query d'un autre service inclut cette entité dans son
// select, invalider AUSSI son tag ici — sinon son cache sert des données mortes.
//
// import { CACHE } from '@/cache/server/key'
//
// export const ENTITY_GRAPH = {
//   ENTITY_CREATED: (orgId: string) => [
//     CACHE.ENTITY(orgId),
//   ],
//   ENTITY_UPDATED: (orgId: string, entityId: string) => [
//     CACHE.ENTITY(orgId),
//     CACHE.ENTITY(orgId, entityId),
//   ],
//   ENTITY_DELETED: (orgId: string, entityId: string) => [
//     CACHE.ENTITY(orgId),
//     CACHE.ENTITY(orgId, entityId),
//     // cross-service : CACHE.RESOURCE(orgId) si resource inclut entity
//   ],
// } as const

export {}
