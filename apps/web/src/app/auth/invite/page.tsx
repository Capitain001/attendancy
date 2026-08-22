'use client'
import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

function InviteRelay() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const supabase     = createClient()

  useEffect(() => {
    async function relay() {
      console.group('[invite] flow start')
      console.log('search params :', Object.fromEntries(searchParams.entries()))
      console.log('full URL      :', window.location.href)

      const hash       = window.location.hash.substring(1)
      const hashParams = new URLSearchParams(hash)

      console.log('hash raw      :', window.location.hash)
      console.log('hash params   :', {
        access_token:  hashParams.get('access_token')  ? '✅ présent' : '❌ absent',
        refresh_token: hashParams.get('refresh_token') ? '✅ présent' : '❌ absent',
        type:          hashParams.get('type') ?? '—',
        error:         hashParams.get('error') ?? '—',
      })
      console.groupEnd()

      const access_token  = hashParams.get('access_token')
      const refresh_token = hashParams.get('refresh_token')

      if (!access_token || !refresh_token) {
        console.error('[invite] hash tokens absents — Supabase utilise peut-être PKCE ?')
        router.replace(`/auth/error?error=invalid_request&error_description=${encodeURIComponent("Tokens d'authentification manquants dans le hash.")}`)
        return
      }

      console.log('[invite] hash tokens trouvés → setSession')
      const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })

      if (error) {
        console.error('[invite] setSession error :', error)
        router.replace(
          `/auth/error?error=${encodeURIComponent(error.name ?? 'unknown')}&error_description=${encodeURIComponent(error.message)}`
        )
        return
      }

      console.log('[invite] session établie :', {
        userId: data.user?.id,
        email:  data.user?.email,
        role:   data.user?.user_metadata?.role,
      })
      console.log('[invite] → redirect /auth/welcome')
      router.replace(`/auth/welcome`)
    }

    relay()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Vérification en cours…
    </div>
  )
}

export default function InvitePage() {
  return (
    <Suspense>
      <InviteRelay />
    </Suspense>
  )
}
