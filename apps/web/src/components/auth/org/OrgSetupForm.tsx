'use client'
import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createOrgAction } from '@/services/organization'
import type { CreateOrgResult } from '@/services/organization'
import { input } from "@/styles/input";
import { cn } from "@/lib/utils";

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)
}

export function OrgSetupForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)

  const [state, formAction, isPending] = useActionState<CreateOrgResult | null, FormData>(
    async (_prev, formData) =>
      createOrgAction({
        name: formData.get('name') as string,
        slug: formData.get('slug') as string,
        email: (formData.get('email') as string | null) || undefined,
      }),
    null,
  )

  useEffect(() => {
    if (state && 'data' in state) {
      router.push(`/${state.data.slug}/direction`)
    }
  }, [state, router])

  useEffect(() => {
    if (!slugManual) setSlug(toSlug(name))
  }, [name, slugManual])

  return (


    <div className="w-full max-w-lg space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Configurer votre établissement</h1>
        <p className="text-sm text-muted-foreground">
          Ces informations identifient votre établissement sur Attendancy.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className={input.label}>
            Nom de l&apos;établissement *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="organization"
            placeholder="Université de Lomé"
            className={input.base}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="slug" className={input.label}>Identifiant URL *</label>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugManual(true) }}
            placeholder="universite-de-lome"
            className={cn(input.base, "font-mono")}
          />
          <p className="text-xs text-muted-foreground">
            Minuscules, chiffres et tirets. URL :{' '}
            <span className="font-mono">/{slug || 'identifiant'}/direction</span>
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className={input.label}>
            Email officiel <span className="text-muted-foreground">(optionnel)</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="contact@etablissement.sn"
            className={input.base}
          />
        </div>

        {state && 'error' in state && (
          <p role="alert" className="text-sm text-destructive">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={isPending || !name || !slug}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          onClick={() => console.log('Submitting form data:')}
        >
          {isPending ? 'Création en cours…' : "Créer l'établissement"}
        </button>
      </form>
    </div>
  )
}
