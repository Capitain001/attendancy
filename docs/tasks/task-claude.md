curent : https://claude.ai/chat/8501232a-7562-4fe5-b214-838ffdea6311

email : augustedev123@gmail.com

proprosition :

- **Groupe absent** : il est créé dans la même transaction que l'ajout. Si l'ajout échoue, aucun groupe orphelin n'est laissé.
- **Retour** : `notAddedStudentIds` contient les étudiants sans inscription active dans la classe du cours. Un étudiant déjà dans le groupe ne compte pas comme un échec, puisqu'il est bien dans le cours. L'appelant en déduit `studentIds.length - notAddedStudentIds.length`.

## `validation.ts`

```ts
export const enrollStudentsInPersonalCourseSchema = v.object({
  courseId: v.pipe(v.string(), v.uuid('ID de cours invalide')),
  studentIds: v.pipe(
    v.array(v.pipe(v.string(), v.uuid('ID étudiant invalide'))),
    v.minLength(1, 'Sélectionnez au moins un étudiant'),
  ),
})

export type EnrollStudentsInPersonalCourseInput = v.InferInput<typeof enrollStudentsInPersonalCourseSchema>
export type EnrollStudentsInPersonalCourseOutput = v.InferOutput<typeof enrollStudentsInPersonalCourseSchema>
```

## `src/features/personal/services/student-enrollment/database/student-enrollment.mutations.ts`

```ts
// Ajouter des étudiants à un cours = relier leur inscription (dans la classe
// du cours) au groupe du cours. Le classId vient du cours, jamais de l'appelant.
// Le groupe est créé au passage s'il manque, dans la même transaction.
// Retourne les étudiants qui n'ont pas pu être ajoutés (pas d'inscription
// active dans la classe du cours).
export async function enrollStudentsInPersonalCourse(
  params: EnrollStudentsInPersonalCourseOutput & { orgId: string },
) {
  const { orgId, courseId } = params
  const studentIds = Array.from(new Set(params.studentIds))

  // 1. Garde : le cours et sa classe appartiennent à l'org et sont actifs.
  const course = await prisma.course.findFirst({
    where: { id: courseId, orgId, deletedAt: null, class: { deletedAt: null } },
    select: { name: true, classId: true, group: { select: { id: true } } },
  })
  if (!course) throw new Error('Cours introuvable')
  const { classId } = course

  // 2. Inscriptions actives de ces étudiants dans la classe du cours.
  const enrollments = await prisma.studentEnrollment.findMany({
    where: {
      classId,
      studentId: { in: studentIds },
      endedAt: null,
      student: { orgId },
    },
    select: { id: true, studentId: true },
  })

  const enrolledStudentIds = new Set(enrollments.map((e) => e.studentId))
  const notAddedStudentIds = studentIds.filter((id) => !enrolledStudentIds.has(id))

  // Personne à ajouter : on n'écrit rien (pas de groupe créé pour rien).
  if (enrollments.length === 0) return { notAddedStudentIds }

  // 3. Écritures atomiques : groupe (si absent) puis affectation.
  const groupCreated = !course.group
  const { count } = await tryConstraint(
    prisma.$transaction(async (tx) => {
      const groupId =
        course.group?.id ??
        (
          await tx.group.create({
            data: { name: course.name, classId, courseId },
            select: { id: true },
          })
        ).id

      // Idempotent grâce à l'unique [enrollmentId, groupId].
      return tx.studentGroup.createMany({
        data: enrollments.map((e) => ({ enrollmentId: e.id, groupId })),
        skipDuplicates: true,
      })
    }),
  )

  // 4. Cache, après le commit.
  await Promise.all([
    ...(groupCreated ? [invalidateEvent('GROUP_CREATED', orgId, classId)] : []),
    ...(groupCreated || count > 0
      ? [
          invalidateEvent('GROUP_UPDATED', orgId, classId),
          invalidateEvent('COURSE_UPDATED', orgId, classId),
        ]
      : []),
  ])

  return { notAddedStudentIds }
}
```

## `src/features/personal/services/student-enrollment/actions/student-enrollment.mutations.ts`

```ts
import { enrollStudentsInPersonalCourseSchema } from '../validation'
import type { EnrollStudentsInPersonalCourseInput } from '../validation'
import { enrollStudentsInPersonalCourse } from '../database'

export async function enrollStudentsInPersonalCourseAction(input: EnrollStudentsInPersonalCourseInput) {
  const auth = await authAccess({ requiredRole: 'TEACHER', requiredOrgType: 'PERSONAL' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(enrollStudentsInPersonalCourseSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    return { data: await enrollStudentsInPersonalCourse({ ...parsed.output, orgId }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
```

## Forme retournée

```ts
{ data: { notAddedStudentIds: string[] } } | { error: string }
```
