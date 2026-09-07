/**
 * scripts/generate/referentiel/config.ts
 * Configuration du générateur — TOUT ce qui est spécifique à un projet/
 * réorganisation de dossiers vit ici, jamais dans referentiel.ts. Objectif :
 * réutiliser le générateur tel quel après un futur déplacement de services,
 * en ne touchant que ce fichier.
 */

// ─────────────────────────────────────────────────────────────────────────────
// IGNORED_SERVICES — dossiers exclus de la classification MODEL/DOMAIN
// ─────────────────────────────────────────────────────────────────────────────
//
// Contexte : certains services ont été déplacés vers src/modules/ (éléments
// transverses, indépendants du domaine métier du projet — auth, subscription,
// audit…). Certains gardent encore un dossier-relais sous src/services/
// (ex. un simple `export * from '@/modules/<x>'`) le temps de la migration —
// ces dossiers-relais n'ont ni database/ ni actions/ complet, donc le
// générateur les classerait à tort en DOMAIN (aucun modèle Prisma
// correspondant) ou plante sur un scan incomplet.
//
// path : chemin relatif à la racine du projet (src/services/<dossier>),
//        DOIT correspondre exactement au nom de dossier tel que lu par
//        fs.readdirSync — pas d'espace, pas de casse différente.
// reason : pourquoi ce service est ignoré — jamais un simple nom sans
//          justification, pour qu'un futur mainteneur sache s'il peut
//          retirer l'entrée une fois la migration terminée.
export const IGNORED_SERVICES = [
  {
    path: "src/services/audit",
    reason: "Déplacé vers src/modules/audit — dossier-relais (re-export) sans database/actions complet.",
  },
  {
    path: "src/services/auth",
    reason: "Déplacé vers src/modules/auth — dossier-relais (re-export) sans database/actions complet.",
  },
  // … ajouter ici chaque service relais au fur et à mesure de la migration
  // vers src/modules/. Retirer l'entrée seulement quand le dossier
  // src/services/<x> est supprimé pour de bon (plus de relais du tout).
] as const satisfies readonly { path: string; reason: string }[];

export type IgnoredServiceEntry = (typeof IGNORED_SERVICES)[number];

// Noms de dossiers seuls (dernier segment de path), pour un lookup rapide
// par folderName pendant le scan de src/services/.
export const IGNORED_SERVICE_FOLDER_NAMES = new Set(
  IGNORED_SERVICES.map((entry) => entry.path.split("/").pop()!),
);