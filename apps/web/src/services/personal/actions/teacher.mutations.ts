// src/services/personal/actions/teacher.mutations.ts
'use server'

import { redirect } from 'next/navigation'
import { authAccess } from '@/services/auth'
import { redirectUser } from '@/config/redirects'
import { ensurePersonalAcademicYearAction } from '@/services/academic-year'
import { ensurePersonalDepartmentAction } from '@/services/department'
import {
  createClassAction,
  getActiveClassesCountAction,
  removeClassAction,
  updateClassAction,
} from '@/services/class'
import { ensurePersonalProgramTrackAction } from '@/services/program-track'
import { getOrgClassQuotaAction } from '@/services/organization'

async function getPersonalTeacherContext() {
  const auth = await authAccess({ requiredRole: 'DIRECTION', allowPersonalOrg: true })
  // Une session absente ne peut pas poursuivre dans le parcours personal.
  if (!auth.data) redirect('/login')

  const { user, orgId } = auth.data
  // allowPersonalOrg ouvre le bypass RBAC; cette garde resserre l'accès au seul
  // TEACHER de l'org PERSONAL et renvoie les autres profils vers leur dashboard.
  if (user.organization?.type !== 'PERSONAL' || user.role !== 'TEACHER' || !user.organization.slug) {
    redirect(redirectUser(user))
  }

  return {
    user,
    orgId,
    // redirectUser cible /personal/{slug}/teacher pour ce rôle et ce type d'org.
    homePath: redirectUser(user),
    // Les mutations de classes reviennent vers la liste, avec error/status en query.
    classesPath: `/personal/${encodeURIComponent(user.organization.slug)}/teacher/classes`,
  }
}

export async function startPersonalTeacherAction() {
  const { user, orgId, homePath: destination } = await getPersonalTeacherContext()
  // Précontrôle UX : un bootstrap répété ne recrée pas de classe; la limite exacte
  // reste imposée par la contrainte DB lors de createClassAction plus bas.
  const [classCount, quota] = await Promise.all([
    getActiveClassesCountAction(),
    getOrgClassQuotaAction(),
  ])
  // L'accueil affiche l'erreur d'initialisation si l'un des deux contrôles échoue.
  if ('error' in classCount || 'error' in quota) redirect(`${destination}?error=bootstrap`)
  // Une classe existe déjà : « Démarrer » est idempotent, retour à l'accueil.
  if (classCount.data > 0) redirect(destination)
  // Quota nul/atteint : retour à l'accueil pour afficher l'état quota.
  if (quota.data.maxClasses !== null && classCount.data >= quota.data.maxClasses) {
    redirect(`${destination}?error=quota`)
  }

  // Ces actions appartiennent aux services propriétaires; elles garantissent
  // les ressources structurelles cachées nécessaires à une Class.
  const [academicYear, department] = await Promise.all([
    ensurePersonalAcademicYearAction(),
    ensurePersonalDepartmentAction(),
  ])
  // Sans année ni département, le bootstrap ne peut pas créer de filière/classe.
  if ('error' in academicYear || 'error' in department) redirect(`${destination}?error=bootstrap`)

  // ProgramTrack est créé dans son service propriétaire et rattaché au département.
  const programTrack = await ensurePersonalProgramTrackAction(department.data.id)
  if ('error' in programTrack) redirect(`${destination}?error=bootstrap`)

  // Le service class crée la classe initiale avec les IDs préparés ci-dessus.
  const result = await createClassAction({
    name: 'Ma première classe',
    programTrackId: programTrack.data.id,
    academicYearId: academicYear.data.id,
  })

  if ('error' in result) {
    // Si la contrainte DB signale le quota, demander à l'accueil de l'afficher.
    if (result.error.toLowerCase().includes('limite')) redirect(`${destination}?error=quota`)
    // Un autre clic concurrent a peut-être déjà créé la classe; dans ce cas,
    // considérer le démarrage comme réussi et revenir à l'accueil.
    const classCountAfterAttempt = await getActiveClassesCountAction()
    if ('data' in classCountAfterAttempt && classCountAfterAttempt.data > 0) redirect(destination)
    // Sinon, l'accueil affichera une erreur de bootstrap générique.
    redirect(`${destination}?error=bootstrap`)
  }

  // Succès : afficher le dashboard personal teacher.
  redirect(destination)
}

export async function createPersonalClassAction(formData: FormData) {
  // Le contexte fournit le chemin de retour; orgId n'est pas consommé ici car
  // les actions propriétaires résolvent leur propre scope d'organisation.
  const { orgId, classesPath } = await getPersonalTeacherContext()
  const name = formData.get('name')
  // FormData est une entrée non typée issue du navigateur : rejeter avant tout appel métier.
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
    redirect(`${classesPath}?error=validation`)
  }

  // Contrôle léger pour éviter de préparer le référentiel si le quota est déjà atteint;
  // la base reste la protection contre les requêtes concurrentes.
  const [classCount, quota] = await Promise.all([
    getActiveClassesCountAction(),
    getOrgClassQuotaAction(),
  ])
  // Les erreurs sont converties en query params lus par la page classes.
  if ('error' in classCount || 'error' in quota) redirect(`${classesPath}?error=create`)
  if (quota.data.maxClasses !== null && classCount.data >= quota.data.maxClasses) {
    redirect(`${classesPath}?error=quota`)
  }

  // Réutiliser le même scaffolding que le bouton initial; ces services font le upsert.
  const [academicYear, department] = await Promise.all([
    ensurePersonalAcademicYearAction(),
    ensurePersonalDepartmentAction(),
  ])
  if ('error' in academicYear || 'error' in department) redirect(`${classesPath}?error=create`)

  // Créer/récupérer la filière avant de déléguer la mutation Class.
  const programTrack = await ensurePersonalProgramTrackAction(department.data.id)
  if ('error' in programTrack) redirect(`${classesPath}?error=create`)

  const result = await createClassAction({
    name: name.trim(),
    programTrackId: programTrack.data.id,
    academicYearId: academicYear.data.id,
  })
  // La page affiche son message de succès en fonction de status=created.
  if ('error' in result) redirect(`${classesPath}?error=create`)

  redirect(`${classesPath}?status=created`)
}

export async function renamePersonalClassAction(formData: FormData) {
  const { classesPath } = await getPersonalTeacherContext()
  const classId = formData.get('classId')
  const name = formData.get('name')
  // Vérifier le contenu avant de construire l'input typé attendu par class.
  if (typeof classId !== 'string' || typeof name !== 'string' || !name.trim()) {
    redirect(`${classesPath}?error=validation`)
  }

  // La portée org et l'update sont déléguées au service propriétaire class.
  const result = await updateClassAction({ classId, data: { name: name.trim() } })
  // query param consommé par la page classes pour afficher l'erreur ciblée.
  if ('error' in result) redirect(`${classesPath}?error=update`)

  // Le succès est lui aussi transmis à l'UI via l'URL.
  redirect(`${classesPath}?status=renamed`)
}

export async function removePersonalClassAction(formData: FormData) {
  const { classesPath } = await getPersonalTeacherContext()
  const classId = formData.get('classId')
  // Même si l'ID vient du formulaire, removeClassAction vérifiera son appartenance
  // à l'organisation courante avant le soft-delete.
  if (typeof classId !== 'string') redirect(`${classesPath}?error=validation`)

  // Le service class possède le soft-delete; personal ne fait qu'orchestrer le retour UI.
  const result = await removeClassAction(classId)
  if ('error' in result) redirect(`${classesPath}?error=remove`)

  redirect(`${classesPath}?status=removed`)
}