# Task 34 — Slot 0 : inventaire des contrats et des pages

**Lot parent :** Lot 0 — Vérifier le périmètre et les dépendances  
**Statut :** Esquisse — à terminer avant l’implémentation

## But

Figer les composants, données, contrats RPC et interactions à reproduire avant
de modifier le routeur ou d’extraire l’UI.

## Défis techniques à résoudre

- **Vérifier les consommateurs avant de modifier une action Web.** `selectOrganizationProfileAction` est consommée par le formulaire de
  `apps/web/src/app/auth/org/profile/page.tsx`; elle met à jour la session puis
  déclenche une redirection Next. `createPersonalOrgAction` est consommée par
  `PersonalRolePicker`. Ces usages Web doivent être cartographiés avant de
  modifier leurs signatures ou leur comportement.
- **Séparer logique métier et transport.** Le contrat RPC sérialise
  `{ data } | { error }`, tandis que l’action Web de sélection redirige.
  L’adaptateur Desktop ajouté précédemment (`selectOrganizationProfileDesktopAction`)
  n’est pas une action métier distincte justifiée : ne pas le réintroduire sans
  décision d’architecture après analyse des consommateurs Web. Une éventuelle
  adaptation de transport doit réutiliser la logique métier, valider l’entrée
  avec Valibot et rester dans le pattern du service.
- **Ne pas prendre les mocks pour une API réelle.** L’action quotidienne
  `getTeacherDailyScheduleAction` existe, mais elle n’est pas enregistrée dans
  RPC et renvoie actuellement des données mockées. Exposer cette action ne
  rendrait donc pas les données réelles disponibles.
- **Tracer les frontières UI.** Plusieurs composants Web dépendent de Next,
  d’utilitaires applicatifs ou de DTOs métier. L’inventaire doit distinguer
  présentation partageable, adaptateur de plateforme et logique métier.

## Constat établi

### Pages Web confirmées

- `/personal/[slug]/teacher` rend `TeacherDailyOverviewScreen` depuis
  `apps/web/src/components/teacher/personal/screen/TeacherDailyOverviewScreen.tsx`.
- `/personal/[slug]/teacher/start` rend `PersonalTeacherWelcome` depuis
  `apps/web/src/components/teacher/personal/ux/PersonalTeacherWelcome.tsx`.
- Le commentaire en tête de `teacher/start/page.tsx` indique un ancien chemin
  (`app/(dashboard)/teacher/daily/page.tsx`), mais la route réelle est bien
  déterminée par l’emplacement du fichier : `/personal/[slug]/teacher/start`.
  Ce commentaire n’a aucun effet sur le routage ni sur le composant rendu;
  cette page rend `PersonalTeacherWelcome`.
- Le layout applique le thème enseignant et construit sa navigation depuis
  `teacherRoutes`, `personal.home()` et `personal.classes()`.
- L’en-tête global Web est rendu séparément par `AsyncHeader` dans
  `apps/web/src/app/layout.tsx`; il ne provient pas du layout enseignant.
  Desktop possède un candidat `Header`, à évaluer avant réutilisation.

### Contrats utilisés dans Desktop

- `packages/types/src/index.ts` réexporte le contrat défini dans
  `apps/web/src/lib/rpc/contract.ts`.
- Ce contrat dérive `ApiClient`, `ApiInput`, `ApiOutput` des actions
  enregistrées dans `apps/web/src/lib/rpc/actions.ts`. Le fichier
  `packages/types/dist/contract.d.mts` est généré : ne pas le modifier à la
  main.
- `apps/desktop/src/lib/api.ts` expose un proxy typé `ApiClient`. Il ajoute le
  token Supabase, effectue un unique refresh après 401, réhydrate les dates
  ISO et lève `NetworkError` pour les échecs réseau.
- `apps/desktop/src/hooks/useMe.ts` montre le pattern Desktop existant :
  `useQuery`, `ApiOutput<...>`, appel via `api` et vérification du résultat
  discriminé avec `'error' in result`.
- `packages/rpc/scripts/gen.mjs` génère les wrappers par service à partir de
  `apps/web/src/lib/rpc/actions.ts`. Les fichiers de
  `packages/rpc/src/generated/` sont générés : ne pas les éditer à la main.
- Le desktop actuel appelle le proxy `api` et ne consomme pas directement les
  wrappers de `@attendancy/rpc`.

### Données du planning quotidien

- Le hook Web `useTeacherDailySchedule` s’appuie sur
  `teacherDailyScheduleQuery`, lequel appelle `getTeacherDailyScheduleAction`.
- Cette action existe dans le service Web `schedule`, authentifie le rôle
  `TEACHER` et déduit le profil enseignant du contexte authentifié ; le
  `teacherId` ne doit donc pas être fourni par Desktop.
- L’action quotidienne n’est pas inscrite dans `apps/web/src/lib/rpc/actions.ts`.
  Elle n’est donc pas exposée dans le contrat partagé actuel ni dans les
  wrappers RPC générés.
- Le corps actuel de l’action renvoie `mockGetTeacherDailySchedule`; l’appel à
  `getTeacherDailySchedule(...)` est commenté. La page Desktop ne pourra pas
  afficher des données réelles sans décision/traitement distinct de ce point.
- Les statistiques de séance utilisent `resolveScheduleUiStatus` et une
  horloge réactive côté Web. Ne pas recopier les règles métier dans `@attendancy/ui`.

### Présentation

- `TeacherDailyOverview` (rendu par la route `/teacher`) est proche d’une vue présentative, mais importe des
  utilitaires Web (`cn`, formatage de durée et d’heure).
- `TeacherScheduleDetailSheet` dépend du DTO/service Web et des composants
  `Sheet`/`Separator`; vérifier la disponibilité et le contrat de ces
  primitives avant extraction. Ces primitives ne sont pas présentes dans
  `packages/ui` au moment de l’inventaire.
- `PersonalTeacherWelcome` (rendu par `/teacher/start`) importe `next/link`,
  les utilitaires Web et `personal.home(slug)`. Ce helper renvoie vers
  `/teacher`, donc le CTA « Démarrer » ouvre l’écran quotidien.
- `MobileNavMenu` dépend de `next/link` et `framer-motion`; il ne peut pas être
  importé tel quel dans `packages/ui`.
- `packages/ui` possède un barrel `src/index.ts`, un `Link` natif agnostique et
  le thème déjà partagé `styles/themes/teacher.css`.

## Tâches de reconnaissance restant à faire

- [x] Relever la structure, les interactions et les dépendances principales
  de `TeacherScheduleDetailSheet`.
- [x] Vérifier l’action quotidienne : action existante, absente du registre
  RPC, et actuellement branchée sur des données mockées.
- [x] Vérifier les candidats UI : `MobileNavMenu`/`PersonalTeacherWelcome`
  dépendent de Next; `Sheet`/`Separator` ne sont pas dans `packages/ui`.
- [x] Mettre à jour le registre UI de `task34.md` avec les conclusions.
- [ ] Faire trancher les décisions listées dans `task34.md` avant leur lot
  dépendant.

## Livrable et contrôle

**Livrable :** matrice de dépendances et statut initial UI documentés dans le
document parent; il reste à trancher les décisions produit et d’architecture
indiquées avant les lots concernés.

**Contrôle :** aucune action API ou donnée requise n’est supposée disponible
sans vérification de son inscription au contrat RPC partagé.

## Dépendances

Aucun lot d’implémentation ne commence avant clôture de ce slot.
