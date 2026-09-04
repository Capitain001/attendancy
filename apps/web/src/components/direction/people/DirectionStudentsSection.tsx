"use client";

import { useState } from "react";
import { SelectClass } from "./SelectClass";
import { StudentList } from "./StudentList";
import { InviteStudentDialog } from "@/components/invitation/InviteStudentDialog";
import InviteUserPlaceholder from "@/components/invitation/InviteUserPlaceholder";
import { typography } from "@/styles";

type ClassItem = {
  id: string;
  name: string;
  programTrack?: { name: string };
};

interface DirectionStudentsSectionProps {
  classes: ClassItem[];
  selectedClassId: string | null;
  students?: Array<any> | null;
  studentsError?: string | null;
  groups: { id: string; name: string }[];
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
  groups,
  slug,
  onInvite,
}: DirectionStudentsSectionProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const hasStudents = students && students.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-text-primary">Étudiants</h1>
        <div className="flex items-center gap-4">
          {students != null && (
            <span className={typography.small}>
              {students.length} étudiant{students.length !== 1 ? "s" : ""}
            </span>
          )}
          {selectedClassId && (
            <InviteStudentDialog
              open={inviteDialogOpen}
              onOpenChange={setInviteDialogOpen}
              groups={groups}
              onSubmit={onInvite}
            />
          )}
        </div>
      </div>

      <SelectClass classes={classes} value={selectedClassId} />

      {!selectedClassId ? (
        <p className={typography.body}>
          Sélectionnez une classe pour voir les étudiants.
        </p>
      ) : studentsError ? (
        <p className={typography.body}>{studentsError}</p>
      ) : hasStudents ? (
        <StudentList enrollments={students} slug={slug} />
      ) : (
        <InviteUserPlaceholder
          title="Inviter vos premiers étudiants"
          subtitle="Ajoutez des étudiants à votre université"
          onCreateLink={() => setInviteDialogOpen(true)}
        />
      )}
    </div>
  );
}


