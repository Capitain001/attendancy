//data :

const invitations: {
    id: string;
    email: string;
    createdAt: Date;
    expiresAt: Date | null;
    status: InvitationStatus;
    usedAt: Date | null;
    details: DatabaseInvitationDetails | null;
    role: string | null;
}[]

const enrollments: {
    classId: string;
    id: string;
    studentId: string;
    createdAt: Date;
    endedAt: Date | null;
    student: {
        id: string;
        user: {
            avatar_url: string | null;
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
        };
    };
    studentGroups: {
        id: string;
        group: {
            name: string;
            id: string;
        };
    }[];
}[]

'available' is declared but its value is never read.ts(6133)
const available: {
    id: string;
    user: {
        avatar_url: string | null;
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
    };
}[]


'acceptedInvitations' is declared but its value is never read.ts(6133)
const acceptedInvitations: {
    id: string;
    email: string;
    createdAt: Date;
    expiresAt: Date | null;
    status: InvitationStatus;
    usedAt: Date | null;
    details: DatabaseInvitationDetails | null;
    role: string | null;
}[]

"use client";

import { useMemo } from "react";
import { useStudents } from "../student/useStudents";
import { useClassEnrollments } from "./useClassEnrollments";
import { excludeByIds } from "@/lib/filter";

/** Étudiants de l'org non inscrits activement dans la classe (liste complète, sans recherche). */
export function useAvailableStudents(classId: string) {
  const students = useStudents();
  const enrollments = useClassEnrollments(classId);

  const available = useMemo(
    () => excludeByIds(students.students, enrollments.enrollments.map((e) => e.studentId)),
    [students.students, enrollments.enrollments],
  );

  return {
    available,
    isLoading: students.isLoading || enrollments.isLoading,
    error: students.error ?? enrollments.error ?? null,
  };
}

//apps\web\src\hooks\data\student-enrollments\useClassEnrollments.ts
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

// src/hooks/data/invitation/use-class-invitations.ts
'use client'
// Invitations d'une classe (écran Direction/classe) + mutations inviteStudent / inviteStudentsBulk.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getClassInvitationsAction,
  inviteStudent,
  inviteStudentsAction,
} from '@/modules/invitation'
import type { InviteStudentsBulkInput } from '@/modules/invitation/student'
import { toast } from 'sonner'
import { CACHE_KEYS } from '@/cache/client/key'
import { useInvitationMutations, invalidateInvitationQueries, copyLinkOrToast } from './useInvitationMutations'

type InviteStudentVars = Parameters<typeof inviteStudent>[0]
type InviteStudentsBulkVars = Omit<InviteStudentsBulkInput, 'classId'>

type UseClassInvitationsOptions = {
  /** Livraison du lien créé. Défaut : copie dans le presse-papiers + toast. */
  deliverLink?: (link: string, message?: string) => void | Promise<void>
  /** Toast d'erreur sur échec. Défaut : true. Mettre false si l'appelant affiche l'erreur lui-même. */
  toastError?: boolean
}

export function useClassInvitations(classId: string, opts: UseClassInvitationsOptions = {}) {
  const { toastError = true } = opts
  const deliverLink =
    opts.deliverLink ??
    ((link: string, message?: string) => copyLinkOrToast(link, message ?? "Lien d'invitation copié"))

  const qc = useQueryClient()
  const classKey = CACHE_KEYS.INVITATIONS.BY_CLASS(classId)

  // extraInvalidateKeys : un resend/revoke fait ici invalide aussi la portée classe,
  // en plus de ALL/STATS déjà gérés par le hook partagé.
  const { resend, revoke } = useInvitationMutations({ extraInvalidateKeys: [classKey] })

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: classKey,
    queryFn: async () => {
      const r = await getClassInvitationsAction({ classId })
      if ('error' in r) throw new Error(r.error)
      return r.data
    },
    enabled: !!classId,
  })

  const inviteStudentMut = useMutation({
    mutationFn: (vars: InviteStudentVars) => inviteStudent(vars),
    onSuccess: async (r) => {
      if (!r.success) {
        if (toastError) toast.error(r.error ?? "Envoi de l'invitation impossible.")
        return
      }
      invalidateInvitationQueries(qc, [classKey])
      if (r.link) await deliverLink(r.link, r.message)
      else toast.success(r.message ?? 'Invitation envoyée')
    },
    onError: () => {
      if (toastError) toast.error("Envoi de l'invitation impossible.")
    },
  })

  const inviteStudentsBulkMut = useMutation({
    mutationFn: (vars: InviteStudentsBulkVars) =>
      inviteStudentsAction({ ...vars, classId }),
    onSuccess: async (r) => {
      if ('error' in r) {
        if (toastError) toast.error(r.error)
        return
      }
      invalidateInvitationQueries(qc, [classKey])
      if (r.data.status === 'ok') {
        toast.success(`${r.data.succeeded.length} invitation(s) envoyée(s)`)
      } else if (r.data.status === 'partial') {
        toast.warning(
          `${r.data.succeeded.length} invitation(s) envoyée(s), ${r.data.failed.length} échouée(s)`
        )
      } else if (toastError) {
        toast.error("Toutes les invitations du lot ont échoué")
      }
    },
    onError: (err) => {
      if (toastError) toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi du lot")
    },
  })

  return {
    invitations,
    isLoading,
    inviteStudent: inviteStudentMut,
    inviteStudentsBulk: inviteStudentsBulkMut,
    resend,
    revoke,
  }
}
