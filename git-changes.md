# Changements Git en attente de commit

Ce rapport montre le contenu actuel des fichiers, pas les lignes de diff.

## Legende

- 🔵 PREPARE (staged) : changements ajoutes a l'index Git, prets a etre commites.
- 🟡 NON PREPARE (unstaged) : changements locaux qui ne sont pas encore ajoutes a l'index.
- 🟣 MIXTE (staged et unstaged) : le fichier contient a la fois des changements indexes et locaux; son contenu affiche est le contenu final sur le disque.
- 🟢 NOUVEAU FICHIER (untracked) : nouveau fichier non suivi par Git.
- 🔴 SUPPRIME : fichier supprime.

Les fichiers generes (`.api/`, `generated/`, `generated.types.ts`, `*.tsbuildinfo`) et le present rapport sont exclus.

_Genere le 2026-11-03 09:14:52._

## 🔵 PREPARE (staged)

### [scripts/export-pending-changes.ps1](<scripts/export-pending-changes.ps1>)

```
[CmdletBinding()]
param(
    [string]$OutputPath
)

$ErrorActionPreference = 'Stop'

$repoRoot = (& git rev-parse --show-toplevel 2>$null)
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($repoRoot)) {
    throw 'This script must be run inside a Git repository.'
}

$repoRoot = [System.IO.Path]::GetFullPath($repoRoot.Trim())
Set-Location -LiteralPath $repoRoot
if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    $OutputPath = Join-Path $repoRoot 'git-changes.md'
} elseif (-not [System.IO.Path]::IsPathRooted($OutputPath)) {
    $OutputPath = Join-Path $repoRoot $OutputPath
}

$OutputPath = [System.IO.Path]::GetFullPath($OutputPath)
$outputDirectory = [System.IO.Path]::GetDirectoryName($OutputPath)
if (-not [System.IO.Directory]::Exists($outputDirectory)) {
    [System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null
}

$head = (& git rev-parse --verify HEAD 2>$null)
$hasHead = $LASTEXITCODE -eq 0

if ($hasHead) {
    $stagedPaths = @(& git diff --cached --name-only --no-renames HEAD --)
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not read staged Git changes.'
    }
    $unstagedPaths = @(& git diff --name-only --no-renames --)
} else {
    $stagedPaths = @(& git diff --cached --name-only --no-renames --)
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not read staged Git changes.'
    }
    $unstagedPaths = @(& git diff --name-only --no-renames --)
}
if ($LASTEXITCODE -ne 0) {
    throw 'Could not read unstaged Git changes.'
}

$untrackedPaths = @(& git ls-files --others --exclude-standard)
if ($LASTEXITCODE -ne 0) {
    throw 'Could not read untracked Git files.'
}

$stagedSet = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
$unstagedSet = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
$untrackedSet = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
foreach ($path in $stagedPaths) {
    [void]$stagedSet.Add([string]$path)
}
foreach ($path in $unstagedPaths) {
    [void]$unstagedSet.Add([string]$path)
}
foreach ($path in $untrackedPaths) {
    [void]$untrackedSet.Add([string]$path)
}

$paths = @($stagedPaths) + @($unstagedPaths) + @($untrackedPaths) |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
    Sort-Object -Unique

$labels = @{
    Staged = "$([char]::ConvertFromUtf32(0x1F535)) PREPARE (staged)"
    Unstaged = "$([char]::ConvertFromUtf32(0x1F7E1)) NON PREPARE (unstaged)"
    Both = "$([char]::ConvertFromUtf32(0x1F7E3)) MIXTE (staged et unstaged)"
    Untracked = "$([char]::ConvertFromUtf32(0x1F7E2)) NOUVEAU FICHIER (untracked)"
    Deleted = "$([char]::ConvertFromUtf32(0x1F534)) SUPPRIME"
}
$groups = [ordered]@{
    Staged = New-Object 'System.Collections.Generic.List[string]'
    Unstaged = New-Object 'System.Collections.Generic.List[string]'
    Both = New-Object 'System.Collections.Generic.List[string]'
    Untracked = New-Object 'System.Collections.Generic.List[string]'
    Deleted = New-Object 'System.Collections.Generic.List[string]'
}
$reportDirectoryUri = New-Object System.Uri(($outputDirectory.TrimEnd('\') + '\'))

foreach ($path in $paths) {
    $normalizedPath = ([string]$path).Replace('\', '/')
    if ($normalizedPath -match '(?i)(^|/)\.api/|(^|/)generated/|(^|/)src/generated/|(^|/)generated\.types\.ts$|\.tsbuildinfo$') {
        continue
    }

    $absolutePath = [System.IO.Path]::GetFullPath((Join-Path $repoRoot $path))
    if ([string]::Equals($absolutePath, $OutputPath, [System.StringComparison]::OrdinalIgnoreCase)) {
        continue
    }

    $isStaged = $stagedSet.Contains([string]$path)
    $isUnstaged = $unstagedSet.Contains([string]$path)
    if ($untrackedSet.Contains([string]$path)) {
        $group = 'Untracked'
    } elseif (-not (Test-Path -LiteralPath $absolutePath -PathType Leaf)) {
        $group = 'Deleted'
    } elseif ($isStaged -and $isUnstaged) {
        $group = 'Both'
    } elseif ($isStaged) {
        $group = 'Staged'
    } else {
        $group = 'Unstaged'
    }

    $groups[$group].Add([string]$path)
}

$markdown = New-Object 'System.Collections.Generic.List[string]'
$markdown.Add('# Changements Git en attente de commit')
$markdown.Add('')
$markdown.Add('Ce rapport montre le contenu actuel des fichiers, pas les lignes de diff.')
$markdown.Add('')
$markdown.Add('## Legende')
$markdown.Add('')
$markdown.Add("- $($labels.Staged) : changements ajoutes a l'index Git, prets a etre commites.")
$markdown.Add("- $($labels.Unstaged) : changements locaux qui ne sont pas encore ajoutes a l'index.")
$markdown.Add("- $($labels.Both) : le fichier contient a la fois des changements indexes et locaux; son contenu affiche est le contenu final sur le disque.")
$markdown.Add("- $($labels.Untracked) : nouveau fichier non suivi par Git.")
$markdown.Add("- $($labels.Deleted) : fichier supprime.")
$markdown.Add('')
$markdown.Add('Les fichiers generes (`.api/`, `generated/`, `generated.types.ts`, `*.tsbuildinfo`) et le present rapport sont exclus.')
$markdown.Add('')
$markdown.Add("_Genere le $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')._")
$markdown.Add('')

$hasFiles = $false
foreach ($group in $groups.Keys) {
    if ($groups[$group].Count -eq 0) {
        continue
    }

    $hasFiles = $true
    $markdown.Add("## $($labels[$group])")
    $markdown.Add('')

    foreach ($path in $groups[$group]) {
        $absolutePath = [System.IO.Path]::GetFullPath((Join-Path $repoRoot $path))
        $targetUri = New-Object System.Uri($absolutePath)
        $relativeUri = $reportDirectoryUri.MakeRelativeUri($targetUri).ToString()
        $displayPath = ([string]$path).Replace('\', '\\').Replace('`', '\`').Replace('[', '\[').Replace(']', '\]')
        $markdown.Add("### [$displayPath](<$relativeUri>)")
        $markdown.Add('')

        if ($group -eq 'Deleted') {
            $markdown.Add('Fichier supprime; aucun contenu disponible.')
        } else {
            $bytes = [System.IO.File]::ReadAllBytes($absolutePath)
            if ([Array]::IndexOf($bytes, [byte]0) -ge 0) {
                $markdown.Add('Fichier binaire; contenu non integre au rapport.')
            } else {
                $content = [System.IO.File]::ReadAllText($absolutePath)
                $maxBacktickRun = 0
                foreach ($match in [System.Text.RegularExpressions.Regex]::Matches($content, '`+')) {
                    $maxBacktickRun = [Math]::Max($maxBacktickRun, $match.Length)
                }
                $fence = '`' * [Math]::Max(3, $maxBacktickRun + 1)
                $markdown.Add($fence)
                $markdown.Add($content.TrimEnd([char[]]@([char]13, [char]10)))
                $markdown.Add($fence)
            }
        }

        $markdown.Add('')
    }
}

