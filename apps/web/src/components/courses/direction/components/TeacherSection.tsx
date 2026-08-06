'use client'

import { useState, useRef, useEffect } from 'react'
import { CheckIcon, PlusIcon, ChevronDownIcon } from 'lucide-react'

export interface Teacher {
  id: string
  firstName: string | null
  lastName: string | null
  avatar_url: string | null
}

export interface CourseTeacherRelation {
  id: string
  teacherId: string | null
  isMain: boolean
  hours: number | null
}

interface EnrichedCourseTeacher extends CourseTeacherRelation {
  teacher: Teacher
}

interface EditForm {
  principalId: string
  assistantIds: string[]
}

export interface TeacherSectionProps {
  courseTeachers: CourseTeacherRelation[]
  allTeachers: Teacher[]
  onSave?: (form: EditForm) => Promise<void> | void
}

function getInitials(firstName: string | null, lastName: string | null): string {
  return [firstName, lastName]
    .filter(Boolean)
    .map((n) => n![0])
    .join('')
    .toUpperCase()
}

function getFullName(firstName: string | null, lastName: string | null): string {
  return [firstName, lastName].filter(Boolean).join(' ') || '—'
}

function TeacherAvatar({
  firstName,
  lastName,
  avatar_url,
  size = 28,
}: Teacher & { size?: number }) {
  return (
    <div
      className="rounded-full bg-foreground/10 border border-dashed border-foreground/30 overflow-hidden shrink-0 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar_url} alt="" className="size-full object-cover" />
      ) : (
        <span className="text-[9px] font-medium text-muted-foreground/60">
          {getInitials(firstName, lastName)}
        </span>
      )}
    </div>
  )
}

interface DotedSelectOption {
  id: string
  label: string
  avatar?: string | null
}

