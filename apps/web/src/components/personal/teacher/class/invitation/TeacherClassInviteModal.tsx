'use client'

/**
 * apps/web/src/components/personal/teacher/class/invitation/TeacherClassInviteModal.tsx
 *
 * Modal plein écran d'invitation d'étudiants en masse (Bulk) à une classe.
 *
 * Principes clés :
 * 1. Double canal automatique :
 *    - 🟢 Anneau Émeraude (Compte actif / École)  -> Reçoit l'invitation dans son /inbox sans email Supabase.
 *    - 🔵 Anneau Bleu (Nouveau compte / Externe) -> Reçoit l'email d'accueil Supabase pour créer son mot de passe.
 * 2. Tout sur un seul écran fluide :
 *    - Saisie d'email(s) libre(s)
 *    - Annuaire des étudiants disponibles de l'établissement avec recherche & sélection
 *    - Panier visuel d'avatars avec leurs anneaux distinctifs
 *    - Rattachement optionnel à un groupe TD/TP
 * 3. Écran de bilan clair post-envoi.
 */

import { useState, useMemo, type ReactNode, type KeyboardEvent } from 'react'
import {
  Search,
  X,
  Mail,
  Inbox,
  UserPlus,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  Sparkles,
} from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn, getInitials, getUserInitials } from '@/lib/utils'
import { isValidEmail } from '@/modules/invitation/validation'
import { useClassInvitations } from '@/hooks/data/invitation/use-class-invitations'
import { useClassGroups } from '@/hooks/data/groups/use-class-groups'
import type { GetStudentsDto } from '@/services/student/types'
import type { BulkInviteData } from '@/modules/invitation/student'

export type TargetStudent = {
  email: string
  firstName?: string
  lastName?: string
  isExisting: boolean
  avatarUrl?: string | null
}

interface TeacherClassInviteModalProps {
  trigger: ReactNode
  classId: string
  classLabel: string
  students: GetStudentsDto
}