if (-not $hasFiles) {
    $markdown.Add('Aucun changement a afficher (les changements generes sont exclus).')
}

$encoding = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($OutputPath, ($markdown -join "`n") + "`n", $encoding)
Write-Output "Rapport exporte : $OutputPath"
```

## 🟡 NON PREPARE (unstaged)

### [apps/web/src/app/(app)/personal/\[slug\]/teacher/classes/\[classId\]/invitation/page.tsx](<apps/web/src/app/(app)/personal/%5Bslug%5D/teacher/classes/%5BclassId%5D/invitation/page.tsx>)

```
// apps/web/src/app/(app)/personal/[slug]/teacher/classes/[id]/invitation/page.tsx
// Page serveur 
import { TClassesInvitationScreen } from "@/components/users/list/TClassesInvitationScreen";
import { TClassInvitationScreen } from "@/components/users/list/TClassInvitationScreen";
import { getPersonalCoursesAction } from "@/features/personal/services/course";



export default async function CourseInvitationPage({
  params,
}: {
  params: Promise<{ slug: string; classId: string }>
}) {
  const { classId } = await params

  const res = await getPersonalCoursesAction({classId}) 
  const courses = 'error' in res ? [] : res.data
  
  return <TClassesInvitationScreen classId={classId} classLabel="Ma classe" />
}
```

### [apps/web/src/components/users/list/TClassesInvitationScreen.tsx](<apps/web/src/components/users/list/TClassesInvitationScreen.tsx>)

```
'use client'

