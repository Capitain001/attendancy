import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key'

export async function getUETemplateImport(templateId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.UE_TEMPLATE_IMPORT(orgId))
  cacheLife('hours')
  return prisma.uETemplateImport.findUnique({
    where: { templateId_orgId: { templateId, orgId } },
    select: { id: true, ueId: true, importedAt: true },
  })
}

export async function getUETemplateImportsByOrg(orgId: string) {
  'use cache'
  cacheTag(CACHE.UE_TEMPLATE_IMPORT(orgId))
  cacheLife('hours')
  return prisma.uETemplateImport.findMany({
    where: { orgId },
    select: { templateId: true, ueId: true, importedAt: true },
  })
}
