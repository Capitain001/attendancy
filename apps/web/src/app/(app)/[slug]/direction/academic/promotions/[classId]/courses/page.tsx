import { connection } from 'next/server'
import { notFound } from 'next/navigation'

import { PromotionCoursesSection } from '@/components/courses/direction/sections/PromotionCoursesSection'
import { getCoursesAction } from '@/services/course'
import { TermCreateButton } from '@/components/direction/academic/TermForm'
import { TermsList } from '@/components/term/TermsList'
import { getTermsAction } from '@/services/term'
import { TermsChips } from '@/components/term/TermsChips'
import { ClassTerms } from '@/components/term/ClassTerms'
// ⚠ à confirmer : quelle action expose déjà { programId } pour une classe ?
// Le service `class`/`academic` n'était pas dans mon contexte — brancher la
// bonne action à la place de ce placeholder pour hasProgram (voir plus bas).
// import { getClassAction } from '@/services/class'

interface PageProps {
  params: Promise<{ classId: string; slug: string }>
}

export default async function Page({ params }: PageProps) {
  await connection()

  const { classId } = await params

  // Deux résultats à résoudre indépendamment — chacun garde son objet
  // { data } | { error } intact jusqu'au narrowing, pas de déstructuration
  // séparée avant coup (sinon `terms`/`error` perdent leur lien pour TS,
  // c'est exactement le bug du snippet précédent).
  const coursesResult = await getCoursesAction(classId)
  const termsResult = await getTermsAction(classId)

  if ('error' in coursesResult) notFound()
  if ('error' in termsResult) notFound()

  const courses = coursesResult.data
  const terms = termsResult.data // narrowed en T[] — plus jamais undefined ici


  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* En-tête */}
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold tracking-tight">Cours</h1>
        <p className="text-sm text-muted-foreground">
          {courses.length === 0
            ? 'Aucun cours pour cette promotion.'
            : `${courses.length} cours répartis par semestre.`}
        </p>
      </div>
      {/* <TermsChips terms={terms} /> */}
      <ClassTerms classId={classId} />


      <PromotionCoursesSection courses={courses} />
    </div>
  )
}