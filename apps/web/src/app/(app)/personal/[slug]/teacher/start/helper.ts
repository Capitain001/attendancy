'use server'

import { redirect } from 'next/navigation'
import { createPersonalClassFormAction, type PersonalClassType } from '@/features/personal/services/class/form'
import { personal } from '@/modules/personal/paths'
import { buildQueryUrl } from '@/lib/url'

export async function resolveCreatePersonalClassAction(
    slug: string,
    type: PersonalClassType,
    formData: FormData,
) {
    const res = await createPersonalClassFormAction(type, formData)

    if (res.error) {
        redirect(buildQueryUrl(personal.start(slug), { step: 'name', type, error: res.error }))
    }

    redirect(personal.home(slug))
}