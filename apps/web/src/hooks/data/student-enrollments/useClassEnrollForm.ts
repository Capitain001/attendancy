"use client";

import { useMemo, useState } from "react";

import {
  isInvitationPending, normalizeEmail, parseEmails,
} from "@/components/personal/teacher/utils";
import { useClassGroups } from "@/hooks/data/groups/use-class-groups";
import { useClassInvitations } from "@/hooks/data/invitation/use-class-invitations";
import { useSelection } from "@/hooks/utils/use-selection";
import { isValidEmail } from "@/modules/invitation/validation";
import type { InviteStudentsBulkInput } from "@/modules/invitation/student";
import { useAvailableStudents } from "./useAvailableStudents";
import { useClassEnrollments } from "./useClassEnrollments";
import { useUserFilter } from "./useUserFilter";

type BulkStudent = InviteStudentsBulkInput["students"][number];

interface Params {
  classId: string;
  onClose: () => void;
}

export function useClassEnrollForm({ classId, onClose }: Params) {
  const { available, isLoading } = useAvailableStudents(classId);
  const { enrollments } = useClassEnrollments(classId);
  const { invitations, inviteStudentsBulk } = useClassInvitations(classId); // toasts + invalidation déjà gérés
  const { groups, isLoading: isLoadingGroups } = useClassGroups(classId);

  const studentSelection = useSelection(); // ids = Student.id (liste `available`)
  const groupSelection = useSelection();   // ids = Group.id, partagés par tout le lot

  const [newEmails, setNewEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [emailIssues, setEmailIssues] = useState<string[]>([]);
  const [failures, setFailures] = useState<{ email: string; error: string }[]>([]);

  // ── Références pour la détection de doublons ────────────────────────────────
  const pendingEmails = useMemo(
    () => new Set(invitations.filter((i) => isInvitationPending(i)).map((i) => normalizeEmail(i.email))),
    [invitations],
  );
  const enrolledEmails = useMemo(
    () => new Set(enrollments.map((e) => normalizeEmail(e.student.user.email))),
    [enrollments],
  );
  const availableByEmail = useMemo(
    () => new Map(available.map((s) => [normalizeEmail(s.user.email), s])),
    [available],
  );

  const isPending = (email: string) => pendingEmails.has(normalizeEmail(email));

  // ── Liste filtrée et sélection ──────────────────────────────────────────────
  const { query, setQuery, filtered } = useUserFilter(available);

  const selectable = useMemo(
    () => filtered.filter((s) => !pendingEmails.has(normalizeEmail(s.user.email))),
    [filtered, pendingEmails],
  );
  const allSelected = selectable.length > 0 && selectable.every((s) => studentSelection.has(s.id));

  // « Tout sélectionner » agit sur le résultat filtré sélectionnable ; le reste est conservé.
  const toggleAll = () => {
    const ids = selectable.map((s) => s.id);
    studentSelection.replace(
      allSelected
        ? studentSelection.ids.filter((id) => !ids.includes(id))
        : [...studentSelection.ids, ...ids],
    );
  };

  // ── Ajout d'emails (collage multiple accepté) ───────────────────────────────
  const addEmails = (raw: string) => {
    const issues: string[] = [];
    const nextEmails = new Set(newEmails);
    const nextIds = new Set(studentSelection.ids);

    for (const email of parseEmails(raw)) {
      const known = availableByEmail.get(email);
      if (!isValidEmail(email)) issues.push(`${email} : email invalide`);
      else if (enrolledEmails.has(email)) issues.push(`${email} : déjà inscrit dans la classe`);
      else if (pendingEmails.has(email)) issues.push(`${email} : invitation déjà en attente`);
      else if (known) nextIds.add(known.id); // étudiant connu de l'org : on le coche
      else nextEmails.add(email);
    }

    setNewEmails([...nextEmails]);
    studentSelection.replace(nextIds);
    setEmailIssues(issues);
    setEmailInput("");
  };

  const removeEmail = (email: string) => setNewEmails((prev) => prev.filter((e) => e !== email));

  // ── Soumission ──────────────────────────────────────────────────────────────
  const selectedStudents = useMemo(
    () => available.filter((s) => studentSelection.has(s.id)),
    [available, studentSelection],
  );
  const totalCount = selectedStudents.length + newEmails.length;

  const submit = async () => {
    if (totalCount === 0) return;

    const students: BulkStudent[] = [
      ...selectedStudents.map((s) => ({
        email: normalizeEmail(s.user.email),
        firstName: s.user.firstName ?? undefined,
        lastName: s.user.lastName ?? undefined,
      })),
      ...newEmails.map((email) => ({ email })),
    ];

    try {
      const res = await inviteStudentsBulk.mutateAsync({
        students,
        // « email » : compte existant → inbox sans email Supabase, nouveau → email d'accueil.
        deliveryMethod: "email",
        ...(groupSelection.count > 0 ? { groupIds: groupSelection.ids } : {}),
      });
      if ("error" in res) return; // toast géré par le hook, le modal reste ouvert

      const failed = res.data.failed;
      if (failed.length === 0) return onClose();

      // Seuls les échecs restent sélectionnés pour un nouvel essai.
      const failedEmails = new Set(failed.map((f) => normalizeEmail(f.email)));
      studentSelection.replace(
        selectedStudents.filter((s) => failedEmails.has(normalizeEmail(s.user.email))).map((s) => s.id),
      );
      setNewEmails((prev) => prev.filter((e) => failedEmails.has(e)));
      setFailures(failed);
    } catch {
      // toast géré par onError du hook
    }
  };

  return {
    isLoading,
    // emails saisis
    emailInput, setEmailInput, addEmails, newEmails, removeEmail, emailIssues,
    // liste des disponibles
    query, setQuery,
    students: filtered,
    isSelected: studentSelection.has,
    toggle: studentSelection.toggle,
    allSelected, toggleAll,
    isPending,
    // groupes
    groups, isLoadingGroups, groupSelection,
    // envoi
    totalCount,
    submit,
    isSending: inviteStudentsBulk.isPending,
    failures,
  };
}