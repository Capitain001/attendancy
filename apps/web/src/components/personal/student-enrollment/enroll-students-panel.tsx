// src/components/personal/student-enrollment/enroll-students-panel.tsx
"use client";

import { button, input, typography } from "@/styles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogFooter } from "@/components/ui/dialog";
import { useEnrollStudents } from "@/hooks/data/student-enrollments/useEnrollStudents";

interface Props {
  classId: string;
  onDone?: () => void;   // modale : fermer ; page : rien à faire
  onCancel?: () => void; // pas de bouton "Annuler" si absent
}

export function EnrollStudentsPanel({ classId, onDone, onCancel }: Props) {
  const { students, query, setQuery, selection, isLoading, isEnrolling, error, submit } =
    useEnrollStudents(classId);

const handleSubmit = async () => {
  if (await submit()) onDone?.();
};

  return (
    <>
      <input
        className={input.base}
        placeholder="Rechercher (nom, email)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="max-h-[22em] overflow-y-auto">
        {isLoading && <p className={typography.small}>Chargement…</p>}
        {error && <p className={`${typography.small} text-destructive`}>{error}</p>}
        {!isLoading && !error && students.length === 0 && (
          <p className={typography.small}>Aucun étudiant disponible.</p>
        )}

        <ul>
          {students.map(({ id, user }) => {
            const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

            return (
              <li key={id}>
                <label className="flex cursor-pointer items-center gap-[1em] rounded-[var(--radius)] p-[0.6em] hover:bg-muted">
                  <Checkbox checked={selection.has(id)} onCheckedChange={() => selection.toggle(id)} />
                  <Avatar>
                    <AvatarImage src={user.avatar_url ?? undefined} alt="" />
                    <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0">
                    <span className={`${typography.small} block truncate`}>{name}</span>
                    <span className={`${typography.xsmall} block truncate text-muted-foreground`}>
                      {user.email}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      <DialogFooter>
        <button type="button" className={button.ghost} onClick={onCancel}>
          Annuler
        </button>
        <button
          type="button"
          className={button.primary}
          disabled={selection.count === 0 || isEnrolling}
          onClick={handleSubmit}
        >
          {isEnrolling ? "Inscription…" : `Inscrire (${selection.count})`}
        </button>
      </DialogFooter>
    </>
  );
}