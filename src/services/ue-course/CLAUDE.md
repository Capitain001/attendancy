# Service : ue-course

Gère les matières structurelles d'une UE — `UECourse`.
Entité structurelle (réutilisée par toutes les classes), pas d'instance temporelle.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `database/ue-course.queries.ts` | `getUECoursesByUE` — liste avec filtre UE |
| `database/ue-course.mutations.ts` | `createUECourse`, `removeUECourse` (soft delete) |
| `cache.ts` | `UE_COURSE_GRAPH` — invalidation liste + filtre UE |
| `validation.ts` | `createUECourseSchema` |
| `actions/ue-course.queries.ts` | `getUECoursesAction(ueId)` |
| `actions/ue-course.mutations.ts` | `createUECourseAction`, `removeUECourseAction` |

## Invariants

- `@@unique([name, ueId])` — contrainte `UECourse_name_ueId_key`
- `deletedAt` = soft delete — `where: { deletedAt: null }` dans les queries
- `orgId` dans `removeUECourse.where` pour ownership multi-tenant
- Accès lecture : tous membres (no `getAuthorization` dans la query action)
- Mutations : DIRECTION uniquement

## Points d'extension (⚠)

- `updateUECourseAction` si édition matière nécessaire
- `reorderUECourseAction` pour drag-and-drop (champ `order`)
