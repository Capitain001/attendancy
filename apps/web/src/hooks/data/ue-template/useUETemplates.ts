// 'use client'
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
// import {
//   getReferentialsAction,
//   getUETemplatesAction,
//   getUETemplateImportsByOrgAction,
//   importUEFromTemplateAction,
//   importMentionFromReferentialAction,
//   deleteUETemplateImportAction,
// } from '@/services/ue-template'
// import { toast } from '@/lib/toast/custom-toast'
// import type { GetUETemplatesParams } from '@/services/ue-template'

// const QK_REFERENTIALS = ['ue-template-referentials'] as const
// const QK_TEMPLATES    = ['ue-templates'] as const
// const QK_IMPORTS      = ['ue-template-imports'] as const

// export function useUEReferentials() {
//   const { data: referentials = [], isLoading } = useQuery({
//     queryKey: QK_REFERENTIALS,
//     queryFn: async () => {
//       const r = await getReferentialsAction()
//       if ('error' in r) throw new Error(r.error)
//       return r.data
//     },
//     staleTime: 1000 * 60 * 60,
//   })
//   return { referentials, isLoading }
// }


// export function useUETemplates(params: GetUETemplatesParams) {
//   const enabled = Boolean(params.referentialId)
//   const { data: templates = [], isLoading } = useQuery({
//     queryKey: [...QK_TEMPLATES, params],
//     queryFn: async () => {
//       const r = await getUETemplatesAction(params)
//       if ('error' in r) throw new Error(r.error)
//       return r.data
//     },
//     enabled,
//     staleTime: 1000 * 60 * 60,
//   })
//   return { templates, isLoading }
// }

// export function useUETemplateImports() {
//   const qc = useQueryClient()
//   const invalidate = () => qc.invalidateQueries({ queryKey: QK_IMPORTS })

//   const { data: imports = [], isLoading } = useQuery({
//     queryKey: QK_IMPORTS,
//     queryFn: async () => {
//       const r = await getUETemplateImportsByOrgAction()
//       if ('error' in r) throw new Error(r.error)
//       return r.data
//     },
//   })

//   const importUE = useMutation({
//     mutationFn: importUEFromTemplateAction,
//     onSuccess: (r) => {
//       if ('error' in r) { toast.error(r.error); return }
//       invalidate()
//       toast.success('UE importée avec succès')
//     },
//   })

//   const applyMention = useMutation({
//     mutationFn: importMentionFromReferentialAction,
//     onSuccess: (r) => {
//       if ('error' in r) { toast.error(r.error); return }
//       invalidate()
//       const { imported, skipped } = r.data
//       toast.success(
//         skipped > 0
//           ? `${imported} UE appliquées (${skipped} déjà présentes)`
//           : `${imported} UE appliquées avec succès`
//       )
//     },
//   })

//   const deleteImport = useMutation({
//     mutationFn: deleteUETemplateImportAction,
//     onSuccess: (r) => {
//       if ('error' in r) { toast.error(r.error); return }
//       invalidate()
//       toast.success('Import supprimé')
//     },
//   })

//   const importedTemplateIds = new Set(imports.map((i) => i.templateId))

//   return { imports, isLoading, importUE, applyMention, deleteImport, importedTemplateIds }
// }
