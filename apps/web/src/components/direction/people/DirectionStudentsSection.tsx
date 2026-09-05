"use client";

import { useState } from "react";
import { SelectClass } from "./SelectClass";
import { StudentList } from "./StudentList";
import { InviteStudentDialog } from "@/components/invitation/InviteStudentDialog";
import InviteUserPlaceholder from "@/components/invitation/InviteUserPlaceholder";
import { typography } from "@/styles";
import type { GetEnrolledStudentsDto } from "@/services/student";
import type { GetClassesDto } from "@/services/class";
import type { GetGroupsByClassDto } from "@/services/group";

// Dérivés des DTO réels plutôt que redéfinis à la main — évite la dérive
// constatée sur programTrack (marqué optionnel ici alors qu'il est toujours
// présent dans GetClassesDto).
type ClassItem = Pick<GetClassesDto[number], "id" | "name" | "programTrack">;

// GroupOption vient de GetGroupsByClassDto (liste des groupes assignables),
// pas de GetEnrolledStudentsDto.studentGroups[].group (groupes déjà
// assignés à un étudiant) — même forme, source différente.
type GroupOption = Pick<GetGroupsByClassDto[number], "id" | "name">;

interface DirectionStudentsSectionProps {
  classes: ClassItem[];
  selectedClassId: string | null;
  students?: GetEnrolledStudentsDto | null;
  studentsError?: string | null;
  totalStudents?: number;
  groups: GroupOption[];
  slug: string;
  onInvite: (input: {
    email: string;
    firstName?: string;
    lastName?: string;
    groupIds?: string[];
    parentEmail?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

export function DirectionStudentsSection({
  classes,
  selectedClassId,
  students,
  studentsError,
  totalStudents,
  groups,
  slug,
  onInvite,
}: DirectionStudentsSectionProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const count = selectedClassId ? students?.length : totalStudents;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-text-primary">Étudiants</h1>
        <div className="flex items-center gap-4">
          {count != null && (
            <span className={typography.small}>
              {count} étudiant{count !== 1 ? "s" : ""}
              {!selectedClassId && " au total"}
            </span>
          )}

          <div title={!selectedClassId ? "Créez une classe d'abord" : undefined}>
            <InviteStudentDialog
              open={inviteDialogOpen}
              onOpenChange={setInviteDialogOpen}
              groups={groups}
              onSubmit={onInvite}
              disabled={!selectedClassId}
            />
          </div>
        </div>
      </div>

      <SelectClass classes={classes} value={selectedClassId} />

      {classes.length === 0 ? (
        <InviteUserPlaceholder
          title="Aucune classe existante"
          subtitle="Vous devez d'abord créer une promotion (classe) avant de pouvoir inviter des étudiants."
        />
      ) : !selectedClassId ? (
        <p className={typography.body}>
          Sélectionnez une classe pour voir les étudiants.
        </p>
      ) : studentsError ? (
        <p className={typography.body}>{studentsError}</p>
      ) : students && students.length > 0 ? (
        <StudentList enrollments={students} slug={slug} />
      ) : (
        <InviteUserPlaceholder
          title="Inviter vos premiers étudiants"
          subtitle="Ajoutez des étudiants à cette classe."
          onCreateLink={() => setInviteDialogOpen(true)}
        />
      )}
    </div>
  );
}
