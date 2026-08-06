# Task5 — suggestions & 2ᵉ audit

NB : suggestions à juger avant implémentation. Verdict + audit ci-dessous.
Cibles : `CourseTeachersIsland.tsx` + `components/TeacherSection.tsx`.

---

## Suggestion initiale : `Promise.all` sur `getCourseTeachersAction` + `getTeachersAction`

**Verdict : rejetée sur sa prémisse — gain nul en parallélisme.**

Les deux appels sont **déjà parallèles**. Dans l'effet, les deux fonctions sont
invoquées synchroniquement avant qu'aucune ne résolve → les deux requêtes réseau
partent en même temps :

```ts
getCourseTeachersAction(courseId).then(...)  // requête 1 en vol
getTeachersAction().then(...)                // requête 2 en vol (immédiat)
```

`Promise.all` ne rendrait pas ça « plus parallèle ». Il change seulement le
**rendu** :

| | `.then()` séparés (actuel) | `Promise.all` |
|---|---|---|
| Parallélisme réseau | ✅ déjà | ✅ identique |
| Rendus React | 2 (chaque liste dès son retour) | 1 (les deux ensemble) |
| 1ʳᵉ peinture | progressive (dès la 1ʳᵉ réponse) | attend la plus lente |

→ Tradeoff neutre, pas une optimisation. **À ne pas implémenter tel quel.**
Si on veut 1 seul rendu + 1 état de chargement, `Promise.all` a du sens — mais
alors le vrai sujet est l'UX de chargement (île §2), pas le parallélisme.

---

## Audit `CourseTeachersIsland.tsx` — par priorité

### 1. ⚠ Violation d'invariant : action serveur appelée directement depuis un client
CLAUDE.md : « Composants clients : jamais d'appel direct à une server action —
toujours via un hook `hooks/data/<domain>/` (useCrudEntity/useEntity). »

L'île appelle directement `getCourseTeachersAction`, `getTeachersAction`,
`syncCourseTeachersAction`. **Non conforme.**

Correctif : passer par `hooks/data/courses/` —
- `useCourseTeachers(courseId)` existe déjà (lecture affectations).
- Manque : un hook liste enseignants (`useTeachers`) + une mutation
  `useSyncCourseTeachers` (via `useCrudEntity`/`useEntity`).

Amélioration structurante — règle aussi §2 et §3 (les hooks `hooks/data/` portent
déjà loading/error/invalidation).

### 2. Pas d'état loading / error
- Erreurs avalées (`if (!('error' in res))` → rien sinon).
- Aucun indicateur de chargement (listes vides puis remplissage).
- `handleSave` en échec → `console.error` seul. Convention : `@/lib/toast/custom-toast`.

### 3. Race condition `useEffect` (pas de cleanup)
Aucun `AbortController` ni flag « ignore ». Si `courseId` change / démontage
pendant une requête en vol → `setState` sur réponse périmée. Résolu nativement
via React Query (§1).

### 4. (option) Fetch client vs données serveur
Le reste de la page est RSC + Suspense. L'île pourrait recevoir les données
initiales en props (server-fetched), rester cliente seulement pour l'édition —
évite le waterfall mount→fetch. Plus lourd ; à peser vs le pattern hook.

---

## Audit `components/TeacherSection.tsx`

### 5. Dropdown maison `DotedSelect` réinvente un `Select`
Gère à la main : état `open`, listener `document.mousedown` pour l'outside-click,
navigation, rendu options. Le projet a déjà `@/components/ui/select` (shadcn/base-ui)
— accessibilité (clavier, ARIA, focus trap) et cohérence gratuites. **Réutiliser**
plutôt que maintenir ~120 lignes de dropdown custom.

### 6. `<img>` brut + `eslint-disable` au lieu d'un Avatar partagé
`TeacherAvatar` réimplémente avatar + initiales avec `<img>` (3 `eslint-disable`).
Le port classe utilise déjà `@/components/users/UserIcon`. **Réutiliser** ce
composant (gère fallback initiales + next/image).

### 7. Assertion non-null fragile
`allTeachers.find((t) => t.id === ct.teacherId)!` puis `.filter((ct) => ct.teacher)` :
le `!` ment au typage (peut être `undefined`), rattrapé après coup. Préférer un
`.flatMap` / garde explicite qui ne produit jamais d'`undefined`.

---

## Recommandation

1. **Ne pas** implémenter `Promise.all` (gain nul, hors sujet).
2. Prioriser §1 : brancher l'île sur `hooks/data/courses/`
   (`useCourseTeachers` + `useTeachers` + `useSyncCourseTeachers`) → conformité +
   UX loading/error + race condition d'un coup.
3. Toast succès/erreur sur `syncCourseTeachers`.
4. `TeacherSection` : remplacer `DotedSelect` par `ui/select` (§5) et
   `TeacherAvatar` par `UserIcon` (§6) — réduction nette de surface à maintenir.
5. §7 (assertion) : quick win indépendant.
