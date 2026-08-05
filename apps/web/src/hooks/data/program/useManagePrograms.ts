'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProgramsAction,
  createProgramAction,
  updateProgramAction,
  removeProgramAction,
} from '@/services/program'
import { customToast } from '@/lib/toast/custom-toast'
import type { UpdateProgramInput } from '@/services/program'

const QK = ['programs'] as const

export function useManagePrograms(params: { programTrackId?: string } = {}) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: QK })

  const { data: programs = [], isLoading } = useQuery({
    queryKey: [...QK, params],
    queryFn: async () => {
      const r = await getProgramsAction(params)
      if ('error' in r) throw new Error(r.error)
      return r.data
    },
  })

  const create = useMutation({
    mutationFn: createProgramAction,
    onSuccess: (r) => {
      if ('error' in r) { customToast.error(r.error); return }
      invalidate()
      customToast.success('Programme créé')
    },
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProgramInput }) =>
      updateProgramAction(id, data),
    onSuccess: (r) => {
      if ('error' in r) { customToast.error(r.error); return }
      invalidate()
      customToast.success('Programme mis à jour')
    },
  })

  const remove = useMutation({
    mutationFn: removeProgramAction,
    onSuccess: (r) => {
      if ('error' in r) { customToast.error(r.error); return }
      invalidate()
      customToast.success('Programme supprimé')
    },
  })

  return { programs, isLoading, create, update, remove }
}
