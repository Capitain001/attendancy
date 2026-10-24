# Plan : Onboarding et typage des classes personnelles

## Contexte

Lors du bootstrap d'un profil `TEACHER` dans une organisation personnelle, une
première classe est déjà créée dans la transaction de création de l'organisation.
Cette classe sert de point de départ à l'espace et porte initialement le nom
sentinelle `PERSONAL.NAME` (`PERSONNEL`).

L'onboarding de `/personal/[slug]/teacher/start` doit configurer cette classe
existante : le professeur choisit son nom et son type (`COHORT` ou `THEMATIC`).
Il ne faut pas créer une deuxième classe pour terminer l'onboarding. Le nom de la
première classe est le signal métier de fin : tant qu'il vaut exactement
`PERSONAL.NAME`, l'onboarding n'est pas terminé. `UserInfo.status` décrit l'état
d'activation du compte et ne sert pas à déterminer cet état.

Le même choix de type sera proposé à chaque création de classe personnelle
ultérieure. Les organisations institutionnelles gardent leur comportement
actuel et le type `COHORT` par défaut.

## Analyse domaine

1. **Données existantes** : le modèle `Class` possède déjà `name` et `type`;
   le schéma Prisma contient `ClassType` et le client Prisma est déjà généré.
   La première classe est créée par `createPersonalClassTx` pendant le
   bootstrap du profil professeur.
2. **Composition nécessaire** : l'action d'onboarding résout la première classe
   personnelle, vérifie son nom sentinelle et met à jour conjointement son nom et
   son type. C'est une opération métier distincte de la création d'une classe.
3. **Données fournies** : le navigateur fournit uniquement le nom et le type
   choisis. L'organisation vient exclusivement de l'authentification serveur;
   l'identifiant de classe est résolu côté serveur.

### Propriété des modèles

| Modèle | Service owner |
|---|---|
| `Class` | `class` |
| `Organization`, `UserOrganization` et profil `Teacher` | `organization` / domaines propriétaires existants |

Le service `personal` orchestre les parcours d'organisation personnelle; il ne
doit pas introduire de requête Prisma sur `Class`.

## Contrat métier

- La première classe personnelle est définie de façon déterministe comme la
  classe non supprimée la plus ancienne de l'organisation, triée par
  `createdAt ASC` puis `id ASC`; `isActive` ne change pas son identité.
- Le parcours d'onboarding est incomplet si et seulement si cette classe existe
  et que son `name` est exactement `PERSONAL.NAME`.
- L'action d'onboarding n'accepte ni `orgId` ni `classId` du client.
- L'action met à jour cette première classe en une opération logique :
  `name` et `type` sont enregistrés ensemble.
- Le nom sentinelle est réservé : la validation empêche de terminer l'onboarding
  en choisissant `PERSONAL.NAME` comme nom final.
- L'absence de première classe ou une classe dont le nom a déjà changé ne doit
  jamais déclencher une création implicite depuis l'action de configuration.
- Le statut global du compte (`NEW`, `PENDING`, `ACTIVE`, etc.) n'est pas un
  indicateur d'onboarding de classe.

## Arborescence cible

### Service `class`

- `src/services/class/database/class.queries.ts`
  - ajouter une lecture minimale de la première classe personnelle, filtrée par
    organisation et classes non archivées.
- `src/services/class/database/class.mutations.ts`
  - ajouter une mutation de configuration d'onboarding qui vérifie toujours
    l'organisation et le nom sentinelle avant modification.
  - inclure explicitement `type: COHORT` lors du bootstrap de la classe initiale.
- `src/services/class/actions/class.queries.ts`
  - exposer l'état d'onboarding par une action `get*Action` autorisée uniquement
    au professeur de son organisation personnelle.
- `src/services/class/actions/class.mutations.ts`
  - exposer l'action serveur de configuration d'onboarding.
  - permettre la création personnelle avec un type validé, tout en conservant
    `COHORT` comme valeur par défaut pour les appels de bootstrap existants.
- `src/services/class/validation.ts` et `types.ts`
  - ajouter les schémas/types `ClassType` requis aux créations personnelles et
    à la mise à jour générique, sans rendre `type` requis pour les appels
    institutionnels historiques.
- `src/services/class/database/index.ts`, `actions/index.ts`, `index.ts`
  - exporter les nouvelles fonctions/types selon les barrels déjà en place.
- `src/services/class/CLAUDE.md`
  - documenter `ClassType`, le nom sentinelle et les invariants du parcours perso.
- `src/services/class/.api/`
  - générer les fiches/index après les mutations d'actions.

### Service `personal` et routes

- `src/services/personal/database/organization.mutations.ts`
  - conserver le bootstrap atomique existant qui crée la première classe pour
    un nouveau profil professeur.
  - conserver la création de cette classe lors de l'ajout d'un profil
    professeur à une organisation personnelle existante.
- `src/services/personal/actions/organization.mutations.ts`
  - retourner le slug personnel de manière cohérente pour le bootstrap initial
    et l'ajout d'un rôle, afin que le picker puisse envoyer un professeur vers
    `/teacher/start` sans changer la navigation des autres rôles.
