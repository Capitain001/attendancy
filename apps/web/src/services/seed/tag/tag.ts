import crypto from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";

export type SeedKind = "teacher" | "student" | "parent";

// L'index signature (typé sur Prisma.InputJsonValue, pas `unknown`) est ce
// qui rend SeedMark assignable au champ Json de Prisma : InputJsonObject
// exige un index [key: string]: InputJsonValue, et TS ne le déduit pas
// automatiquement à partir de propriétés nommées seules — sans lui,
// `details: buildSeedMark(...)` échoue à la compilation avec "Index
// signature for type 'string' is missing".
export interface SeedMark {
  seed: true;
  seedBatchId: string;
  seedKind: SeedKind;
  seedCreatedAt: string; // ISO — pratique pour trier/filtrer dans un panel
  [key: string]: Prisma.InputJsonValue;
}

export function createSeedBatchId(): string {
  return crypto.randomUUID();
}

export function buildSeedMark(seedBatchId: string, seedKind: SeedKind): SeedMark {
  return {
    seed: true,
    seedBatchId,
    seedKind,
    seedCreatedAt: new Date().toISOString(),
  };
}

// Filtres Prisma sur le champ Json User.details — c'est le SEUL endroit du
// schéma où poser une marque sans migration (Teacher/Student/Parent n'ont
// pas de champ Json propre, cf. purge.ts pour la conséquence).
export function seedFilterByBatch(seedBatchId: string) {
  return { details: { path: ["seedBatchId"], equals: seedBatchId } } as const;
}

export function seedFilterAny() {
  return { details: { path: ["seed"], equals: true } } as const;
}
