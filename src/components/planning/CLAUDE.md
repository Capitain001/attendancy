# Composants `planning`

## Point d'entrée

`ClassPlanning` est le seul composant à instancier depuis une page RSC.
Tout le reste est interne — importer via le barrel `@/components/planning`.

```tsx
import { ClassPlanning } from "@/components/planning"

<ClassPlanning
  slug={slug}           // slug de l'organisation (pour le lien retour vers la classe)
  classId={classId}     // id de la classe
  resources={resources} // NonNullable<PlanningResources> — chargé côté serveur
  schedules={schedules} // GetSchedulesReturn — chargé côté serveur
/>
```

La page RSC chargeant ces données est :
`src/app/(app)/[slug]/direction/planning/classe/[classId]/page.tsx`

---

## Composants

| Composant | Rôle | Paramètre clé |
|---|---|---|
| `ClassPlanning` | Racine client — calendrier + dialog + export | `resources`, `schedules`, `classId`, `slug` |
| `CoursePlanningDialog` | Dialog création/édition séance (lazy via `dynamic`) | `EventDialogRendererProps` + `classId` + `resources: NonNullable<PlanningResources>` |
| `CoursePCard` | Carte aperçu séance (mode `view`) | `courseName`, `date`, `startTime`, `endTime`, `roomName`, `teacher`, `status` |
| `CourseECard` | Carte édition séance (mode `edit`) | `courseOptions`, `roomOptions`, `teacherOptions`, `timeOptions`, `onUpdate` |
| `MiniMonth` | Mini-calendrier mensuel (dans `CourseECard`) | `value: Date`, `onChange: (d: Date) => void` |
| `TeacherCombobox` | Sélecteur enseignant avec recherche | `teachers: CourseTeacherItem[]`, `value`, `onChange` |
| `PlanningExportWidget` | Popover d'export (scope × période) | `classId`, `resources: NonNullable<PlanningResources>` |
| `PlanningToolbar` | Barre d'actions du dialog (modes + save/delete) | voir `PlanningToolbarProps` |

---

## Hooks internes

### `usePlanningEvents(opts)`

Gère le state des événements + appels CRUD schedule.

```ts
const { events, onEventAdd, onEventUpdate, onEventDelete } = usePlanningEvents({
  initialEvents,          // ScheduleEvent[] mappés depuis schedules
  classId,
  confirmMove,            // (prev, next) => Promise<boolean> — confirmation drag
  getConflictResources,   // (classId) => Promise<ConflictResources | null>
})
```

- `onEventAdd` / `onEventUpdate` / `onEventDelete` → passés directement à `<EventCalendar>`
- Gère le toast undo (6s), la détection de conflit (`checkConflictsAction`), le diff avant update

### `useActionConfirm()`

Toast de confirmation pour le drag&drop.

```ts
const { open, waitForConfirmation, onConfirm, onCancel, onClose } = useActionConfirm()
```

- `waitForConfirmation()` → Promise<boolean> — suspendre le drag jusqu'à la réponse utilisateur

---

## `coursePlanning/` — utilitaires métier (barrel `./coursePlanning`)

| Fonction | Usage |
|---|---|
| `getInitialCoursePlanningFormState(event)` | Init `CoursePlanningFormState` depuis un `ScheduleEvent` ou `null` (nouvelle séance) |
| `buildTimeOptions(startHour, endHour)` | Génère les options horaires (pas de 15 min) |
| `computeSlotFromFormTimes(date, start, end)` | `{ start: Date, end: Date } \| null` — valide l'intervalle |
| `resolveTimeUpdateAgainstGrid(data, currentEnd, options)` | Ajuste `endTime` si `startTime` le dépasse |
| `buildCourseMap(courses)` / `buildRoomMap(rooms)` | `Map<id, row>` pour lookup rapide |
| `buildAllTeachersMap(courses)` | `Map<teacherId, teacher>` sur tous les cours |
| `flattenTeacherIdsForAvailability(courses)` | `{ id }[]` pour `useAvailability` |
| `roomsForAvailability(rooms)` | `{ id }[]` pour `useAvailability` |
| `buildCourseSelectOptions(courses)` | `{ value, label }[]` pour `<Select>` |
| `buildRoomSelectOptions(rooms, isRoomAvailable)` | idem + `disabled` si occupée |
| `buildTeacherCardItems(teachers, isAvailable, duration)` | `CourseTeacherItem[]` pour `TeacherCombobox` |
| `buildUseAvailabilityParams({ form, classId, resources, excludeScheduleId })` | Construit les params de `useAvailability` |
| `validateScheduleForSave(form, slot)` | Retourne `{ ok, slot } \| { ok: false, message }` |
| `buildScheduleEventFromForm({ form, slot, ... })` | Construit le `ScheduleEvent` pour `onSave` |

---

## Types clés (barrel `@/components/planning`)

```ts
// Ressources planning d'une classe — chargées côté serveur par getPlanningResources
// Nullable (null si classId inconnu). Toujours NonNullable avant d'entrer dans les composants.
type PlanningResources = ... | null  // (depuis @/services/planning)

// Dérivés de PlanningResources
type PlanningCourseRow    // resources.courses[number]
type PlanningTeacherRow   // course.teachers[number]
type PlanningRoomRow      // resources.rooms[number]

// État du formulaire dialog
interface CoursePlanningFormState {
  courseId, roomId, teacherId, groupId: string
  startDate: Date; startTime, endTime, notes: string
  status: ScheduleStatus; confirmed: boolean
}

// Patch émis par CourseECard vers CoursePlanningDialog
type CoursePlanningCardUpdatePatch = Partial<{ date, courseId, startTime, endTime, roomId, teacherId }>

// Mode du dialog
type DialogMode = "view" | "edit" | "notes" | "group"

// Sentinelles
const NO_TEACHER = "__none__"  // enseignant non assigné
const NO_GROUP   = "__none__"  // toute la classe (groupId null en DB)
```

---

## `utils.ts` — utilitaires partagés

```ts
mapScheduleToEvent(schedule: ScheduleRow): ScheduleEvent
statusToColor(status: ScheduleStatus): EventColor
buildScheduleMoveChange(previous, next): ScheduleMoveChange
buildScheduleMoveToastContent(previous, next): { title, description }
```

`ScheduleRow` = select Prisma Schedule avec `course`, `room`, `teacher`, `group`, `classId`.

---

## Règles d'usage

- `CoursePlanningDialog` est chargé en `dynamic({ ssr: false })` — jamais importé directement comme composant SSR.
- `PlanningResources` est `null` si la classe n'existe pas — la page vérifie avant de rendre `ClassPlanning`.
- `NO_GROUP` / `NO_TEACHER` sont des sentinelles string (`"__none__"`) ; en DB, `groupId: null` = classe entière.
- `useAvailability` est branché dans `CoursePlanningDialog` — il rafraîchit en temps réel les disponibilités salle/prof.
- Toast de conflit : `toastScheduleConflict` (dans `conflictsToast.ts`) — nécessite `ConflictResources` (sous-ensemble de `PlanningResources`).
