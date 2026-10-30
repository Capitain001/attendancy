apps\web\src\lib\filter.ts : excludeByIds pluto que import { excludeByIds } from "@/utils/exclude";



src/hooks/
  data/
    students/use-students.ts                        → query : étudiants de l'org
    student-enrollments/use-class-enrollments.ts    → query : inscriptions actives d'une classe
    student-enrollments/use-enroll-students.ts      → mutation : inscrire en masse
  logic/
    use-selection.ts                                → état de sélection générique (réutilisable)
    use-enroll-students-logic.ts                    → compose le tout (disponibles, recherche, submit)
Clés de cache à ajouter

@/config/client_cache (à adapter à ta structure)

ts
STUDENTS: {
  ALL: ["students"] as const,
},
STUDENT_ENROLLMENTS: {
  BY_CLASS: (classId: string) => ["student-enrollments", "class", classId] as const,
},
Hooks data/

src/hooks/data/students/use-students.ts

ts
"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { getStudentsAction } from "@/services/student";
import { CACHE_KEYS, QUERY_PRESETS } from "@/config/client_cache";

/** Étudiants de l'org (user inclus). Liste froide → preset DASHBOARD. */
export function useStudents() {
  const { data: response, isLoading } = useQuery({
    queryKey: CACHE_KEYS.STUDENTS.ALL,
    queryFn: () => getStudentsAction(),
    ...QUERY_PRESETS.DASHBOARD,
  });

  // useMemo : référence stable, sinon `?? []` recrée un tableau à chaque render
  const students = useMemo(() => response?.data ?? [], [response]);

  return { students, isLoading, error: response?.error };
}

src/hooks/data/student-enrollments/use-class-enrollments.ts

ts
"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { getStudentsEnrollmentsAction } from "@/services/student-enrollment";
import { CACHE_KEYS, QUERY_PRESETS } from "@/config/client_cache";

/** Inscriptions ACTIVES d'une classe (endedAt = null, défaut côté serveur). */
export function useClassEnrollments(classId: string) {
  const { data: response, isLoading } = useQuery({
    queryKey: CACHE_KEYS.STUDENT_ENROLLMENTS.BY_CLASS(classId),
    queryFn: () => getStudentsEnrollmentsAction({ classId }),
    enabled: !!classId,
    ...QUERY_PRESETS.LIVE,
  });

  const enrollments = useMemo(() => response?.data ?? [], [response]);

  return { enrollments, isLoading, error: response?.error };
}

src/hooks/data/student-enrollments/use-enroll-students.ts

ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { enrollStudentsInClassAction } from "@/services/student-enrollment";
import { CACHE_KEYS } from "@/config/client_cache";

/** Inscription en masse (best-effort côté serveur : un résultat par étudiant). */
export function useEnrollStudents(classId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (studentIds: string[]) =>
      enrollStudentsInClassAction({ classId, studentIds }),

    onSuccess: (response) => {
      if (response.error) {
        toast.error(response.error);
        return;
      }

      const results = response.data ?? [];
      const failed = results.filter((r) => r.status === "failed").length;
      const ok = results.length - failed;

      if (failed === results.length) {
        toast.error("Toutes les inscriptions ont échoué.");
      } else if (failed > 0) {
        toast.warning(
          `${ok} inscrit${ok > 1 ? "s" : ""}, ${failed} échoué${failed > 1 ? "s" : ""}.`
        );
      } else {
        toast.success(`${ok} étudiant${ok > 1 ? "s" : ""} inscrit${ok > 1 ? "s" : ""}.`);
      }
    },

    onError: () => toast.error("Erreur lors de l'inscription."),

    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.STUDENT_ENROLLMENTS.BY_CLASS(classId),
      }),
  });

  return {
    enrollStudents: mutation.mutateAsync,
    isEnrolling: mutation.isPending,
  };
}
Hooks logic/

src/hooks/logic/use-selection.ts (générique, aucune dépendance au domaine)

ts
"use client";

import { useCallback, useMemo, useState } from "react";

