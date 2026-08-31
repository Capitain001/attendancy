import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { GetTeacherDto, GetTeacherStatsDto,  } from "@/services/teacher"

// ─── Stats ───────────────────────────────────────────────────────────────────

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

// ─── Composant ───────────────────────────────────────────────────────────────

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

  const { user, department } = teacher

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email

  const initials =
    [user.firstName?.[0], user.lastName?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "?"

  return (
    <div
      className={cn(
        "w-full rounded-xl rounded-se-none bg-card p-4",
        className,
      )}
    >
      {/* Identité */}
      <div className="flex items-center gap-3">
        <Avatar className="size-16 shrink-0">
          {user.avatar_url && (
            <AvatarImage
              src={user.avatar_url}
              alt={fullName}
            />
          )}

          <AvatarFallback className="text-sm font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {fullName}
          </p>

          <p className="truncate text-xs text-muted-foreground">
            {user.email}
          </p>

          {department && (
            <Badge
              variant="secondary"
              className="mt-1 h-4 px-1.5 text-[10px]"
            >
              {department.name}
            </Badge>
          )}
        </div>

        <Badge
          variant={
            user.status === "ACTIVE"
              ? "default"
              : "secondary"
          }
          className="h-4 shrink-0 px-1.5 text-[10px]"
        >
          {user.status === "ACTIVE" ? "Actif" : "Inactif"}
        </Badge>
      </div>

      {/* Bande de stats */}
      <div className="mt-4 grid grid-cols-4 divide-x divide-border overflow-hidden rounded-md bg-muted/50">
        {STATS.map(({ key, label, suffix }) => (
          <div
            key={key}
            className="flex flex-col items-center px-1 py-2.5"
          >
            <span className="text-sm font-bold leading-none tabular-nums">
              {stats[key]}
              {suffix}
            </span>

            <span className="mt-1 text-center text-[9px] leading-tight text-muted-foreground">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}