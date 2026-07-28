/**
 * //scripts/generate-api/config.ts
 * Configuration du générateur — TOUT ce qui est spécifique à un projet/domaine
 * métier vit ici, jamais dans generate-api.ts. Objectif : réutiliser le
 * générateur tel quel sur un autre projet en ne touchant que ce fichier.
 */

// ─────────────────────────────────────────────────────────────────────────────
// ORG_ID_CHECK — assertion de scope tenant (§5 du skill)
// ─────────────────────────────────────────────────────────────────────────────
//
// enabled     : false désactive complètement le check (projet non multi-tenant,
//               ou scope vérifié par un autre mécanisme — RLS, middleware, etc.).
// fieldName   : nom du champ de scope tenant dans le schéma Prisma. Changer ici
//               (ex. "tenantId", "companyId", "accountId") suffit à adapter tout
//               le check — le script ne connaît plus jamais la string en dur.
// exemptFns   : fns totalement exemptées (pas de warn du tout).
//               Raisons valides : lookup par clé globale unique (userId) ou scope
//               vérifié par un autre mécanisme non traçable statiquement.
// exemptDirs  : répertoires entiers exemptés (super-admin, auth). Chemins relatifs
//               à la racine du projet, doivent matcher le préfixe de fileRel tel
//               que produit par relPath() (donc sans espace ni typo).
// globalModels  : modèles Prisma dont l'id est global-unique (pas de scope
//                 tenant nécessaire).
// profileModels : modèles "profil" scopés par tenant (ex. après migration
//                 @@unique([userId, orgId])). Pour ces modèles, un lookup sans
//                 le champ de scope dans le where racine est ambigu — message
//                 dédié plus explicite que le warn générique.
// messages    : gabarits de message, paramétrés par fieldName — à adapter si le
//               vocabulaire métier change (ex. mentionner la migration réelle).
export const ORG_ID_CHECK = {
  enabled: true,

  fieldName: "orgId",

  exemptFns: [
    // ⚠ À ÉTENDRE PAR PROJET — fns exemptées du check (lookup par clé globale
    // unique, ex. userId) :
    // "getProfileIdByUserId",
  ],

  exemptDirs: [
    // ⚠ À ÉTENDRE PAR PROJET — répertoires exemptés (auth, super-admin…) :
    "src/services/auth/",
  ],

  globalModels: ["User"],

  // ⚠ À ÉTENDRE PAR PROJET — modèles "profil" scopés par tenant
  // (@@unique([userId, orgId])), ex. : ["Member", "Owner"]
  profileModels: [],

  messages: {
    absent: (model: string, method: string, fieldName: string) =>
      `prisma.${model}.${method} : where racine sans ${fieldName} — scope non vérifié`,
    nested: (model: string, method: string, fieldName: string) =>
      `prisma.${model}.${method} : ${fieldName} possiblement imbriqué dans where/select — relecture requise`,
    absentProfile: (model: string, method: string, fieldName: string) =>
      `prisma.${model}.${method} : modèle profil — ${fieldName} absent du where racine. Un lookup sur un modèle scopé par tenant est ambigu sans ce champ (retourne potentiellement le mauvais profil si l'utilisateur appartient à plusieurs tenants).`,
    nestedProfile: (model: string, method: string, fieldName: string) =>
      `prisma.${model}.${method} : modèle profil — ${fieldName} imbriqué dans where/select. Vérifier que le filtre couvre bien le bon profil tenant.`,
  },
} as const;

export type OrgIdCheckConfig = typeof ORG_ID_CHECK;

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT_LAYOUT — conventions de fichiers/imports du projet
// ─────────────────────────────────────────────────────────────────────────────
//
// pathAlias : alias TS résolu par le générateur (doit correspondre au
//             tsconfig.json du projet — baseUrl + paths).
// dirNames  : noms des sous-dossiers "couche DB" et "couche action" à l'intérieur
//             d'un service. Un service peut aussi n'avoir qu'un fichier plat
//             (`${dirNames.db}.ts` / `${dirNames.actions}.ts}`) au lieu d'un
//             dossier — les deux formes sont supportées.
export const PROJECT_LAYOUT = {
  pathAlias: {
    baseUrl: ".",             // relatif à la racine du projet (ROOT)
    paths: { "@/*": ["./src/*"] },
  },
  servicesRoot: "src/services",
  dirNames: {
    db: "database",
    actions: "actions",
  },
} as const;

export type ProjectLayoutConfig = typeof PROJECT_LAYOUT;