export function useSelection() {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }, []);

  const replace = useCallback((ids: Iterable<string>) => setSelected(new Set(ids)), []);
  const clear = useCallback(() => setSelected(new Set()), []);
  const has = useCallback((id: string) => selected.has(id), [selected]);
  const ids = useMemo(() => [...selected], [selected]);

  return { ids, count: selected.size, has, toggle, replace, clear };
}

src/hooks/logic/use-enroll-students-logic.ts (compose uniquement, aucun appel serveur direct)

ts
"use client";

import { useMemo, useState } from "react";

import { excludeByIds } from "@/utils/exclude";
import { useStudents } from "@/hooks/data/students/use-students";
import { useClassEnrollments } from "@/hooks/data/student-enrollments/use-class-enrollments";
import { useEnrollStudents } from "@/hooks/data/student-enrollments/use-enroll-students";
import { useSelection } from "./use-selection";

export function useEnrollStudentsLogic(classId: string) {
  const students = useStudents();
  const enrollments = useClassEnrollments(classId);
  const { enrollStudents, isEnrolling } = useEnrollStudents(classId);
  const selection = useSelection();
  const [query, setQuery] = useState("");

  // étudiants de l'org privés des inscrits actifs de la classe
  const available = useMemo(
    () => excludeByIds(students.students, enrollments.enrollments.map((e) => e.studentId)),
    [students.students, enrollments.enrollments],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter(({ user }) =>
      [user.firstName, user.lastName, user.email].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [available, query]);

  /** @returns true si tout est passé (le composant décide de fermer la modale). */
  const submit = async () => {
    try {
      const res = await enrollStudents(selection.ids);
      if (!res.data) return false;

      // on ne garde sélectionnés que les échecs, pour retenter
      const failedIds = res.data.filter((r) => r.status === "failed").map((r) => r.studentId);
      selection.replace(failedIds);
      return failedIds.length === 0;
    } catch {
      return false; // toast déjà géré par onError
    }
  };

  return {
    students: filtered,
    query,
    setQuery,
    selection,
    isLoading: students.isLoading || enrollments.isLoading,
    isEnrolling,
    error: students.error ?? enrollments.error ?? null,
    submit,
  };
}
UI : le panneau se monte seulement à l’ouverture

Radix démonte DialogContent à la fermeture. En plaçant le hook dans un sous-composant rendu dans le contenu, il n’y a plus de param enabled ni d’effet de reset : la sélection et la recherche repartent d’zéro à chaque ouverture, et les queries ne partent qu’à l’ouverture. Le cache TanStack évite le refetch à la réouverture.

src/components/classes/enroll-students-modal.tsx (coque : trigger + dialog)

tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { button } from "@/styles";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { EnrollStudentsPanel } from "./enroll-students-panel";

export function EnrollStudentsModal({ classId, className }: { classId: string; className: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={button.addRound} aria-label={`Ajouter des étudiants à ${className}`}>
          <Plus className="size-[1.75em]" />
        </button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter à {className}</DialogTitle>
          <DialogDescription>Sélectionne les étudiants à inscrire dans cette classe.</DialogDescription>
        </DialogHeader>

        <EnrollStudentsPanel classId={classId} onDone={() => setOpen(false)} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

src/components/classes/enroll-students-panel.tsx (affichage pur, la logique est dans le hook)

tsx
"use client";

import { button, input, typography } from "@/styles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogFooter } from "@/components/ui/dialog";
import { useEnrollStudentsLogic } from "@/hooks/logic/use-enroll-students-logic";

interface Props {
  classId: string;
  onDone: () => void;
  onCancel: () => void;
}

export function EnrollStudentsPanel({ classId, onDone, onCancel }: Props) {
  const { students, query, setQuery, selection, isLoading, isEnrolling, error, submit } =
    useEnrollStudentsLogic(classId);

  const handleSubmit = async () => {
    if (await submit()) onDone();
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
                    <span className={`${typography.xsmall} block truncate text-muted-foreground`}>{user.email}</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      <DialogFooter>
        <button type="button" className={button.ghost} onClick={onCancel}>Annuler</button>
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