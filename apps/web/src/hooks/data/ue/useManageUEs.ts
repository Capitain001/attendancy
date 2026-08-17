'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUEsAction, createUEAction, archiveUEAction } from '@/services/ue'
import { customToast } from '@/lib/toast/custom-toast'

const QK = ['ues'] as const

export function useManageUEs(departmentId?: string) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: QK })

  const { data: ues = [], isLoading } = useQuery({
    queryKey: [...QK, departmentId],
    queryFn: async () => {
      const r = await getUEsAction(departmentId)
      if ('error' in r) throw new Error(r.error)
      return r.data
    },
  })

  const create = useMutation({
    mutationFn: (data: { name: string; code?: string; departmentId?: string }) =>
      createUEAction({ data }),
    onSuccess: (r) => {
      if ('error' in r) { customToast.error(r.error ?? 'Erreur inconnue'); return }
      invalidate()
      customToast.success('UE créée')
    },
  })

  const archive = useMutation({
    mutationFn: async (ueId: string) => {
      if (!ueId) throw new Error('Aucune UE sélectionnée')
      return archiveUEAction(ueId)
    },
    onSuccess: (r) => {
      if ('error' in r) { customToast.error(r.error ?? 'Erreur inconnue'); return }
      invalidate()
      customToast.success('UE archivée')
    },
  })

  return { ues, isLoading, create, archive }
}
