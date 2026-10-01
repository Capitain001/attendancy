'use client'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createPersonalOrgAction } from '@/services/organization'
import { PERSONAL_ROLES, type PersonalRole } from '@/modules/auth/constants'
import { REDIRECT_URL } from '@/config'

const ROLE_LABEL: Record<PersonalRole, string> = {
  TEACHER: 'Enseignant',
  STUDENT: 'Étudiant',
  PARENT: 'Parent',
}

// Un clic = un appel. createPersonalOrgAction gère seule la distinction
// bootstrap/ajout-de-rôle — ce composant n'a plus à orchestrer deux appels.
export function PersonalRolePicker() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSelect(role: PersonalRole) {
    startTransition(async () => {
      const result = await createPersonalOrgAction(role)
      if ('data' in result) router.push(REDIRECT_URL)
      // TODO: surfacer result.error (toast)
    })
  }

  return (
    <div className="space-y-2">
      {PERSONAL_ROLES.map((role) => (
        <button
          key={role}
          type="button"
          disabled={isPending}
          onClick={() => handleSelect(role)}
          className="w-full rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          {ROLE_LABEL[role]}
        </button>
      ))}
    </div>
  )
}