export function TeacherClassInviteModal({
  trigger,
  classId,
  classLabel,
  students,
}: TeacherClassInviteModalProps) {
  const [open, setOpen] = useState(false)

  // ── ÉTAT DE LA SÉLECTION ──────────────────────────────────────────────────
  const [selectedStudents, setSelectedStudents] = useState<TargetStudent[]>([])
  const [emailInput, setEmailInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)

  // ── ÉTATS DE SOUMISSION & RÉSULTAT ─────────────────────────────────────────
  const [result, setResult] = useState<BulkInviteData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ── HOOKS DE DONNÉES ───────────────────────────────────────────────────────
  const { inviteStudentsBulk } = useClassInvitations(classId, { toastError: false })
  const { groups, isLoading: isLoadingGroups } = useClassGroups(classId)

  // Set pour tester instantanément si un email est sélectionné
  const selectedEmailSet = useMemo(
    () => new Set(selectedStudents.map((s) => s.email.toLowerCase())),
    [selectedStudents],
  )

  // Filtrage des étudiants disponibles dans l'établissement
  const filteredAvailableStudents = useMemo(() => {
    if (!searchQuery.trim()) return students
    const q = searchQuery.toLowerCase().trim()
    return students.filter((s) => {
      const email = s.user.email?.toLowerCase() ?? ''
      const first = s.user.firstName?.toLowerCase() ?? ''
      const last = s.user.lastName?.toLowerCase() ?? ''
      const full = `${first} ${last}`.trim()
      return email.includes(q) || first.includes(q) || last.includes(q) || full.includes(q)
    })
  }, [students, searchQuery])

  // Décompte par canal automatique
  const existingCount = useMemo(
    () => selectedStudents.filter((s) => s.isExisting).length,
    [selectedStudents],
  )
  const newEmailCount = selectedStudents.length - existingCount

  // ── ACTIONS DE SÉLECTION ───────────────────────────────────────────────────

  function resetAll() {
    setSelectedStudents([])
    setEmailInput('')
    setSearchQuery('')
    setSelectedGroupId(null)
    setResult(null)
    setError(null)
  }

  function handleClose(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) resetAll()
  }

  /** Ajoute une ou plusieurs adresses saisies dans le champ texte */
  function handleAddEmail() {
    const raw = emailInput.trim()
    if (!raw) return

    // Découpage sur virgule, point-virgule, espace ou retour à la ligne
    const parts = raw.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean)
    const newItems: TargetStudent[] = []

    for (const email of parts) {
      if (!isValidEmail(email) || selectedEmailSet.has(email)) continue

      // Vérifie si cet email correspond à un étudiant déjà dans l'école
      const matched = students.find((s) => s.user.email?.toLowerCase() === email)
      if (matched) {
        newItems.push({
          email,
          firstName: matched.user.firstName ?? undefined,
          lastName: matched.user.lastName ?? undefined,
          isExisting: true,
          avatarUrl: matched.user.avatar_url ?? null,
        })
      } else {
        newItems.push({
          email,
          isExisting: false,
        })
      }
    }

    if (newItems.length > 0) {
      setSelectedStudents((prev) => [...prev, ...newItems])
      setEmailInput('')
      setError(null)
    }
  }

  function handleKeyDownEmail(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddEmail()
    }
  }

  /** Coche / Décoche un étudiant de l'annuaire de l'école */
  function handleToggleStudent(student: GetStudentsDto[number]) {
    const email = student.user.email?.toLowerCase().trim()
    if (!email) return

    if (selectedEmailSet.has(email)) {
      setSelectedStudents((prev) => prev.filter((s) => s.email !== email))
    } else {
      setSelectedStudents((prev) => [
        ...prev,
        {
          email,
          firstName: student.user.firstName ?? undefined,
          lastName: student.user.lastName ?? undefined,
          isExisting: true,
          avatarUrl: student.user.avatar_url ?? null,
        },
      ])
    }
    setError(null)
  }

  /** Tout sélectionner parmi les résultats visibles de l'annuaire */
  function handleToggleSelectAllVisible() {
    const visibleEmails = filteredAvailableStudents
      .map((s) => s.user.email?.toLowerCase().trim())
      .filter((e): e is string => Boolean(e))

    const allVisibleSelected = visibleEmails.every((e) => selectedEmailSet.has(e))

    if (allVisibleSelected) {
      // Désélectionne tous les visibles
      const visibleSet = new Set(visibleEmails)
      setSelectedStudents((prev) => prev.filter((s) => !visibleSet.has(s.email)))
    } else {
      // Ajoute tous les visibles non encore sélectionnés
      const toAdd: TargetStudent[] = []
      for (const st of filteredAvailableStudents) {
        const email = st.user.email?.toLowerCase().trim()
        if (email && !selectedEmailSet.has(email)) {
          toAdd.push({
            email,
            firstName: st.user.firstName ?? undefined,
            lastName: st.user.lastName ?? undefined,
            isExisting: true,
            avatarUrl: st.user.avatar_url ?? null,
          })
        }
      }
      setSelectedStudents((prev) => [...prev, ...toAdd])
    }
    setError(null)
  }

  /** Supprime un étudiant individuel du panier */
  function handleRemoveStudent(emailToRemove: string) {
    setSelectedStudents((prev) => prev.filter((s) => s.email !== emailToRemove))
  }

  // ── SOUMISSION DU LOT ──────────────────────────────────────────────────────
  async function handleSend() {
    if (selectedStudents.length === 0) return
    setError(null)

    try {
      const res = await inviteStudentsBulk.mutateAsync({
        students: selectedStudents.map((s) => ({
          email: s.email,
          firstName: s.firstName,
          lastName: s.lastName,
        })),
        groupIds: selectedGroupId ? [selectedGroupId] : undefined,
        deliveryMethod: 'email',
      })

      if ('error' in res) {
        setError(res.error)
        return
      }

      setResult(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur inattendue s'est produite.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="fixed inset-0 z-50 m-0 flex h-screen w-screen max-w-none flex-col rounded-none border-0 bg-background p-0 shadow-none">
        <DialogTitle className="sr-only">Inviter des étudiants dans {classLabel}</DialogTitle>

        {/* ── HEADER FIXE ──────────────────────────────────────────────────────── */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserPlus className="size-5" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground sm:text-base">
                Inviter des étudiants
              </h1>
              <p className="text-xs text-muted-foreground">{classLabel}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleClose(false)}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </header>

        {/* ── VUE DE BILAN / SUCCÈS (POST-ENVOI) ─────────────────────────────────── */}
        {result ? (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <div className="mx-auto max-w-md space-y-6">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="size-10" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Invitations traitées avec succès !
                </h2>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{result.succeeded.length}</span>{' '}
                  étudiant{result.succeeded.length > 1 ? 's' : ''} invité{result.succeeded.length > 1 ? 's' : ''}{' '}
                  dans {classLabel}.
                </p>
              </div>

              {result.failed.length > 0 && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-left">
                  <p className="text-xs font-semibold text-destructive">
                    {result.failed.length} invitation{result.failed.length > 1 ? 's' : ''} n'{result.failed.length > 1 ? 'ont' : 'a'} pas pu être envoyée{result.failed.length > 1 ? 's' : ''} :
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {result.failed.map((f) => (
                      <li key={f.email} className="flex justify-between">
                        <span>{f.email}</span>
                        <span className="text-destructive">{f.error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                >
                  Terminer
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── VUE PRINCIPALE D'INVITATION ─────────────────────────────────────── */
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-4xl space-y-8 p-6">
                {/* ── 1. LE PANIER VISUEL D'AVATARS SÉLECTIONNÉS ───────────────── */}
                <section className="space-y-3 rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="size-4 text-muted-foreground" />
                      <h2 className="text-sm font-semibold text-foreground">
                        Étudiants sélectionnés ({selectedStudents.length})
                      </h2>
                    </div>

                    {selectedStudents.length > 0 && (
                      <button
                        type="button"
                        onClick={resetAll}
                        className="text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
                      >
                        Tout retirer
                      </button>
                    )}
                  </div>

                  {/* LÉGENDE DES ANNEAUX */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-emerald-500" />
                      <span>Compte actif école (Remise Inbox)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-blue-500" />
                      <span>Nouveau compte (Remise Email)</span>
                    </div>
                  </div>

                  {/* RANGÉE D'AVATARS */}
                  {selectedStudents.length === 0 ? (
                    <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-xs text-muted-foreground">
                      Sélectionnez des étudiants ci-dessous ou saisissez des emails pour les ajouter.
                    </div>
                  ) : (
                    <div className="flex max-h-48 flex-wrap gap-2.5 overflow-y-auto pt-1">
                      {selectedStudents.map((st) => {
                        const displayName =
                          st.firstName && st.lastName
                            ? `${st.firstName} ${st.lastName}`
                            : st.email
                        const initials = st.isExisting
                          ? getInitials(st.firstName, st.lastName) || getUserInitials(undefined, st.email)
                          : getUserInitials(undefined, st.email)

                        return (
                          <div
                            key={st.email}
                            className={cn(
                              'group relative flex items-center gap-2 rounded-full border border-border bg-background py-1 pl-1 pr-3 text-xs transition-colors',
                              st.isExisting ? 'hover:border-emerald-500/50' : 'hover:border-blue-500/50',
                            )}
                          >
                            {/* Avatar avec anneau coloré */}
                            <div
                              className={cn(
                                'flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold shadow-sm',
                                st.isExisting
                                  ? 'bg-emerald-500/15 text-emerald-600 ring-2 ring-emerald-500 ring-offset-1 ring-offset-background dark:text-emerald-400'
                                  : 'bg-blue-500/15 text-blue-600 ring-2 ring-blue-500 ring-offset-1 ring-offset-background dark:text-blue-400',
                              )}
                            >
                              {initials}
                            </div>

                            <span className="max-w-[140px] truncate font-medium text-foreground">
                              {displayName}
                            </span>

                            {/* Bouton pour retirer du panier */}
                            <button
                              type="button"
                              onClick={() => handleRemoveStudent(st.email)}
                              className="ml-1 text-muted-foreground transition-colors hover:text-destructive"
                              title="Retirer"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </section>

                {/* ── 2. AJOUTER PAR EMAIL (NOUVEAUX ÉTUDIANTS) ────────────────── */}
                <section className="space-y-3">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      Ajouter par email
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Saisissez une ou plusieurs adresses séparées par des virgules ou des espaces.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        onKeyDown={handleKeyDownEmail}
                        placeholder="etudiant@domaine.com, autre@domaine.com..."
                        className="h-10 w-full rounded-md border border-border bg-card pl-10 pr-3 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddEmail}
                      disabled={!emailInput.trim()}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-secondary px-4 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-40"
                    >
                      <UserPlus className="size-4" />
                      Ajouter
                    </button>
                  </div>
                </section>

                {/* ── 3. ANNUAIRE DES ÉTUDIANTS DE L'ÉCOLE (NON INSCRITS) ───────── */}
                <section className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">
                        Étudiants de l'établissement disponibles ({students.length})
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Étudiants inscrits dans l'établissement qui ne sont pas encore dans cette classe.
                      </p>
                    </div>

                    {filteredAvailableStudents.length > 0 && (
                      <button
                        type="button"
                        onClick={handleToggleSelectAllVisible}
                        className="self-start text-xs font-semibold text-primary transition-colors hover:underline"
                      >
                        Tout sélectionner ({filteredAvailableStudents.length})
                      </button>
                    )}
                  </div>

                  {/* Recherche rapide */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filtrer par nom, prénom ou email..."
                      className="h-9 w-full rounded-md border border-border bg-card pl-10 pr-3 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Liste des étudiants de l'école */}
                  <div className="max-h-72 overflow-y-auto rounded-lg border border-border bg-card divide-y divide-border">
                    {filteredAvailableStudents.length === 0 ? (
                      <div className="p-6 text-center text-xs text-muted-foreground">
                        {students.length === 0
                          ? "Aucun autre étudiant disponible dans l'établissement."
                          : 'Aucun étudiant ne correspond à votre recherche.'}
                      </div>
                    ) : (
                      filteredAvailableStudents.map((st) => {
                        const email = st.user.email?.toLowerCase().trim() ?? ''
                        const isSelected = selectedEmailSet.has(email)
                        const fullName = `${st.user.firstName ?? ''} ${st.user.lastName ?? ''}`.trim() || email
                        const initials = getInitials(st.user.firstName, st.user.lastName) || getUserInitials(undefined, email)

                        return (
                          <div
                            key={st.id}
                            onClick={() => handleToggleStudent(st)}
                            className={cn(
                              'flex cursor-pointer items-center justify-between p-3 text-xs transition-colors hover:bg-muted/50',
                              isSelected && 'bg-emerald-500/5',
                            )}
                          >
                            <div className="flex items-center gap-3">
                              {/* Checkbox stylisée */}
                              <div
                                className={cn(
                                  'flex size-4 items-center justify-center rounded border transition-colors',
                                  isSelected
                                    ? 'border-emerald-600 bg-emerald-600 text-white'
                                    : 'border-muted-foreground/40 bg-background',
                                )}
                              >
                                {isSelected && <Check className="size-3" />}
                              </div>

                              {/* Avatar */}
                              <div
                                className={cn(
                                  'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                                  isSelected
                                    ? 'bg-emerald-500/15 text-emerald-600 ring-2 ring-emerald-500 ring-offset-1 ring-offset-background'
                                    : 'bg-muted text-muted-foreground',
                                )}
                              >
                                {initials}
                              </div>

                              <div>
                                <p className="font-medium text-foreground">{fullName}</p>
                                <p className="text-[11px] text-muted-foreground">{email}</p>
                              </div>
                            </div>

                            <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              École &middot; Inbox
                            </span>
                          </div>
                        )
                      })
                    )}
                  </div>
                </section>

                {/* ── 4. AFFECTATION À UN GROUPE TD/TP (OPTIONNEL) ─────────────── */}
                {groups.length > 0 && (
                  <section className="space-y-3 rounded-xl border border-border bg-card p-5">
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">
                        Affecter à un sous-groupe (Optionnel)
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Les étudiants invités seront directement inscrits dans ce groupe une fois leur invitation acceptée.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedGroupId(null)}
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-medium transition-colors border',
                          selectedGroupId === null
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted',
                        )}
                      >
                        Aucun groupe
                      </button>

                      {groups.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setSelectedGroupId(g.id)}
                          className={cn(
                            'rounded-full px-3 py-1 text-xs font-medium transition-colors border',
                            selectedGroupId === g.id
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted',
                          )}
                        >
                          {g.name}
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* MESSAGE D'ERREUR ÉVENTUEL */}
                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── FOOTER FIXE D'ACTION ─────────────────────────────────────────── */}
            <footer className="flex h-16 shrink-0 items-center justify-between border-t border-border bg-card px-6">
              <div className="text-xs text-muted-foreground">
                {selectedStudents.length === 0 ? (
                  <span>Aucun étudiant sélectionné</span>
                ) : (
                  <span>
                    <strong className="text-foreground">{selectedStudents.length}</strong> invité{selectedStudents.length > 1 ? 's' : ''}{' '}
                    ({existingCount > 0 && `${existingCount} via Inbox`}
                    {existingCount > 0 && newEmailCount > 0 && ' · '}
                    {newEmailCount > 0 && `${newEmailCount} par email`})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  disabled={inviteStudentsBulk.isPending}
                  className="rounded-md border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={selectedStudents.length === 0 || inviteStudentsBulk.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-40"
                >
                  {inviteStudentsBulk.isPending ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Envoi en cours…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5" />
                      <span>Envoyer les invitations ({selectedStudents.length})</span>
                    </>
                  )}
                </button>
              </div>
            </footer>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