function DotedSelect({
  options,
  selectedIds,
  onToggle,
  open,
  onOpenChange,
  placeholder = 'Sélectionner',
  multiple = false,
  icon = 'chevron',
}: {
  options: DotedSelectOption[]
  selectedIds: string[]
  onToggle: (id: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  placeholder?: string
  multiple?: boolean
  icon?: 'chevron' | 'plus'
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOpenChange(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onOpenChange])

  const selectedLabels = options.filter((o) => selectedIds.includes(o.id)).map((o) => o.label)
  const displayLabel =
    selectedLabels.length === 0
      ? placeholder
      : multiple && selectedLabels.length > 1
        ? `${selectedLabels.length} sélectionnés`
        : selectedLabels[0]

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className={`w-full border border-dashed rounded-sm px-3 py-2 text-[12px] flex items-center justify-between gap-2 transition-colors ${
          open
            ? 'border-foreground/50 text-foreground/90'
            : 'border-foreground/30 text-foreground/80 hover:border-foreground/60'
        }`}
      >
        <span className="flex items-center gap-2 truncate min-w-0">
          {icon === 'plus' ? (
            <PlusIcon className="size-3 shrink-0 opacity-70" />
          ) : (
            <ChevronDownIcon className="size-3 shrink-0 opacity-70" />
          )}
          <span className="truncate">{displayLabel}</span>
        </span>
        <ChevronDownIcon
          className={`size-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-[100] bg-background border border-dashed border-foreground/30 rounded-sm overflow-hidden max-h-44 overflow-y-auto shadow-lg">
          {options.length === 0 && (
            <p className="px-3 py-2 text-[12px] text-muted-foreground/65">
              Aucun enseignant disponible
            </p>
          )}
          {options.map((opt) => {
            const selected = selectedIds.includes(opt.id)
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onToggle(opt.id)
                  if (!multiple) onOpenChange(false)
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-left transition-colors hover:bg-foreground/5 ${selected ? 'bg-foreground/5' : ''}`}
              >
                {opt.avatar ? (
                  <div className="size-5 rounded-full overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={opt.avatar} alt="" className="size-full object-cover" />
                  </div>
                ) : (
                  <div className="size-5 rounded-full bg-foreground/10 border border-dashed border-foreground/30 shrink-0 flex items-center justify-center">
                    <span className="text-[8px] font-medium text-muted-foreground/75">
                      {opt.label
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </span>
                  </div>
                )}
                <span className="flex-1 text-foreground/85">{opt.label}</span>
                {selected && <CheckIcon className="size-3 shrink-0 text-foreground/80" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function TeacherSection({ courseTeachers, allTeachers, onSave }: TeacherSectionProps) {
  const enrichedTeachers: EnrichedCourseTeacher[] = courseTeachers
    .map((ct) => ({
      ...ct,
      teacher: allTeachers.find((t) => t.id === ct.teacherId)!,
    }))
    .filter((ct) => ct.teacher)

  const main = enrichedTeachers.find((t) => t.isMain)
  const assistants = enrichedTeachers.filter((t) => !t.isMain)

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState<EditForm>({
    principalId: main?.teacherId ?? '',
    assistantIds: assistants.map((t) => t.teacherId ?? '').filter(Boolean),
  })
  const [principalOpen, setPrincipalOpen] = useState(false)
  const [asstOpen, setAsstOpen] = useState(false)

  const principalOptions: DotedSelectOption[] = allTeachers
    .filter((t) => !form.assistantIds.includes(t.id))
    .map((t) => ({ id: t.id, label: getFullName(t.firstName, t.lastName), avatar: t.avatar_url }))

  const assistantOptions: DotedSelectOption[] = allTeachers
    .filter((t) => t.id !== form.principalId)
    .map((t) => ({ id: t.id, label: getFullName(t.firstName, t.lastName), avatar: t.avatar_url }))

  const sideUser = allTeachers.find((t) => t.id === form.principalId)

  function handleCancel() {
    setForm({
      principalId: main?.teacherId ?? '',
      assistantIds: assistants.map((t) => t.teacherId ?? '').filter(Boolean),
    })
    setPrincipalOpen(false)
    setAsstOpen(false)
    setIsEditing(false)
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      await onSave?.(form)
    } finally {
      setIsSaving(false)
      setPrincipalOpen(false)
      setAsstOpen(false)
      setIsEditing(false)
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-foreground/30 bg-card">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-dashed border-foreground/30">
        <p className="text-[9px] font-bold uppercase tracking-[.22em] text-muted-foreground/75">
          Enseignants
        </p>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="text-[10px] font-medium text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors disabled:opacity-40"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="text-[10px] font-medium px-2.5 py-1 rounded border border-dashed border-foreground/30 text-foreground/90 hover:border-foreground/50 hover:text-foreground transition-colors disabled:opacity-40"
              >
                {isSaving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-[10px] font-medium px-2.5 py-1 rounded border border-dashed border-foreground/30 text-muted-foreground/70 hover:border-foreground/50 hover:text-muted-foreground/90 transition-colors"
            >
              Modifier
            </button>
          )}
        </div>
      </div>

      <div className="px-5 py-3.5 border-b border-dashed border-foreground/30">
        <p className="text-[9px] font-bold uppercase tracking-[.22em] text-muted-foreground/75 mb-2.5">
          Principal
        </p>
        {isEditing ? (
          <div className="flex items-center gap-3">
            <div className="size-7 rounded-full bg-foreground/5 border border-dashed border-foreground/15 overflow-hidden shrink-0 flex items-center justify-center">
              {sideUser?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sideUser.avatar_url} alt="" className="size-full object-cover" />
              ) : (
                <span className="text-[9px] font-medium text-muted-foreground/60">
                  {getInitials(sideUser?.firstName ?? null, sideUser?.lastName ?? null)}
                </span>
              )}
            </div>
            <DotedSelect
              options={principalOptions}
              selectedIds={form.principalId ? [form.principalId] : []}
              onToggle={(id) => setForm((prev) => ({ ...prev, principalId: id }))}
              open={principalOpen}
              onOpenChange={(o) => {
                setPrincipalOpen(o)
                if (o) setAsstOpen(false)
              }}
              placeholder="Choisir un enseignant"
            />
          </div>
        ) : main?.teacher ? (
          <div className="flex items-center gap-2.5">
            <TeacherAvatar {...main.teacher} />
            <span className="text-[13px] font-medium text-foreground/85 flex-1">
              {getFullName(main.teacher.firstName, main.teacher.lastName)}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-[.15em] px-1.5 py-0.5 border border-dashed border-foreground/30 text-muted-foreground/70 rounded-sm">
              principal
            </span>
          </div>
        ) : (
          <p className="text-[12px] text-muted-foreground/35">Non assigné</p>
        )}
      </div>

      <div className="px-5 py-3.5">
        <p className="text-[9px] font-bold uppercase tracking-[.22em] text-muted-foreground/75 mb-2.5">
          Assistants{' '}
          <span className="font-normal opacity-80">
            ({isEditing ? form.assistantIds.length : assistants.length})
          </span>
        </p>
        {isEditing ? (
          <div className="space-y-2">
            {assistants.map((a) => (
              <div key={a.id} className="flex items-center gap-2.5">
                <TeacherAvatar {...a.teacher} />
                <span className="text-[13px] font-medium text-foreground/85">
                  {getFullName(a.teacher.firstName, a.teacher.lastName)}
                </span>
              </div>
            ))}
            <DotedSelect
              options={assistantOptions}
              selectedIds={form.assistantIds}
              onToggle={(id) =>
                setForm((prev) => ({
                  ...prev,
                  assistantIds: prev.assistantIds.includes(id)
                    ? prev.assistantIds.filter((x) => x !== id)
                    : [...prev.assistantIds, id],
                }))
              }
              open={asstOpen}
              onOpenChange={(o) => {
                setAsstOpen(o)
                if (o) setPrincipalOpen(false)
              }}
              placeholder="Ajouter un assistant"
              multiple
              icon="plus"
            />
          </div>
        ) : assistants.length === 0 ? (
          <p className="text-[12px] text-muted-foreground/35">Aucun assistant assigné</p>
        ) : (
          <div className="space-y-2">
            {assistants.map((a) => (
              <div key={a.id} className="flex items-center gap-2.5">
                <TeacherAvatar {...a.teacher} />
                <span className="text-[13px] font-medium text-foreground/85">
                  {getFullName(a.teacher.firstName, a.teacher.lastName)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
