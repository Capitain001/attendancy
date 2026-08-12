import Link from 'next/link'

export default async function ModalPage({
  searchParams,
}: {
  searchParams: Promise<{ show_modal?: string }>
}) {
  const params = await searchParams

  if (params?.show_modal !== 'true') {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-background border p-6 rounded-lg max-w-md w-full space-y-4 shadow-xl text-foreground">
        <h3 className="text-lg font-bold text-emerald-500 flex items-center gap-2">
          <span>🎉</span> Modale Parallèle Opérationnelle
        </h3>
        <p className="text-sm text-muted-foreground">
          Cette modale est rendue via le slot <code className="bg-muted px-1 rounded">@modal</code> de Next.js App Router.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Link
            href="/test/modal"
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 text-sm font-medium"
          >
            Fermer
          </Link>
        </div>
      </div>
    </div>
  )
}
