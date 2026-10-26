'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Play } from 'lucide-react'
import { createPersonalClassAction } from '@/services/class'

export function StartPersonalClassButton({ href }: { href: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()

  function onClick() {
    setError(undefined)
    startTransition(async () => {
      const res = await createPersonalClassAction()
      if ('error' in res) {
        setError(res.error)
        return
      }
      router.push(href) // « Mes classes » : une seule navigation, pas de refresh
    })
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        <Play aria-hidden="true" className="h-4 w-4" />
        {pending ? 'Création…' : 'Démarrer'}
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}