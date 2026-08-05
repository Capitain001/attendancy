// src/services/entity/validation.ts
// ═══════════════════════════════════════════════════════════════════════════
// RÉFÉRENCE COMMENTÉE — voir database/entity.queries.ts pour le mode d'emploi.
// ═══════════════════════════════════════════════════════════════════════════
//
// Valibot uniquement — jamais Zod.
// IDs : pipe(string(), uuid('Message')) — tous les IDs sont des UUID.
// Convention : createXSchema + InferInput<typeof createXSchema>.
//
// import { object, string, pipe, trim, minLength, maxLength, uuid } from 'valibot'
// import type { InferInput } from 'valibot'
//
// export const createEntitySchema = object({
//   name: pipe(string(), trim(), minLength(1, 'Nom requis'), maxLength(100)),
//   // référence vers une autre entité :
//   // parentId: pipe(string(), uuid('Référence invalide')),
// })
//
// export type CreateEntityInput = InferInput<typeof createEntitySchema>

export {}
