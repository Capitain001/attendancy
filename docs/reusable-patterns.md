# Patterns réutilisables du projet

Ce document liste les éléments du projet qui sont des **patterns** ou des **briques réutilisables** plutôt que des contenus métier spécifiques.

> Objectif : distinguer ce qui peut être extrait dans un template ou utilisé dans un autre projet, de ce qui appartient au domaine métier `attendancy`.

## Sommaire

- [1. Patterns d'architecture généraux](#1-patterns-darchitecture-g%C3%A9n%C3%A9raux)
  - [1.1 Pattern `service-module`](#11-pattern-service-module)
  - [1.2 `src/utils/server`](#12-srcutilsserver)
  - [1.3 `src/lib/export`](#13-srclibexport)
  - [1.4 `src/hooks/entity`](#14-srchokssentity)
  - [1.5 `src/hooks/notification` et `src/hooks/auth`](#15-srchooksnotification-et-srchooksauth)
- [2. Modules patternables](#2-modules-patternables)
  - [2.1 `@/modules/audit`](#21-modulesaudit)
  - [2.2 `@/modules/notification`](#22-modulesnotification)
  - [2.3 `@/modules/auth`](#23-modulesauth)
  - [2.4 `@/modules/user`](#24-modulesuser)
- [3. Patterns métier du projet (non réutilisables en l'état)](#3-patterns-m%C3%A9tier-du-projet-non-r%C3%A9utilisables-en-l%C3%A9tat)
  - [3.1 `src/hooks/data/<domain>/`](#31-srchooksdatadomain)
  - [3.2 `src/services/<service>/` métier](#32-srcservicesservice-m%C3%A9tier)
- [4. Comment repérer un pattern réutilisable](#4-comment-rep%C3%A9rer-un-pattern-r%C3%A9utilisable)
- [5. Exemples de patternables que l’on peut extraire dans un template](#5-exemples-de-patternables-que-lon-peut-extraire-dans-un-template)
- [6. Recommandation](#6-recommandation)
- [7. Comment scinder un projet template](#7-comment-scinder-un-projet-template)

## 1. Patterns d'architecture généraux

Ces éléments ne sont pas liés à un modèle métier précis. Ils sont généralement réutilisables d’un projet à l’autre.

### 1.1 Pattern `service-module`

Le pattern principal du projet est :

- `src/services/<module>/` = service métier propriétaire d’un modèle.
- `src/modules/<module>/` = module core réutilisable, sans dépendance Prisma ni auth.
- `database/` = Prisma uniquement.
- `actions/` = Server Actions, auth, adaptation métier.
- `cache.ts`, `validation.ts`, `types.ts`, `CLAUDE.md`.
- `index.ts` = barrel vers `actions` + `types` seulement.

Exemples :

- `apps/web/src/services/entity/` = exemple canonique du pattern.
- `apps/web/src/services/notification/` = service métier couplé.
- `apps/web/src/modules/notification/` = version reusable sans Prisma.

### 1.2 `src/utils/server`

Utilitaires serveur partagés et réutilisables :

- `src/utils/server/prisma.ts` — gestion des erreurs Prisma et normalisation.
- `src/utils/server/audit.ts` — journal d’audit `logAudit` / `logAuditAsync`.
- `src/utils/server/debug.ts` — debug Prisma et bus d’événements.

Ces fichiers sont des patterns d’infrastructure pour tout projet serveur Next.js + Prisma.

### 1.3 `src/lib/export`

Module d’export générique de documents / tableaux :

- `src/lib/export/index.ts`
- `src/lib/export/types.ts`

C’est une brique réutilisable pour l’export CSV / XLSX / JSON / print.

### 1.4 `src/hooks/entity`

Couche client générique de gestion d’entités :

- `useEntity.ts`
- `useCrudEntity.ts`
- `useEntityFilter.ts`
- `actionHelpers.ts`
- `types.ts`
- `cache.ts`
- `utils.ts`

Ce dossier contient le pattern de base du CRUD client/React Query indépendant du domaine métier.

### 1.5 `src/hooks/*` utilitaires génériques

Hooks transverses indépendants du domaine métier :

- `use-realtime-draggable-item.ts`
- `use-event-visibility.ts`
- `use-infinite-query.ts`
- `use-is-in-view.tsx`
- `use-local-storage.ts`
- `use-mobile.ts`

Ces hooks montrent un pattern utilitaire réutilisable pour les interactions UI et les comportements client.

### 1.6 `src/cache/server`

Moteur de cache générique pour Next 16 :

- `engine.ts` — clé/tag scoped + invalidation generique `invalidateCache` / `invalidateEvent`
- `key.ts` — registre de clés métiers et de profils `cacheLife`

Ce pattern est indépendant du domaine applicatif et peut être copié dans d’autres projets Next.js.

### 1.7 `src/store`

Stores Zustand partagés :

- `userStore.ts` — modèle de référence pour un store client partagé

Règle : stocker uniquement l’état client partagé, jamais des données déjà gérées par React Query.

### 1.8 `src/components/tools` et UI réutilisables

Composants d’interface génériques :

- `src/components/tools/ReusableDialog.tsx`
- `src/components/tools/ReusablePopover.tsx`
- `src/components/ui/ExportButton.tsx`

Ces composants servent de pattern UI réutilisable pour dialogues, popovers et export table.

### 1.9 `src/services/*/policy.ts`

Règles métier partagées client/serveur :

- `src/services/attendance/policy.ts`
- `src/services/session/policy.ts`
- `src/services/planning/queries.ts` (prefetch + cache)

Ces fichiers exposent un pattern de logic reusable entre UI et serveurs de service.

### 1.10 `src/services/schedule/utils.ts`

Selects et helpers réutilisables exposés aux consommateurs du service planning.

### 1.11 `src/services/SPECIAL_SERVICES.md`

Documentation des exceptions au pattern standard : utile pour décider ce qui doit rester spécifique et ce qui peut être extrait.

### 1.12 `src/services/entity/` et `src/services/notification/`

Ces hooks adaptent des modules réutilisables pour l’UI :

- `src/hooks/notification/*` utilise `@/modules/notification`
- `src/hooks/auth/*` utilise `@/modules/auth`

Ils sont un bon exemple de couches métier légères qui restent consommatrices de patterns réutilisables.

## 2. Modules patternables

Certains modules sont déjà conçus comme des briques réutilisables, même s’ils sont utilisés dans ce projet.

### 2.1 `@/modules/audit`

- Service de journalisation immuable.
- `logAuditAsync` est fire-and-forget.
- `resource` enregistré en string pour rester stable.
- Peut être extrait comme pattern de traçabilité audit dans d’autres projets.

### 2.2 `@/modules/notification`

- Core de notifications Web Push et in-app.
- Zéro Prisma, zéro auth dans le module core.
- Service `@/services/notification` apporte le couplage métier + cache + org.

### 2.3 `@/modules/auth`

- Auth core réutilisable.
- Gestion des actions d’authentification, des providers OAuth, des sessions.
- Doit être importé via `@/modules/auth` quand on veut du code réutilisable.

### 2.4 `@/modules/user`

- Logique utilisateur partagée : `getUserInfo`, `user profile`, `authorization`.
- Ce module contient des patterns de gestion d’identité et de contexte utilisateur.
- C’est un pattern d’architecture important, pas juste un domaine métier local.

## 3. Patterns métier du projet (non réutilisables en l’état)

Ce qui suit est plutôt spécifique à `attendancy` et dépend donc du domaine métier du projet.

### 3.1 `src/hooks/data/<domain>/`

- `src/hooks/data/academic-year/`
- `src/hooks/data/classes/`
- `src/hooks/data/courses/`
- `src/hooks/data/departments/`
- `src/hooks/data/programs/`
- `src/hooks/data/schedule/`
- `src/hooks/data/teachers/`

Ces hooks sont liés aux modèles Prisma spécifiques du projet et ne sont pas directement extrayables.

### 3.2 `src/services/<service>/` métier

- `src/services/organization/`
- `src/services/program/`
- `src/services/attendance/`
- `src/services/teacher/`
- `src/services/student/`

Ces services implémentent des règles métiers `attendancy` et sont moins patternables sans adaptation.

## 4. Comment repérer un pattern réutilisable

Un élément est patternable si :

- il ne dépend pas directement des modèles métier du projet,
- il n’importe pas `@/services/*/database/*` en dehors de son service propriétaire,
- il peut vivre avec des hooks et fonctions de type générique,
- il correspond à une couche technique ou un module de domaine transversal (auth, audit, notification, export, cache, utilitaires serveur).

## 5. Exemples de patternables que l’on peut extraire dans un template

- `service-module-pattern` : structure `src/services/<module>/` + `CLAUDE.md`
- `src/utils/server/prisma.ts`
- `src/utils/server/audit.ts`
- `src/hooks/entity/*`
- `src/lib/export/*`
- `src/modules/notification/*`
- `src/modules/auth/*`
- `src/modules/audit/*`
- `src/modules/user/*`

---

## 6. Recommandation

Pour concevoir un template réutilisable, sépare :

1. Infrastructure technique générique (`utils/server`, `lib/export`, `hooks/entity`).
2. Modules métiers transverses réutilisables (`audit`, `notification`, `auth`, `user`).
3. Services propriétaires de domaine (`services/<service>`), qui restent spécifiques au projet.

## 7. Comment scinder un projet template

### 7.1 Séparer l’infrastructure technique

Extraire :

- `src/utils/server/` — serveur et erreurs Prisma, audit, debug.
- `src/lib/export/` — export générique de données.
- `src/hooks/entity/` — CRUD générique client / React Query.
- `src/hooks/use-*` et `src/hooks/utils/` qui ne dépendent pas du domaine métier.

Ces fichiers forment le socle technique que tout projet template doit fournir.

### 7.2 Séparer le module core réutilisable

Créer des modules prêts à l’emploi sans dépendances métier :

- `src/modules/auth/`
- `src/modules/user/`
- `src/modules/audit/`
- `src/modules/notification/`

Ces modules doivent exposer des API stables et importer uniquement des dépendances génériques.

### 7.3 Laisser les services métier spécifiques

Dans un template, garder :

- `src/services/<service>/actions/`
- `src/services/<service>/database/`
- `src/services/<service>/validation.ts`
- `src/services/<service>/types.ts`
- `src/services/<service>/CLAUDE.md`

Ces dossiers sont le point d’entrée des règles métier du projet et doivent être personnalisés selon le domaine cible.

### 7.4 Quand un service devient patternable

Un service est patternable si on peut isoler sa logique en :

- un module core réutilisable (`@/modules/...`) ;
- une couche spécifique métier (`@/services/...`) qui orchestre auth / cache / orgId.

Exemples :

- `notification` : le module core gère le push, le service gère les données Prisma et l’organisation.
- `audit` : le module core gère l’écriture du log, le service peut exposer des queries de lecture si nécessaire.

### 7.5 Carte rapide d’extraction possible

- Extraire `audit`, `auth`, `notification`, `user` comme modules de base.
- Garder `services/*` comme implémentation métier du template.
- Réutiliser `hooks/entity` pour les patterns CRUD client.
- Conserver `hooks/data/<domain>` comme exemple d’intégration, pas comme cœur du template.
