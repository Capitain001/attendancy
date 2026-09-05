"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  enrollStudentsInClassAction,
  removeStudentEnrollmentAction,
  searchStudentsForEnrollmentAction,
} from "@/services/student-enrollment";
import type {
  GetStudentsEnrollmentsDto,
  SearchStudentsForEnrollmentDto,
} from "@/services/student-enrollment/types";
import { getEnrollmentState, getFullName } from "./enrollment-status";

export interface SelectedStudent {
  id: string;
  label: string;
  email: string;
  avatarUrl: string | null;
}

export function useEnrollmentWorkspace(classId: string, initialRows: GetStudentsEnrollmentsDto) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchStudentsForEnrollmentDto>([]);
  const [selected, setSelected] = useState<SelectedStudent[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectedIds = useMemo(() => new Set(selected.map((student) => student.id)), [selected]);

  function runSearch() {
    startTransition(async () => {
      const response = await searchStudentsForEnrollmentAction({ classId, query });
      if (response.error) {
        toast.error(response.error);
        return;
      }
      setResults(response.data ?? []);
    });
  }

  function toggleStudent(student: SearchStudentsForEnrollmentDto[number]) {
    if (getEnrollmentState(student) === "enrolled") return;

    const label = getFullName(student.user);
    setSelected((current) => {
      if (current.some((item) => item.id === student.id)) {
        return current.filter((item) => item.id !== student.id);
      }
      return [
        ...current,
        { id: student.id, label, email: student.user.email, avatarUrl: student.user.avatar_url },
      ];
    });
  }

  function removeFromSelection(studentId: string) {
    setSelected((current) => current.filter((item) => item.id !== studentId));
  }

  function clearSelection() {
    setSelected([]);
  }

  function submitEnrollment() {
    startTransition(async () => {
      const response = await enrollStudentsInClassAction({
        classId,
        studentIds: selected.map((student) => student.id),
      });

      if (response.error || !response.data) {
        toast.error(response.error ?? "Erreur lors de l'inscription");
        return;
      }

      const summary = response.data.reduce(
        (acc, item) => {
          acc[item.status] += 1;
          return acc;
        },
        { created: 0, reactivated: 0, skipped: 0, failed: 0 },
      );

      toast.success(
        `${summary.created} inscrit(s), ${summary.reactivated} réactivé(s), ${summary.skipped} ignoré(s), ${summary.failed} erreur(s).`,
      );

      setSelected([]);
      setConfirmOpen(false);
      setResults([]);
      setQuery("");
      router.refresh();
    });
  }

  function removeEnrollment(enrollmentId: string) {
    const confirmed = window.confirm(
      "Retirer cet étudiant de la classe ? Cette action pourra être annulée par une réinscription.",
    );
    if (!confirmed) return;

    startTransition(async () => {
      const response = await removeStudentEnrollmentAction(enrollmentId);
      if (response.error) {
        toast.error(response.error);
        return;
      }
      toast.success("Inscription retirée.");
      router.refresh();
    });
  }

  return {
    // recherche
    query,
    setQuery,
    results,
    runSearch,
    toggleStudent,
    // sélection
    selected,
    selectedIds,
    removeFromSelection,
    clearSelection,
    // inscrits actuels
    activeRows: initialRows,
    removeEnrollment,
    // confirmation + soumission
    confirmOpen,
    setConfirmOpen,
    submitEnrollment,
    // état global
    isPending,
  };
}
