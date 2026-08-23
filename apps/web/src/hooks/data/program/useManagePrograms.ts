'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProgramsAction,
  createProgramAction,
  updateProgramAction,
  removeProgramAction,
} from '@/services/program'
import { toast } from '@/lib/toast/custom-toast'
import type { UpdateProgramInput } from '@/services/program'
import { ERRORS } from '@/config'

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
      if ('error' in r) { toast.error(r.error ??ERRORS.NOT_FOUND); return }
      invalidate()
      toast.success('Programme créé')
    },
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProgramInput['data'] }) =>
      updateProgramAction({ programId: id, data }),
    onSuccess: (r) => {
      if ('error' in r) { toast.error(r.error?? ERRORS.NOT_FOUND); return }
      invalidate()
      toast.success('Programme mis à jour')
    },
  })

  const remove = useMutation({
    mutationFn: async (programId: string) => {
      if (!programId) throw new Error('Aucun programme sélectionné')
      return removeProgramAction(programId)
    },
    onSuccess: (r) => {
      if ('error' in r) { toast.error(r.error?? ERRORS.NOT_FOUND); return }
      invalidate()
      toast.success('Programme supprimé')
    },
  })

  return { programs, isLoading, create, update, remove }
}
