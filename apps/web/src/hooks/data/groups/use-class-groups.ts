"use client";

// Cache TanStack des groupes d'une classe — partagé entre la liste (GroupsManager)
// et le modal (GroupManageDialog). Hydraté côté serveur → aucune refetch « à chaque
// ouverture ». Mutations en update OPTIMISTE (setQueryData) + invalidation de réconciliation.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getClassGroupsAction,
  getGroupEligibleStudentsAction,
  createGroupAction,
  setGroupStudentsAction,
  updateGroupAction,
  removeGroupAction,
} from "@/services/group";
import { CACHE_KEYS, QUERY_PRESETS } from "@/config/client_cache";

type GroupsRes = Awaited<ReturnType<typeof getClassGroupsAction>>;
export type GroupRow = {
  id: string;
  name: string;
  description: string | null;
  _count: { studentGroups: number };
};

function extract(res: GroupsRes | undefined) {
  return res && "data" in res && res.data ? res.data : undefined;
}

export function useClassGroups(classId: string) {
  const qc = useQueryClient();
  const key = CACHE_KEYS.GROUPS.BY_CLASS(classId);

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => getClassGroupsAction({ classId }),
    enabled: !!classId,
    ...QUERY_PRESETS.DASHBOARD,
  });

  const payload = extract(data);
  const groups = payload?.groups ?? [];
  const classInfo = payload?.class ?? null;

  /** Patch immutable de la liste de groupes dans le cache. */
  function patchGroups(updater: (groups: GroupRow[]) => GroupRow[]) {
    qc.setQueryData<GroupsRes>(key, (old) => {
      if (!old || !("data" in old) || !old.data) return old;
      return { data: { ...old.data, groups: updater(old.data.groups) } };
    });
  }

  // ── Création (append optimiste à la réponse serveur) ──
  const createMutation = useMutation({
    mutationFn: (input: { name: string; description?: string }) =>
      createGroupAction({ classId, ...input }),
    onSuccess: (res) => {
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      if ("data" in res && res.data) patchGroups((g) => [...g, res.data]);
    },
    onError: () => toast.error("Création impossible."),
  });

  // ── Renommer / description (optimiste) ──
  const updateMutation = useMutation({
    mutationFn: (input: { groupId: string; name?: string; description?: string | null }) =>
      updateGroupAction({ classId, ...input }),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<GroupsRes>(key);
      patchGroups((g) =>
        g.map((x) =>
          x.id === input.groupId
            ? {
                ...x,
                name: input.name ?? x.name,
                description:
                  input.description !== undefined ? input.description : x.description,
              }
            : x,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast.error("Mise à jour impossible.");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  // ── Suppression (soft) — optimiste ──
  const deleteMutation = useMutation({
    mutationFn: (groupId: string) => removeGroupAction(groupId),
    onMutate: async (groupId) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<GroupsRes>(key);
      patchGroups((g) => g.filter((x) => x.id !== groupId));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast.error("Suppression impossible.");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  // ── Membres (set/diff) — optimiste sur le compteur + invalide les éligibles ──
  const setMembersMutation = useMutation({
    mutationFn: (input: { groupId: string; enrollmentIds: string[] }) =>
      setGroupStudentsAction({ classId, ...input }),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<GroupsRes>(key);
      patchGroups((g) =>
        g.map((x) =>
          x.id === input.groupId
            ? { ...x, _count: { studentGroups: input.enrollmentIds.length } }
            : x,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast.error("Mise à jour des membres impossible.");
    },
    onSettled: (_d, _e, input) => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({
        queryKey: CACHE_KEYS.GROUPS.ELIGIBLE(classId, input.groupId),
      });
    },
  });

  return {
    groups,
    classInfo,
    isLoading,
    createGroup: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateGroup: updateMutation.mutateAsync,
    deleteGroup: deleteMutation.mutateAsync,
    setMembers: setMembersMutation.mutateAsync,
    isSavingMembers: setMembersMutation.isPending,
  };
}

/** Étudiants éligibles d'un groupe (modal) — caché par (classId, groupId). */
export function useGroupEligibleStudents(
  classId: string,
  groupId: string | null,
  enabled: boolean,
) {
  const { data, isLoading } = useQuery({
    queryKey: CACHE_KEYS.GROUPS.ELIGIBLE(classId, groupId ?? "none"),
    queryFn: () =>
      getGroupEligibleStudentsAction({ classId, groupId: groupId as string }),
    enabled: enabled && !!groupId,
    ...QUERY_PRESETS.DASHBOARD,
  });

  const payload = data && "data" in data && data.data ? data.data : undefined;
  return { students: payload?.students ?? [], isLoading };
}
