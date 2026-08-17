# Erreurs de build complexes restantes

Ce document recense les blocages qui restent après les correctifs de typage mineurs appliqués sur les DTO des services `program-track` et `program`.

## 1) Migrations de contrats d’API / services legacy

Problème principal : plusieurs composants importent des symboles supprimés ou renommés sans être alignés sur le contrat actuel des services.

Exemples :
- `@/services/program-track/types` attend `ProgramTrackDto`, mais le vrai type exposé est `GetProgramTrackDto` / alias local
- `@/services/program/types` attend `ProgramDto`, mais le service expose `GetProgramsDto[number]` et non l’ancien alias historique
- `@/services/ue/actions` attend `getOrgUEAction`, `removeUEAction`, `removeUEFromProgramAction`, alors que les actions réelles sont `getUEsAction`, `reorderProgramAction`, etc.
- `@/services/session/generated.types.ts` référence `createSessionToken` / `validateSessionToken` absents de `./database`
- `@/services/weekly-template/types.ts` et `@/services/teacher-unavailability/types.ts` font référence à des types générés non exportés

Impact : erreurs de compilation par import de façade héritée, surtout côté UI et hooks.

## 2) DTOs / types incomplets pour tableaux et relations imbriquées

Plusieurs composants supposent des objets de type très précis, mais les données réelles renvoyées par les services contiennent des valeurs nullables ou des relations optionnelles.

Exemples :
- `programTrack.department` peut être `null` selon le service
- `description` est `string | null` alors que certains composants supposent `string`
- `teacher.id` est parfois `string | undefined` alors que le type attendu est `string`
- `groupId` peut être `null` alors que l’input attendu est `string | undefined`
- `ue.ueCourses` mélange des objets avec `settings` et d’autres sans `settings`, ce qui casse les `ProgramTable` / `ProgramSemesterDTO`

Impact : nombreuses erreurs de type `TS2322`, `TS2345`, `TS2741` sur les composants d’UI.

## 3) Fichiers / modules absents ou déplacés

Le projet contient des imports pointant vers des modules non présents dans l’arborescence actuelle.

Exemples :
- `@/hooks/data/programTracks/useProgramTracks` introuvable
- `@/hooks/data/organization/useOrgDetails` introuvable
- `@/components/courses/pages/DirectionCoursePage` introuvable
- `../section/program-viewer` introuvable
- `@/components/organization/loader` introuvable
- `@/services/fonctions/user` et sous-modules introuvables
- `@supabase/postgrest-js` absent des dépendances
- `csstype` absent
- `slugify` absent

Impact : erreurs `TS2307` sur des chemins et modules supprimés ou non installés.

## 4) Contrats d’auth / permissions incohérents

Le code d’auth a des unions de retour qui ne sont pas cohérentes avec les usages.

Exemples :
- `AuthorizationResult` est défini comme `{ success: true } | { success: false; error: string }`, mais certaines fonctions retournent `{ error: ... }` sans `success`
- `acces.ts` et `autorization.ts` consultent `auth.error`, alors que le type ne le permet pas
- `return { error: null }` est incompatibles avec `string`

Impact : blocage strict du typage dans le module d’autorisation.

## 5) Services / modules à réconciliation

Quelques modules semblent avoir été refactorés sans mettre à jour les composants consommateurs ou les types générés.

Exemples :
- `schedule` : `export *` sur fichier sans export réel
- `program-track` / `program` : alias DTO à reconstruire et imports UI à harmoniser
- `parent` : tests Django-like sur `deletedAt` alors que le type Prisma ne contient pas cette propriété
- `attendance` : sous-ensemble de statut enums pas alignés avec le type réel
- `ue-template` : types générés absents ou invalides

## 6) Recommandation de traitement

La bonne stratégie est de traiter ces erreurs par lots, dans l’ordre :
1. restaurer les exports de façade du service (types + actions)
2. fixer les imports cassés et chemins manquants
3. uniformiser les DTOs avec les vrais retours de service
4. corriger les schémas d’auth / permissions
5. remettre à jour les dépendances manquantes et les références legacy
6. relancer `bun run build` puis `bun x tsc --noEmit --pretty false`

Les points ci-dessus sont techniquement complexes et ne sont pas des corrections de « typage mineur » selon la logique du projet ; ils nécessitent une refonte de contrat ou un nettoyage de legacy avant d’aboutir à un build stable.