/**
 * apps/web/src/components/users/list/TClassesInvitationScreen.tsx
 *
 * Écran parent de gestion des participants & invitations d'une classe (Espace Enseignant / Direction).
 *
 * Rôles :
 * 1. Présenter l'état actuel de la classe (étudiants déjà inscrits et confirmés).
 * 2. Déclencher le modal plein écran `TeacherClassInviteModal` pour inviter des étudiants en masse.
 * 3. Suivre les invitations en attente (inbox / email) avec relance ou annulation.
 */

import { useMemo } from 'react'
import { UserPlus, Mail, Clock, RotateCw, XCircle, Users } from 'lucide-react'

import { useClassInvitations } from '@/hooks/data/invitation/use-class-invitations'
import { useAvailableStudents } from '@/hooks/data/student-enrollments/useAvailableStudents'
import { useClassEnrollments } from '@/hooks/data/student-enrollments'
import type { InvitationListItem } from '@/modules/invitation'
import { TeacherClassInviteModal } from '@/components/personal/teacher/class/invitation/TeacherClassInviteModal'
import { ParticipantList } from './ParticipantList'

interface TClassesInvitationScreenProps {
  classId: string
  classLabel: string
}

export function TClassesInvitationScreen({ classId, classLabel }: TClassesInvitationScreenProps) {
  // ── 1. Données d'invitations ─────────────────────────────────────────────────
  const {
    invitations,
    isLoading: isLoadingInvitations,
    resend,
    revoke,
  } = useClassInvitations(classId)

  // ── 2. Étudiants inscrits dans la classe ─────────────────────────────────────
  const {
    enrollments,
    isLoading: isLoadingEnrollments,
  } = useClassEnrollments(classId)

  // ── 3. Étudiants disponibles dans l'école (vivier pour l'invitation) ─────────
  const {
    available,
    isLoading: isLoadingAvailable,
  } = useAvailableStudents(classId)

  // ── Filtres & Dérivations ────────────────────────────────────────────────────
  const participants = useMemo(
    () => enrollments.map((e) => e.student),
    [enrollments],
  )

  const pendingInvitations = useMemo(
    () => invitations.filter((inv) => !inv.usedAt),
    [invitations],
  )

  const isLoading = isLoadingInvitations || isLoadingEnrollments || isLoadingAvailable

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      {/* ── EN-TÊTE DE LA CLASSE ─────────────────────────────────────────────── */}
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Users className="size-4" />
            <span>Promotion &middot; Participants</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{classLabel}</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {participants.length} étudiant{participants.length > 1 ? 's' : ''} inscrit{participants.length > 1 ? 's' : ''}
            {pendingInvitations.length > 0 && ` &middot; ${pendingInvitations.length} invitation(s) en attente`}
          </p>
        </div>

        {/* Bouton d'ouverture du modal plein écran */}
        <TeacherClassInviteModal
          classId={classId}
          classLabel={classLabel}
          students={available}
          trigger={
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              <UserPlus className="size-4" />
              <span>Inviter des étudiants</span>
            </button>
          }
        />
      </header>

      {/* ── SECTION 1 : ÉTUDIANTS ACTUELLEMENT INSCRITS ──────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Étudiants de la classe ({participants.length})
          </h2>
        </div>

        {participants.length > 0 ? (
          <div className="rounded-xl border border-border bg-card p-4">
            <ParticipantList participants={participants} />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
            Aucun étudiant n'est encore inscrit dans cette classe.
          </div>
        )}
      </section>

      {/* ── SECTION 2 : SUIVI DES INVITATIONS EN ATTENTE ─────────────────────── */}
      <section className="space-y-3 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Mail className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">
            Invitations en attente ({pendingInvitations.length})
          </h2>
        </div>

        {pendingInvitations.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Aucune invitation en attente pour cette classe.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {pendingInvitations.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between py-3 text-xs">
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground">{inv.email}</p>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="size-3" />
                    <span>
                      {inv.expiresAt
                        ? `Expire le ${new Date(inv.expiresAt).toLocaleDateString('fr-FR')}`
                        : 'En attente'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => resend.mutate(inv as unknown as InvitationListItem)}
                    disabled={resend.isPending}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    <RotateCw className="size-3" />
                    Relancer
                  </button>

                  <button
                    type="button"
                    onClick={() => revoke.mutate(inv as unknown as InvitationListItem)}
                    disabled={revoke.isPending}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                  >
                    <XCircle className="size-3" />
                    Annuler
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
```

### [docs/cmd/git.md](<docs/cmd/git.md>)

````
# Git — Commandes du projet

## Convention de commits

Format : `type(scope): message`

### Types

| Type | Usage |
|---|---|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `refactor` | Réécriture sans changement de comportement |
| `chore` | Maintenance, config, outillage |
| `docs` | Documentation uniquement |
| `test` | Ajout ou modification de tests |
| `perf` | Optimisation de performance |

### Exemples du projet

```bash
feat(course): extrait service course-teacher + port page détail cours V2
refactor(courses): enseignants via hooks/data + types UI dérivés + garde UUID
fix(auth): corriger pattern authAccess dans actions planning
chore(claude): post-compaction hook + context-essentials
docs(visions): vision produit complète — rôles, parcours, navigation
```

---

## Branches

```bash
# Voir branche courante
git branch

# Créer et basculer
git checkout -b feat/nom-feature

# Basculer
git checkout main
git switch main
```

---

## Staging & commit

```bash
# Voir état
git status

# Stager des fichiers précis (préféré — évite les .env)
git add src/services/planning/actions.ts src/components/planning/

# Stager tout le suivi (jamais pour le premier commit d'un fichier sensible)
git add -u

# Commit
git commit -m "feat(planning): ajouter CoursePlanningDialog"

# Vérifier ce qui va être committé
git diff --staged
```

## Exporter les changements en Markdown

Le script rassemble les changements dans un seul fichier Markdown. Les fichiers
sont regroupés par statut Git, leur chemin est un lien cliquable et leur contenu
complet après modification est affiché (pas un diff) :

- **PREPARE** : changements ajoutés à l'index Git, prêts à être commités.
- **NON PREPARE** : changements locaux pas encore ajoutés à l'index.
- **MIXTE** : changements à la fois indexés et non indexés.
- **NOUVEAU FICHIER** : fichier non suivi par Git.
- **SUPPRIME** : fichier supprimé, dont le contenu n'est plus disponible.

Les fichiers générés comme `.api/`, `generated/`, `generated.types.ts` et
`*.tsbuildinfo` sont exclus du rapport.

```powershell
# Depuis la racine du dépôt
powershell -ExecutionPolicy Bypass -File scripts/export-pending-changes.ps1
```

Par défaut, le rapport est écrit dans `git-changes.md` à la racine du dépôt.
Pour choisir un autre chemin :

```powershell
powershell -ExecutionPolicy Bypass -File scripts/export-pending-changes.ps1 -OutputPath docs/rapport-changements.md
```

Le rapport montre le contenu complet des fichiers modifiés : vérifie-le avant
de le partager.

---

## Synchronisation

```bash
# Récupérer sans merger
git fetch origin

# Pull avec rebase (évite les merge commits)
git pull --rebase origin main

# Push
git push origin feat/nom-feature

# Push premier envoi
git push -u origin feat/nom-feature
```

---

## Inspection

```bash
# Historique condensé
git log --oneline -10

# Historique avec graph
git log --oneline --graph --decorate -15

# Diff non stagé
git diff

# Diff stagé
git diff --staged

# Voir un commit
git show decb56e
```

---

## Stash

```bash
# Mettre de côté le travail en cours
git stash

# Lister les stashs
git stash list

# Récupérer le dernier stash
git stash pop

# Récupérer un stash précis
git stash pop stash@{1}
```

---

## Corrections

```bash
# Modifier le dernier message de commit (avant push)
git commit --amend -m "nouveau message"

# Annuler le dernier commit en gardant les modifications
git reset HEAD~1

# Voir qui a modifié une ligne
git blame src/services/planning/actions.ts
```

---

## Monorepo — commandes depuis la racine

```bash
# Status global
git status

# Diff d'un package
git diff packages/planning/

# Diff d'une app
git diff apps/web/src/services/
```

---

## Règles du projet

- Ne jamais committer `.env` ou `.env.local`
- Préférer `git add <fichiers>` plutôt que `git add .`
- Un commit = une unité logique de travail
- Le scope du commit correspond au service ou composant modifié : `feat(session)`, `fix(schedule)`, `refactor(planning)`
- Ne pas utiliser `--force` sur `main` / `--no-verify`
````

## 🟢 NOUVEAU FICHIER (untracked)

### [apps/web/src/components/personal/teacher/class/invitation/TeacherClassInviteModal.tsx](<apps/web/src/components/personal/teacher/class/invitation/TeacherClassInviteModal.tsx>)

```
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
```

### [apps/web/src/components/users/list/data.md](<apps/web/src/components/users/list/data.md>)

```
//data :

const invitations: {
    id: string;
    email: string;
    createdAt: Date;
    expiresAt: Date | null;
    usedAt: Date | null;
    details: DatabaseInvitationDetails | null;
    role: string | null;
}[]

const enrollments: {
    classId: string;
    id: string;
    studentId: string;
    createdAt: Date;
    endedAt: Date | null;
    student: {
        id: string;
        user: {
            avatar_url: string | null;
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
        };
    };
    studentGroups: {
        id: string;
        group: {
            name: string;
            id: string;
        };
    }[];
}[]

'available' is declared but its value is never read.ts(6133)
const available: {
    id: string;
    user: {
        avatar_url: string | null;
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
    };
}[]


'acceptedInvitations' is declared but its value is never read.ts(6133)
const acceptedInvitations: {
    id: string;
    email: string;
    createdAt: Date;
    expiresAt: Date | null;
    usedAt: Date | null;
    details: DatabaseInvitationDetails | null;
    role: string | null;
}[]

"use client";

import { useMemo } from "react";
import { useStudents } from "../student/useStudents";
import { useClassEnrollments } from "./useClassEnrollments";
import { excludeByIds } from "@/lib/filter";

/** Étudiants de l'org non inscrits activement dans la classe (liste complète, sans recherche). */
export function useAvailableStudents(classId: string) {
  const students = useStudents();
  const enrollments = useClassEnrollments(classId);

  const available = useMemo(
    () => excludeByIds(students.students, enrollments.enrollments.map((e) => e.studentId)),
    [students.students, enrollments.enrollments],
  );

  return {
    available,
    isLoading: students.isLoading || enrollments.isLoading,
    error: students.error ?? enrollments.error ?? null,
  };
}

//apps\web\src\hooks\data\student-enrollments\useClassEnrollments.ts
"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { getStudentsEnrollmentsAction } from "@/services/student-enrollment";
import { CACHE_KEYS, QUERY_PRESETS } from "@/config/client_cache";

/** Inscriptions ACTIVES d'une classe (endedAt = null, défaut côté serveur). */
export function useClassEnrollments(classId: string) {
  const { data: response, isLoading } = useQuery({
    queryKey: CACHE_KEYS.STUDENT_ENROLLMENTS.BY_CLASS(classId),
    queryFn: () => getStudentsEnrollmentsAction({ classId }),
    enabled: !!classId,
    ...QUERY_PRESETS.LIVE,
  });

  const enrollments = useMemo(() => response?.data ?? [], [response]);

  return { enrollments, isLoading, error: response?.error };
}

// src/hooks/data/invitation/use-class-invitations.ts
'use client'
// Invitations d'une classe (écran Direction/classe) + mutations inviteStudent / inviteStudentsBulk.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getClassInvitationsAction,
  inviteStudent,
  inviteStudentsAction,
} from '@/modules/invitation'
import type { InviteStudentsBulkInput } from '@/modules/invitation/student'
import { toast } from 'sonner'
import { CACHE_KEYS } from '@/cache/client/key'
import { useInvitationMutations, invalidateInvitationQueries, copyLinkOrToast } from './useInvitationMutations'

type InviteStudentVars = Parameters<typeof inviteStudent>[0]
type InviteStudentsBulkVars = Omit<InviteStudentsBulkInput, 'classId'>

type UseClassInvitationsOptions = {
  /** Livraison du lien créé. Défaut : copie dans le presse-papiers + toast. */
  deliverLink?: (link: string, message?: string) => void | Promise<void>
  /** Toast d'erreur sur échec. Défaut : true. Mettre false si l'appelant affiche l'erreur lui-même. */
  toastError?: boolean
}

export function useClassInvitations(classId: string, opts: UseClassInvitationsOptions = {}) {
  const { toastError = true } = opts
  const deliverLink =
    opts.deliverLink ??
    ((link: string, message?: string) => copyLinkOrToast(link, message ?? "Lien d'invitation copié"))

  const qc = useQueryClient()
  const classKey = CACHE_KEYS.INVITATIONS.BY_CLASS(classId)

  // extraInvalidateKeys : un resend/revoke fait ici invalide aussi la portée classe,
  // en plus de ALL/STATS déjà gérés par le hook partagé.
  const { resend, revoke } = useInvitationMutations({ extraInvalidateKeys: [classKey] })

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: classKey,
    queryFn: async () => {
      const r = await getClassInvitationsAction({ classId })
      if ('error' in r) throw new Error(r.error)
      return r.data
    },
    enabled: !!classId,
  })

  const inviteStudentMut = useMutation({
    mutationFn: (vars: InviteStudentVars) => inviteStudent(vars),
    onSuccess: async (r) => {
      if (!r.success) {
        if (toastError) toast.error(r.error ?? "Envoi de l'invitation impossible.")
        return
      }
      invalidateInvitationQueries(qc, [classKey])
      if (r.link) await deliverLink(r.link, r.message)
      else toast.success(r.message ?? 'Invitation envoyée')
    },
    onError: () => {
      if (toastError) toast.error("Envoi de l'invitation impossible.")
    },
  })

  const inviteStudentsBulkMut = useMutation({
    mutationFn: (vars: InviteStudentsBulkVars) =>
      inviteStudentsAction({ ...vars, classId }),
    onSuccess: async (r) => {
      if ('error' in r) {
        if (toastError) toast.error(r.error)
        return
      }
      invalidateInvitationQueries(qc, [classKey])
      if (r.data.status === 'ok') {
        toast.success(`${r.data.succeeded.length} invitation(s) envoyée(s)`)
      } else if (r.data.status === 'partial') {
        toast.warning(
          `${r.data.succeeded.length} invitation(s) envoyée(s), ${r.data.failed.length} échouée(s)`
        )
      } else if (toastError) {
        toast.error("Toutes les invitations du lot ont échoué")
      }
    },
    onError: (err) => {
      if (toastError) toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi du lot")
    },
  })

  return {
    invitations,
    isLoading,
    inviteStudent: inviteStudentMut,
    inviteStudentsBulk: inviteStudentsBulkMut,
    resend,
    revoke,
  }
}
```

### [apps/web/src/components/users/list/TClassesInvitationScreen.md](<apps/web/src/components/users/list/TClassesInvitationScreen.md>)

```
'use client'

