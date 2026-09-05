import { prisma } from "@/lib/prisma";

export class SeedingNotAllowedError extends Error {}

// Double garde-fou, volontairement redondant : ce service est écrit pour
// être déclenché depuis un panel — une erreur humaine (mauvais orgId
// sélectionné dans un dropdown) ne doit JAMAIS pouvoir injecter des centaines
// de faux comptes dans une organisation réelle.
//
// 1) NODE_ENV : bloque tout appel en production, sauf override explicite
//    (utile pour un environnement de démo qui tourne en mode "production"
//    mais reste une sandbox assumée).
// 2) Organization.details.isProduction : convention à adopter côté
//    provisioning des orgs de test/démo — si absente, traitée comme false
//    (n'empêche pas la fonction de marcher tant que ce n'est pas en place,
//    mais permet de marquer explicitement une org comme protégée même en
//    dehors de NODE_ENV=production, ex: une org cliente pilote en staging).
export async function ensureSeedingAllowed(orgId: string) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED_IN_PRODUCTION !== "true") {
    throw new SeedingNotAllowedError(
      "Génération de données de test désactivée en production (variable ALLOW_SEED_IN_PRODUCTION non définie).",
    );
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, details: true },
  });

  if (!org) throw new SeedingNotAllowedError("Organisation introuvable.");

  const details = (org.details as Record<string, unknown> | null) ?? {};
  if (details.isProduction === true) {
    throw new SeedingNotAllowedError(
      "Cette organisation est marquée comme organisation de production (details.isProduction) — génération bloquée.",
    );
  }
}
