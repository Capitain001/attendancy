// src/components/users/list/TClassStudentsScreen.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Search, UserMinus, Users, X } from "lucide-react";

import {
  useClassEnrollments,
  useRemoveStudentEnrollment,
} from "@/hooks/data/student-enrollments";
import { StudentAvatar } from "@/components/personal/teacher/student/StudentAvatar";
import { getStudentName } from "@/components/personal/teacher/utils";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface TClassStudentsScreenProps {
  classId: string;
  classLabel: string;
  slug: string;
}

export function TClassStudentsScreen({
  classId,
  classLabel,
  slug,
}: TClassStudentsScreenProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { enrollments, isLoading } = useClassEnrollments(classId);
  const { removeStudentEnrollment, isRemoving } = useRemoveStudentEnrollment(classId);

  const fallbackBackHref = `/personal/${encodeURIComponent(slug)}/teacher/classes/${classId}/invitation`;

  const handleRemove = (enrollmentId: string) => {
    setRemovingId(enrollmentId);
    removeStudentEnrollment(enrollmentId, {
      onSettled: () => setRemovingId(null),
    });
  };

  // Filtrage insensible à la casse sur nom, prénom et email
  const filteredEnrollments = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return enrollments;

    return enrollments.filter(({ student }) => {
      const u = student.user;
      const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase();
      const email = u.email.toLowerCase();
      return fullName.includes(q) || email.includes(q);
    });
  }, [enrollments, query]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background text-foreground">
      {/* ── En-tête mobile épuré ── */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/50 bg-background/95 px-4 py-3 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push(fallbackBackHref);
            }
          }}
          aria-label="Retour"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-5" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold leading-tight">{classLabel}</h1>
          <p className="text-xs text-muted-foreground">
            {isLoading
              ? "Chargement…"
              : `${enrollments.length} inscrit${enrollments.length > 1 ? "s" : ""}`}
          </p>
        </div>
      </header>

      <main className="flex-1 space-y-3 p-4">
        {/* ── Recherche rapide (si au moins 1 inscrit) ── */}
        {!isLoading && enrollments.length > 0 && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              inputMode="search"
              placeholder="Rechercher…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 rounded-lg border-border/60 bg-muted/30 pl-9 pr-8 text-xs placeholder:text-muted-foreground/60 focus-visible:ring-1"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Effacer la recherche"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        )}

        {/* ── Contenu / Liste ── */}
        {isLoading ? (
          <ul className="divide-y divide-border/40">
            {[1, 2, 3, 4].map((i) => (
              <li key={i} className="flex items-center gap-3 py-3">
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
              </li>
            ))}
          </ul>
        ) : enrollments.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Users className="size-5" />
            </div>
            <p className="text-sm font-medium text-foreground">Aucun étudiant inscrit</p>
            <Link
              href={fallbackBackHref}
              className="mt-2 text-xs font-medium text-primary hover:underline"
            >
              Inscrire des étudiants
            </Link>
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Aucun résultat pour « {query} »
          </div>
        ) : (
          <ul className="divide-y divide-border/40">
            {filteredEnrollments.map((enrollment) => {
              const { student } = enrollment;
              const name = getStudentName(student.user);
              const isCurrentRemoving = isRemoving && removingId === enrollment.id;

              return (
                <li
                  key={enrollment.id}
                  className="flex items-center gap-3 py-2.5"
                >
                  <StudentAvatar user={student.user} className="size-9 shrink-0" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-tight text-foreground">
                      {name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {student.user.email}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isRemoving}
                    onClick={() => handleRemove(enrollment.id)}
                    title="Retirer de la classe"
                    aria-label={`Retirer ${name} de la classe`}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isCurrentRemoving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <UserMinus className="size-4" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

