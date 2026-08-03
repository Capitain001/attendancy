import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getUserInfo } from '@/modules/user'
import { redirectUser } from '@/config/redirects'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const inviteToken = searchParams.get('inviteToken')

  if (!code) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL('/login?error=callback_failed', request.url))
  }

  // Invitation acceptée → compléter le profil
  if (inviteToken) {
    return NextResponse.redirect(new URL(`/auth/invite?token=${inviteToken}`, request.url))
  }

  const user = await getUserInfo({ cache: false })

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // DIRECTION sans org → setup de l'organisation
  const needsOrgSetup = user.function === 'PRINCIPAL' && !user.organization?.id
  if (needsOrgSetup) {
    return NextResponse.redirect(new URL('/auth/org-setup', request.url))
  }

  return NextResponse.redirect(new URL(redirectUser(user), request.url))
}