import { useMemo } from 'react'

// ── 1. Hook d'invitations de la classe ──────────────────────────────────────────
// - invitations        : liste des invitations émises pour cette classe (avec email, usedAt, expiresAt, etc.).
// - isLoadingInvitations: statut de chargement initial.
// - inviteStudentsBulk : mutation d'envoi en masse consommée par le modal (inviteStudentsBulk.mutateAsync).
// - resend             : relance d'une invitation en attente (resend.mutate(invitation)).
// - revoke             : annulation d'une invitation en attente (revoke.mutate(invitation)).
import { useClassInvitations } from '@/hooks/data/invitation/use-class-invitations'

// ── 2. Hook des étudiants disponibles ──────────────────────────────────────────
// - available          : liste des étudiants de l'établissement non encore inscrits dans cette classe.
//   Ce vivier alimente directement la sélection de l'Étape 1 du futur modal.
import { useAvailableStudents } from '@/hooks/data/student-enrollments/useAvailableStudents'

// ── 3. Hook des inscriptions confirmées ─────────────────────────────────────────
// - enrollments        : inscriptions actives (StudentEnrollment) de la classe.
import { useClassEnrollments } from '@/hooks/data/student-enrollments'

interface TClassesInvitationScreenProps {
  classId: string
  classLabel: string
}

