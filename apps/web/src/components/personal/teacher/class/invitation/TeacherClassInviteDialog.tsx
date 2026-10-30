'use client'
// Dialog épuré d'invitation à la classe : email libre ou étudiant existant, envoi par email ou partage du lien.

import { useState, useTransition, useMemo, type ReactNode } from 'react'
import { Send, Share2 } from 'lucide-react'
import { toast } from 'sonner'

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { share } from '@/lib/invitation/share'
import { isValidEmail } from '@/modules/invitation/validation'
import type { GetStudentsDto } from '@/services/student/types'
import { UserCombobox } from '@/components/users/select/UserCombobox'
import { InviteStudentInput, InviteStudentResult } from '@/modules/invitation/student'
import { withName } from '@/lib/map' // <-- Import de notre utilitaire de mapping

type StudentUser = GetStudentsDto[number]['user']
type MappedUser = ReturnType<typeof withName<StudentUser>>

// Le dialog ne fournit que l'identité de l'invité ; classId et deliveryMethod viennent du parent.
type InviteInput = Pick<InviteStudentInput, 'email' | 'firstName' | 'lastName'>

interface TeacherClassInviteDialogProps {
  trigger: ReactNode
  classLabel: string
  students: GetStudentsDto
  onSendEmail: (input: InviteInput) => Promise<InviteStudentResult>
  onCreateLink: (input: InviteInput) => Promise<InviteStudentResult>
}

export function TeacherClassInviteDialog({
  trigger,
  classLabel,
  students,
  onSendEmail,
  onCreateLink,
}: TeacherClassInviteDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [picked, setPicked] = useState<MappedUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Mapping direct des étudiants vers le format attendu par le UserCombobox (avec `name`)
  const mappedUsers = useMemo(
    () => students.map((s) => withName(s.user)),
    [students]
  )

  const trimmed = email.trim()
  const canSubmit = !pending && isValidEmail(trimmed)
  // L'étudiant choisi n'est pris en compte que si l'email n'a pas été retouché à la main.
  const pickedUser = picked && picked.email === trimmed ? picked : null
  const pickedName = pickedUser?.name ?? ''

  function reset() {
    setEmail('')
    setPicked(null)
    setError(null)
  }

  function buildInput(): InviteInput {
    return {
      email: trimmed,
      firstName: pickedUser?.firstName ?? undefined,
      lastName: pickedUser?.lastName ?? undefined,
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
      // permission refusée / activation utilisateur expirée → presse-papiers
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

      <DialogContent className="gap-4 rounded-sm border-0 p-6 shadow-lg sm:max-w-sm">
        <DialogTitle className="sr-only">Inviter dans la classe</DialogTitle>

        <div className="mt-6 space-y-2">
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
              users={mappedUsers}
              disabled={pending}
              onSelect={(s) => {
                setPicked(s)
                setEmail(s.email)
              }}
              contentClassName="mt-2 w-[calc(100vw)] rounded-md sm:w-[336px]"
            />
          </div>
          {pickedName && <p className="text-[11px] text-muted-foreground">{pickedName}</p>}
          {error && <p className="text-[12px] text-destructive">{error}</p>}
        </div>

        <div className="mt-10 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleShare}
            disabled={!canSubmit}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-3.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
          >
            <Share2 className="size-4" />
            Partager le lien
          </button>

          <button
            type="button"
            onClick={handleSendEmail}
            disabled={!canSubmit}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-dashed border-border bg-foreground/10 px-3.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
          >
            {!pending && <Send className="size-4" />}
            {pending ? 'Envoi…' : 'Email'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}