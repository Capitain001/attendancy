import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUserInfo } from '@/modules/user'
import { getInviteByTokenAction } from '@/services/invite'
import { AcceptInviteForm } from '@/components/auth/AcceptInviteForm'
import { roleToPath, validateInvitation } from '@/config/roles'

export const metadata: Metadata = {
  title: 'Rejoindre une organisation | Attendancy',
  robots: { index: false, follow: false },
}

type Props = { searchParams: Promise<{ token?: string }> }

export default async function WelcomePage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) redirect('/login')

  const user = await getUserInfo()
  if (!user?.id) redirect('/login')

  if (user.organization?.slug) {
    redirect(`/${user.organization.slug}/${roleToPath(user.role)}`)
  }

  const inviteRes = await getInviteByTokenAction(token)
  const result    = validateInvitation(inviteRes, user.email ?? '')

  if (!result.ok) {
    redirect(result.reason === 'mismatch' ? '/login?error=invite_mismatch' : '/login?error=invite_invalid')
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <AcceptInviteForm
        token={token}
        orgName={result.invitation.organization.name ?? ''}
        roleLabel={result.roleLabel}
        userEmail={user.email ?? ''}
      />
    </main>
  )
}
