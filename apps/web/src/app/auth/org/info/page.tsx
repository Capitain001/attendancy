// src/app/auth/org/info/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUserInfo } from '@/modules/user'

export const metadata: Metadata = {
  title: 'Informations organisation | Attendancy',
  robots: { index: false, follow: false },
}

export default async function Workspace() {
  const user = await getUserInfo()
  if (!user?.id) redirect('/login')

  const organizations = user.organizations ?? []
  const currentOrg = user.organization

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
{/* page a reformer */}
    </main>
  )
}
