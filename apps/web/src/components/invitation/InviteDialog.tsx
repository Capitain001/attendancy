'use client'
// Dialog unifié d'invitation staff : Enseignant | Direction (fonctions conditionnelles).
// Ne touche pas aux actions serveur — délègue aux mutations passées par la page (hook).

import { useState, useTransition } from 'react'
import { Check } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { isValidEmail } from '@/modules/invitation/validation'

type Submit = (input: {
  email: string
  name?: string
  functions?: string[]
  deliveryMethod?: "email" | "link"
}) => Promise<{ success: boolean; error?: string }>

interface InviteDialogProps {
  functions: { id: string; name: string }[]
  onInviteTeacher: Submit
  onInviteDirection: Submit
}

type Role = 'TEACHER' | 'DIRECTION'

export function InviteDialog({ functions, onInviteTeacher, onInviteDirection }: InviteDialogProps) {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<Role>('TEACHER')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [selectedFns, setSelectedFns] = useState<string[]>([])
  const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'link'>('email')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function reset() {
    setRole('TEACHER')
    setEmail('')
    setName('')
    setSelectedFns([])
    setDeliveryMethod('email')
    setError(null)
  }

  function toggleFn(fnName: string) {
    setSelectedFns((prev) =>
      prev.includes(fnName) ? prev.filter((f) => f !== fnName) : [...prev, fnName],
    )
  }

  const canSubmit =
    isValidEmail(email.trim()) &&
    (role === 'TEACHER' || selectedFns.length > 0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const input = { email: email.trim(), name: name.trim() || undefined, deliveryMethod }
    startTransition(async () => {
      const res =
        role === 'DIRECTION'
          ? await onInviteDirection({ ...input, functions: selectedFns })
          : await onInviteTeacher(input)
      if (!res.success) {
        setError(res.error ?? "Envoi de l'invitation impossible.")
        return
      }
      reset()
      setOpen(false)
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-[12px] font-medium text-background transition-opacity hover:opacity-90"
        >
          <span aria-hidden className="text-[14px] leading-none">+</span>
          Inviter
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm rounded-sm">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Inviter un membre</DialogTitle>
          <DialogDescription className="text-[12px]">
            Envoie une invitation par email pour rejoindre l'organisation.
          </DialogDescription>
        </DialogHeader>

        {/* Segment rôle */}
        <div className="grid grid-cols-2 gap-1 rounded-md bg-muted/50 p-1">
          {(['TEACHER', 'DIRECTION'] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                'rounded-[5px] py-1.5 text-[12px] font-medium transition-colors',
                role === r ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
              )}
            >
              {r === 'TEACHER' ? 'Enseignant' : 'Direction'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="invite-email" className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Email
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
              placeholder="membre@ecole.com"
              className="h-9 w-full rounded-md border border-dashed border-foreground/30 bg-card px-3 text-[13px] outline-none focus:border-foreground/60 placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="invite-name" className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Nom (optionnel)
            </label>
            <input
              id="invite-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jean Dupont"
              className="h-9 w-full rounded-md border border-dashed border-foreground/30 bg-card px-3 text-[13px] outline-none focus:border-foreground/60 placeholder:text-muted-foreground/60"
            />
          </div>

          {role === 'DIRECTION' && (
            <div className="space-y-1">
              <label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Fonction(s)
              </label>
              {functions.length === 0 ? (
                <p className="py-2 text-[12px] text-muted-foreground">Aucune fonction disponible.</p>
              ) : (
                <ul className="max-h-40 space-y-1 overflow-y-auto">
                  {functions.map((f) => {
                    const checked = selectedFns.includes(f.name)
                    return (
                      <li key={f.id}>
                        <button
                          type="button"
                          onClick={() => toggleFn(f.name)}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-accent/40',
                            checked && 'bg-primary/10',
                          )}
                        >
                          <span
                            className={cn(
                              'grid size-4 shrink-0 place-items-center rounded border',
                              checked ? 'border-primary bg-primary text-primary-foreground' : 'border-foreground/30',
                            )}
                          >
                            {checked && <Check className="size-3" />}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{f.name}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}

          <div className="space-y-2 pt-1">
            <label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Envoi de l'invitation
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-[13px] cursor-pointer">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="email"
                  checked={deliveryMethod === 'email'}
                  onChange={() => setDeliveryMethod('email')}
                  className="accent-primary"
                />
                Par email automatique
              </label>
              <label className="flex items-center gap-1.5 text-[13px] cursor-pointer">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="link"
                  checked={deliveryMethod === 'link'}
                  onChange={() => setDeliveryMethod('link')}
                  className="accent-primary"
                />
                Lien uniquement
              </label>
            </div>
            {deliveryMethod === 'link' && (
              <p className="text-[11px] text-muted-foreground/80 leading-snug">
                Le lien magique sera généré et copié pour que vous le partagiez vous-même (SMS, WhatsApp...).
              </p>
            )}
          </div>

          {error && <p className="text-[12px] text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-md border border-foreground/15 px-3 py-2 text-[12px] text-muted-foreground transition-colors hover:bg-foreground/[0.04]"
              >
                Annuler
              </button>
            </DialogClose>
            <button
              type="submit"
              disabled={pending || !canSubmit}
              className="rounded-md bg-foreground px-3 py-2 text-[12px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