- `src/services/personal/CLAUDE.md`
  - préciser le rôle de l'onboarding comme composition des actions propriétaires.
- `src/app/(app)/personal/[slug]/teacher/start/page.tsx`
  - charger l'état d'onboarding, rediriger vers l'accueil si la classe est déjà
    configurée et transmettre au formulaire l'action serveur adaptée.
- `src/components/teacher/personal/ux/PersonalTeacherWelcome.tsx`
  - remplacer le lien de démarrage passif par le formulaire de nom et les deux
    choix explicites de type; libellé/exemple peuvent dépendre du type.
- `src/components/organization/personal/PersonalRolePicker.tsx`
  - après création/sélection du rôle `TEACHER`, naviguer vers le slug personnel
    et son parcours `start`; garder le comportement existant pour `STUDENT` et
    `PARENT`.

### Création courante et affichage personnel

- `src/components/teacher/personal/class/CreateClassModal.tsx`
  - proposer le choix du type à chaque création personnelle et envoyer le type
    avec le nom via l'action formulaire existante.
- `src/services/class/form.ts`
  - transmettre et rediriger après soumission en gardant les retours de succès
    et d'erreur existants.
- `src/components/teacher/personal/class/PersonalClassCard.tsx` et
  `src/app/(app)/personal/[slug]/teacher/classes/page.tsx`
  - charger/afficher le type nécessaire à l'iconographie et au vocabulaire.
- `src/app/(app)/personal/[slug]/teacher/classes/[id]/page.tsx` et ses pages
  enfants étudiants/cours
  - adapter les libellés selon `class.type` là où la spec prévoit
    « classe / cohorte » ou « groupe / thématique », « étudiants / participants »
    et « cours / modules ».
- Les parcours institutionnels de création et d'affichage restent en `COHORT`;
  aucune interface institutionnelle ne propose `THEMATIC` dans cette feature.

## Phase 1 — Contrat et validation

1. Importer le type généré `ClassType` depuis le client Prisma.
2. Étendre les DTOs d'écriture et Valibot :
   - `type` optionnel pour la création personnelle courante, défaut `COHORT`;
   - `type` exigé par le formulaire d'onboarding;
   - nom trimé, non vide, longueur maximale 100;
   - nom final différent de `PERSONAL.NAME`;
   - accepter uniquement `COHORT` et `THEMATIC`.
3. Ajouter une validation d'action pour le payload d'onboarding sans identifiant
   de classe ni scope d'organisation provenant du client.

**Critère** : entrées absentes/inconnues/refusées ne peuvent ni créer une classe
ni marquer l'onboarding comme terminé.

## Phase 2 — `database/` du service `class`

1. Ajouter une query, par exemple
   `getFirstPersonalClass(orgId: string)`, avec `select` minimal `{ id, name,
   type }`, `where: { deletedAt: null, programTrack: { orgId } }` et ordre
   déterministe `createdAt ASC, id ASC`, sans filtrer sur `isActive`.
2. Ajouter une mutation transactionnelle dédiée à la configuration :
   - relire la première classe dans la transaction;
   - retourner une erreur métier si elle n'existe pas ou si son nom n'est plus
     le marqueur `PERSONAL.NAME`;
   - mettre à jour cette classe avec le nom et le type fournis;
   - restreindre l'update par `id`, organisation et nom sentinelle afin que deux
     soumissions concurrentes ne configurent pas une autre classe.
3. Dans `createPersonalClassTx`, préciser explicitement `type: COHORT` pour les
   créations automatiques de bootstrap.
4. Réutiliser les événements existants (`CLASS_UPDATED`, `CLASS_CREATED`) et
   l'invalidation `CACHE.CLASS(orgId)` / détail. Ne pas ajouter de graphe de
   cache ni de modèle de suivi d'onboarding.

**Critère** : l'action de configuration ne crée jamais de ligne `Class`; elle
met à jour uniquement la classe initiale encore sentinelle.

## Phase 3 — Actions serveur

1. Ajouter `getPersonalClassOnboardingAction()` :
   - `authAccess({ requiredRole: 'TEACHER', requiredOrgType: 'PERSONAL' })`;
   - utiliser uniquement `orgId` authentifié;
   - retourner un résultat discriminé indiquant si la première classe porte le
     marqueur et, si oui, les valeurs initiales minimales du formulaire.
2. Ajouter `configurePersonalClassOnboardingAction(input)` :
   - vérifier la même autorisation;
   - valider le nom et le type Valibot;
   - appeler la mutation `class` et retourner `{ data } | { error }`.
3. Étendre `createPersonalClassAction` pour prendre le type optionnel à la
   création explicite, avec `COHORT` par défaut pour les usages internes sans
   choix UI.
4. Ne pas élargir l'autorisation institutionnelle ni permettre au client de
   transmettre un `orgId`.

**Critère** : l'action n'est utilisable que par le professeur de l'organisation
personnelle authentifiée; une classe appartenant à une autre organisation ne
peut pas être modifiée.

