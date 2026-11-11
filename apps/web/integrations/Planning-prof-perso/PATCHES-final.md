# Planning prof perso — PATCHES (version finale)

Principe : le prof choisit une classe, puis `TeacherPersonalPlanning` (Calendar générique + liste du jour
+ dialogue) s'appuie sur l'existant. Les règles métier (policy, contraintes GiST, triggers) restent côté
serveur/DB ; l'écriture passe par `usePlanningEvents` (conflits, undo, rollback).

**Non modifiés :** `usePlanningEvents`, `ClassPlanning`, `useScheduleDays`, `planningSchedulesQuery`, actions `schedule`.

---

## 1. Fichiers livrés

| Fichier | Rôle |
|---|---|
| `app/(app)/personal/[slug]/teacher/planning/[classId]/page.tsx` | Prefetch `planningSchedulesQuery({ date, classId })`, charge `getPlanningResourcesAction(classId)` + `getCurrentTeacherId()` |
| `components/teacher/planning/TeacherPersonalPlanning.tsx` | `Calendar` + liste du jour + dialogue ; `usePlanningEvents` pour l'écriture |
| `components/teacher/planning/ui/TeacherDaySchedules.tsx` | Liste des séances du jour + bouton « Ajouter » (visuel minimal) |
| `features/personal/services/class/database/class.mutations.ts` | `ensurePersonalRoom` appelé par `createPersonalClass` (salle par défaut) |
| `scripts/backfill-personal-rooms.ts` | Rattrapage des orgs PERSONAL existantes sans salle (`--dry` pour simuler) |

---

## 2. Modifications du code existant

### 2.1 `features/personal/constants`
```ts
export const PERSONAL = {
  // ...existant (NAME, ACADEMIC_YEAR, ...)
+ ROOM_NAME: 'Salle principale',
}
```

### 2.2 `components/planning/CoursePlanningDialog.tsx` — enseignant présélectionné
À chaque changement de cours, `handleCardUpdate` remet `teacherId = NO_TEACHER`. En org perso le cours
n'a qu'un enseignant : le présélectionner (bénéfice aussi pour la direction).
```ts
if (resolved.courseId) {
  next.courseId = resolved.courseId;
  if (resolved.courseId !== prev.courseId) {
-   next.teacherId = NO_TEACHER;
+   const teachers = courseMap.get(resolved.courseId)?.teachers ?? [];
+   next.teacherId = teachers.length === 1 ? teachers[0].id : NO_TEACHER;
  }
}
// + `courseMap` dans les deps du useCallback
```
Caduc dès que ton dialogue dédié remplace `PlanningDialog` (voir §6).

---

## 3. À vérifier côté serveur (aucun code fourni)

1. **`getClassSchedulesAction`** (utilisé par `planningSchedulesQuery` via `getSchedulesAction`) : confirmer
   `allowPersonalOrg: true` et qu'un TEACHER d'org PERSONAL passe l'auth. Déjà confirmé pour les mutations
   `schedule`, `checkConflictsAction`, `checkAvailabilityAction`, `getPlanningResourcesAction`.
2. **`createScheduleAction` / `createSchedule`** : seule l'appartenance de `classId` à l'org est vérifiée.
   `teacherId` et `roomId` viennent du client sans contrôle d'org (simple FK Postgres). En org PERSONAL,
   imposer côté serveur que `teacherId` soit le prof de l'org, et que `roomId` appartienne à l'org.
3. **Hors périmètre, constaté** : `removeScheduleAction` n'a ni validation UUID ni refus des séances
   verrouillées côté serveur ; `cancelScheduleAction` ne notifie ni n'audite (le dialogue passe par
   `updateScheduleAction`, donc pas affecté).

---

## 4. À confirmer avant de tester

- **`getPlanningRange(date)`** (`services/planning/utils`) : je passe `date = yyyy-MM-01` du mois visible.
  Si la plage renvoyée couvre le mois (ou mois ±1, comme la page direction) : OK. Si c'est une semaine,
  le calendrier mensuel sera incomplet → ajouter un mode mois ou ajuster le paramètre.
