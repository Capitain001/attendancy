// src/hooks/data/invitation/use-class-invitations.ts
'use client'
// Invitations d'une classe (écran Direction/classe) + mutations inviteStudent / inviteStudentsBulk.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getClassInvitationsAction,
  inviteStudent,
  inviteStudentsAction,
} from '@/modules/invitation'
import type { InviteStudentsBulkInput } from '@/modules/invitation/student'
import { toast } from 'sonner'
import { CACHE_KEYS } from '@/cache/client/key'
import { useInvitationMutations, invalidateInvitationQueries, copyLinkOrToast } from './useInvitationMutations'

type InviteStudentVars = Parameters<typeof inviteStudent>[0]
type InviteStudentsBulkVars = Omit<InviteStudentsBulkInput, 'classId'>

type UseClassInvitationsOptions = {
  /** Livraison du lien créé. Défaut : copie dans le presse-papiers + toast. */
  deliverLink?: (link: string, message?: string) => void | Promise<void>
  /** Toast d'erreur sur échec. Défaut : true. Mettre false si l'appelant affiche l'erreur lui-même. */
  toastError?: boolean
}

export function useClassInvitations(classId: string, opts: UseClassInvitationsOptions = {}) {
  const { toastError = true } = opts
  const deliverLink =
    opts.deliverLink ??
    ((link: string, message?: string) => copyLinkOrToast(link, message ?? "Lien d'invitation copié"))

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
    mutationFn: (vars: InviteStudentVars) => inviteStudent(vars),
    onSuccess: async (r) => {
      if (!r.success) {
        if (toastError) toast.error(r.error ?? "Envoi de l'invitation impossible.")
        return
      }
      invalidateInvitationQueries(qc, [classKey])
      if (r.link) await deliverLink(r.link, r.message)
      else toast.success(r.message ?? 'Invitation envoyée')
    },
    onError: () => {
      if (toastError) toast.error("Envoi de l'invitation impossible.")
    },
  })

  const inviteStudentsBulkMut = useMutation({
    mutationFn: (vars: InviteStudentsBulkVars) =>
      inviteStudentsAction({ ...vars, classId }),
    onSuccess: async (r) => {
      if ('error' in r) {
        if (toastError) toast.error(r.error)
        return
      }
      invalidateInvitationQueries(qc, [classKey])
      if (r.data.status === 'ok') {
        toast.success(`${r.data.succeeded.length} invitation(s) envoyée(s)`)
      } else if (r.data.status === 'partial') {
        toast.warning(
          `${r.data.succeeded.length} invitation(s) envoyée(s), ${r.data.failed.length} échouée(s)`
        )
      } else if (toastError) {
        toast.error("Toutes les invitations du lot ont échoué")
      }
    },
    onError: (err) => {
      if (toastError) toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi du lot")
    },
  })

  return {
    invitations,
    isLoading,
    inviteStudent: inviteStudentMut,
    inviteStudentsBulk: inviteStudentsBulkMut,
    resend,
    revoke,
  }
}