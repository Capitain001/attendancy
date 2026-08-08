'use client'
import { useState, useMemo } from 'react'
import { BookOpen, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, GraduationCap, Library } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useUETemplates, useUETemplateImports, useUEReferentials } from '@/hooks/data/ue-template/useUETemplates'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'
import type { GetReferentialsDto, GetUETemplatesDto } from '@/services/ue-template'
import type { GetProgramsDto } from '@/services/program'

type ReferentialItem = GetReferentialsDto[number]
type TemplateItem    = GetUETemplatesDto[number]
type ProgramItem     = GetProgramsDto[number]

// ─── Type dérivé : résumé d'une filière ──────────────────────────────────────

type MentionSummary = {
  domain:        string
  degree:        string
  mention:       string
  speciality:    string | null
  templateIds:   string[]
  semesterCount: number
  ueCount:       number
  ecCount:       number
}

function buildMentions(templates: TemplateItem[]): MentionSummary[] {
  const map = new Map<string, MentionSummary>()
  for (const t of templates) {
    const key = `${t.domain}||${t.mention}||${t.speciality ?? ''}`
    const m = map.get(key)
    if (m) {
      m.templateIds.push(t.id)
      m.ecCount += t._count.elements
      m.ueCount++
      if (t.semester > m.semesterCount) m.semesterCount = t.semester
    } else {
      map.set(key, {
        domain:        t.domain,
        degree:        t.degree,
        mention:       t.mention,
        speciality:    t.speciality ?? null,
        templateIds:   [t.id],
        semesterCount: t.semester,
        ueCount:       1,
        ecCount:       t._count.elements,
      })
    }
  }
  return [...map.values()].sort((a, b) =>
    a.domain.localeCompare(b.domain) || a.mention.localeCompare(b.mention)
  )
}

// ─── Niveau 1 : carte de template (NationalReferential) ──────────────────────

function ReferentialCard({
  referential,
  onSelect,
}: {
  referential: ReferentialItem
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        card.base,
        'w-full text-left flex items-center gap-4 py-4 hover:border-primary/40 transition-colors group',
      )}
    >
      <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        <Library className="size-5 text-primary" strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text-primary">{referential.name}</p>
        <p className={typography.small}>
          {referential.issuer} · Version {referential.version}
        </p>
      </div>
      <ChevronRight className="size-4 text-text-subtle group-hover:text-primary transition-colors shrink-0" />
    </button>
  )
}

// ─── Dialog : activer une filière ────────────────────────────────────────────