- **`QUERY_PRESETS.DASHBOARD`** est surchargé par `staleTime: 0` dans `TeacherPersonalPlanning` : voulu,
  car `usePlanningEvents` n'invalide pas React Query (état local). Option plus propre à terme : un
  callback `onMutated` dans `usePlanningEvents` (non fait pour ne pas toucher au hook).

Hypothèses marquées `⚠` dans le code :
- `Room` : champs obligatoires supposés = `name` + `orgId`, `capacity` nullable ; ajouter `deletedAt: null`
  dans `ensurePersonalRoom` et le script si `Room` est en soft-delete.
- `invalidateEvent('ROOM_CREATED', orgId)` : nom d'événement à confirmer dans `cache/server/graph`.
- `handleSave` : `"dialog" as ScheduleUpdateSource` — choisir une valeur de l'union (seul `"dnd"` déclenche
  `confirmMove`).
- `NO_TEACHER` importé depuis `@/components/planning/types` (comme `usePlanningEvents`) ; il existe aussi
  dans `coursePlanning/formState.ts` : vérifier que c'est la même valeur.
- Brouillon de création : événement `id: ""` + `meta` minimal supposé accepté par
  `getInitialCoursePlanningFormState` (sinon l'aligner sur l'événement que `EventCalendar` passe au clic).
- `mapScheduleToEvent(s as never)` : retirer le cast si `GetSchedulesDto[number]` est compatible avec
  `ScheduleRow` (annoncé directement convertible).

---

## 5. Ordre de mise en production

1. Ajouter `PERSONAL.ROOM_NAME`.
2. Déployer `class.mutations.ts` (les nouvelles classes perso reçoivent leur salle).
3. `npx tsx scripts/backfill-personal-rooms.ts --dry`, puis sans `--dry` (idempotent, relançable).
4. Déployer la page `[classId]`, `TeacherPersonalPlanning`, `TeacherDaySchedules` + patch §2.2.
5. Pointer le sélecteur de classe perso vers `/personal/{slug}/teacher/planning/{classId}`.

Sans salle, le dialogue affiche « ressources manquantes » (`CourseRCard`) : ne pas sauter l'étape 3.

---

## 6. Dialogue dédié prof (quand il sera prêt)

Remplacer `PlanningDialog` dans `TeacherPersonalPlanning` (un seul point). Contrat de props identique
à `CoursePlanningDialog` :
`event | null`, `isOpen`, `onClose`, `onSave`, `onDelete`, `classId`, `resources`, `onLockChange`.

Règles à conserver (portées par le dialogue actuel) :
- `event.id` vide = création ; un créneau écoulé bloque la création (`isSlotElapsed`).
- `isScheduleEditable` (statut `PENDING`, non verrouillé, non écoulé) conditionne modifier/supprimer.
- `onSave` = `onEventAdd` / `onEventUpdate` (conflits, undo, rollback gérés par le hook) ; le dialogue
  se ferme après `onSave`, mais **l'hôte ferme après `onDelete`**.
- Annulation = `onSave` avec `status: "CANCELED"` (passe par `updateScheduleAction` : notification + audit).
- Disponibilités via `useAvailability` ; verrou via `toggleScheduleLockAction` puis `onLockChange`.
- Validation avant envoi : cours, salle et enseignant obligatoires (`validateMeta` dans le hook).

---

## 7. Checklist de test

1. Org perso neuve : onboarding → classe créée → une « Salle principale » existe.
2. Créer une séance aujourd'hui / demain : brouillon accepté, enseignant présélectionné, salle auto.
3. Créer un chevauchement : toast de conflit, aucune séance ajoutée.
4. Modifier : seul le `diff` part vers `updateScheduleAction`.
5. Supprimer puis « Annuler » dans le toast : la séance revient ; aller-retour entre deux mois : cohérent.
6. Verrouiller : édition/suppression bloquées, déverrouillage possible.
7. Jour passé : bouton « Ajouter » désactivé ; séance passée non modifiable.
8. Navigation de mois (`?month=`) : points du calendrier et liste du jour corrects.