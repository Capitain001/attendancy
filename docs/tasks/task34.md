# Task 34 — Reproduire l’espace enseignant personnel dans Desktop

## Objectif

Reproduire dans l’application Desktop les deux pages confirmées de l’espace
enseignant personnel du Web, en commençant par leur structure commune :

- l’accueil de l’espace enseignant, défini dans
  `apps/web/src/app/(app)/personal/[slug]/teacher/page.tsx` :
  `/personal/[slug]/teacher`, qui rend `TeacherDailyOverviewScreen`
- la page de démarrage, définie dans
  `apps/web/src/app/(app)/personal/[slug]/teacher/start/page.tsx` :
  `/personal/[slug]/teacher/start`, qui rend `PersonalTeacherWelcome`
- les éléments du layout enseignant : thème, navigation et en-tête requis par
  ces pages

Le portage doit séparer la présentation de la logique métier. Les composants
visuels réutilisables doivent être créés ou adaptés dans `@attendancy/ui`.
L’implémentation Web existante reste en place jusqu’à une migration Web
distincte, explicitement planifiée.

## Références Web

| Élément | Source |
|---|---|
| Layout enseignant | `apps/web/src/app/(app)/personal/[slug]/teacher/layout.tsx` |
| Accueil enseignant | `apps/web/src/app/(app)/personal/[slug]/teacher/page.tsx` |
| Page de démarrage | `apps/web/src/app/(app)/personal/[slug]/teacher/start/page.tsx` |
| En-tête global Web | `apps/web/src/app/layout.tsx` (`AsyncHeader`) |
| Accueil quotidien enseignant | `apps/web/src/components/teacher/personal/screen/TeacherDailyOverviewScreen` |
| Bienvenue / démarrage | `apps/web/src/components/teacher/personal/ux/PersonalTeacherWelcome` |
| Routes et navigation enseignant | `apps/web/src/components/teacher/user/navigation` |
| Chemins personnels | `apps/web/src/modules/personal/paths` |

## Contrats partagés déjà utilisés dans Desktop

- `@attendancy/types` expose le contrat dérivé des actions déclarées dans
  `apps/web/src/lib/rpc/actions.ts`, via `apps/web/src/lib/rpc/contract.ts`.
  Desktop en tire notamment `ApiClient` et `ApiOutput`; ne pas recopier les
  DTO serveur ni éditer `packages/types/dist/contract.d.mts` à la main.
- `apps/desktop/src/lib/api.ts` est le transport typé utilisé par Desktop :
  il ajoute le token Supabase, gère un refresh après 401, réhydrate les dates
  ISO et conserve les erreurs réseau comme exceptions.
- `packages/rpc/src/generated/*` est généré depuis le registre RPC Web par
  `packages/rpc/scripts/gen.mjs`. Ajouter une action RPC signifie modifier le
  registre source puis lancer le générateur, jamais éditer ces wrappers à la
  main. Desktop utilise actuellement son proxy `api` plutôt que ces wrappers.
- Exemple de typage et d’appel React Query Desktop :
  `apps/desktop/src/hooks/useMe.ts`.
- L’action Web `getTeacherDailyScheduleAction` existe, mais elle n’est pas
  encore exposée par le registre RPC partagé. Elle devra être ajoutée et les
  contrats régénérés si le Slot 0 confirme qu’elle convient à la page Desktop.
  Son implémentation actuelle retourne des données mockées; ce point est
  documenté comme décision/risque dans le slot concerné.

## Hors périmètre de cette livraison

- Les autres pages enseignantes (`classes`, `courses`, `planning`,
  `attendance`, `sessions`, `students`, `unavailabilities`,
  `notifications` et leurs sous-pages).
- La suppression ou le remplacement des pages Web.
- La migration de l’ensemble des écrans Web dans `@attendancy/ui`.
- Toute nouvelle règle métier, API ou modification de données non nécessaire
  aux deux pages visées.

---

## Fonctionnalités

### F34-01 — Accéder aux pages enseignantes avec le slug de l’organisation

**En tant qu’enseignant connecté,** je veux ouvrir les pages de mon espace
personnel avec le slug de mon organisation, afin que les liens et le contenu
restent associés au bon espace.

**Critères d’acceptation**

- Desktop prend en charge les routes correspondant à
  `/personal/$slug/teacher` et `/personal/$slug/teacher/start`.
- Le `slug` provient du paramètre de route, et non d’une valeur codée en dur.
- Les liens internes de l’espace conservent le slug courant.
- Les routes utilisent le routeur TanStack déjà adopté par Desktop et
  conservent le hash history requis par Tauri.
