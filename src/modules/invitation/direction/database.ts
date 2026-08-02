// src/services/invitation/direction/database.ts
import { prisma } from "@/lib/prisma";
import type { Function as PrismaFunction } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { CACHE } from "@/config/cache";

/**
 * Vérifie que les fonctions existent dans l'organisation
 * 
 * @param functionNames - Noms des fonctions à valider
 * @param orgId - ID de l'organisation
 * @returns Liste des fonctions valides et invalides
 */
export function checkFunctionsExist(
  functionNames: string[],
  orgId: string
): Promise<{ valid: string[]; invalid: string[] }> {
  return unstable_cache(
    async () => {
      if (functionNames.length === 0) {
        return { valid: [], invalid: [] };
      }

      const functions = await prisma.function.findMany({
        where: {
          orgId,
          name: {
            in: functionNames,
          },
        },
        select: {
          name: true,
        },
      });

      const validNames = new Set(functions.map((f) => f.name));
      const valid: string[] = [];
      const invalid: string[] = [];

      functionNames.forEach((name) => {
        if (validNames.has(name)) {
          valid.push(name);
        } else {
          invalid.push(name);
        }
      });

      return { valid, invalid };
    },
    ["check-functions", orgId, ...functionNames.sort()],
    { revalidate: 300, tags: [CACHE.FUNCTIONS(orgId)] }
  )();
}

/**
 * Récupère les fonctions d'une organisation par leurs noms
 * 
 * @param functionNames - Noms des fonctions à récupérer
 * @param orgId - ID de l'organisation
 * @returns Liste des fonctions trouvées
 */
export function getFunctionsByNames(
  functionNames: string[],
  orgId: string
): Promise<PrismaFunction[]> {
  return unstable_cache(
    async () => {
      if (functionNames.length === 0) {
        return [];
      }

      return prisma.function.findMany({
        where: {
          orgId,
          name: {
            in: functionNames,
          },
        },
      });
    },
    ["functions-by-names", orgId, ...functionNames.sort()],
    { revalidate: 300, tags: [CACHE.FUNCTIONS(orgId)] }
  )();
}

/**
 * Vérifie si toutes les fonctions existent dans l'organisation
 * 
 * @param functionNames - Noms des fonctions à vérifier
 * @param orgId - ID de l'organisation
 * @returns true si toutes les fonctions existent, false sinon
 */
export function allFunctionsExist(
  functionNames: string[],
  orgId: string
): Promise<boolean> {
  return unstable_cache(
    async () => {
      if (functionNames.length === 0) {
        return false;
      }

      const count = await prisma.function.count({
        where: {
          orgId,
          name: {
            in: functionNames,
          },
        },
      });

      return count === functionNames.length;
    },
    ["all-functions-exist", orgId, ...functionNames.sort()],
    { revalidate: 300, tags: [CACHE.FUNCTIONS(orgId)] }
  )();
}

