'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getClassesAction,
  createClassAction,
  removeClassAction,
} from '@/services/class'
import { customToast } from '@/lib/toast/custom-toast'

const QK = ['classes'] as const

export function useManageClasses(yearId?: string, query?: string, programTrackId?: string) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: QK })

  const { data: classes = [], isLoading } = useQuery({
    queryKey: [...QK, yearId, query, programTrackId],
    queryFn: async () => {
      const r = await getClassesAction({yearId})
      if ('error' in r) throw new Error(r.error)
      return r.data
    },
  })

  const create = useMutation({
    mutationFn: createClassAction,
    onSuccess: (r) => {
      if ('error' in r) { customToast.error(r.error); return }
      invalidate()
      customToast.success('Classe créée')
    },
  })

  const remove = useMutation({
    mutationFn: removeClassAction,
    onSuccess: (r) => {
      if ('error' in r) { customToast.error(r.error); return }
      invalidate()
      customToast.success('Classe archivée')
    },
  })

  return { classes, isLoading, create, remove }
}