- Une route protégée ne rend pas l’espace enseignant avant que l’état
  d’authentification soit connu.
- Après connexion, l’état d’authentification partagé ne provoque ni boucle de
  redirection ni remontage répété de la page.

### F34-02 — Afficher le layout commun de l’espace enseignant

**En tant qu’enseignant,** je veux retrouver une structure cohérente sur les
deux pages, afin de naviguer dans mon espace personnel sans perdre son contexte.

**Critères d’acceptation**

- Le layout respecte le thème et le mode choisis par l’utilisateur.
- Le thème enseignant n’est pas activé automatiquement pour le rôle enseignant.
- Il fournit les éléments de navigation et d’en-tête réellement nécessaires
  aux deux pages ciblées.
- Les liens affichés pointent vers les routes Desktop prévues et conservent le
  slug.
- La présentation s’adapte aux tailles d’écran prises en charge par Desktop.
- Le layout ne contient pas de requête métier ni d’accès direct à la base de
  données.
- Les pages Web restent fonctionnelles et inchangées par ce portage.

### F34-03 — Consulter l’accueil quotidien enseignant

**En tant qu’enseignant,** je veux retrouver dans Desktop le contenu et le
comportement de la page `/personal/$slug/teacher`, afin de consulter mon
planning quotidien et les séances associées.

**Critères d’acceptation**

- La page Desktop reproduit la hiérarchie visuelle et le contenu utiles de la
  page Web de référence.
- Les interactions présentes sur la page de référence sont conservées ou
  adaptées à Desktop sans perte de fonctionnalité.
- Les états de chargement, vide et erreur nécessaires sont prévus lorsque la
  page dépend de données.
- La page consomme les données au moyen des hooks/actions ou appels API
  appropriés ; elle n’accède pas directement à Prisma.
- Le composant de présentation est réutilisable et ne dépend pas de Next.js,
  de TanStack Router, ni des détails de l’authentification.

### F34-04 — Afficher la page de bienvenue et démarrer

**En tant qu’enseignant,** je veux retrouver dans Desktop la page de bienvenue
de mon espace personnel, puis accéder à mon accueil quotidien.

**Critères d’acceptation**

- La route `/personal/$slug/teacher/start` affiche l’équivalent Desktop de
  `PersonalTeacherWelcome`.
- Le slug courant est transmis explicitement au composant ou aux hooks qui en
  ont besoin.
- La page respecte le layout et le thème définis dans F34-02.
- La présentation est séparée des appels réseau et des règles métier.
- Le CTA « Démarrer » mène à `/personal/$slug/teacher`, conformément à
  `personal.home(slug)` dans l’implémentation Web actuelle.
- Aucun changement n’est apporté à l’accueil Web dans le cadre de cette tâche.

### F34-05 — Réutiliser et inventorier les composants UI

**En tant qu’équipe produit,** nous voulons réutiliser les composants visuels
dans `@attendancy/ui` et garder un registre de ces décisions, afin de faciliter
les futurs portages et la migration ultérieure du Web.

**Critères d’acceptation**

- Les composants partageables sont implémentés ou adaptés dans
  `packages/ui`, publié sous le nom `@attendancy/ui`.
- Un composant UI partagé ne contient ni accès Prisma, ni logique métier, ni
  dépendance à une route ou à une action serveur propre au Web.
- Les différences propres à Desktop ou au Web sont gérées par composition,
  propriétés de présentation ou adaptateurs placés hors du composant partagé.
- Les composants Web existants ne sont ni supprimés ni remplacés dans cette
  livraison.
- Le registre ci-dessous est mis à jour à chaque composant évalué :
  réutilisé sans adaptation, adapté/partagé, spécifique à une plateforme ou
  encore à évaluer.

#### Registre des composants évalués

