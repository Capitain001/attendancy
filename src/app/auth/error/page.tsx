import { Suspense } from 'react'
import { AuthError } from '@/components/auth/AuthError'

export default function AuthErrorPage() {
  return (
    <Suspense>
      <AuthError />
    </Suspense>
  )
}
