export default function Layout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <div className="p-8 font-sans space-y-6">
      <h1 className="text-2xl font-bold">Test de Route Modale Parallèle (Next.js App Router)</h1>
      <div>{modal}</div>
      <div>{children}</div>
    </div>
  )
}
