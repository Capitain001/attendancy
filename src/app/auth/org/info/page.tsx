import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUserInfo } from '@/modules/user'

export const metadata: Metadata = {
  title: 'Informations organisation | Attendancy',
  robots: { index: false, follow: false },
}

export default async function OrgInfoPage() {
  const user = await getUserInfo()
  if (!user?.id) redirect('/login')

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Informations de l&apos;organisation
          </h1>
          <p className="text-sm text-muted-foreground">
            Complétez les informations de votre organisation super-admin.
          </p>
        </div>
        {/* OrgInfoForm — à implémenter */}
      </div>
    </main>
  )
}