export function TClassesInvitationScreen({ classId, classLabel }: TClassesInvitationScreenProps) {
  // ── HOOK 1 : Invitations & actions associées ─────────────────────────────────
  const {
    invitations,
    isLoading: isLoadingInvitations,
    inviteStudentsBulk,
    resend,
    revoke,
  } = useClassInvitations(classId)

  // ── HOOK 2 : Étudiants inscrits dans la classe ───────────────────────────────
  const {
    enrollments,
    isLoading: isLoadingEnrollments,
  } = useClassEnrollments(classId)

  // ── HOOK 3 : Étudiants disponibles dans l'école (hors classe) ────────────────
  const {
    available,
    isLoading: isLoadingAvailable,
  } = useAvailableStudents(classId)

  // ── FILTRES & ÉTATS DÉRIVÉS ───────────────────────────────────────────────────

  // Liste des étudiants actuellement inscrits (format Student pour l'affichage)
  const participants = useMemo(
    () => enrollments.map((e) => e.student),
    [enrollments],
  )

  // Invitations en cours : ni utilisées, ni révoquées
  const pendingInvitations = useMemo(
    () => invitations.filter((inv) => !inv.usedAt),
    [invitations],
  )

  // Invitations acceptées (historique d'intégration)
  const acceptedInvitations = useMemo(
    () => invitations.filter((inv) => Boolean(inv.usedAt)),
    [invitations],
  )

  // État global de chargement
  const isLoading = isLoadingInvitations || isLoadingEnrollments || isLoadingAvailable

  return (
    <div className="space-y-8 p-6">
      {/* ── ZONE 1 : En-tête de classe (classLabel, compteurs effectifs & invitations) */}
      <header>
        {/* Titre et métriques dérivées : participants.length, pendingInvitations.length */}
      </header>

      {/* ── ZONE 2 : Membres actifs & Trigger du modal plein écran */}
      <section>
        {/*
          Emplacement du futur TeacherClassInviteModal :
          Props qui lui seront passées :
            - classId={classId}
            - classLabel={classLabel}
            - availableStudents={available}
            - trigger={<button>...</button>}
          Le modal exploitera directement la mutation `inviteStudentsBulk`
        */}

        {/* Affichage des participants existants (participants) */}
      </section>

      {/* ── ZONE 3 : Suivi des invitations en attente */}
      <section>
        {/*
          Affichage des invitations en cours (pendingInvitations) :
          - email, expiresAt
          - actions unitaires : resend.mutate(inv), revoke.mutate(inv)
        */}
      </section>

      {/* ── ZONE 4 : Inscription directe alternative (sans invitation) */}
      <section>
        {/* Inscription directe d'étudiants de l'école (ex: EnrollStudentsModal) */}
      </section>
    </div>
  )
}
```

## 🔴 SUPPRIME

### [tools/export-pending-changes.ps1](<tools/export-pending-changes.ps1>)

Fichier supprime; aucun contenu disponible.

