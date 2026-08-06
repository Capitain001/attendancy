<!-- /src/services/ -->
# SERVICE_CONTEXT.md

Règle de **réflexion** avant d'écrire une query, une mutation ou une fonction de
service dans `src/services/*`.

> Ce document ne décrit pas un gabarit à copier. Il décrit **comment penser**.
> Structure des fichiers : voir le skill `docs/skills/service-module-pattern/SKILL.md`.
> Exemple canonique : `src/services/entity/` (référence commentée).

---

## 1. Chaque modèle a un seul domaine propriétaire

| Modèle Prisma | Service propriétaire |
|---------------|----------------------|
| `Organization` | `org` |
| `User` (record applicatif) | `auth` |
| `Course` | `course` |
| `CourseTeacher` | `course-teacher` |
| ⚠ À ÉTENDRE PAR PROJET — une ligne par modèle | |

La couche Prisma d'un modèle vit dans son domaine propriétaire — **une seule
source de vérité, un seul cache, un seul point d'évolution**.

Un service qui *consomme* une donnée ne devient pas propriétaire : il ne refait
pas un `prisma.x.findMany()` sur un modèle d'un autre domaine. Il appelle la
query déjà exposée par l'owner.

```ts
// ❌ depuis un service consommateur
await prisma.resource.findMany(...)

// ✅
const resources = await getResources(parentId, orgId); // owner: service resource
```

---

## 2. Chaque service a son CLAUDE.md

Tout dossier `src/services/<service>/` contient un `CLAUDE.md` décrivant :

- **Rôle** — quel domaine le service possède
- **Fichiers** — table fichier → responsabilité
- **Points d'extension** — ce que le projet doit remplacer (marqués ⚠)
- **Invariants** — les règles que toute modification doit respecter

Ce fichier est lu par l'IA avant toute modification du service — il remplace la
lecture du code pour comprendre l'intention. Le maintenir à jour fait partie de
toute évolution du service. Modèles : `user/CLAUDE.md`, `org/CLAUDE.md`,
`entity/CLAUDE.md`.

---

## 3. Avant de créer une fonction, trois questions

1. **La donnée existe-t-elle déjà ailleurs ?** → identifier le modèle, son owner,
   et la query équivalente. Si elle existe, on la réutilise.
2. **Ma fonction change-t-elle ou combine-t-elle la donnée ?** → sinon, elle ne
   doit pas exister (voir §4).
3. **Qui peut fournir les données dont ma fonction a besoin ?** → l'appelant, le
   plus souvent. On ne résout pas une donnée en interne si le parent l'a déjà
   (voir §5).

---

## 4. Composer ≠ wrapper

Un service consommateur n'est **pas un domaine de données**.
C'est une couche de composition **uniquement quand elle apporte une valeur**.

Une fonction de composition est justifiée seulement si elle :

- **adapte** la donnée à un besoin métier (filtre conditionnel, projection) ;
- **fusionne** plusieurs domaines (ex. dashboard = plusieurs sources) ;
- porte une **logique** propre au contexte.

Sinon — si elle ne fait que résoudre un id puis déléguer à l'owner **sans rien
changer au retour** — elle n'existe pas. L'appelant appelle l'owner directement.

```ts
// ❌ wrapper sans valeur
export const getParentResources = (parentId, orgId) => getResources(parentId, orgId);

// ✅ la page RSC compose directement
const [items, resources] = await Promise.all([
  getItemsAction({ parentId }),      // owner: item
  getResourcesAction({ parentId }),  // owner: resource
]);
```

> Si une fonction ne change ni ne combine la donnée, elle ne doit pas exister.

---

## 5. Fonctions pures : le parent fournit les props

Une fonction ne résout pas ce dont elle a besoin tant qu'elle peut le **recevoir**.
Avant d'ajouter un fetch interne, demander : *l'appelant peut-il fournir cette
donnée ?* — généralement oui (page, action, loader l'ont déjà résolue).

Conséquences :

- **Un seul point de résolution** par donnée.
- **Distinguer contexte auth et donnée métier.** Le scope tenant (`orgId`) vient
  du token (frontière auth, dans l'action) ; les ids métier (`entityId`,
  `parentId`) sont de la donnée métier → fournis par l'appelant. Ne pas
  confondre les deux.
- Fonction pure = testable, cacheable au bon niveau, sans duplication cachée.

---

## 6. Anti-pattern : résolution cachée dans une action

Une action ne résout jamais son propre contexte métier en interne.

```ts
// ❌ anti-pattern : l'action résout parentId + charge 3 domaines
async function getDashboardAction() {
  const profile = await getProfile(...)       // résolution cachée
  const items = await getItems(profile.parentId, orgId)
  const resources = await getResources(profile.parentId, orgId)
  return { items, resources }
}

// ✅ la page RSC résout le contexte une fois, puis parallélise des actions ciblées
const parent = await getParentAction(parentId)
const [items, resources] = await Promise.all([
  getItemsAction(parentId),
  getResourcesAction(parentId),
])
```

Règle : `getUserInfo()` + `orgId` = contexte auth → dans l'action.
Les ids métier = données métier → fournis par l'appelant.
Ne jamais mélanger les deux dans la même résolution interne.

---

## 7. Cohérence du cache

Le cache suit l'unique implémentation de la donnée (celle de l'owner). En
composant l'owner, on hérite de **son** cache — on n'empile pas une seconde
couche de cache sur la même donnée dans le consommateur.

