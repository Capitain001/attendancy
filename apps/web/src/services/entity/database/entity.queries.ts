// src/services/entity/database/entity.queries.ts
// ═══════════════════════════════════════════════════════════════════════════
// RÉFÉRENCE COMMENTÉE — le service `entity` illustre le pattern complet sans
// exiger de modèle Prisma. Pour créer un vrai service : copier le dossier,
// remplacer Entity/entity par le modèle du projet, décommenter, adapter.
// ═══════════════════════════════════════════════════════════════════════════
//
// Couche database/ = Prisma pur. AUCUNE auth ici — l'orgId arrive en paramètre
// depuis l'action (qui l'a extrait du token). Chaque query :
//   - "use cache" en PREMIÈRE instruction du corps
//   - cacheTag() aligné sur le registre CACHE (liste + détail)
//   - cacheLife() depuis le profil du registre
//   - select explicite — jamais de findMany({}) sans select
//   - deletedAt: null si le modèle a soft-delete
//   - paramètres contextuels : entityId, pas id
//
// import { cacheTag, cacheLife } from 'next/cache'
// import { prisma } from '@/lib/db'
// import { CACHE } from '@/cache/server/key'
//
// // LISTE — tag de liste uniquement
// export async function getEntities(orgId: string) {
//   'use cache'
//   cacheTag(CACHE.ENTITY(orgId))
//   cacheLife(CACHE.ENTITY.life)
//   return prisma.entity.findMany({
//     where: { orgId, deletedAt: null },
//     select: { id: true, name: true },
//     orderBy: { name: 'asc' },
//   })
// }
//
// // DÉTAIL — les DEUX tags (liste + détail) : une mutation du détail doit
// // aussi invalider les listes qui le contiennent
// export async function getEntity(entityId: string, orgId: string) {
//   'use cache'
//   cacheTag(CACHE.ENTITY(orgId))
//   cacheTag(CACHE.ENTITY(orgId, entityId))
//   cacheLife(CACHE.ENTITY.life)
//   return prisma.entity.findFirst({
//     where: { id: entityId, orgId, deletedAt: null },
//     select: { id: true, name: true, createdAt: true },
//   })
// }

export {}
