export default async function Default(props: any) {
  const resolvedSearchParams = props?.searchParams ? await props.searchParams : null
  const resolvedParams = props?.params ? await props.params : null

  console.log('[SLOT @program_modal/default.tsx] Rendered!')
  console.log('[SLOT @program_modal/default.tsx] resolvedParams:', resolvedParams)
  console.log('[SLOT @program_modal/default.tsx] resolvedSearchParams:', resolvedSearchParams)

  return (
    <div className="p-4 bg-purple-700 text-white font-bold rounded my-2 border-2 border-white">
      <h3 className="text-lg">🟪 ⚠️ [SLOT @program_modal/default.tsx] EST RENDU !</h3>
      <p className="text-xs font-mono mt-1">params : {JSON.stringify(resolvedParams)}</p>
      <p className="text-xs font-mono">searchParams : {JSON.stringify(resolvedSearchParams)}</p>
    </div>
  )
}
