'use client'

import { useState, useTransition } from 'react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'

type Submit = (input: {
  email: string
  name?: string
}) => Promise<{ success: boolean; error?: string }>

interface InviteTeacherDialogProps {
  onInviteTeacher: Submit
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function InviteTeacherDialog({ 
  onInviteTeacher,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: InviteTeacherDialogProps) {
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
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function reset() {
    setEmail('')
    setName('')
    setError(null)
  }

  const canSubmit = email.trim().length > 3

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const input = { email: email.trim(), name: name.trim() || undefined }
    startTransition(async () => {
      const res = await onInviteTeacher(input)
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
          Inviter un enseignant
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Inviter un enseignant</DialogTitle>
          <DialogDescription className="text-[12px]">
            Envoie une invitation par email pour rejoindre le corps professoral.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
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
              placeholder="enseignant@ecole.com"
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

          {error && <p className="text-[12px] text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
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
              {pending ? 'Envoi…' : 'Envoyer l\'invitation'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
