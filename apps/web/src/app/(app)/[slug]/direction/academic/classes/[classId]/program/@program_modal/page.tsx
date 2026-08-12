export default async function ProgramModalPage(props: {
  params?: Promise<any>
  searchParams?: Promise<any>
}) {
  const resolvedParams = props.params ? await props.params : null
  const resolvedSearchParams = props.searchParams ? await props.searchParams : null

  console.log('[SLOT @program_modal/page.tsx] Rendered!')
  console.log('[SLOT @program_modal/page.tsx] resolvedParams:', resolvedParams)
  console.log('[SLOT @program_modal/page.tsx] resolvedSearchParams:', resolvedSearchParams)

  return (
    <div className="p-4 bg-emerald-600 text-white font-bold rounded my-2 border-2 border-white shadow-xl">
      <h3 className="text-lg">🟩 ✅ [SLOT @program_modal/page.tsx] RENDU AVEC SUCCÈS !</h3>
      <p className="text-xs font-mono mt-1">params : {JSON.stringify(resolvedParams)}</p>
      <p className="text-xs font-mono">searchParams : {JSON.stringify(resolvedSearchParams)}</p>
    </div>
  )
}