| Composant / motif | Source Web | Destination ou usage | Statut | Adaptation / remarque |
|---|---|---|---|---|
| Navigation mobile enseignant | `MobileNavMenu` du layout enseignant | Adaptateur de navigation Desktop ; extraction présentative à décider | Adaptateur plateforme requis | Implémentation Web liée à `next/link` et `framer-motion` |
| En-tête global | `AsyncHeader` dans le layout racine Web | En-tête Desktop existant ou composition Desktop à confirmer | À évaluer | L’en-tête n’est pas rendu par le layout enseignant lui-même |
| Écran quotidien | `TeacherDailyOverviewScreen` | Vue Desktop composée avec hook et état Desktop sur `/teacher` | Partagé après adaptation | Séparer le hook et la policy du rendu; action quotidienne à exposer via RPC |
| Bienvenue / démarrage | `PersonalTeacherWelcome` dans `ux/` | UI partagée avec callback, navigation dans Desktop sur `/teacher/start` | Partagé après adaptation | Le composant Web dépend de `next/link`; le CTA mène à l’accueil `/teacher` |
| Préférences de thème | Thèmes `@attendancy/ui` et préférence utilisateur | Respect du thème actif dans Desktop | À intégrer | Le rôle enseignant ne force pas la palette `teacher` |
| Liens de navigation | Liens générés à partir de `personal` et `teacherRoutes` | Adaptateur de navigation Desktop | Adaptateur plateforme requis | Employer TanStack Router dans Desktop; conserver l’UI partagée indépendante du routeur |
| Détails de séance | `TeacherScheduleDetailSheet` + primitives Web `Sheet`/`Separator` | Extraction UI ou implémentation Desktop à décider | À évaluer | Les primitives ne sont pas actuellement présentes dans `packages/ui` |

**Statuts autorisés :** `Réutilisé sans adaptation`, `Partagé après adaptation`,
`Adaptateur plateforme requis`, `Spécifique Web`, `Spécifique Desktop`,
`À évaluer`.

---

## Découpage en lots livrables et testables

### Lot 0 — Vérifier le périmètre et les dépendances

- Comparer les deux pages Web ciblées, leur layout, les composants appelés et
  les données/interactions nécessaires.
- Étudier les contrats `@attendancy/types`, les wrappers `@attendancy/rpc` et
  leur utilisation actuelle dans Desktop avant de prévoir une nouvelle
  action ou un DTO.
- Compléter le registre des composants UI.
- Respecter les deux routes confirmées dans le périmètre ; vérifier les
  comportements et dépendances présents dans leurs implémentations.

**Livrable :** inventaire des composants, dépendances et comportements à
reproduire, avec les décisions bloquantes identifiées.

**Vérification :** chaque élément visuel/interactif des deux pages est associé
à une source Web, à une destination Desktop et à un statut dans le registre;
inclure l’`AsyncHeader` global Web rendu par le layout racine.

**Synthèse des défis et esquisse :** [slot0.md](./tache34/slot0.md)

### Lot 1 — Préparer les routes et la garde d’authentification

- Ajouter les routes Desktop des deux pages avec prise en charge de `$slug`.
- Regrouper les pages dans le layout protégé approprié.
- Réutiliser l’état d’authentification Desktop partagé et préserver le
  hash history Tauri.
- Garder les routes existantes (`login`, `signup`, `account`) fonctionnelles.

**Livrable :** routes atteignables avec des pages temporaires, sans boucle
d’authentification.

**Vérification :** accès direct à chaque URL avec hash ; redirection correcte
en étant déconnecté ; accès maintenu après connexion ; navigation entre les
deux routes sans perdre le slug.

**Synthèse des défis et esquisse :** [slot1.md](./tache34/slot1.md)

### Lot 2 — Construire le layout et l’inventaire UI

- Extraire ou créer dans `@attendancy/ui` les éléments strictement
  présentatifs qui peuvent être partagés.
- Ajouter les adaptateurs Desktop nécessaires pour les liens, la navigation
  et les données.
- Composer le layout Desktop en respectant le thème choisi par l’utilisateur;
  ne pas activer automatiquement la palette enseignant.
- Mettre à jour le registre avec les composants réellement traités.

**Livrable :** layout commun visible sur les deux routes, sans dépendance
métier dans les composants partagés.

**Vérification :** navigation fonctionnelle, rendu aux tailles d’écran
ciblées et contrôle des dépendances : pas de Prisma, Next.js ou action serveur
dans les composants de `@attendancy/ui`.

**Synthèse des défis et esquisse :** [slot2.md](./tache34/slot2.md)

### Lot 3 — Porter l’accueil quotidien `/teacher`

- Porter `TeacherDailyOverviewScreen` et son comportement confirmé au lot 0.
- Séparer la vue partagée de la récupération des données Desktop.
- Documenter les composants réutilisés et les adaptations dans le registre.

**Livrable :** accueil quotidien Desktop fonctionnel à `/teacher`.

**Vérification :** critères F34-03, états de chargement/erreur/vide pertinents
et tests des hooks ou composants modifiés.

**Synthèse des défis et esquisse :** [slot3.md](./tache34/slot3.md)

### Lot 4 — Porter la bienvenue `/teacher/start`

