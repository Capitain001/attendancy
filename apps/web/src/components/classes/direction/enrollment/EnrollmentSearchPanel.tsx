"use client";

import { Check, RefreshCw, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchStudentsForEnrollmentDto } from "@/services/student-enrollment/types";
import { getEnrollmentState, getFullName } from "./enrollment-status";
import { Pill } from "./ui";
import { StudentAvatar } from "./StudentAvatar";

interface EnrollmentSearchPanelProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  results: SearchStudentsForEnrollmentDto;
  selectedIds: Set<string>;
  onToggleStudent: (student: SearchStudentsForEnrollmentDto[number]) => void;
  classIsActive: boolean;
  isPending: boolean;
}

export function EnrollmentSearchPanel({
  query,
  onQueryChange,
  onSearch,
  results,
  selectedIds,
  onToggleStudent,
  classIsActive,
  isPending,
}: EnrollmentSearchPanelProps) {
  return (
    <section className="rounded-md border border-border bg-card p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-foreground">Ajouter des étudiants</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Recherchez par nom, email ou téléphone, puis sélectionnez les profils à inscrire.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            disabled={!classIsActive || isPending}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && query.trim().length >= 2) onSearch();
            }}
            placeholder="Rechercher un étudiant…"
            className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-[13px] outline-none transition-colors focus:border-foreground/40 disabled:opacity-60 placeholder:text-muted-foreground/60"
          />
        </div>
        <button
          type="button"
          disabled={!classIsActive || query.trim().length < 2 || isPending}
          onClick={onSearch}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-5 text-[13px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? <RefreshCw className="size-4 animate-spin" /> : <Search className="size-4" />}
          Rechercher
        </button>
      </div>

      {!classIsActive && (
        <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Cette classe appartient à une année académique clôturée. L'inscription est bloquée.
        </p>
      )}

      {results.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 py-12">
          <Search className="size-6 text-muted-foreground/50" />
          <p className="text-[13px] text-muted-foreground">
            Lancez une recherche pour ajouter des étudiants.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-1.5">
          {results.map((student) => {
            const state = getEnrollmentState(student);
            const isSelected = selectedIds.has(student.id);
            const label = getFullName(student.user);
            const disabled = state === "enrolled";

            return (
              <li key={student.id}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onToggleStudent(student)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                    isSelected
                      ? "border-primary/40 bg-primary/[0.06]"
                      : "border-transparent hover:bg-accent/40",
                    disabled && "cursor-not-allowed opacity-55",
                  )}
                >
                  <StudentAvatar name={label} src={student.user.avatar_url} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-foreground">{label}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {student.user.email}
                      {student.user.phone ? ` · ${student.user.phone}` : ""}
                    </span>
                  </span>
                  {state === "enrolled" && <Pill tone="ok">Déjà inscrit</Pill>}
                  {state === "reactivable" && <Pill tone="muted">À réactiver</Pill>}
                  <span
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-lg border transition-colors",
                      isSelected ? "border-primary bg-primary text-primary-foreground" : "border-foreground/25",
                    )}
                  >
                    {isSelected && <Check className="size-3.5" />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
