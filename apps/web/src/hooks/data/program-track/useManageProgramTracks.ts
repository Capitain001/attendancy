'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProgramTracksAction,
  createProgramTrackAction,
  updateProgramTrackAction,
  deleteProgramTrackAction,
} from '@/services/program-track'
import { toast } from '@/lib/toast/custom-toast'

const QK = ['program-tracks'] as const

export function useManageProgramTracks(departmentId?: string) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: QK })

  const { data: tracks = [], isLoading } = useQuery({
    queryKey: [...QK, departmentId],
    queryFn: async () => {
      const r = await getProgramTracksAction({ departmentId })
      if ('error' in r) throw new Error(r.error)
      return r.data
    },
  })

  const create = useMutation({
    mutationFn: createProgramTrackAction,
    onSuccess: (r) => {
      if ('error' in r) { toast.error(r.error ?? 'Erreur inconnue'); return }
      invalidate()
      toast.success('Filière créée')
    },
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; departmentId?: string } }) =>
      updateProgramTrackAction(id, data),
    onSuccess: (r) => {
      if ('error' in r) { toast.error(r.error ?? 'Erreur inconnue'); return }
      invalidate()
      toast.success('Filière mise à jour')
    },
  })

  const remove = useMutation({
    mutationFn: async (programTrackId: string) => {
      if (!programTrackId) throw new Error('Aucune filière sélectionnée')
      return deleteProgramTrackAction(programTrackId)
    },
    onSuccess: (r) => {
      if ('error' in r) { toast.error(r.error ?? 'Erreur inconnue'); return }
      invalidate()
      toast.success('Filière supprimée')
    },
  })

  return { tracks, isLoading, create, update, remove }
}
