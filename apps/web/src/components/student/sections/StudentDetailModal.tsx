'use client'

import Link from 'next/link'
import type { ClassEnrollmentRow } from '@/services/student'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AttendanceBar, AttendanceTableBar } from '@/components/attendance/AttendanceBar'
import {
  initials,
  sexLabel,
  computeAge,
} from '@/components/direction/students/ui/studentDirectory.helpers'
import { BackgroundPattern } from '@/components/design/BackgroundPattern'

function formatDate(date: Date | string | null | undefined) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="text-[13px] text-foreground">{value}</span>
    </div>
  )
}

interface StudentDetailModalProps {
  row: ClassEnrollmentRow | null
  attendanceRate: number
  href: string
  onOpenChange: (open: boolean) => void
}

export function StudentDetailModal({
  row,
  attendanceRate,
  href,
  onOpenChange,
}: StudentDetailModalProps) {
  const u = row?.student.user
  const displayName = u
    ? [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email
    : ''
  const age = computeAge(u?.dateOfBirth)
  const groups = row?.studentGroups.map((sg) => sg.group) ?? []
  const isActive = u?.status === 'ACTIVE'

  return (
    <Dialog open={row !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {row && u && (
          <>
            <BackgroundPattern className="z-0" opacity={0.12} />
            <DialogHeader>
              <div className="flex items-center gap-3">
                <Avatar className="size-12">
                  {u.avatar_url && <AvatarImage src={u.avatar_url} alt={displayName} />}
                  <AvatarFallback className="bg-foreground/15 text-[13px] font-medium text-foreground/70">
                    {initials(u)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 text-left">
                  <DialogTitle className="truncate text-[15px]">{displayName}</DialogTitle>
                  <DialogDescription className="truncate font-mono text-[11px]">
                    {u.email}
                  </DialogDescription>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-foreground/5 text-muted-foreground'
                  }`}
                >
                  {isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </DialogHeader>

            <div className="space-y-1">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Assiduité
              </span>
              <AttendanceTableBar className="border-0" attendanceRate={attendanceRate} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Genre" value={sexLabel(u.sex)} />
              <Field label="Téléphone" value={u.phone || '—'} />
              <Field
                label="Naissance"
                value={
                  u.dateOfBirth
                    ? `${formatDate(u.dateOfBirth)}${age !== null ? ` · ${age} ans` : ''}`
                    : '—'
                }
              />
              <Field label="Inscrit le" value={formatDate(row.createdAt)} />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Groupes ({groups.length})
              </span>
              {groups.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {groups.map((g) => (
                    <span
                      key={g.id}
                      className="rounded-md border border-dashed border-foreground/30 px-2 py-0.5 text-[11px] text-foreground/80"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-muted-foreground/70">Aucun groupe.</p>
              )}
            </div>

            <Link
              href={href}
              className="mt-1 inline-flex items-center justify-center gap-1 rounded-md border border-foreground/20 bg-card px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-foreground/[0.04]"
            >
              Voir la fiche complète
              <span aria-hidden>→</span>
            </Link>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