function ActivateMentionDialog({
  mention,
  referentialId,
  programs,
  open,
  onOpenChange,
}: {
  mention: MentionSummary
  referentialId: string
  programs: ProgramItem[]
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { applyMention } = useUETemplateImports()
  const [programId, setProgramId] = useState('')

  const handleActivate = () => {
    if (!programId) return
    applyMention.mutate(
      { referentialId, mention: mention.mention, speciality: mention.speciality, programId },
      { onSuccess: (r) => { if (!('error' in r)) onOpenChange(false) } },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Activer cette filière</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="rounded-lg bg-muted/50 p-3 flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <GraduationCap className="size-4 text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium">{mention.mention}</p>
                {mention.speciality && (
                  <p className={typography.small}>{mention.speciality}</p>
                )}
              </div>
            </div>
            <div className="flex gap-3 text-xs text-text-subtle">
              <span>{mention.degree}</span>
              <span>·</span>
              <span>{mention.semesterCount} semestres</span>
              <span>·</span>
              <span>{mention.ueCount} UE</span>
              {mention.ecCount > 0 && <><span>·</span><span>{mention.ecCount} EC</span></>}
            </div>
            <p className={cn(typography.small, 'text-text-subtle')}>
              Toutes les UE de cette filière seront créées dans le programme cible,
              organisées par semestre selon le référentiel.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="program-select">Programme cible</Label>
            <Select value={programId} onValueChange={setProgramId}>
              <SelectTrigger id="program-select">
                <SelectValue placeholder="Sélectionner un programme…" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button disabled={!programId || applyMention.isPending} onClick={handleActivate}>
              {applyMention.isPending ? 'Activation…' : 'Activer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Carte de filière ─────────────────────────────────────────────────────────

function MentionCard({
  mention,
  referentialId,
  activated,
  programs,
  mentionTemplates,
}: {
  mention: MentionSummary
  referentialId: string
  activated: boolean
  programs: ProgramItem[]
  mentionTemplates: TemplateItem[]
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [expanded,   setExpanded]   = useState(false)

  // UEs de cette filière groupées par semestre
  const bySemester = useMemo(() => {
    const map = new Map<number, TemplateItem[]>()
    for (const t of mentionTemplates) {
      const list = map.get(t.semester) ?? []
      list.push(t)
      map.set(t.semester, list)
    }
    return [...map.entries()].sort(([a], [b]) => a - b)
  }, [mentionTemplates])

  return (
    <>
      <div className={cn(card.base, 'flex flex-col py-3 gap-0')}>
        {/* ── Ligne principale ── */}
        <div className="flex items-center gap-3 px-1">
          <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <GraduationCap className="size-4 text-primary" strokeWidth={1.5} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text-primary truncate">{mention.mention}</p>
            {mention.speciality && (
              <p className={cn(typography.small, 'truncate')}>{mention.speciality}</p>
            )}
            <div className="mt-0.5 flex gap-2 text-[11px] text-text-subtle">
              <span>{mention.degree}</span>
              <span>·</span>
              <span>{mention.semesterCount} sem.</span>
              <span>·</span>
              <span>{mention.ueCount} UE</span>
              {mention.ecCount > 0 && <><span>·</span><span>{mention.ecCount} EC</span></>}
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {/* Bouton expand */}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs text-text-subtle hover:text-text-primary transition-colors"
            >
              {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              <span>{expanded ? 'Masquer' : 'Voir UEs'}</span>
            </button>

            {activated ? (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                <Check className="size-3.5" />
                Activée
              </span>
            ) : (
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setDialogOpen(true)}>
                Activer
              </Button>
            )}
          </div>
        </div>

        {/* ── Contenu expandable : UEs par semestre ── */}
        {expanded && (
          <div className="mt-3 border-t border-border/60 pt-3 flex flex-col gap-4 px-1">
            {bySemester.map(([sem, ues]) => (
              <div key={sem} className="flex flex-col gap-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-subtle">
                  Semestre {sem}
                </p>
                {ues.map((ue) => (
                  <div key={ue.id} className="flex items-start justify-between gap-2 rounded-md bg-muted/40 px-3 py-2">
                    <div className="min-w-0">
                      {ue.code && (
                        <span className="mr-1.5 inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-primary">
                          {ue.code}
                        </span>
                      )}
                      <span className="text-xs text-text-primary">{ue.name}</span>
                      {ue._count.elements > 0 && (
                        <span className="ml-1.5 text-[10px] text-text-subtle">
                          · {ue._count.elements} EC
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-[11px] text-text-subtle whitespace-nowrap">
                      {Number(ue.credits)} cr.
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {dialogOpen && (
        <ActivateMentionDialog
          mention={mention}
          referentialId={referentialId}
          programs={programs}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </>
  )
}

// ─── Niveau 2 : filières d'un template ───────────────────────────────────────

function ReferentialDetail({
  referential,
  programs,
  onBack,
}: {
  referential: ReferentialItem
  programs: ProgramItem[]
  onBack: () => void
}) {
  const { templates, isLoading } = useUETemplates({ referentialId: referential.id })
  const { importedTemplateIds }  = useUETemplateImports()

  const mentions  = useMemo(() => buildMentions(templates), [templates])
  const byDomain  = useMemo(() => {
    const map = new Map<string, MentionSummary[]>()
    for (const m of mentions) {
      const list = map.get(m.domain) ?? []
      list.push(m)
      map.set(m.domain, list)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [mentions])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-1 px-2 h-8" onClick={onBack}>
          <ChevronLeft className="size-4" />
          Retour
        </Button>
        <div className="h-4 w-px bg-border" />
        <div>
          <span className="text-sm font-semibold text-text-primary">{referential.name}</span>
          <span className={cn(typography.small, 'ml-2')}>{referential.issuer} · {referential.version}</span>
        </div>
      </div>

      {isLoading ? (
        <p className={typography.small}>Chargement des filières…</p>
      ) : byDomain.length === 0 ? (
        <div className="py-10 text-center">
          <BookOpen className="mx-auto mb-2 size-8 text-text-subtle" strokeWidth={1} />
          <p className={typography.body}>Aucune filière dans ce template.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {byDomain.map(([domain, domainMentions]) => (
            <div key={domain} className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-subtle px-1">
                {domain}
              </h3>
              <div className="flex flex-col gap-2">
                {domainMentions.map((m) => (
                  <MentionCard
                    key={`${m.mention}||${m.speciality ?? ''}`}
                    mention={m}
                    referentialId={referential.id}
                    activated={m.templateIds.some((id) => importedTemplateIds.has(id))}
                    programs={programs}
                    mentionTemplates={templates.filter((t) =>
                      t.mention === m.mention && (t.speciality ?? null) === m.speciality
                    )}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function UETemplateList({
  initialReferentials,
  programs,
}: {
  initialReferentials: ReferentialItem[]
  programs: ProgramItem[]
}) {
  const { referentials } = useUEReferentials()
  const refs = referentials.length > 0 ? referentials : initialReferentials

  const [selected, setSelected] = useState<ReferentialItem | null>(null)

  if (selected) {
    return (
      <ReferentialDetail
        referential={selected}
        programs={programs}
        onBack={() => setSelected(null)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {refs.length === 0 ? (
        <div className="py-10 text-center">
          <Library className="mx-auto mb-2 size-8 text-text-subtle" strokeWidth={1} />
          <p className={typography.body}>Aucun référentiel disponible.</p>
          <p className={typography.small}>Les curricula nationaux apparaîtront ici.</p>
        </div>
      ) : (
        refs.map((r) => (
          <ReferentialCard key={r.id} referential={r} onSelect={() => setSelected(r)} />
        ))
      )}
    </div>
  )
}
