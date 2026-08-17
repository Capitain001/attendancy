## Hook `useUECourse`

file: [useUECourse.ts](/src/hooks/data/ue-course/useUECourse.ts)

**`src/hooks/data/ue-course/useUECourse.ts`** — Hook de gestion CRUD des Éléments Constitutifs (EC / Cours) rattachés à une UE :

- Utilise `useCrudEntity` pour la gestion réactive et synchronisée du cache local
- Utilise les helpers `toFetchFn`, `toCreateFn`, `toUpdateFn`, `toDeleteFn` (convention **V2** : `{ data } | { error }`)
- Importe les actions depuis le barrel file `@/services/ue-course`
- Typage strict importé depuis Valibot (`CreateUECourseInput`, `UpdateUECourseInput`)
- Le type de base de l'élément est inféré directement depuis la base de données : `GetUECoursesByUEDto[number]`
- Options obligatoires : `ueId` (le parent)
- Options facultatives : `staleTime`, `enabled`
- Nom d'entité en cache dynamiquement construit (`ue-courses-${ueId}`) pour isoler chaque UE

### Détails d'implémentation à connaître

- **`ueId` requis** : Ce hook est intimement lié à son UE parente. Il faut systématiquement passer `ueId` dans les options pour construire la clé de cache locale et charger les bons cours.
- **Validation `null` vs `undefined`** : Le schéma Valibot de `ue-course` utilise `v.optional(v.nullable(...))`, il accepte donc indifféremment `null` ou `undefined` pour ses champs (contrairement à `useUEs`).
- **`create`** : L'action serveur `createUECourseAction` attend ses arguments "à plat" (`{ name, code, ueId }`) et non imbriqués sous une clé `data`. Le hook s'y conforme naturellement sans wrapper `{ data }`.
- **`update`** : Mappé via `toUpdateFn(updateUECourseAction, "ueCourseId")`. S'utilise sous la forme conventionnelle de `useCrudEntity` : `{ id, data }`.
- **`delete`** : Suppression matérielle ou soft-delete gérée par `removeUECourseAction`. Exposé de façon classique via `delete`.

### Utilisation :

```tsx
// L'ID de l'UE parente doit être fourni dans un objet d'options
const { data: courses, create, update, delete: removeCourse } = useUECourse({ ueId: "ue-123" });

// Créer un nouveau cours (EC)
// Tous les paramètres sont au même niveau (à plat)
await create({ 
  ueId: "ue-123",
  name: "Base de données relationnelles", 
  code: "BDD101", 
  credits: 3,
  duration: 30
});

// Mettre à jour un cours
// Séparation { id, data: {...} } obligatoire
await update({ 
  id: "course-456", 
  data: { 
    duration: 45 // Modification partielle acceptée
  } 
});

// Supprimer un cours
await removeCourse("course-456");
```
