// apps/web/src/app/(app)/personal/[slug]/teacher/classes/[id]/invitation/_components/InviteSandbox.tsx
'use client'
// Wrapper de test : dialog d'invitation branché sur des handlers mock (à remplacer par useClassInvitations).

import { PlusIcon } from 'lucide-react'

import { MOCK_ORG_USERS } from '@/data/mocks/mock.user'
import { TeacherClassInviteDialog } from '@/components/personal/teacher/class/invitation/TeacherClassInviteDialog';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function TeacherClassInviteButton({ classId, classLabel }: { classId: string; classLabel: string }) {
  return (
    <TeacherClassInviteDialog
      classLabel={classLabel}
      orgUsers={MOCK_ORG_USERS}
      trigger={
        <button
          type="button"
          aria-label="Inviter dans la classe"
          className="flex w-[72px] shrink-0 flex-col items-center gap-1.5"
        >
          <span className="flex size-14 items-center justify-center rounded-full border border-dashed border-foreground/40 text-foreground transition-colors hover:bg-foreground/[0.04]">
            <PlusIcon className="size-5" />
          </span>
          <span className="text-[11px] text-muted-foreground">Ajouter</span>
        </button>
      }
      onSendEmail={async (input) => {
        await wait(600)
        if (input.email.startsWith('fail')) return { success: false, error: 'Échec simulé.' }
        console.log('[mock] sendEmail', { classId, ...input })
        return { success: true, message: `Invitation envoyée à ${input.email}` }
      }}
      onCreateLink={async (input) => {
        await wait(600)
        if (input.email.startsWith('fail')) return { success: false, error: 'Échec simulé.' }
        console.log('[mock] createLink', { classId, ...input })
        return { success: true, link: `${window.location.origin}/invite/mock-${classId}` }
      }}
    />
  )
}