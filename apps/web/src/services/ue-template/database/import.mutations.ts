// Orchestration cross-service — pattern validé : database/ peut importer database/ d'autres owners
// Voir commentaire src/services/ue/database/ue.mutations.ts
import { createUE, removeUE } from '@/services/ue/database'
import { getUEByCode } from '@/services/ue/database'
import { createUECourse } from '@/services/ue-course/database'
import { addUEToProgram } from '@/services/program-ue/database'
import { getUETemplates, getUETemplate } from './referential.queries'
import { getUETemplateImport, getUETemplateImportsByOrg } from './template.queries'
import { createUETemplateImport, deleteUETemplateImport } from './template.mutations'

export async function importUEFromTemplate(params: {
  templateId: string
  programId: string
  semester: number
  orgId: string
}) {
  const { templateId, programId, semester, orgId } = params

  const existing = await getUETemplateImport(templateId, orgId)
  if (existing) throw new Error('Cette UE est déjà importée dans votre organisation.')

  const template = await getUETemplate(templateId)
  if (!template) throw new Error('Template introuvable.')

  if (template.code) {
    const conflict = await getUEByCode(template.code, orgId)
    if (conflict) throw new Error(`Code "${template.code}" déjà utilisé dans votre organisation.`)
  }

  const ue = await createUE({ name: template.name, code: template.code ?? undefined, orgId })

  const courses = await Promise.all(
    template.elements.map((ec) => {
      const credits = Number(ec.credits)
      return createUECourse({
        name:     ec.name ?? ec.code,
        code:     ec.code,
        credits,
        duration: Math.max(1, Math.round(credits * 15)),
        ueId:     ue.id,
        orgId,
      })
    })
  )

  await addUEToProgram({ ueId: ue.id, programId, semester })

  const importRecord = await createUETemplateImport({ templateId, orgId, ueId: ue.id })

  return { ueId: ue.id, importedCount: courses.length, importId: importRecord.id }
}

// Import d'une filière complète : toutes les UEs d'une mention/spécialité en une opération.
// Chaque UE va dans son semestre propre (UETemplate.semester).
// Idempotent : les UEs déjà importées sont silencieusement ignorées.
export async function importMentionFromReferential(params: {
  referentialId: string
  mention: string
  speciality: string | null | undefined
  programId: string
  orgId: string
}) {
  const { referentialId, mention, speciality, programId, orgId } = params

  const templates = await getUETemplates({
    referentialId,
    mention,
    ...(speciality !== undefined && { speciality: speciality ?? null }),
  })

  if (templates.length === 0) throw new Error('Aucune UE trouvée pour cette filière.')

  let imported = 0
  let skipped  = 0

  for (const t of templates) {
    const existing = await getUETemplateImport(t.id, orgId)
    if (existing) { skipped++; continue }

    const full = await getUETemplate(t.id)
    if (!full) continue

    if (full.code) {
      const conflict = await getUEByCode(full.code, orgId)
      if (conflict) { skipped++; continue }
    }

    const ue = await createUE({ name: full.name, code: full.code ?? undefined, orgId })

    await Promise.all(
      full.elements.map((ec) => {
        const credits = Number(ec.credits)
        return createUECourse({
          name:     ec.name ?? ec.code,
          code:     ec.code,
          credits,
          duration: Math.max(1, Math.round(credits * 15)),
          ueId:     ue.id,
          orgId,
        })
      })
    )

    await addUEToProgram({ ueId: ue.id, programId, semester: full.semester })
    await createUETemplateImport({ templateId: full.id, orgId, ueId: ue.id })
    imported++
  }

  return { imported, skipped, total: templates.length }
}

export async function deleteImportedUE(ueId: string, orgId: string) {
  const imports = await getUETemplateImportsByOrg(orgId)
  const record = imports.find((i) => i.ueId === ueId)
  if (!record) throw new Error('Import introuvable pour cette UE.')

  await removeUE(ueId, orgId)
  await deleteUETemplateImport(record.templateId, orgId)
}
