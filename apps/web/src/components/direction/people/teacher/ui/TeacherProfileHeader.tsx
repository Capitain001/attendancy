import UserIcon from '@/components/users/UserIcon'
import { card } from '@/styles'
import { cn } from '@/lib/utils'
import { Mail, Phone, Building2 } from 'lucide-react'
import type { GetTeacherNotNull } from '@/services/teacher'
import { BackgroundPattern } from '@/components/design/BackgroundPattern'

export function TeacherProfileHeader({ teacher }: { teacher: GetTeacherNotNull }) {
  const name =
    [teacher.user.firstName, teacher.user.lastName].filter(Boolean).join(' ') || teacher.user.email
  const isActive = teacher.user.status === 'ACTIVE'
  const coursesCount = String(teacher._count.courses).padStart(2, '0')

  const emailHref = `mailto:${teacher.user.email}`
  const phoneHref = teacher.user.phone ? `tel:${teacher.user.phone.replace(/\s+/g, '')}` : undefined

  return (
    <div className={cn(card.base, 'p-4 sm:p-6 font-sans tracking-tight text-foreground bg-background border border-border relative isolate mix-blend-multiply')}>

        {/* <BackgroundPattern
          pattern="pattern-noise-svg"
          baseFrequency={0.5}
          numOctaves={1}
          opacity={0.2}
          className='w-full h-full'
        /> */}
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
      <div className="flex items-start justify-between gap-4 pt-4 sm:pt-6 relative isolate">
           <BackgroundPattern pattern="pattern-dots"  opacity={0.2} className='dark:invert-0' />

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
          <a href={emailHref} className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity">
            <Mail className="size-3.5 sm:size-4 text-muted-foreground stroke-[1.5] shrink-0" />
            <span className="font-mono text-xs sm:text-sm truncate hover:underline underline-offset-4">{teacher.user.email}</span>
          </a>

          {teacher.user.phone && phoneHref && (
            <a href={phoneHref} className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
              <Phone className="size-3.5 sm:size-4 text-muted-foreground stroke-[1.5] shrink-0" />
              <span className="font-mono text-xs sm:text-sm hover:underline underline-offset-4">{teacher.user.phone}</span>
            </a>
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