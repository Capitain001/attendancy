// src/hooks/data/invitation/use-class-invitations.ts
'use client'
// Invitations d'une classe (écran Direction/classe) + mutation inviteStudent.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getClassInvitationsAction, inviteStudent } from '@/modules/invitation'
import { toast } from 'sonner'
import { CACHE_KEYS } from '@/cache/client/key'
import { useInvitationMutations, invalidateInvitationQueries, copyLinkOrToast } from './useInvitationMutations'

interface InviteStudentResult {
  success: boolean
  message?: string
  error?: string
  link?: string
}

export function useClassInvitations(classId: string) {
  const qc = useQueryClient()
  const classKey = CACHE_KEYS.INVITATIONS.BY_CLASS(classId)

  // extraInvalidateKeys : un resend/revoke fait ici invalide aussi la portée classe,
  // en plus de ALL/STATS déjà gérés par le hook partagé.
  const { resend, revoke } = useInvitationMutations({ extraInvalidateKeys: [classKey] })

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: classKey,
    queryFn: async () => {
      const r = await getClassInvitationsAction({ classId })
      if ('error' in r) throw new Error(r.error)
      return r.data
    },
    enabled: !!classId,
  })

  const inviteStudentMut = useMutation({
    mutationFn: inviteStudent,
    onSuccess: (r: InviteStudentResult) => {
      if (!r.success) {
        toast.error(r.error ?? "Envoi de l'invitation impossible.")
        return
      }
      invalidateInvitationQueries(qc, [classKey])
      if (r.link) {
        void copyLinkOrToast(r.link, r.message ?? "Lien d'invitation copié")
      } else {
        toast.success(r.message ?? 'Invitation envoyée')
      }
    },
    onError: () => toast.error("Envoi de l'invitation impossible."),
  })

  return { invitations, isLoading, inviteStudent: inviteStudentMut, resend, revoke }
}