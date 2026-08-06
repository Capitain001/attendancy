import { prisma } from '@/lib/prisma'
import { invalidateEvent } from '@/cache/server/key'

export async function createUETemplateImport(params: {
  templateId: string
  orgId: string
  ueId: string
}) {
  const record = await prisma.uETemplateImport.create({
    data: params,
    select: { id: true, templateId: true, orgId: true, ueId: true, importedAt: true },
  })
  invalidateEvent('UE_TEMPLATE_IMPORTED', params.orgId)
  return record
}

export async function deleteUETemplateImport(templateId: string, orgId: string) {
  await prisma.uETemplateImport.delete({
    where: { templateId_orgId: { templateId, orgId } },
  })
  invalidateEvent('UE_TEMPLATE_IMPORT_DELETED', orgId)
}
