import { cn } from "@/lib/utils"
import { Mail, Phone, Building2 } from "lucide-react"
import UserIcon from "@/components/users/UserIcon"
import { card } from "@/styles"
import { BackgroundPattern } from "@/components/design/BackgroundPattern"
import type { GetTeacherDto, GetTeacherStatsDto } from "@/services/teacher"

const STATS: {
  key: keyof GetTeacherStatsDto
  label: string
  suffix: string
}[] = [
  { key: "assiduite", label: "Assiduité", suffix: "%" },
  { key: "ponctualite", label: "Ponctualité", suffix: "%" },
  { key: "courses", label: "Cours", suffix: "" },
  { key: "annulations", label: "Annulations", suffix: "" },
]

interface TeacherProfileCardProps {
  teacher: GetTeacherDto
  stats: GetTeacherStatsDto
  className?: string
}

export function TeacherProfileCard({
  teacher,
  stats,
  className,
}: TeacherProfileCardProps) {
  if (!teacher) {
    return null
  }

  const user = teacher.user
  const department = teacher.department

  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email

  const isActive = user.status === "ACTIVE"

  const coursesCount = String(teacher._count.courses).padStart(2, "0")

  const emailHref = `mailto:${user.email}`

  const phoneHref = user.phone
    ? `tel:${user.phone.replace(/\s+/g, "")}`
    : null

  return (
    <div
      className={cn(
        card.base,
        "relative isolate border border-border bg-background p-4 font-sans tracking-tight text-foreground sm:p-6 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border/60 pb-3 text-[10px] font-medium uppercase tracking-widest text-muted-foreground sm:pb-4 sm:text-[11px]">
        <span>TEACHER</span>

        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "size-2 rounded-full",
              isActive ? "bg-blue-600" : "bg-muted-foreground",
            )}
          />

          <span className="text-[10px] font-semibold uppercase tracking-wider sm:text-[11px]">
            {isActive ? "ACTIVE" : "INACTIVE"}
          </span>
        </div>
      </div>

      <div className="relative isolate flex items-start justify-between gap-4 pt-4 sm:pt-6">
        <BackgroundPattern
          pattern="pattern-dots"
          opacity={0.2}
          className="dark:invert-0"
        />

        <UserIcon
          showOnline={false}
          name={name}
          avatarUrl={user.avatar_url}
          className={cn(
            "size-20 aspect-square rounded-none border border-border [&_*]:rounded-none sm:size-32",
            !isActive && "opacity-80 grayscale",
          )}
        />

        <div className="flex flex-col items-end text-right">
          <span className="text-5xl font-light leading-none tracking-tighter sm:text-7xl">
            {coursesCount}
          </span>

          <span className="mt-1 text-[9px] uppercase tracking-widest text-muted-foreground sm:text-xs">
            Cours
          </span>
        </div>
      </div>

      <div className="mt-4 sm:mt-5">
        <h1 className="break-words text-2xl font-normal tracking-tight sm:text-4xl">
          {name}
        </h1>
      </div>

      {/* CONTACT */}
      <div className="mt-6 space-y-3 sm:mt-8">
        <div className="flex items-center gap-3">
          <span className="shrink-0 text-[10px] font-medium uppercase tracking-widest text-muted-foreground sm:text-[11px]">
            CONTACT
          </span>

          <div className="h-px flex-1 bg-border/60" />
        </div>

        <div className="flex flex-col justify-between gap-2.5 text-xs text-foreground sm:flex-row sm:items-center sm:text-sm">
          <a
            href={emailHref}
            className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-80"
          >
            <Mail className="size-3.5 shrink-0 stroke-[1.5] text-muted-foreground sm:size-4" />

            <span className="truncate font-mono text-xs underline-offset-4 hover:underline sm:text-sm">
              {user.email}
            </span>
          </a>

          {phoneHref ? (
            <a
              href={phoneHref}
              className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80"
            >
              <Phone className="size-3.5 shrink-0 stroke-[1.5] text-muted-foreground sm:size-4" />

              <span className="font-mono text-xs underline-offset-4 hover:underline sm:text-sm">
                {user.phone}
              </span>
            </a>
          ) : null}
        </div>
      </div>

      {/* DÉPARTEMENT */}
      {department ? (
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-3">
            <span className="shrink-0 text-[10px] font-medium uppercase tracking-widest text-muted-foreground sm:text-[11px]">
              DÉPARTEMENT
            </span>

            <div className="h-px flex-1 bg-border/60" />
          </div>

          <div className="flex items-center gap-2 text-xs text-foreground sm:text-sm">
            <Building2 className="size-3.5 shrink-0 stroke-[1.5] text-muted-foreground sm:size-4" />

            <span className="font-mono text-xs sm:text-sm">
              {department.name}
            </span>
          </div>
        </div>
      ) : null}

      {/* STATISTIQUES */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-3">
          <span className="shrink-0 text-[10px] font-medium uppercase tracking-widest text-muted-foreground sm:text-[11px]">
            STATISTIQUES
          </span>

          <div className="h-px flex-1 bg-border/60" />
        </div>

        <div className="grid grid-cols-4 divide-x divide-border/60">
          {STATS.map((s) => (
            <div
              key={s.key}
              className="flex flex-col items-center gap-1 px-1 py-2"
            >
              <span className="text-lg font-light leading-none tracking-tighter tabular-nums sm:text-2xl">
                {stats[s.key]}
                {s.suffix}
              </span>

              <span className="text-center text-[9px] uppercase tracking-widest text-muted-foreground">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}