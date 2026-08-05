"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createUEAction,
  addUEToProgramAction,
  updateUEAction,
} from "@/services/ue/actions";
import {
  createUECourseAction,
  removeUECourseAction,
  updateUECourseAction,
} from "@/services/ue-course";
import { removeUEFromProgramAction } from "@/services/program-ue/actions";
import {
  CreateUEInput,
  LinkUEInput,
  CreateUECourseInput,
} from "@/services/ue/validation";
import { UpdateUEData } from "@/services/ue/database";
import type { UpdateUECourseData } from "@/services/ue-course";
import { ProgramTable } from "@/services/ue/types";
import { CACHE_KEYS } from "@/config/client_cache";

interface UseProgramActionsOptions {
  programId: string;
  classId: string;
//   slug: string;
}

type UndoAction = {
  label: string;
  run: () => Promise<void>;
  snapshot?: ProgramTable;
};

type UnlinkContext = {
  removedBlock: any;
  targetSemester: number;
  targetUeId: string;
};

type RemoveCourseContext = {
  removedCourse: any;
  targetProgramUEId: string;
};

export function useProgramActions({ programId, classId }: UseProgramActionsOptions) {
  const queryClient = useQueryClient();
  const programQueryKey = CACHE_KEYS.PROGRAMS.BY_ID(programId);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingUeCourseId, setPendingUeCourseId] = useState<string | null>(null);
  const [undoInProgress, setUndoInProgress] = useState(false);
  const [lastUndoAction, setLastUndoAction] = useState<UndoAction | null>(null);

  const updateProgramCache = (
    updater: (prev: ProgramTable | undefined) => ProgramTable | undefined
  ) => {
    queryClient.setQueryData<ProgramTable | undefined>(
      programQueryKey,
      (prev) => updater(prev)
    );
  };

  const cloneProgramSnapshot = (program: ProgramTable | undefined) =>
    program ? (JSON.parse(JSON.stringify(program)) as ProgramTable) : undefined;

  const getErrorMessage = (err: unknown) =>
    err instanceof Error ? err.message : "Une erreur est survenue";

  const toResult = async <T,>(fn: () => Promise<T>) => {
    try {
      const data = await fn();
      return { success: true as const, data };
    } catch (err) {
      const message = getErrorMessage(err);
      return { success: false as const, error: message };
    }
  };

  // On conserve uniquement la dernière action annulable.
  const setUndoAction = (action: UndoAction | null) => {
    setLastUndoAction(action);
  };

  // Undo global: annule la dernière action puis invalide le programme.
  const undoLastAction = async () => {
    if (!lastUndoAction || undoInProgress) return;
    setUndoInProgress(true);
    try {
      await lastUndoAction.run();
      if (lastUndoAction.snapshot) {
        queryClient.setQueryData<ProgramTable>(programQueryKey, lastUndoAction.snapshot);
      }
      toast.success("Dernière action annulée");
      setLastUndoAction(null);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Échec de l'annulation");
    } finally {
      setUndoInProgress(false);
    }
  };

  // — mutations internes

  const createUEMutation = useMutation({
    mutationFn: async (data: CreateUEInput) => {
      const { data: ueData, error } = await createUEAction({
        data,
        programId,
        semester: data.semester,
        order: data.order,
      });
      if (!ueData || error) throw new Error(error || "Une erreur est survenue");
      return { ue: ueData, input: data };
    },
    onSuccess: ({ ue, input }) => {
      // Mise à jour optimiste du cache: on ajoute l'UE dans le bon semestre
      updateProgramCache((prev) => {
        if (!prev) return prev;
        const semester = input.semester ?? 1;
        const order = input.order ?? prev.length + 1;

        let found = false;
        const next = prev.map((block) => {
          if (block.semester !== semester) return block;
          found = true;
          return {
            ...block,
            ues: [
              ...block.ues,
              {
                programUEId: `temp-${ue.id}`,
                semester,
                order,
                ue: {
                  ...ue,
                  description: null,
                  imageUrl: null,
                  departmentId: null,
                  department: null,
                  ueCourses: [],
                },
                ueTotalCredits: 0,      // AJOUTÉ
                ueTotalDuration: 0,     // AJOUTÉ
              },
            ],
          };
        });

        if (!found) {
          next.push({
            semester,
            totalCredits: 0,
            totalDuration: 0,
            ues: [
              {
                programUEId: `temp-${ue.id}`,
                semester,
                order,
                ue: {
                  ...ue,
                  description: null,
                  imageUrl: null,
                  departmentId: null,
                  department: null,
                  ueCourses: [],
                },
                ueTotalCredits: 0,      // AJOUTÉ
                ueTotalDuration: 0,     // AJOUTÉ
              },
            ],
          });
        }

        return next;
      });
      toast.success("UE créée avec succès");
    },
    onError: (err: unknown) =>
      toast.error(getErrorMessage(err)),
  });

  const linkUEMutation = useMutation({
    onMutate: async () => {
      const previousProgram =
        queryClient.getQueryData<ProgramTable | undefined>(programQueryKey);
      return { snapshot: cloneProgramSnapshot(previousProgram) };
    },
    mutationFn: async (data: LinkUEInput) => {
      const { data: result, error } = await addUEToProgramAction({
        ueId: data.ueId,
        programId,
        semester: data.semester,
        order: data.order,
      });
      if (!result || error) throw new Error(error || "Une erreur est survenue");
      return { input: data, result };
    },
    onSuccess: async ({ input }, _vars, context: { snapshot?: ProgramTable } | undefined) => {
      await queryClient.invalidateQueries({ queryKey: programQueryKey });
      setUndoAction({
        label: "Liaison UE",
        snapshot: context?.snapshot,
        run: async () => {
          const { error } = await removeUEFromProgramAction({ 
            programId,
            ueId: input.ueId,
          });
          if (error) throw new Error(error);
        },
      });
      toast.success("UE liée avec succès");
    },
    onError: (err: unknown) =>
      toast.error(getErrorMessage(err)),
  });

  const unlinkUEMutation = useMutation({
    onMutate: async ({ programUEId }: { programUEId: string; ueId: string }) => {
      await queryClient.cancelQueries({ queryKey: programQueryKey });
      const previousProgram =
        queryClient.getQueryData<ProgramTable | undefined>(programQueryKey);
      let removedBlock: any = null;
      let targetSemester = 0;
      let targetUeId = "";

      updateProgramCache((prev) => {
        if (!prev) return prev;
        return prev.map((block) => {
          const ueIndex = block.ues.findIndex((u) => u.programUEId === programUEId);
          if (ueIndex === -1) return block;

          removedBlock = block.ues[ueIndex];
          targetSemester = block.semester;
          targetUeId = removedBlock?.ue?.id ?? "";
          
          return {
            ...block,
            ues: block.ues.filter((u) => u.programUEId !== programUEId),
            totalCredits: block.totalCredits - removedBlock.ueTotalCredits,
            totalDuration: block.totalDuration - removedBlock.ueTotalDuration,
          };
        });
      });

      return {
        removedBlock,
        targetSemester,
        targetUeId,
        snapshot: cloneProgramSnapshot(previousProgram),
      };
    },
    mutationFn: async ({ programUEId, ueId }: { programUEId: string; ueId: string }) => {
      const { data: result, error } = await removeUEFromProgramAction({
        programId,
        ueId,
      });
      if (error) throw new Error(error);
      if (!result || typeof result.count !== "number" || result.count < 1) {
        throw new Error("Aucune UE supprimée (état obsolète)");
      }
      return programUEId;
    },
    onSuccess: (
      _programUEId,
      _vars,
      context: (UnlinkContext & { snapshot?: ProgramTable }) | undefined
    ) => {
      if (!context?.removedBlock) return;
      const removed = context.removedBlock;
      setUndoAction({
        label: "Déliaison UE",
        snapshot: context.snapshot,
        run: async () => {
          const { error } = await addUEToProgramAction({
            ueId: removed.ue.id,
            programId,
            semester: context.targetSemester,
            order: removed.order,
          });
          if (error) throw new Error(error);
        },
      });
      toast.success("UE déliée avec succès");
    },
    onError: (err, _programUEId, context: UnlinkContext | undefined) => {
      if (context?.removedBlock) {
        updateProgramCache((prev) => {
          if (!prev) return prev;
          return prev.map((block) => {
            if (block.semester !== context.targetSemester) return block;
            const newUes = [...block.ues, context.removedBlock].sort((a,b) => a.order - b.order);
            return {
               ...block,
               ues: newUes,
               totalCredits: block.totalCredits + context.removedBlock.ueTotalCredits,
               totalDuration: block.totalDuration + context.removedBlock.ueTotalDuration,
            };
          });
        });
      }
      toast.error("Erreur: " + getErrorMessage(err));
    },
  });

  const updateUEMutation = useMutation({
    mutationFn: async ({ ueId, data }: { ueId: string; data: UpdateUEData }) => {
      // Ne passez PAS programId ici
      const payload: UpdateUEData = { name: data.name };
      const { data: ueData, error } = await updateUEAction({ 
        ueId, 
        data: payload
        // programId est retiré !
      });
      if (!ueData || error) throw new Error(error || "Une erreur est survenue");
      return { ueId, data: payload };
    },
    onSuccess: ({ ueId, data }) => {
      updateProgramCache((prev) => {
        if (!prev) return prev;
        return prev.map((block) => ({
          ...block,
          ues: block.ues.map((ueBlock) => {
            if (ueBlock.ue.id !== ueId) return ueBlock;
            return {
              ...ueBlock,
              ue: { ...ueBlock.ue, name: data.name ?? ueBlock.ue.name },
            };
          }),
        }));
      });
      toast.success("UE modifiée avec succès");
    },
    onError: (err: unknown) =>
      toast.error(getErrorMessage(err)),
  });

  const createCourseMutation = useMutation({
    onMutate: async () => {
      const previousProgram =
        queryClient.getQueryData<ProgramTable | undefined>(programQueryKey);
      return { snapshot: cloneProgramSnapshot(previousProgram) };
    },
    mutationFn: async (data: CreateUECourseInput) => {
      const createResult = await createUECourseAction({ ...data });
      if ('error' in createResult) throw new Error(createResult.error);
      const ueCourse = createResult.data;
      return { ueCourse, input: data };
    },
    onSuccess: (
      { ueCourse, input },
      _vars,
      context: { snapshot?: ProgramTable } | undefined
    ) => {
      // Ajout optimiste du cours dans l'UE ciblée + mise à jour des totaux
      updateProgramCache((prev) => {
        if (!prev) return prev;
        const { ueId, credits, duration } = input;

        return prev.map((block) => {
          let updated = false;
          const newUes = block.ues.map((ueBlock) => {
            if (ueBlock.ue.id !== ueId) return ueBlock;
            updated = true;
            const newCourse = {
              id: ueCourse.id,
              name: input.name,
              code: input.code ?? null,
              credits,
              duration,
              order:
                input.order ??
                (ueBlock.ue.ueCourses[ueBlock.ue.ueCourses.length - 1]?.order ?? 0) + 1,
            };
            return {
              ...ueBlock,
              ue: {
                ...ueBlock.ue,
                ueCourses: [...ueBlock.ue.ueCourses, newCourse],
              },
              ueTotalCredits: ueBlock.ueTotalCredits + credits,      // AJOUTÉ
              ueTotalDuration: ueBlock.ueTotalDuration + duration,   // AJOUTÉ
            };
          });

          if (!updated) return block;

          return {
            ...block,
            ues: newUes,
            totalCredits: block.totalCredits + credits,
            totalDuration: block.totalDuration + duration,
          };
        });
      });
      setUndoAction({
        label: "Ajout cours",
        snapshot: context?.snapshot,
        run: async () => {
          const removeResult = await removeUECourseAction(ueCourse.id);
          if ('error' in removeResult) throw new Error(removeResult.error);
        },
      });
      toast.success("Cours créé avec succès");
    },
    onError: (err: unknown) =>
      toast.error(getErrorMessage(err)),
  });

  const updateCourseMutation = useMutation({
    onMutate: async ({ ueCourseId }) => {
      const previousProgram =
        queryClient.getQueryData<ProgramTable | undefined>(programQueryKey);
      let previous: { name: string; credits: number; duration: number; code: string | null } | null = null;
      const current = previousProgram;
      current?.forEach((block) => {
        block.ues.forEach((ueBlock) => {
          const c = ueBlock.ue.ueCourses.find((x) => x.id === ueCourseId);
          if (c) {
            previous = {
              name: c.name,
              credits: c.credits,
              duration: c.duration,
              code: c.code ?? null,
            };
          }
        });
      });
      return { previous, snapshot: cloneProgramSnapshot(previousProgram) };
    },
    mutationFn: async ({ ueCourseId, data }: { ueCourseId: string; data: UpdateUECourseData }) => {
      const updateResult = await updateUECourseAction(ueCourseId, data);
      if ('error' in updateResult) throw new Error(updateResult.error);
      return { ueCourseId, data };
    },
    onSuccess: ({ ueCourseId, data }, _vars, context) => {
      updateProgramCache((prev) => {
        if (!prev) return prev;
        return prev.map((block) => {
          let diffCredits = 0;
          let diffDuration = 0;
          const newUes = block.ues.map((ueBlock) => {
            const idx = ueBlock.ue.ueCourses.findIndex(c => c.id === ueCourseId);
            if (idx === -1) return ueBlock;
            
            const oldCourse = ueBlock.ue.ueCourses[idx];
            const newCredits = data.credits ?? oldCourse.credits;
            const newDuration = data.duration ?? oldCourse.duration;
            diffCredits += newCredits - oldCourse.credits;
            diffDuration += newDuration - oldCourse.duration;

            const newCourses = [...ueBlock.ue.ueCourses];
            newCourses[idx] = {
              ...oldCourse,
              name: data.name ?? oldCourse.name,
              credits: newCredits,
              duration: newDuration,
            };

            return {
              ...ueBlock,
              ue: { ...ueBlock.ue, ueCourses: newCourses },
              ueTotalCredits: ueBlock.ueTotalCredits + (newCredits - oldCourse.credits),
              ueTotalDuration: ueBlock.ueTotalDuration + (newDuration - oldCourse.duration),
            };
          });

          if (diffCredits === 0 && diffDuration === 0) return { ...block, ues: newUes };

          return {
            ...block,
            ues: newUes,
            totalCredits: block.totalCredits + diffCredits,
            totalDuration: block.totalDuration + diffDuration,
          };
        });
      });
      const previous = (context as any)?.previous as
        | { name: string; credits: number; duration: number; code: string | null }
        | undefined;
      if (previous) {
        setUndoAction({
          label: "Modification cours",
          snapshot: (context as any)?.snapshot,
          run: async () => {
            const revertResult = await updateUECourseAction(ueCourseId, {
              name: previous.name,
              credits: previous.credits,
              duration: previous.duration,
              code: previous.code ?? undefined,
            });
            if ('error' in revertResult) throw new Error(revertResult.error);
          },
        });
      }
      toast.success("Cours modifié avec succès");
    },
    onError: (err: unknown) =>
      toast.error(getErrorMessage(err)),
  });

  const removeCourseMutation = useMutation({
    onMutate: async (ueCourseId) => {
      await queryClient.cancelQueries({ queryKey: programQueryKey });
      const previousProgram =
        queryClient.getQueryData<ProgramTable | undefined>(programQueryKey);

      let removedCourse: any = null;
      let targetProgramUEId = "";

      updateProgramCache((prev) => {
        if (!prev) return prev;

        return prev.map((block) => {
          let updated = false;
          let rCredits = 0;
          let rDuration = 0;

          const newUes = block.ues.map((ueBlock) => {
            const idx = ueBlock.ue.ueCourses.findIndex((c) => c.id === ueCourseId);
            if (idx === -1) return ueBlock;

            removedCourse = ueBlock.ue.ueCourses[idx];
            targetProgramUEId = ueBlock.programUEId;
            rCredits = removedCourse.credits;
            rDuration = removedCourse.duration;
            updated = true;

            return {
              ...ueBlock,
              ue: {
                ...ueBlock.ue,
                ueCourses: ueBlock.ue.ueCourses.filter((c) => c.id !== ueCourseId),
              },
              ueTotalCredits: ueBlock.ueTotalCredits - rCredits,
              ueTotalDuration: ueBlock.ueTotalDuration - rDuration,
            };
          });

          if (!updated) return block;

          return {
            ...block,
            ues: newUes,
            totalCredits: block.totalCredits - rCredits,
            totalDuration: block.totalDuration - rDuration,
          };
        });
      });

      return {
        removedCourse,
        targetProgramUEId,
        snapshot: cloneProgramSnapshot(previousProgram),
      };
    },
    mutationFn: async (ueCourseId: string) => {
      const removeResult = await removeUECourseAction(ueCourseId);
      if ('error' in removeResult) throw new Error(removeResult.error);
      return ueCourseId;
    },
    onSuccess: (
      _ueCourseId,
      _vars,
      context: (RemoveCourseContext & { snapshot?: ProgramTable }) | undefined
    ) => {
      if (!context?.removedCourse || !context?.targetProgramUEId) return;

      const current = queryClient.getQueryData<ProgramTable | undefined>(programQueryKey);
      let targetUeId: string | null = null;
      current?.forEach((block) => {
        const match = block.ues.find((u) => u.programUEId === context.targetProgramUEId);
        if (match) targetUeId = match.ue.id;
      });
      if (!targetUeId) return;

      const removed = context.removedCourse;
      setUndoAction({
        label: "Suppression cours",
        snapshot: context.snapshot,
        run: async () => {
          const restoreResult = await createUECourseAction({
            ueId:        targetUeId!,
            name:        removed.name,
            code:        removed.code ?? undefined,
            credits:     removed.credits,
            duration:    removed.duration,
            order:       removed.order ?? undefined,
            description: undefined,
          });
          if ('error' in restoreResult) throw new Error(restoreResult.error || "Impossible de restaurer le cours");
        },
      });
      toast.success("Cours supprimé avec succès");
    },
    onError: (err, _ueCourseId, context: RemoveCourseContext | undefined) => {
      if (context?.removedCourse) {
        updateProgramCache((prev) => {
          if (!prev) return prev;
          return prev.map((block) => {
            const ueIdx = block.ues.findIndex((u) => u.programUEId === context.targetProgramUEId);
            if (ueIdx === -1) return block;

            const newUes = block.ues.map((ueBlock) => {
              if (ueBlock.programUEId !== context.targetProgramUEId) return ueBlock;
              const newCourses = [...ueBlock.ue.ueCourses, context.removedCourse].sort(
                (a, b) => (a.order ?? 0) - (b.order ?? 0)
              );
              return {
                ...ueBlock,
                ue: { ...ueBlock.ue, ueCourses: newCourses },
                ueTotalCredits: ueBlock.ueTotalCredits + context.removedCourse.credits,
                ueTotalDuration: ueBlock.ueTotalDuration + context.removedCourse.duration,
              };
            });

            return {
              ...block,
              ues: newUes,
              totalCredits: block.totalCredits + context.removedCourse.credits,
              totalDuration: block.totalDuration + context.removedCourse.duration,
            };
          });
        });
      }
      toast.error("Erreur: " + getErrorMessage(err));
    },
  });

  // — fonctions prêtes à passer aux composants

  const createUE = (data: CreateUEInput) =>
    toResult(() => createUEMutation.mutateAsync(data));

  const linkUE = (data: LinkUEInput) =>
    toResult(() => linkUEMutation.mutateAsync(data));

  const unlinkUE = (programUEId: string) =>
    toResult(async () => {
      const current = queryClient.getQueryData<ProgramTable | undefined>(programQueryKey);
      let ueId: string | null = null;
      current?.forEach((block) => {
        const match = block.ues.find((u) => u.programUEId === programUEId);
        if (match) ueId = match.ue.id;
      });
      if (!ueId) throw new Error("UE introuvable pour la suppression");

      return unlinkUEMutation.mutateAsync({ programUEId, ueId });
    });

  const createCourse = (data: CreateUECourseInput) =>
    toResult(() => createCourseMutation.mutateAsync(data));

  const updateUE = (ueId: string, data: UpdateUEData) =>
    toResult(() => updateUEMutation.mutateAsync({ ueId, data }));

  const updateCourse = (ueCourseId: string, data: UpdateUECourseData) =>
    toResult(() => updateCourseMutation.mutateAsync({ ueCourseId, data }));

  const requestRemoveCourse = (ueCourseId: string) => {
    setPendingUeCourseId(ueCourseId);
    setDeleteDialogOpen(true);
    return Promise.resolve({ success: true as const });
  };

  const confirmRemoveCourse = async () => {
    if (!pendingUeCourseId) return;
    await toResult(() => removeCourseMutation.mutateAsync(pendingUeCourseId));
    setPendingUeCourseId(null);
  };

  const onDeleteDialogChange = (open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open) setPendingUeCourseId(null);
  };

  return {
    createUE,
    updateUE,
    linkUE,
    unlinkUE,
    createCourse,
    updateCourse,
    requestRemoveCourse,
    deleteDialogOpen,
    onDeleteDialogChange,
    confirmRemoveCourse,
    canUndo: !!lastUndoAction,
    undoLabel: lastUndoAction?.label ?? null,
    undoInProgress,
    undoLastAction,
  };
}
