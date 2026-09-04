'use client'
// Dialog d'invitation étudiant (écran classe) : email, identité, groupes, parent optionnel.

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

interface InviteStudentDialogProps {
  groups: { id: string; name: string }[]
  onSubmit: (input: {
    email: string
    firstName?: string
    lastName?: string
    groupIds?: string[]
    parentEmail?: string
    deliveryMethod?: 'email' | 'link'
  }) => Promise<{ success: boolean; error?: string }>
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function InviteStudentDialog({
  groups,
  onSubmit,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: InviteStudentDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const setOpen = (value: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(value)
    } else {
      setInternalOpen(value)
    }
  }
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [groupIds, setGroupIds] = useState<string[]>([])
  const [parentEmail, setParentEmail] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'link'>('email')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function reset() {
    setEmail('')
    setFirstName('')
    setLastName('')
    setGroupIds([])
    setParentEmail('')
    setDeliveryMethod('email')
    setError(null)
  }

  function toggleGroup(id: string) {
    setGroupIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await onSubmit({
        email: email.trim(),
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        groupIds: groupIds.length ? groupIds : undefined,
        parentEmail: parentEmail.trim() || undefined,
        deliveryMethod,
      })
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
          Inviter un étudiant
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Inviter un étudiant</DialogTitle>
          <DialogDescription className="text-[12px]">
            L'étudiant sera rattaché à cette classe à l'acceptation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="student-email" className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Email
            </label>
            <input
              id="student-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
              placeholder="etudiant@ecole.com"
              className="h-9 w-full rounded-md border border-dashed border-foreground/30 bg-card px-3 text-[13px] outline-none focus:border-foreground/60 placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label htmlFor="student-first" className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Prénom
              </label>
              <input
                id="student-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-9 w-full rounded-md border border-dashed border-foreground/30 bg-card px-3 text-[13px] outline-none focus:border-foreground/60"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="student-last" className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Nom
              </label>
              <input
                id="student-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-9 w-full rounded-md border border-dashed border-foreground/30 bg-card px-3 text-[13px] outline-none focus:border-foreground/60"
              />
            </div>
          </div>

          {groups.length > 0 && (
            <div className="space-y-1">
              <label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Groupes (optionnel)
              </label>
              <ul className="flex flex-wrap gap-1.5">
                {groups.map((g) => {
                  const checked = groupIds.includes(g.id)
                  return (
                    <li key={g.id}>
                      <button
                        type="button"
                        onClick={() => toggleGroup(g.id)}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[12px] transition-colors',
                          checked
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-foreground/20 text-muted-foreground hover:bg-foreground/[0.04]',
                        )}
                      >
                        {checked && <Check className="size-3" />}
                        {g.name}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="parent-email" className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Email parent (optionnel)
            </label>
            <input
              id="parent-email"
              type="email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              placeholder="parent@email.com"
              className="h-9 w-full rounded-md border border-dashed border-foreground/30 bg-card px-3 text-[13px] outline-none focus:border-foreground/60 placeholder:text-muted-foreground/60"
            />
          </div>

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
                Le lien magique sera généré et copié pour que vous le partagiez vous-même (SMS, WhatsApp...). L'étudiant ne recevra pas d'email.
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
              disabled={pending || !isValidEmail(email.trim())}
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
