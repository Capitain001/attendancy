'use client'
// Dialog épuré d'invitation à la classe : email libre ou user existant, envoi par email ou partage du lien.

import { useState, useTransition, type ReactNode } from 'react'
import { Send, Share2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { UserInfo } from '@/components/users/AvatarSelect'
import { share } from '@/lib/invitation/share'
import { isValidEmail } from '@/modules/invitation/validation'
import { UserCombobox } from '@/components/users/select/UserCombobox'

type InviteInput = { email: string; firstName?: string; lastName?: string }
type InviteResult = { success: boolean; error?: string; message?: string; link?: string }

interface TeacherClassInviteDialogProps {
  trigger: ReactNode
  classLabel: string
  orgUsers: UserInfo[]
  onSendEmail: (input: InviteInput) => Promise<InviteResult>
  onCreateLink: (input: InviteInput) => Promise<InviteResult>
}

export function TeacherClassInviteDialog({
  trigger,
  classLabel,
  orgUsers,
  onSendEmail,
  onCreateLink,
}: TeacherClassInviteDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [picked, setPicked] = useState<UserInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const trimmed = email.trim()
  const canSubmit = !pending && isValidEmail(trimmed)
  // Le user choisi n'est pris en compte que si l'email n'a pas été retouché à la main.
  const pickedUser = picked && picked.email === trimmed ? picked : null

  function reset() {
    setEmail('')
    setPicked(null)
    setError(null)
  }

  function buildInput(): InviteInput {
    const [firstName, ...rest] = pickedUser?.name?.trim().split(' ') ?? []
    return {
      email: trimmed,
      firstName: firstName || undefined,
      lastName: rest.join(' ') || undefined,
    }
  }

  function handleSendEmail() {
    setError(null)
    startTransition(async () => {
      const res = await onSendEmail(buildInput())
      if (!res.success) {
        setError(res.error ?? "Envoi de l'invitation impossible.")
        return
      }
      toast.success(res.message ?? 'Invitation envoyée')
      reset()
      setOpen(false)
    })
  }

  function handleShare() {
    setError(null)
    startTransition(async () => {
      const res = await onCreateLink(buildInput())
      if (!res.success || !res.link) {
        setError(res.error ?? 'Création du lien impossible.')
        return
      }
      await shareLink(res.link)
      reset()
      setOpen(false)
    })
  }

  async function shareLink(link: string) {
    try {
      const outcome = await share.native(link, {
        title: 'Invitation',
        text: `Rejoins ${classLabel}`,
      })
      if (outcome === 'shared') return toast.success('Lien partagé')
      if (outcome === 'cancelled') return toast.message('Invitation créée, lien non partagé')
    } catch {
      // permission refusée / activation utilisateur expirée → on retombe sur le presse-papiers
    }
    const { copied } = await share.clipboard(link)
    if (copied) toast.success("Lien d'invitation copié")
    else toast.message("Lien d'invitation", { description: link })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="gap-4 rounded-sm border-0  p-6 shadow-lg sm:max-w-sm">
        <DialogTitle className="sr-only">Inviter dans la classe</DialogTitle>
        {/* <DialogDescription className="sr-only">
          Saisissez un email ou choisissez un utilisateur existant, puis envoyez l'invitation ou
          partagez le lien.
        </DialogDescription> */}

        <div className="space-y-2 mt-6">
          <label htmlFor="invite-email" className="text-[13px] font-semibold text-foreground">
            Email
          </label>
          <div className="flex items-center gap-2">
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              placeholder="etudiant@ecole.com"
              className="h-10 min-w-0 flex-1 rounded-lg bg-muted px-3 text-[13px] outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-foreground/20"
            />
            <UserCombobox
              users={orgUsers}
              disabled={pending}
              onSelect={(u) => {
                setPicked(u)
                setEmail(u.email ?? '')
              }}
             contentClassName="w-[calc(100vw)] rounded-md sm:w-[336px] mt-2"
            />
          </div>
          {pickedUser?.name && (
            <p className="text-[11px] text-muted-foreground">{pickedUser.name}</p>
          )}
          {error && <p className="text-[12px] text-destructive">{error}</p>}
        </div>

        <div className="mt-10 flex items-center justify-between">
          <button
            type="button"
            onClick={handleShare}
            disabled={!canSubmit}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground transition-opacity hover:opacity-70 disabled:opacity-40"
          >
            <Share2 className="size-3.5" />
            Partager le lien
          </button>
          <button
            type="button"
            onClick={handleSendEmail}
            disabled={!canSubmit}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground transition-opacity hover:opacity-70 disabled:opacity-40"
          >
            {pending ? 'Envoi…' : 'Envoyer par email'}
            {!pending && <Send className="size-3.5" />}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}