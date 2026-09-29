// app/auth/signup/page.tsx
import { SignupPersonalForm } from '@/components/auth/signup/SignupPersonalForm'
import { signupPersonalAction } from '@/modules/auth/actions/signup'

export default function SignupPage() {
  return <SignupPersonalForm action={signupPersonalAction} />
}