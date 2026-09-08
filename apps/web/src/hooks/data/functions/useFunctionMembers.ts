'use client'

import { GetFunctionDetailDto, removeFunctionFromUserAction } from '@/services/function'
import { useCallback, useState, useTransition } from 'react'
import { toast } from 'sonner'


type FunctionMember = NonNullable<GetFunctionDetailDto>['users'][number]

/**
 * Gère la liste des membres d'une fonction côté client : retrait optimiste
 * après confirmation serveur, état de chargement PAR utilisateur (pas un
 * seul flag global — deux révocations en parallèle ne doivent pas se
 * bloquer l'une l'autre côté UI), et notification.
 *
 * Réutilisable partout où une liste "membres d'une fonction" a besoin de
 * cette action (page détail fonction, futur profil utilisateur…).
 */
export function useFunctionMembers(functionId: string, initialMembers: FunctionMember[]) {
  const [members, setMembers] = useState(initialMembers)
  const [revokingIds, setRevokingIds] = useState<Set<string>>(new Set())
  const [, startTransition] = useTransition()

  const revoke = useCallback(
    (userId: string) => {
      setRevokingIds((prev) => new Set(prev).add(userId))

      startTransition(async () => {
        const result = await removeFunctionFromUserAction({ userId, functionId })

        setRevokingIds((prev) => {
          const next = new Set(prev)
          next.delete(userId)
          return next
        })

        if (result.error) {
          toast.error(result.error)
          return
        }

        setMembers((prev) => prev.filter((m) => m.user.id !== userId))
        toast.success('Fonction retirée')
      })
    },
    [functionId]
  )

  const isRevoking = useCallback((userId: string) => revokingIds.has(userId), [revokingIds])

  return { members, revoke, isRevoking }
}