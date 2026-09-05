"use client";

import { UserMinus } from "lucide-react";
import type { GetStudentsEnrollmentsDto } from "@/services/student-enrollment";
import { getFullName } from "./enrollment-status";
import { Pill } from "./ui";
import { StudentAvatar } from "./StudentAvatar";

interface EnrolledStudentsListProps {
  rows: GetStudentsEnrollmentsDto;
  classIsActive: boolean;
  isPending: boolean;
  onRemove: (enrollmentId: string) => void;
}

export function EnrolledStudentsList({ rows, classIsActive, isPending, onRemove }: EnrolledStudentsListProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Étudiants inscrits</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {rows.length} inscription{rows.length > 1 ? "s" : ""} active{rows.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 py-12">
          <p className="text-[13px] text-muted-foreground">Aucun étudiant inscrit dans cette classe.</p>
        </div>
      ) : (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {rows.map((row) => {
            const label = getFullName(row.student.user);
            const groups = row.studentGroups.map((sg) => sg.group.name);

            return (
              <li
                key={row.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
              >
                <StudentAvatar name={label} src={row.student.user.avatar_url} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-foreground">{label}</p>
                  <p className="truncate text-xs text-muted-foreground">{row.student.user.email}</p>
                  {groups.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {groups.map((g) => (
                        <Pill key={g} tone="accent">
                          {g}
                        </Pill>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  disabled={!classIsActive || isPending}
                  onClick={() => onRemove(row.id)}
                  title="Retirer de la classe"
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                >
                  <UserMinus className="size-4" />
                  <span className="sr-only">Retirer</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
