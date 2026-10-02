// src/lib/slug.ts
// Source unique des règles de génération du slug d'organisation (slug + nom), par type.
// Importable côté client ET serveur — aucune dépendance Node.
//
// EXTENSIBILITÉ : ORG_SLUG_POLICY `satisfies` Record<OrganizationType, ...>.
// Ajouter une valeur à l'enum OrganizationType fait échouer la compilation tant
// que la politique du nouveau type n'est pas déclarée ici — rien à oublier.
//
// Deux familles de politiques :
//   - generated: false (INSTITUTION) : le slug est saisi par l'utilisateur
//     (défaut = toSlug(nom)). buildOrgSlug() refuse ce type À LA COMPILATION
//     (GeneratedOrgType). Une collision est une erreur utilisateur
//     (« Ce slug est déjà pris »).
//     → Pour brancher plus tard une génération institutionnelle : passer l'entrée
//       INSTITUTION en `generated: true` et déclarer sa politique. Rien d'autre.
//   - generated: true (PERSONAL) : slug généré CÔTÉ SERVEUR uniquement.
//       slug : p_<nom>-<suffixe>  ex. p_jean-dupont-k3x9a2
//       name : P.<Nom>            ex. P.Jean Dupont
//     Le suffixe aléatoire porte l'unicité du slug (Organization.slug est
//     @unique global). Organization.name n'est PAS unique : deux enseignants
//     de même displayName produisent le même `name` affiché — accepté, ce
//     champ n'est qu'un libellé d'affichage, l'identité réelle est le slug.
//
// RÈGLE DE PRÉFIXE : tout préfixe non vide DOIT contenir `_`, caractère qu'aucune
// sortie de toSlug() ne produit. Ainsi un slug institutionnel généré ne peut jamais
// entrer en collision avec un slug typé, et aucun nom d'établissement légitime
// n'est refusé (un préfixe lisible type `perso-` interdirait « Perso Academy »).
// Vérifiée au chargement du module (assertion ci-dessous).
//
// ⚠️ Le préfixe sert à réserver l'espace de noms et à lire une URL —
//    JAMAIS à autoriser quoi que ce soit. Source de vérité : Organization.type.

import type { OrganizationType } from "@/generated/prisma/browser";

type ManualSlugPolicy = {
  generated: false;
  slugPrefix: "";
};

type GeneratedSlugPolicy = {
  generated: true;
  slugPrefix: string;
  uniqueSuffix: boolean; // true → suffixe aléatoire dans le slug
  fallbackLabel: string; // libellé si displayName est vide
  name: (label: string, suffix: string) => string;
};

type OrgSlugPolicy = ManualSlugPolicy | GeneratedSlugPolicy;

const ORG_SLUG_POLICY = {
  INSTITUTION: {
    generated: false,
    slugPrefix: "",
  },
  PERSONAL: {
    generated: true,
    slugPrefix: "p_",
    uniqueSuffix: true,
    fallbackLabel: "enseignant",
    name: (label) => `P.${label}`,
  },
} satisfies Record<OrganizationType, OrgSlugPolicy>;

// Types pour lesquels buildOrgSlug() est autorisé (dérivé de la politique).
export type GeneratedOrgType = {
  [K in OrganizationType]: (typeof ORG_SLUG_POLICY)[K] extends { generated: true } ? K : never;
}[OrganizationType];

// Garde-fou : un préfixe sans `_` pourrait entrer en collision avec toSlug().
for (const { slugPrefix } of Object.values(ORG_SLUG_POLICY)) {
  if (slugPrefix && !slugPrefix.includes("_")) {
    throw new Error(`ORG_SLUG_POLICY : le préfixe « ${slugPrefix} » doit contenir « _ »`);
  }
}

export const PERSONAL_SLUG_PREFIX = ORG_SLUG_POLICY.PERSONAL.slugPrefix;

// Segments racine déjà occupés par l'arbre de routes : un slug institutionnel
// ne doit pas les masquer (ex. `personal` → (attendancy)/personal/[slug]/...).
// ⚠️ À compléter avec les segments réels de src/app (auth, api, ...).
export const RESERVED_SLUGS = ["personal"] as const;

const SLUG_MAX_LENGTH = 50;
const SUFFIX_LENGTH = 6;

const RESERVED_PREFIXES = Object.values(ORG_SLUG_POLICY)
  .map((policy) => policy.slugPrefix)
  .filter(Boolean);

export function toSlug(value: string, maxLength = SLUG_MAX_LENGTH): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, maxLength);
}

export function isPersonalSlug(slug: string): boolean {
  return slug.startsWith(PERSONAL_SLUG_PREFIX);
}

// À brancher dans le schéma de validation du slug INSTITUTIONNEL : le formulaire
// permet l'édition manuelle du slug, la garde doit donc être serveur. Dérivée de
// la politique — un nouveau type préfixé est réservé automatiquement.
export function isReservedSlug(slug: string): boolean {
  return (
    RESERVED_PREFIXES.some((prefix) => slug.startsWith(prefix)) ||
    (RESERVED_SLUGS as readonly string[]).includes(slug)
  );
}

function randomSuffix(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(SUFFIX_LENGTH));
  return Array.from(bytes, (b) => (b % 36).toString(36)).join("");
}

// Génère { slug, name } pour un type d'org à identité générée (SERVEUR uniquement).
// Contrairement au slug (suffixe porte l'unicité, @unique global), `name`
// n'est plus garanti unique depuis la levée de la contrainte DB — voir
// l'en-tête du fichier.
export function buildOrgSlug(type: GeneratedOrgType, displayName?: string | null): { slug: string; name: string } {
  const policy: GeneratedSlugPolicy = ORG_SLUG_POLICY[type];
  const suffix = policy.uniqueSuffix ? randomSuffix() : "";
  const label = displayName?.trim() || policy.fallbackLabel;

  const baseMax = SLUG_MAX_LENGTH - policy.slugPrefix.length - (suffix ? SUFFIX_LENGTH + 1 : 0);
  const base = toSlug(label, baseMax).replace(/-+$/, "");

  const slug = `${policy.slugPrefix}${[base, suffix].filter(Boolean).join("-")}`;
  if (!slug) throw new Error(`buildOrgSlug(${type}) : slug vide (libellé, préfixe et suffixe vides)`);

  return { slug, name: policy.name(label, suffix) };
}