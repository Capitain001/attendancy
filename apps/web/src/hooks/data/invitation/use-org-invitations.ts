'use client'
// Historique + stats des invitations de l'org (hub Direction) + mutations d'invitation staff.
// Consomme modules/invitation (backend dormant) et normalise ses retours hétérogènes.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getOrgInvitationsAction,
  getInvitationStatsAction,
  resendInvitationAction,
  deleteInvitationUserAction,
  inviteTeacher,
  inviteDirection,
} from '@/modules/invitation'
import { customToast } from '@/lib/toast/custom-toast'
import { CACHE_KEYS } from '@/cache/client/key'

export function useOrgInvitations(limit = 50) {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: CACHE_KEYS.INVITATIONS.ORG })
    qc.invalidateQueries({ queryKey: CACHE_KEYS.INVITATIONS.STATS })
  }

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: CACHE_KEYS.INVITATIONS.ORG,
    queryFn: async () => {
      const r = await getOrgInvitationsAction({ limit })
      if ('error' in r) throw new Error(r.error)
      return r.data
    },
  })

  const inviteTeacherMut = useMutation({
    mutationFn: inviteTeacher,
    onSuccess: (r) => {
      if (!r.success) { customToast.error(r.error ?? "Envoi de l'invitation impossible."); return }
      invalidate()
      customToast.success('Invitation envoyée')
    },
    onError: () => customToast.error("Envoi de l'invitation impossible."),
  })

  const inviteDirectionMut = useMutation({
    mutationFn: inviteDirection,
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

  return {
    invitations,
    isLoading,
    inviteTeacher: inviteTeacherMut,
    inviteDirection: inviteDirectionMut,
    resend,
    revoke,
  }
}

export function useInvitationStats() {
  const { data, isLoading } = useQuery({
    queryKey: CACHE_KEYS.INVITATIONS.STATS,
    queryFn: async () => {
      const r = await getInvitationStatsAction()
      if (!r.success) {
        throw new Error(typeof r.error === 'string' ? r.error : 'Statistiques indisponibles')
      }
      return r.stats
    },
  })
  return { stats: data, isLoading }
}
