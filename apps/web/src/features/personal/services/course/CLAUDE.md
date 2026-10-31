# features/personal/services/course

## Rôle
Création d'un cours dans l'espace personnel d'un prof. Le prof ne fournit que
`{ classId, name }` : la chaîne institutionnelle (UE `PERSONNEL` → matière du
même nom → cours → prof responsable) est créée en silence, dans UNE transaction.
Un groupe lié au cours (`Group.courseId`) n'est créé que si l'appelant passe
`withGroup: true`.

## Fichiers
| Fichier | Rôle |
|---|---|
| `database/course.mutations.ts` | `createPersonalCourse` (orchestrateur) + briques `*Tx` locales non exportées |
| `database/index.ts` | `export *` — interne au service |
| `server.ts` | entrée server-only (`import 'server-only'`, `export * from './database'`) |
| `validation.ts` | `createPersonalCourseSchema` (Valibot) |
| `types.ts` / `generated.types.ts` | `CreatePersonalCourseData`, `CreatePersonalCourseDto` |
| `actions/course.mutations.ts` | `createPersonalCourseAction` ("use server") |

## Invariants
- `createPersonalCourse` ne décide d'aucune règle métier : le groupe n'existe que sur `withGroup`,
  elle ne lit jamais le type de classe et ne peuple jamais le groupe (membres → `setGroupStudents`).
- Lectures (`findOrgClass`) AVANT la transaction ; la tx ne contient que des écritures.
- UECourse : unicité PARTIELLE (`uecourse_active_name_unique_idx`) → `findFirst` parmi les actives
  puis `create`, jamais d'upsert. `order` n'est jamais fourni (trigger `fn_uecourse_insert_order`).
- Doublon (classId, ueCourseId) actif → P2002 `course_active_unique_idx`, mappé par `tryConstraint`.
- `orgId` vient du token (`authAccess`), jamais du body.
- Invalidation APRÈS commit : `UE_CREATED`, `UE_COURSE_CREATED`, `COURSE_CREATED`, `GROUP_CREATED` (si groupe).

## Points d'extension / à surveiller
- `teacherId` est extrait de la session serveur (`authAccess`), jamais accepté depuis le client.
- ⚠ Événements `UE_CREATED` / `UE_COURSE_CREATED` : doivent exister dans les graphes des services `ue` / `ueCourse`.
- ⚠ Peuplement du groupe (inscrits) : volontairement hors de ce service.
- Pas de `cache.ts` : aucun nouvel événement, les existants sont réutilisés.