## Phase 4 — Bootstrap et navigation de l'onboarding

1. Garder la création initiale de classe dans la transaction de création du
   profil professeur; elle porte le nom `PERSONAL.NAME` et `COHORT`.
2. Garder la création équivalente lorsqu'un rôle professeur est ajouté à un
   espace personnel déjà existant, uniquement si ce profil est nouveau.
3. Faire retourner le slug personnel depuis les deux branches de
   `createPersonalOrgAction`.
4. Adapter le `PersonalRolePicker` : professeur → `personal.start(slug)`;
   étudiant/parent → flux actuel.
5. Dans `/teacher/start`, appeler `getPersonalClassOnboardingAction`; si
   l'onboarding est déjà fini, rediriger vers `personal.home(slug)`.
6. Soumettre le formulaire à l'action serveur; succès → accueil professeur,
   erreur → rester sur `/start` et afficher le feedback.

**Critère** : création de l'organisation + profil + classe initiale reste
atomique; un refresh du welcome ne crée aucune classe supplémentaire.

## Phase 5 — Création ultérieure et affichage

1. Mettre à jour le formulaire `CreateClassModal` pour afficher deux options
   explicites de type et transmettre le choix à l'action de création.
2. Garder `COHORT` comme défaut déterministe et adapter label/placeholder du nom
   selon le type choisi.
3. Ajouter `type` aux sélections `getClasses` et `getClass` (ainsi qu'aux
   fiches/types générés) afin que les composants personnels adaptent leur
   vocabulaire et leur icône.
4. Appliquer les libellés définis dans
   `docs/features/personal-teaher-classe-types.md` aux pages personnelles
   concernées; ne pas modifier le vocabulaire institutionnel.
5. Conserver un nom/type cohérent lors des opérations de renommage; les
   formulaires existants qui ne modifient pas le type ne doivent pas l'écraser.

**Critère** : un professeur peut créer une cohorte et un groupe thématique dans
le même espace, chacun avec ses libellés adaptés; les classes institutionnelles
restent des cohortes.

## Phase 6 — Tests et contrôles

Tests à ajouter ou ajuster selon les patterns Vitest existants :

- le bootstrap `TEACHER` crée exactement une classe sentinelle `COHORT` dans la
  même transaction; les autres rôles n'en créent pas;
- ajouter un profil `TEACHER` crée une classe seulement pour un profil nouveau;
- l'état d'onboarding est incomplet pour le nom sentinelle et terminé après son
  remplacement;
- l'action met à jour le nom et le type de la première classe et ne crée pas
  de classe supplémentaire;
- nom sentinelle, type invalide, classe absente/configurée et accès hors org
  sont refusés proprement;
- la création ultérieure avec un type explicite persiste le type; absence du
  type conserve `COHORT`;
- parcours institutionnel existant conserve son comportement.

Vérifications depuis `apps/web/` :

```bash
bun run ts:check
bun run check:naming:svc -- class
bun run check:types:svc -- class
bun run generate:api:svc -- class
bun run check:naming:svc -- personal
bun run check:types:svc -- personal
bun run generate:api:svc -- personal
bun run api:check
<commande Vitest du dépôt> <tests ciblés>
```

Le schéma Prisma et le client généré sont déjà à jour : aucune migration ni
nouvelle génération Prisma n'est prévue pour ce plan, sauf si le code révèle un
écart réel entre schéma et client.

## Risques / Décisions

| Décision | Alternative écartée | Risque / garde-fou |
|---|---|---|
| `name === PERSONAL.NAME` est le marqueur d'onboarding inachevé. | Ajouter un booléen/table/état auth séparé. | Le nom sentinelle doit être réservé et jamais accepté comme nom final. |
| La cible est la première classe non supprimée, triée par `createdAt`, puis `id`; `isActive` ne change pas l'identité. | Prendre une classe arbitraire issue de `getClassesAction()` et son ordre d'affichage. | Les classes doivent être filtrées par l'org authentifiée et la règle d'ordre documentée/testée. |
| L'onboarding met à jour la première classe créée pendant le bootstrap. | Déplacer toute la création hors de la transaction ou en créer une seconde au welcome. | Les répétitions/refreshs ne doivent pas créer de doublons; l'update conditionnel sur le marqueur protège les courses concurrentes. |
| `UserInfo.status` ne gouverne pas l'onboarding. | Interpréter `ACTIVE` comme welcome terminé. | Le compte est déjà marqué actif au bootstrap; le marqueur de nom est la source métier retenue. |
| La création choisit un type uniquement dans l'espace personnel; institution = `COHORT`. | Exposer `THEMATIC` partout ou changer le type implicite des anciennes classes. | Vérifier les autorisations d'action et garder le défaut Prisma/comportement institutionnel. |
| La mutation et la lecture de `Class` restent dans le service owner `class`. | Ajouter une requête Prisma au service `personal`. | Le bootstrap existant compose une transaction inter-domaines; le helper transactionnel doit rester clairement possédé par `class` et invalidé après le commit externe. |
