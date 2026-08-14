"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ProgramTable, CourseOrder, UEOrder, ReorderProgramPayload } from "@/services/ue/types";
import { reorderProgramAction } from "@/services/ue/actions";

export type ReorderStatus = "idle" | "saving" | "success" | "error";

function snapshotProgramOrder(program: ProgramTable) {
  // Snapshot minimal & stable pour détecter les changements d’ordre
  // UE: (programUEId, semester, order)
  // Cours: (ueCourseId, programUEId, order) — le programUEId est inclus
  // pour détecter un changement d'UE parente (drag cross-UE) : plus gerer niveau projet
  const ueParts: string[] = [];
  const courseParts: string[] = [];

  for (const block of program) {
    for (const u of block.ues) {
      ueParts.push(
        `${u.programUEId}:${block.semester}:${u.order ?? ""}`
      );
      for (const c of u.ue.ueCourses) {
        courseParts.push(`${c.id}:${c.order ?? ""}`);
      }
    }
  }

  ueParts.sort();
  courseParts.sort();
  return `ue=${ueParts.join("|")};course=${courseParts.join("|")}`;
}

function buildPayload(program: ProgramTable): Pick<ReorderProgramPayload, "ueOrders" | "courseOrders"> {
  const ueOrders: UEOrder[] = [];
  const courseOrders: CourseOrder[] = [];

  for (const block of program) {
    block.ues.forEach((u, idx) => {
      ueOrders.push({
        programUEId: u.programUEId,
        semester: block.semester,
        order: idx + 1,
      });

      u.ue.ueCourses.forEach((c, cIdx) => {
        courseOrders.push({
          ueCourseId: c.id,
          ueId: u.ue.id,
          order: cIdx + 1,
        });
      });
    });
  }

  return { ueOrders, courseOrders };
}

export function useProgramReorder({
  programId,
  program,
}: {
  programId: string;
  program: ProgramTable;
}) {
  const currentSnapshot = useMemo(() => snapshotProgramOrder(program ?? []), [program]);
  const baseSnapshotRef = useRef<string | null>(null);
  const lastProgramIdRef = useRef<string | null>(null);

  // Initialiser le snapshot de référence quand les données arrivent
  useEffect(() => {
    // Si on change de programme, on réinitialise le snapshot
    if (lastProgramIdRef.current !== programId) {
      lastProgramIdRef.current = programId;
      baseSnapshotRef.current = null;
    }

    // Ne pas initialiser sur un état "vide" (avant chargement réel)
    const hasAnyUE = (program ?? []).some((b) => (b.ues?.length ?? 0) > 0);
    if (!hasAnyUE) return;

    if (!baseSnapshotRef.current) {
      baseSnapshotRef.current = currentSnapshot;
    }
  }, [currentSnapshot, program, programId]);

  const isDirty = baseSnapshotRef.current !== null && baseSnapshotRef.current !== currentSnapshot;

  const mutation = useMutation({
    mutationFn: async () => {
      const { ueOrders, courseOrders } = buildPayload(program ?? []);
      const result = await reorderProgramAction({ programId, ueOrders, courseOrders });
      if ("error" in result) throw new Error(result.error ?? "Une erreur est survenue");
      return true;
    },
    onSuccess: async () => {
      baseSnapshotRef.current = currentSnapshot;
      toast.success("Nouvelle disposition enregistrée");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue");
    },
  });

  const save = useCallback(async () => {
    try {
      await mutation.mutateAsync();
    } catch {
      // déjà géré par onError (toast) — on avale ici pour éviter
      // une unhandled promise rejection côté onClick.
    }
  }, [mutation]);

  const status: ReorderStatus = mutation.isPending
    ? "saving"
    : mutation.isError
    ? "error"
    : mutation.isSuccess
    ? "success"
    : "idle";

  return {
    isDirty,
    save,
    status,
    error: mutation.error instanceof Error ? mutation.error.message : null,
  };
}