import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key'

export type GetUETemplatesParams = {
  referentialId: string
  domain?: string
  degree?: string
  mention?: string
  speciality?: string
  semester?: number
}

export async function getReferentials() {
  'use cache'
  cacheTag(CACHE.UE_TEMPLATE())
  cacheLife('days')
  return prisma.nationalReferential.findMany({
    where: { isActive: true },
    select: {
      id: true,
      country: true,
      issuer: true,
      name: true,
      version: true,
      publishedAt: true,
    },
    orderBy: [{ country: 'asc' }, { publishedAt: 'desc' }],
  })
}

export async function getUETemplates(params: GetUETemplatesParams) {
  'use cache'
  cacheTag(CACHE.UE_TEMPLATE())
  cacheLife('days')
  const { referentialId, domain, degree, mention, speciality, semester } = params
  return prisma.uETemplate.findMany({
    where: {
      referentialId,
      ...(domain     && { domain }),
      ...(degree     && { degree }),
      ...(mention    && { mention }),
      ...(speciality !== undefined && { speciality: speciality ?? null }),
      ...(semester   !== undefined && { semester }),
    },
    select: {
      id: true,
      domain: true,
      degree: true,
      mention: true,
      speciality: true,
      semester: true,
      code: true,
      name: true,
      type: true,
      credits: true,
      _count: { select: { elements: true } },
    },
    orderBy: [{ domain: 'asc' }, { mention: 'asc' }, { semester: 'asc' }, { name: 'asc' }],
  })
}

export async function getUETemplate(templateId: string) {
  'use cache'
  cacheTag(CACHE.UE_TEMPLATE(), CACHE.UE_TEMPLATE(templateId))
  cacheLife('days')
  return prisma.uETemplate.findUnique({
    where: { id: templateId },
    select: {
      id: true,
      domain: true,
      degree: true,
      mention: true,
      speciality: true,
      semester: true,
      code: true,
      name: true,
      type: true,
      credits: true,
      elements: {
        select: { id: true, code: true, name: true, credits: true },
        orderBy: { code: 'asc' },
      },
    },
  })
}