Cross-service : si `getEntity` inclut des ressources d'un autre domaine dans son
`select`, alors le graphe de CE domaine doit invalider `CACHE.ENTITY` en plus du
sien.

```ts
// resource/cache.ts — invalide aussi entity car getEntity inclut les resources
export const RESOURCE_GRAPH = {
  RESOURCE_CREATED: (orgId: string, entityId: string) => [
    CACHE.RESOURCE(orgId, entityId),
    CACHE.ENTITY(orgId, entityId), // cross-service
  ],
} as const
```

---

## 8. Outillage automatique

Deux générateurs vivent sous `scripts/generate/` — les utiliser plutôt qu'écrire à la main.

### Indexeur API (`scripts/generate/api/`)

Génère `src/services/<service>/.api/index.json` + une fiche JSON par fonction exportée.
Utilisé par l'IA et le hook pre-commit pour la navigation rapide du codebase.

```bash
npx tsx scripts/generate/api/api.ts <service>       # un service
npx tsx scripts/generate/api/sync.ts                # tous les services éligibles
npx tsx scripts/generate/api/api.ts --check         # cohérence cross-service
```

Ce que génère `api.ts` par fonction : `sig` (signature), `layer` (db|action),
`kind` (query|mutation|server-action), `composes`/`calls` (dépendances),
`depsMap` (cross-service), `orgIdIssues` (violations de scope détectées).

### Générateur de types (`scripts/generate/types/`)

Génère `src/services/<service>/types.ts` depuis `database/*.queries.ts`.
Naming : `getEntity` → `export type GetEntityDto = Awaited<ReturnType<typeof getEntity>>`

```bash
npx tsx scripts/generate/types/types.ts <service>   # un service
npx tsx scripts/generate/types/types.ts --all       # tous les services
```

### Pre-commit (`.husky/pre-commit`)

Si des fichiers `src/services/` sont stagés : régénère `.api/` des services
touchés (régime généré) + check cross-service bloquant sur référence morte.

## Naming

### Suppression

- **Soft delete** : utiliser le préfixe `remove`
  - ✅ `removeRoom`
  - ✅ `removeStudent`

- **Hard delete** : utiliser le préfixe `delete`
  - ✅ `deleteRoom`
  - ✅ `deleteStudent`

### Lecture

- Toutes les opérations de lecture utilisent le préfixe `get`.
- Le préfixe `list` est interdit.

| Opération | Convention |
|-----------|------------|
| Récupération d'un élément | `getRoom` |
| Récupération d'une collection | `getRooms` |

**Exemples :**

- ✅ `getRoom`
- ✅ `getRooms`
- ❌ `listRoom`
- ❌ `listRooms`

### Tests

`*.unit.test.ts` co-localisés (fonctions pures — authorization, policies).
`*.integration.test.ts` (DB réelle) — base dédiée via `npm run test:db:setup`.
Helpers partagés du service : `__tests__/*.helpers.ts` (exemple commenté dans
`entity/__tests__/`). Chaque test crée son propre tenant — aucune dépendance à
un état pré-existant.

---

## 9. Checklist mentale

- [ ] Quel service possède ce modèle ? Sa query existe-t-elle déjà ?
- [ ] Ma fonction transforme/fusionne/filtre — ou n'est-ce qu'un wrapper ?
- [ ] L'appelant peut-il fournir les ids/données plutôt que moi les résoudre ?
- [ ] Est-ce du contexte auth (`orgId` ← token) ou de la donnée métier (id ← props) ?
- [ ] Vais-je créer un doublon de cache sur une donnée d'un autre domaine ?
- [ ] Ai-je enregistré `<SERVICE>_GRAPH` dans `src/cache/server/key.ts` ?
- [ ] Le `CLAUDE.md` du service reflète-t-il encore la réalité après ma modif ?
- [ ] Ai-je régénéré `.api/` et `types.ts` après ajout/modification ?
