// src/services/entity/constants.ts
// ═══════════════════════════════════════════════════════════════════════════
// RÉFÉRENCE COMMENTÉE — voir database/entity.queries.ts pour le mode d'emploi.
// ═══════════════════════════════════════════════════════════════════════════
//
// Constantes du domaine. Enum aligné compile-time sur Prisma via
// `as const satisfies readonly EnumType[]` + labels en Record.
//
// import type { EntityKind } from '@/generated/prisma/browser'
//
// export const ENTITY_KINDS = ['KIND_A', 'KIND_B'] as const satisfies readonly EntityKind[]
// export type EntityKindValue = (typeof ENTITY_KINDS)[number]
//
// export const ENTITY_KIND_LABELS: Record<EntityKindValue, string> = {
//   KIND_A: 'Libellé A',
//   KIND_B: 'Libellé B',
// }

export {}
