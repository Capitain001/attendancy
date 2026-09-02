// src/services/curriculum/database/curriculum.mutations.ts
//
// Composition term + course — curriculum ne possède AUCUN modèle Prisma
// propre. Il orchestre deux fonctions owner existantes dans le bon ordre,
// même précédent que finalizeSession (session) → markScheduleAbsences
// (attendance) : import direct de la database/ d'un autre service, pas de
// passage par ses actions (auth déjà faite une fois ici, tout doit rester
// cohérent si un jour ceci passe en $transaction).
//
// Problème résolu : generateTermsFromProgram et generateCoursesFromProgram
// existent et fonctionnent chacun isolément, mais rien ne les enchaînait —
// lancés indépendamment (deux boutons), les cours sortaient avec
// termId: null car `termsBySemester` n'était jamais construit. Ici, l'ordre
// est garanti : Terms d'abord, mapping construit depuis TOUS les Terms de la
// classe (fraîchement créés + déjà existants), puis Courses liés dès leur
// création.
import { prisma } from '@/lib/prisma'
import { invalidateEvent } from '@/cache/server/key'
import { generateTermsFromProgram } from '@/services/term/database/term.mutations'
import { generateCoursesFromProgram } from '@/services/course/database/course.mutations'

/**
 * Applique un programme à une classe : génère les semestres manquants,
 * PUIS génère les cours manquants en les rattachant à leur semestre.
 * Idempotent de bout en bout (les deux fonctions composées le sont déjà).
 *
 * Ne prend pas `programId` en paramètre — le programme d'une classe est une
 * propriété structurelle de `Class.programId`, résolue ici (une classe n'a
 * qu'un seul programme actif à la fois, contrairement à termId/courseId qui
 * sont multiples).
 */
export async function applyProgramToClass({
  classId,
  orgId,
}: {
  classId: string
  orgId: string
}) {
  // 1. Semestres — idempotent, ignore les `order` déjà présents. Lève déjà
  //    "Aucun programme attaché à cette classe" si Class.programId est null,
  //    donc pas besoin de dupliquer cette garde ici.
  const createdTerms = await generateTermsFromProgram(classId, orgId)

  // 2. Mapping semestre structurel → Term.id de CETTE classe — reconstruit
  //    depuis TOUS les Terms (pas seulement ceux créés à l'instant : un
  //    semestre déjà existant avant cet appel doit aussi recevoir ses cours).
  const allTerms = await prisma.term.findMany({
    where: { classId },
    select: { order: true, id: true },
  })
  const termsBySemester = Object.fromEntries(allTerms.map((t) => [t.order, t.id]))

  // 3. programId : relecture minimale, dans le même esprit que la vérif
  //    d'appartenance déjà faite indépendamment par generateTermsFromProgram
  //    ET generateCoursesFromProgram (chacune valide son propre scope — pas
  //    une redondance à éliminer, une défense en profondeur déjà en place
  //    dans le style du projet).
  const class_ = await prisma.class.findFirst({
    where: { id: classId, deletedAt: null, programTrack: { orgId } },
    select: { programId: true },
  })
  if (!class_?.programId) throw new Error('Aucun programme attaché à cette classe')

  // 4. Cours — rattachés à leur Term dès la création.
  const { created: createdCourses, skippedCount: coursesSkipped } =
    await generateCoursesFromProgram({
      programId: class_.programId,
      classId,
      orgId,
      termsBySemester,
    })

  await invalidateEvent('CURRICULUM_APPLIED', orgId, classId)

  return {
    termsCreated: createdTerms,
    coursesCreated: createdCourses,
    coursesSkipped,
  }
}
