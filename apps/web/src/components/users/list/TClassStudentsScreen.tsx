// src/components/users/list/TClassStudentsScreen.tsx
import Link from "next/link";
import { Search, Users, X } from "lucide-react";

import type { getStudentsEnrollmentsAction } from "@/services/student-enrollment";
import { StudentAvatar } from "@/components/personal/teacher/student/StudentAvatar";
import { getStudentName } from "@/components/personal/teacher/utils";

type EnrollmentDTO = NonNullable<
  Extract<
    Awaited<ReturnType<typeof getStudentsEnrollmentsAction>>,
    { data: unknown }
  >["data"]
>[number];

type EnrollmentRow = Pick<EnrollmentDTO, "id" | "student" | "studentGroups">;

interface TClassStudentsScreenProps {
  enrollments: EnrollmentRow[];
  query: string;
}

export function TClassStudentsScreen({
  enrollments,
  query,
}: TClassStudentsScreenProps) {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? enrollments.filter(({ student }) => {
        const u = student.user;
        const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase();
        return fullName.includes(q) || u.email.toLowerCase().includes(q);
      })
    : enrollments;

  const total = enrollments.length;

  if (total === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground">
        <Users className="size-8" />
        <p className="text-sm">Aucun étudiant inscrit</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh w-full md:px-4 bg-background text-foreground">
      {/* ── Recherche + compteur ── */}
      <form
        method="get"
        role="search"
        className="sticky top-0 z-10 border-b border-border/50 bg-background/90 px-3 py-2 backdrop-blur-md"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            inputMode="search"
            autoComplete="off"
            placeholder={`Rechercher parmi ${total}…`}
            aria-label="Rechercher un étudiant"
            className="h-10 w-full rounded-lg bg-muted/50 pl-9 pr-10 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring/40 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <Link
              href="?"
              aria-label="Effacer la recherche"
              className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </Link>
          )}
        </div>
      </form>

      {/* ── Liste ── */}
      {filtered.length === 0 ? (
        <p className="px-4 py-12 text-center text-sm text-muted-foreground">
          Aucun résultat pour «&nbsp;{query}&nbsp;»
        </p>
      ) : (
        <ul className="divide-y divide-border/40">
          {filtered.map(({ id, student, studentGroups }) => (
            <li key={id} className="flex items-center gap-3 px-4 py-2.5">
              <StudentAvatar user={student.user} className="size-10 shrink-0" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight">
                  {getStudentName(student.user)}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {student.user.email}
                </p>
              </div>

              {studentGroups.length > 0 && (
                <span className="max-w-[30%] shrink-0 truncate rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {studentGroups.map(({ group }) => group.name).join(" · ")}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}