import { prisma } from "@/lib/prisma";
import type { UserStatus } from "@/generated/prisma/client";
import { tryConstraint } from "@/utils/server/prisma";
import { invalidateEvent } from "@/cache/server/key";

const ACTIVE_STATUS: UserStatus = "ACTIVE" as UserStatus;
const SUSPENDED_STATUS: UserStatus = "SUSPENDED" as UserStatus;
const INACTIVE_STATUS: UserStatus = "INACTIVE" as UserStatus;


// Suspend un membre ACTIVE d'une org. Une seule requête : le `where` porte
// à la fois l'identité (userId_orgId) et la garde de concurrence (status
// attendu ACTIVE). Si la ligne n'existe pas OU si son statut n'est pas
// ACTIVE (déjà SUSPENDED, ou PENDING/ON_LEAVE/INACTIVE), Prisma renvoie
// P2025 — traduit par tryConstraint. Le statut courant n'a PAS besoin
// d'être lu au préalable : l'UI connaît déjà l'état affiché et choisit la
// bonne fonction (suspend vs activate) au point d'appel.
export async function suspendOrgUser(userId: string, orgId: string) {
  const result = await tryConstraint(
    prisma.userOrganization.update({
      where: { userId_orgId: { userId, orgId }, status: ACTIVE_STATUS },
      data: { status: SUSPENDED_STATUS },
      select: { status: true },
    }),
  );

  await invalidateEvent("USER_ORGANIZATION_STATUS_CHANGED", orgId, userId);
  return result;
}

// Active un membre SUSPENDED. Symétrique — mêmes garanties, même coût
// (1 requête).
export async function activateOrgUser(userId: string, orgId: string) {
  const result = await tryConstraint(
    prisma.userOrganization.update({
      where: { userId_orgId: { userId, orgId }, status: SUSPENDED_STATUS },
      data: { status: ACTIVE_STATUS },
      select: { status: true },
    }),
  );

  await invalidateEvent("USER_ORGANIZATION_STATUS_CHANGED", orgId, userId);
  return result;
}

// Réintégration explicite d'un membre INACTIVE — flux séparé de
// activateOrgUser (décision produit confirmée : INACTIVE → ACTIVE n'est pas
// un aller-retour comme SUSPENDED, c'est une décision distincte qui mérite
// sa propre fonction nommée, même si le code reste simple). Pas de champ
// motif : l'AuditLog (qui, quand — posé côté action) suffit comme trace.
//
// Même pattern que activateOrgUser : une seule requête, garde de
// concurrence dans le where (status attendu INACTIVE).
export async function reintegrateUserOrganization(userId: string, orgId: string) {
  const result = await tryConstraint(
    prisma.userOrganization.update({
      where: { userId_orgId: { userId, orgId }, status: INACTIVE_STATUS },
      data: { status: ACTIVE_STATUS },
      select: { status: true },
    }),
  );

  await invalidateEvent("USER_ORGANIZATION_STATUS_CHANGED", orgId, userId);
  return result;
}