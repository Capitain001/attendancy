'use client'

import { useState, useTransition } from 'react'
import { Check, ChevronRight, ArrowLeft, Loader2, MailOpen, Users } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

import { useClasses } from '@/hooks/data/classes/useClasses'
import { getGroupsByClassAction } from '@/services/group'
import { inviteStudent } from '@/modules/invitation/student/actions'

export function GlobalInviteStudentDialog() {
  const [open, setOpen] = useState(false)
  
  // Steps: 1: Info, 2: Class, 3: Groups (optional), 4: Identity
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  
  // Data & form state
  const { data: classesData, loading: classesLoading } = useClasses({ enabled: open })
  const classes = classesData?.items ?? []
  const [availableGroups, setAvailableGroups] = useState<{ id: string; name: string }[]>([])
  
  const [classId, setClassId] = useState<string | null>(null)
  const [groupIds, setGroupIds] = useState<string[]>([])
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setStep(1)
    setClassId(null)
    setGroupIds([])
    setAvailableGroups([])
    setEmail('')
    setFirstName('')
    setLastName('')
    setParentEmail('')
    setError(null)
  }

  async function handleSelectClass(id: string) {
    setClassId(id)
    setLoadingGroups(true)
    setError(null)
    
    try {
      const res = await getGroupsByClassAction(id)
      if (res.error || !res.data) {
        setAvailableGroups([])
        setStep(4) // Skip groups
      } else {
        const groups = res.data
        if (groups.length > 0) {
          setAvailableGroups(groups)
          setStep(3)
        } else {
          setAvailableGroups([])
          setStep(4)
        }
      }
    } catch (e) {
      setAvailableGroups([])
      setStep(4)
    } finally {
      setLoadingGroups(false)
    }
  }

  function toggleGroup(id: string) {
    setGroupIds((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!classId) return
    setError(null)
    
    startTransition(async () => {
      const res = await inviteStudent({
        email: email.trim(),
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        groupIds: groupIds.length ? groupIds : undefined,
        parentEmail: parentEmail.trim() || undefined,
        classId
      })
      
      if (!res.success) {
        setError(res.error ?? "Envoi de l'invitation impossible.")
        return
      }
      
      toast.success("Invitation envoyée avec succès")
      reset()
      setOpen(false)
    })
  }

  // --- Step Renders ---
  
  const renderStep1 = () => (
    <div className="flex h-[420px] flex-col py-2">
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailOpen className="size-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-[15px] font-semibold text-foreground">Inviter un étudiant</h3>
          <p className="text-[13px] text-muted-foreground max-w-[280px] mx-auto">
            L'étudiant recevra un lien d'inscription valable 7 jours. Il pourra créer son compte et sera automatiquement affecté à la promotion de votre choix.
          </p>
        </div>
      </div>
      
      <div className="flex justify-end pt-3 border-t shrink-0">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2 text-[12px] font-medium text-background transition-colors hover:opacity-90"
        >
          Commencer <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
  
  const renderStep2 = () => (
    <div className="flex h-[420px] flex-col py-2">
      <div className="flex items-center gap-2 border-b pb-3 shrink-0">
        <span className="text-[14px] font-medium">1. Choix de la promotion</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
        <p className="text-[12px] text-muted-foreground">
          Sélectionnez la classe (promotion) que l'étudiant va rejoindre.
        </p>

        <div className="space-y-2">
          {classesLoading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : classes && classes.length > 0 ? (
            classes.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelectClass(c.id)}
                disabled={loadingGroups}
                className="flex w-full items-center justify-between rounded-md border p-3 text-left transition-colors hover:border-foreground/30 hover:bg-muted/50 disabled:opacity-50"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-medium">{c.name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {c.academicYear?.name ?? "Année inconnue"}
                  </span>
                </div>
                {loadingGroups && classId === c.id ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 text-muted-foreground" />
                )}
              </button>
            ))
          ) : (
            <p className="text-[12px] text-muted-foreground py-4 text-center">
              Aucune promotion disponible.
            </p>
          )}
        </div>
      </div>
      
      <div className="flex justify-between items-center pt-3 border-t shrink-0">
        <button type="button" onClick={() => setStep(1)} className="rounded-md border border-foreground/15 px-3 py-2 text-[12px] text-muted-foreground transition-colors hover:bg-foreground/[0.04]">
          Retour
        </button>
        {/* Pas de bouton suivant ici, le clic sur la classe avance */}
      </div>
    </div>
  )
  
  const renderStep3 = () => (
    <div className="flex h-[420px] flex-col py-2">
      <div className="flex items-center gap-2 border-b pb-3 shrink-0">
        <span className="text-[14px] font-medium">2. Groupes (Optionnel)</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-3 space-y-4">
        <p className="text-[12px] text-muted-foreground">
          Vous pouvez pré-assigner l'étudiant à un ou plusieurs groupes de la classe.
        </p>
        
        <ul className="flex flex-wrap gap-2">
          {availableGroups.map((g) => {
            const checked = groupIds.includes(g.id)
            return (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => toggleGroup(g.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] transition-colors',
                    checked
                      ? 'border-primary bg-primary/10 text-foreground font-medium'
                      : 'border-foreground/20 text-muted-foreground hover:bg-foreground/[0.04]',
                  )}
                >
                  {checked && <Check className="size-3.5" />}
                  {g.name}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
      
      <div className="flex justify-between items-center pt-3 border-t shrink-0">
        <button type="button" onClick={() => setStep(2)} className="rounded-md border border-foreground/15 px-3 py-2 text-[12px] text-muted-foreground transition-colors hover:bg-foreground/[0.04]">
          Retour
        </button>
        <button
          type="button"
          onClick={() => setStep(4)}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2 text-[12px] font-medium text-background transition-colors hover:opacity-90"
        >
          Suivant <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
  
  const renderStep4 = () => (
    <form onSubmit={handleSubmit} className="flex h-[420px] flex-col py-2">
      <div className="flex items-center gap-2 border-b pb-3 shrink-0">
        <span className="text-[14px] font-medium">3. Identité de l'étudiant</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-3 space-y-4">
        <p className="text-[12px] text-muted-foreground">
          Renseignez les coordonnées de l'étudiant pour lui envoyer l'invitation.
        </p>

        <div className="space-y-3 pr-1">
          <div className="space-y-1">
            <label htmlFor="student-email-global" className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Email de l'étudiant *
            </label>
            <input
              id="student-email-global"
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
              <label htmlFor="student-first-global" className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Prénom (Optionnel)
              </label>
              <input
                id="student-first-global"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-9 w-full rounded-md border border-dashed border-foreground/30 bg-card px-3 text-[13px] outline-none focus:border-foreground/60"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="student-last-global" className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Nom (Optionnel)
              </label>
              <input
                id="student-last-global"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-9 w-full rounded-md border border-dashed border-foreground/30 bg-card px-3 text-[13px] outline-none focus:border-foreground/60"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="parent-email-global" className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Email parent (Optionnel)
            </label>
            <input
              id="parent-email-global"
              type="email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              placeholder="parent@email.com"
              className="h-9 w-full rounded-md border border-dashed border-foreground/30 bg-card px-3 text-[13px] outline-none focus:border-foreground/60 placeholder:text-muted-foreground/60"
            />
          </div>
        </div>
        
        {error && <p className="text-[12px] text-destructive">{error}</p>}
      </div>
      
      <div className="flex justify-between items-center pt-3 border-t shrink-0">
        <button 
          type="button" 
          onClick={() => setStep(availableGroups.length > 0 ? 3 : 2)} 
          className="rounded-md border border-foreground/15 px-3 py-2 text-[12px] text-muted-foreground transition-colors hover:bg-foreground/[0.04]"
        >
          Retour
        </button>
        <button
          type="submit"
          disabled={pending || email.trim().length < 4}
          className="rounded-md bg-foreground px-4 py-2 text-[12px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Users className="size-3.5" />}
          {pending ? 'Envoi…' : 'Envoyer l\'invitation'}
        </button>
      </div>
    </form>
  )

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
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </DialogContent>
    </Dialog>
  )
}
