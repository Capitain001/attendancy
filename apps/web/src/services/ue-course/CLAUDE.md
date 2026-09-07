# Service : ue-course

Gère les matières structurelles d'une UE — `UECourse`.
Entité structurelle (réutilisée par toutes les classes), pas d'instance temporelle.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `actions/index.ts` | Barrel exports des actions |
| `actions/ue-course.mutations.ts` | `createUECourseAction`, `removeUECourseAction` |
| `actions/ue-course.queries.ts` | `getUECoursesAction(ueId)` |
| `cache.ts` | `UE_COURSE_GRAPH` — invalidation liste + filtre UE |
| `database/index.ts` | Barrel interne (non exporté) |
| `database/ue-course.mutations.ts` | `createUECourse`, `removeUECourse` (soft delete) |
| `database/ue-course.queries.ts` | `getUECoursesByUE` — liste avec filtre UE |
| `generated.types.ts` | Types générés automatiquement (DTOs de lecture) |
| `index.ts` | Point d'entrée du service (export actions + types) |
| `types.ts` | DTOs et types du domaine |
| `validation.ts` | `createUECourseSchema` |
## Invariants

- `@@unique([name, ueId])` — contrainte `UECourse_name_ueId_key`
- `deletedAt` = soft delete — `where: { deletedAt: null }` dans les queries
- `orgId` dans `removeUECourse.where` pour ownership multi-tenant
- Accès lecture : tous membres (no `getAuthorization` dans la query action)
- Mutations : DIRECTION uniquement

## Points d'extension (⚠)

- `updateUECourseAction` si édition matière nécessaire
- `reorderUECourseAction` pour drag-and-drop (champ `order`)
