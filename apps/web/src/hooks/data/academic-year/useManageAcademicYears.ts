'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAcademicYearsAction } from '@/services/academic-year'
import {
  createAcademicYearAction,
  setCurrentYearAction,
  removeAcademicYearAction,
} from '@/services/academic-year'
import { customToast } from '@/lib/toast/custom-toast'

const QK = ['academic-years'] as const

export function useManageAcademicYears() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: QK })

  const { data: years = [], isLoading } = useQuery({
    queryKey: QK,
    queryFn: async () => {
      const r = await getAcademicYearsAction()
      if ('error' in r) throw new Error(r.error)
      return r.data
    },
  })

  const create = useMutation({
    mutationFn: createAcademicYearAction,
    onSuccess: (r) => {
      if ('error' in r) { customToast.error(r.error ?? 'Erreur inconnue'); return }
      invalidate()
      customToast.success('Année académique créée')
    },
  })

  const setCurrent = useMutation({
    mutationFn: async (academicYearId: string) => {
      if (!academicYearId) throw new Error('Aucune année sélectionnée')
      return setCurrentYearAction({ academicYearId })
    },
    onSuccess: (r) => {
      if ('error' in r) { customToast.error(r.error ?? 'Erreur inconnue'); return }
      invalidate()
      customToast.success('Année courante définie')
    },
  })

  const remove = useMutation({
    mutationFn: removeAcademicYearAction,
    onSuccess: (r) => {
      if ('error' in r) { customToast.error(r.error ?? 'Erreur inconnue'); return }
      invalidate()
      customToast.success('Année archivée')
    },
  })

  return { years, isLoading, create, setCurrent, remove }
}
