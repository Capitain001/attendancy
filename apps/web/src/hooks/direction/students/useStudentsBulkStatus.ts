// src/hooks/direction/students/useStudentsBulkStatus.ts
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { StudentRow } from "@/components/direction/students/ui/studentDirectory.helpers";
import { bulkSetStudentStatusAction } from "@/services/student";

type BulkStatus = "ACTIVE" | "INACTIVE";

/**
 * Action de masse : (dés)activation des étudiants sélectionnés.
 * Préoccupation unique : la mutation serveur + son feedback.
 * `onSuccess` permet à l'appelant de réinitialiser la sélection.
 */
export function useStudentsBulkStatus({
  selectedRows,
  onSuccess,
}: {
  selectedRows: StudentRow[];
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function bulkStatus(status: BulkStatus) {
    const ids = selectedRows.map((s) => s.id);
    startTransition(async () => {
      const res = await bulkSetStudentStatusAction(ids, status);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      const verb = status === "INACTIVE" ? "désactivé" : "réactivé";
      toast.success(`${res.data.count} étudiant(s) ${verb}`);
      onSuccess?.();
      router.refresh();
    });
  }

  return { isPending, bulkStatus };
}
