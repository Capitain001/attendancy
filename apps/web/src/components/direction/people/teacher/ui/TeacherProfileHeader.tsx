import UserIcon from '@/components/users/UserIcon'
import { card } from '@/styles'
import { cn } from '@/lib/utils'
import { Mail, Phone, Building2 } from 'lucide-react'
import type { GetTeacherNotNull } from '@/services/teacher'

export function TeacherProfileHeader({ teacher }: { teacher: GetTeacherNotNull }) {
  const name =
    [teacher.user.firstName, teacher.user.lastName].filter(Boolean).join(' ') || teacher.user.email
  const isActive = teacher.user.status === 'ACTIVE'
  const coursesCount = String(teacher._count.courses).padStart(2, '0')

  return (
    <div className={cn(card.base, 'p-4 sm:p-6 font-sans tracking-tight text-foreground bg-background border border-border')}>
      {/* En-tête style éditorial */}
      <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-border/60 text-[10px] sm:text-[11px] font-medium tracking-widest uppercase text-muted-foreground">
        <span>TEACHER</span>
        {/* Badge statut minimaliste */}
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'size-2 rounded-full',
              isActive ? 'bg-blue-600' : 'bg-muted-foreground'
            )}
          />
          <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase">
            {isActive ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>
      </div>

      {/* Section principale : Photo + Grand chiffre de cours */}
      <div className="flex items-start justify-between gap-4 pt-4 sm:pt-6">
        <div className="relative">
          <UserIcon
            showOnline={false}
            name={name}
            avatarUrl={teacher.user.avatar_url}
            className={cn(
              'size-20 sm:size-32 rounded-none [&_*]:rounded-none aspect-square border border-border',
              !isActive && 'grayscale opacity-80'
            )}
          />
        </div>

        <div className="flex flex-col items-end text-right">
          <span className="text-5xl sm:text-7xl font-light tracking-tighter leading-none">
            {coursesCount}
          </span>
          <span className="text-[9px] sm:text-xs tracking-widest uppercase text-muted-foreground mt-1">
            Cours
          </span>
        </div>
      </div>

      {/* Identité */}
      <div className="mt-4 sm:mt-5">
        <h1 className="text-2xl sm:text-4xl font-normal tracking-tight break-words">{name}</h1>
      </div>

      {/* Section Contact avec séparateur intégré */}
      <div className="mt-6 sm:mt-8 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-[10px] sm:text-[11px] font-medium tracking-widest uppercase text-muted-foreground shrink-0">
            CONTACT
          </span>
          <div className="h-px bg-border/60 flex-1" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs sm:text-sm text-foreground">
          <div className="flex items-center gap-2 min-w-0">
            <Mail className="size-3.5 sm:size-4 text-muted-foreground stroke-[1.5] shrink-0" />
            <span className="font-mono text-xs sm:text-sm truncate">{teacher.user.email}</span>
          </div>

          {teacher.user.phone && (
            <div className="flex items-center gap-2 shrink-0">
              <Phone className="size-3.5 sm:size-4 text-muted-foreground stroke-[1.5] shrink-0" />
              <span className="font-mono text-xs sm:text-sm">{teacher.user.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Section Département avec séparateur intégré (après contact) */}
      {teacher.department && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] sm:text-[11px] font-medium tracking-widest uppercase text-muted-foreground shrink-0">
              DÉPARTEMENT
            </span>
            <div className="h-px bg-border/60 flex-1" />
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm text-foreground">
            <Building2 className="size-3.5 sm:size-4 text-muted-foreground stroke-[1.5] shrink-0" />
            <span className="font-mono text-xs sm:text-sm">{teacher.department.name}</span>
          </div>
        </div>
      )}
    </div>
  )
}