import { PersonalTeacherOnboarding } from '@/components/personal/teacher/ux/PersonalTeacherOnboarding'
import { resolveCreatePersonalClassAction } from './helper'

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ step?: string; type?: string; error?: string }>
}) {
  const [{ slug }, { step, type, error }] = await Promise.all([params, searchParams])

  return (
    <PersonalTeacherOnboarding
      slug={slug}
      step={step}
      type={type}
      error={error}
      createClassAction={resolveCreatePersonalClassAction.bind(null, slug)}
    />
  )
}