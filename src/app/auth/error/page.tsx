import { AuthError } from '@/components/auth/page/AuthError'
import { Suspense } from 'react'


export default function AuthErrorPage() {
  return (
    <Suspense>
      <AuthError />
    </Suspense>
  )
}