- Porter `PersonalTeacherWelcome` à `/teacher/start`.
- Transmettre le slug courant aux composants/hook concernés.
- Relier le CTA « Démarrer » à l’accueil quotidien `/teacher`.
- Mettre à jour le registre UI.

**Livrable :** page de bienvenue Desktop fonctionnelle à `/teacher/start`.

**Vérification :** critères F34-04 et test du CTA de bienvenue vers l’accueil
quotidien.

**Synthèse des défis et esquisse :** [slot4.md](./tache34/slot4.md)

### Lot 5 — Validation de la livraison

- Vérifier les deux parcours complets : accès direct et navigation depuis
  l’application.
- Vérifier la connexion, la déconnexion et le comportement des routes
  protégées.
- Lancer les vérifications de types, tests et build disponibles pour les
  packages/applications concernés.
- Relire le registre UI et confirmer que les pages Web d’origine sont
  toujours présentes.

**Livrable :** deux pages Desktop validées et registre à jour.

**Vérification :** aucun échec de type, test ou build introduit par la tâche ;
les éventuels échecs préexistants sont distingués et documentés.

**Synthèse des défis et esquisse :** [slot5.md](./tache34/slot5.md)

---

## Correspondance de routage

Les groupes Next entre parenthèses ne font pas partie de l’URL. Le paramètre
dynamique `[slug]` devient `$slug` dans la convention de routes TanStack.
L’arborescence Desktop doit refléter la hiérarchie métier utile sans copier
les conventions Next à l’identique lorsqu’elles ne s’appliquent pas.

| Next.js App Router | TanStack Router |
|---|---|
| `app/layout.tsx` | route racine (`__root`) |
| `app/(groupe)/layout.tsx` | route layout sans segment visible |
| `page.tsx` | route correspondante |
| `[slug]` | `$slug` |
| middleware / redirection | garde de route / redirection |
| `params` | paramètres de route typés |

Exemple indicatif de structure cible :

```text
apps/desktop/src/routes/
  __root.tsx
  _personal/
    route.tsx
    personal/
      $slug/
        teacher/
          route.tsx
          index.tsx       # /personal/$slug/teacher (TeacherDailyOverviewScreen)
          start.tsx       # /personal/$slug/teacher/start (PersonalTeacherWelcome)
```

Le routeur Desktop actuel est défini dans
`apps/desktop/src/app/router.tsx` et construit manuellement. Avant d’introduire
un générateur de routes ou un plugin, confirmer le choix au point « Routage »
ci-dessous ; ne pas mélanger les deux approches au sein du même lot.

## Séparation des responsabilités

- `@attendancy/ui` : composants de présentation réutilisables, sans logique
  métier, accès base de données, API d’application ou routage plateforme.
- Desktop (`apps/desktop`) : composition des pages, navigation TanStack,
  hooks et appels aux API/actions compatibles avec Desktop.
- Web (`apps/web`) : implémentation actuelle préservée pendant le portage.
- Données : accès Prisma réservé aux services Web propriétaires ; Desktop
  consomme les interfaces/API prévues, sans importer les modules `database/`.

## Points à trancher ou risques

1. **Stratégie de routes :** conserver la définition manuelle du routeur
   actuelle ou adopter les routes basées sur les fichiers et leur plugin.
   La seconde option exige une configuration et une génération de route tree ;
   cette décision affecte le Lot 1.
2. **Navigation responsive :** le layout Web référence `MobileNavMenu`.
   Déterminer si Desktop doit reprendre cette navigation mobile, utiliser une
   navigation adaptée aux fenêtres desktop, ou gérer les deux formats.
3. **Composants fortement couplés :** certains composants Web peuvent inclure
   données, actions ou navigation Next. Ils nécessiteront une extraction UI et
   un adaptateur plutôt qu’un import direct.
4. **Données et états :** confirmer les données réellement visibles et les
   états attendus pour chaque page avant d’estimer le travail des hooks/API.

## Définition de terminé

- Les lots 1 à 5 et les critères d’acceptation F34-01 à F34-05 sont satisfaits.
- Les deux routes Desktop fonctionnent avec le slug courant et le layout
  enseignant.
- Les composants partagés sont présentatifs ; les appels de données et la
  navigation restent dans leurs couches respectives.
- Le registre des composants UI est renseigné et à jour.
- Les pages Web ciblées n’ont pas été supprimées ni remplacées.
- Les tests, le contrôle de types et le build concernés ont été exécutés ; les
  résultats sont consignés dans le suivi de livraison.
