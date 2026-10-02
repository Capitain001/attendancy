// components/teacher/personal/PersonalTeacherStart.tsx
// Composant serveur : tout ce qui concerne l'écran de démarrage.
import { redirect } from 'next/navigation'
import { ERRORS } from '@/config'
import type { checkClassQuotaLimitAction } from '@/services/organization'

import { PersonalTeacherWelcome } from './PersonalTeacherWelcome'
import { createPersonalClassAction } from '@/services/class'

type Props = {
  data: Awaited<ReturnType<typeof checkClassQuotaLimitAction>>['data'] // undefined => lecture échouée
  homeHref: string
  startHref: string
  error?: string
}

export function PersonalTeacherStart({ data, homeHref, startHref, error }: Props) {
  // Soumission du formulaire : deux issues, et seulement deux.
  //   succès -> URL normale | échec -> ?start&error=failed
  // (l'auth et la validation sont dans createPersonalClassAction)
  async function start() {
    'use server'
    const res = await createPersonalClassAction()
    redirect(res.error ? `${startHref}&error=failed` : homeHref)
  }

  const blockedMessage = !data
    ? ERRORS.UI.PERSONAL_STATUS_UNAVAILABLE // lecture impossible
    : data.limitReached
      ? ERRORS.UI.CLASS_LIMIT_NONE_ALLOWED  // quota à 0 : rien à créer
      : undefined

  return (
    <PersonalTeacherWelcome
      action={start}
      blockedMessage={blockedMessage}
      errorMessage={error === 'failed' ? ERRORS.UI.PERSONAL_START_FAILED : undefined}
    />
  )
}