import { checkClassQuotaLimitAction } from '@/services/organization'

// Décide quoi afficher pour (slug, ?start) : lit l'état, ne redirige pas.
export async function resolveTeacherView(slug: string, start: string | undefined) {
  const homeHref = `/personal/${encodeURIComponent(slug)}/teacher`
  const startHref = `${homeHref}?start`
  const isStart = start !== undefined

  const { data } = await checkClassQuotaLimitAction() // data === undefined => échec de lecture
  const hasClass = !!data && data.activeCount > 0

  if (hasClass && isStart) return { view: 'REDIRECT', to: homeHref } as const    // déjà démarré
  if (!hasClass && !isStart) return { view: 'REDIRECT', to: startHref } as const // pas démarré (ou lecture impossible)
  if (isStart) return { view: 'START', data, homeHref, startHref } as const
  return { view: 'HOME' } as const
}