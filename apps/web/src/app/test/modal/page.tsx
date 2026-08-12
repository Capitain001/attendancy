import Link from 'next/link'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ show_modal?: string }>
}) {
  const params = await searchParams
  const showModal = params?.show_modal

  return (
    <div className="p-6 border rounded-lg bg-card space-y-4 max-w-xl">
      <h2 className="text-xl font-semibold">Page Principale de Test</h2>
      <p className="text-sm text-muted-foreground">
        Statut du paramètre <code className="bg-muted px-1 py-0.5 rounded">show_modal</code> :{' '}
        <strong>{showModal ?? 'aucun'}</strong>
      </p>
      <div className="flex gap-4 pt-2">
        <Link
          href="/test/modal?show_modal=true"
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 text-sm font-medium"
        >
          Ouvrir la modale (?show_modal=true)
        </Link>
        <Link
          href="/test/modal"
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:opacity-90 text-sm font-medium"
        >
          Fermer la modale
        </Link>
      </div>
    </div>
  )
}
