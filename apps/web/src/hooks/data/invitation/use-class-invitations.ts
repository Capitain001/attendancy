'use client'
// Invitations d'une classe (écran Direction/classe) + mutation inviteStudent.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getClassInvitationsAction,
  inviteStudent,
  resendInvitationAction,
  deleteInvitationUserAction,
} from '@/modules/invitation'
import { customToast } from '@/lib/toast/custom-toast'
import { CACHE_KEYS } from '@/cache/client/key'

export function useClassInvitations(classId: string) {
  const qc = useQueryClient()
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: CACHE_KEYS.INVITATIONS.BY_CLASS(classId) })

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: CACHE_KEYS.INVITATIONS.BY_CLASS(classId),
    queryFn: async () => {
      const r = await getClassInvitationsAction({ classId })
      if ('error' in r) throw new Error(r.error)
      return r.data
    },
    enabled: !!classId,
  })

  const inviteStudentMut = useMutation({
    mutationFn: inviteStudent,
    onSuccess: (r) => {
      if (!r.success) { customToast.error(r.error ?? "Envoi de l'invitation impossible."); return }
      invalidate()
      customToast.success('Invitation envoyée')
    },
    onError: () => customToast.error("Envoi de l'invitation impossible."),
  })

  const resend = useMutation({
    mutationFn: resendInvitationAction,
    onSuccess: (r) => {
      if (!r.success) { customToast.error(r.error); return }
      invalidate()
      customToast.success(r.message)
    },
    onError: () => customToast.error('Relance impossible.'),
  })

  const revoke = useMutation({
    mutationFn: deleteInvitationUserAction,
    onSuccess: (r) => {
      if (!r.success) { customToast.error(r.error); return }
      invalidate()
      customToast.success(r.message)
    },
    onError: () => customToast.error('Révocation impossible.'),
  })

  return { invitations, isLoading, inviteStudent: inviteStudentMut, resend, revoke }
}
