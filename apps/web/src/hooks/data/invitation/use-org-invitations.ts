// src/hooks/data/invitation/use-org-invitations.ts
'use client'
// Historique + stats des invitations de l'org (hub Direction) + mutations d'invitation staff.
// Consomme modules/invitation (backend dormant) et normalise ses retours hétérogènes.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getOrgInvitationsAction,
  getInvitationStatsAction,
  inviteTeacher,
  inviteDirection,
  type InvitationListItem,
} from '@/modules/invitation'
import { toast } from 'sonner'
import { CACHE_KEYS } from '@/cache/client/key'
import { useInvitationMutations, invalidateInvitationQueries, copyLinkOrToast } from './useInvitationMutations'
import { share as shareLink } from '@/lib/invitation/share'

// Forme réelle renvoyée par inviteTeacher/inviteDirection : flat, pas { data, error }.
interface InviteStaffResult {
  success: boolean
  message?: string
  error?: string
  link?: string
}
export function useOrgInvitations(limit = 50) {
  const qc = useQueryClient()
  const { resend, revoke, generateMagicLink } = useInvitationMutations()

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: CACHE_KEYS.INVITATIONS.ALL,
    queryFn: async () => {
      const r = await getOrgInvitationsAction({ limit })
      if ('error' in r) throw new Error(r.error)
      return r.data
    },
  })

  // Mode "link" : le lien généré est dans r.link — on le copie, sinon il disparaît
  // silencieusement derrière un simple "Invitation envoyée".
  const onInviteSuccess = (r: InviteStaffResult) => {
    if (!r.success) {
      toast.error(r.error ?? "Envoi de l'invitation impossible.")
      return
    }
    invalidateInvitationQueries(qc)
    if (r.link) {
      void copyLinkOrToast(r.link, r.message ?? "Lien d'invitation copié")
    } else {
      toast.success(r.message ?? 'Invitation envoyée')
    }
  }

  const inviteTeacherMut = useMutation({
    mutationFn: inviteTeacher,
    onSuccess: onInviteSuccess,
    onError: () => toast.error("Envoi de l'invitation impossible."),
  })

  const inviteDirectionMut = useMutation({
    mutationFn: inviteDirection,
    onSuccess: onInviteSuccess,
    onError: () => toast.error("Envoi de l'invitation impossible."),
  })

  /**
   * Action "share" pour une ligne du tableau : génère le lien magique puis
   * tente le partage natif (feuille système). Si non supporté (ex: desktop),
   * fallback sur la copie presse-papiers avec toast.
   */
  const shareInvitation = async (inv: InvitationListItem) => {
    const result = await generateMagicLink.mutateAsync(inv)
    if (!result.success || !result.link) {
      const err = result as { success: false; error?: string }
      toast.error(err.error ?? 'Impossible de générer le lien')
      return
    }
    try {
      const outcome = await shareLink.native(result.link, {
        title: 'Invitation',
        text: "Invitation à rejoindre l'établissement",
      })
      if (outcome === 'unsupported') {
        await copyLinkOrToast(result.link, 'Lien copié (partage système non disponible)')
      }
      // "shared" et "cancelled" : rien à afficher, la feuille système a déjà fait le travail
    } catch {
      toast.error('Partage impossible')
    }
  }

  return {
    invitations,
    isLoading,
    inviteTeacher: inviteTeacherMut,
    inviteDirection: inviteDirectionMut,
    resend,
    revoke,
    share:shareInvitation,
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
