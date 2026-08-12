// 'use client'
// import { useMemo, useState } from 'react'
// import { Button } from '@/components/ui/button'
// import { Checkbox } from '@/components/ui/checkbox'
// import { cn } from '@/lib/utils'
// import { typography } from '@/styles'
// import { useUETemplateImports } from '@/hooks/data/ue-template/useUETemplates'
// import { useManagePrograms } from '@/hooks/data/program/useManagePrograms'
// import { useManageProgramTracks } from '@/hooks/data/program-track/useManageProgramTracks'
// import { customToast } from '@/lib/toast/custom-toast'
// import type { GetUETemplatesDto } from '@/services/ue-template'

// type TemplateItem = GetUETemplatesDto[number]

// export default function UETemplatePage({
//   referentialName,
//   mention,
//   templates,
//   onClose,
// }: {
//   referentialName: string
//   mention: { mention: string; speciality: string | null }
//   templates: TemplateItem[]
//   onClose: () => void
// }) {
//   const [selected, setSelected] = useState<Record<string, boolean>>({})
//   const { importUE } = useUETemplateImports()
//   const { create: createProgram } = useManagePrograms()
//   const { tracks } = useManageProgramTracks()

//   const selectedIds = useMemo(
//     () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k),
//     [selected],
//   )

//   const allSelected = selectedIds.length > 0 && selectedIds.length === templates.length

//   const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }))

//   const selectAll = () => {
//     const allIds = templates.map((t) => t.id)
//     setSelected(Object.fromEntries(allIds.map((id) => [id, true])))
//   }

//   const clearAll = () => setSelected({})

//   const toggleAll = () => {
//     if (allSelected) return clearAll()
//     selectAll()
//   }

//   const selectedLabel = selectedIds.length === 1 ? 'UE sélectionnée' : 'UE sélectionnées'

//   const handleApply = async () => {
//     if (selectedIds.length === 0) return customToast.error('Sélectionnez au moins une UE')

//     const trackId = tracks?.[0]?.id
//     if (!trackId) return customToast.error('Aucun parcours trouvé. Créez d\u2019abord une filière.')

//     try {
//       const programName = `${mention.mention}${mention.speciality ? ' - ' + mention.speciality : ''} - ${referentialName}`
//       const r = await createProgram.mutateAsync({ name: programName, programTrackId: trackId })
//       if (!r || 'error' in r) return
//       const programId = r.data.id

//       await Promise.all(
//         selectedIds.map((templateId) => {
//           const t = templates.find((x) => x.id === templateId)
//           return importUE.mutateAsync({ templateId, programId, semester: t?.semester ?? 1 })
//         })
//       )

//       customToast.success('UE importées avec succès')
//       onClose()
//     } catch (e) {
//       customToast.error(e instanceof Error ? e.message : 'Erreur lors de l\u2019import')
//     }
//   }

//   // group by semester
//   const bySem = new Map<number, TemplateItem[]>()
//   for (const t of templates) {
//     const list = bySem.get(t.semester) ?? []
//     list.push(t)
//     bySem.set(t.semester, list)
//   }

//   const semesters = [...bySem.entries()].sort((a, b) => a[0] - b[0])

//   return (
//     <div className="flex flex-col gap-4">
//       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <p className="text-sm font-semibold">{mention.mention}{mention.speciality ? ` — ${mention.speciality}` : ''}</p>
//           <p className={cn(typography.small, 'text-text-subtle')}>{referentialName}</p>
//           <p className={cn(typography.small, 'text-text-subtle mt-1')}>
//             {selectedIds.length} / {templates.length} {selectedLabel}
//           </p>
//         </div>
//         <div className="flex flex-wrap gap-2 items-center">
//           <Button variant="ghost" onClick={onClose}>Fermer</Button>
//           <Button variant="outline" onClick={toggleAll}>
//             {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
//           </Button>
//           <Button disabled={importUE.isPending || createProgram.isPending} onClick={handleApply}>
//             {importUE.isPending || createProgram.isPending ? 'Import en cours…' : 'Appliquer la sélection'}
//           </Button>
//         </div>
//       </div>

//       <div className="flex flex-col gap-3">
//         {semesters.map(([sem, ues]) => (
//           <div key={sem} className="flex flex-col gap-2">
//             <div className="flex items-center justify-between gap-3">
//               <p className="text-[11px] font-semibold uppercase tracking-wider text-text-subtle">Semestre {sem}</p>
//               <div className="flex items-center gap-2 text-[12px] text-text-subtle">
//                 <span>{ues.length} UE(s)</span>
//                 <Checkbox
//                   checked={ues.every((ue) => selected[ue.id])}
//                   onCheckedChange={() => {
//                     const next = { ...selected }
//                     const isAll = ues.every((ue) => next[ue.id])
//                     ues.forEach((ue) => {
//                       next[ue.id] = !isAll
//                     })
//                     setSelected(next)
//                   }}
//                 />
//               </div>
//             </div>
//             <div className="flex flex-col gap-2">
//               {ues.map((ue) => (
//                 <label key={ue.id} className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2">
//                   <div className="flex items-center gap-3">
//                     <Checkbox checked={!!selected[ue.id]} onCheckedChange={() => toggle(ue.id)} />
//                     <div className="min-w-0">
//                       {ue.code && <span className="mr-1.5 inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-primary">{ue.code}</span>}
//                       <span className="text-xs text-text-primary">{ue.name}</span>
//                     </div>
//                   </div>
//                   <div className="text-[11px] text-text-subtle">{Number(ue.credits)} cr.</div>
//                 </label>
//               ))}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   )
// }
