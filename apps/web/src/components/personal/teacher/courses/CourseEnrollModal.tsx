// courses/CourseEnrollModal.tsx
"use client";

import { getStudentName } from "@/components/personal/teacher/utils";
import { StudentAvatar } from "@/components/personal/teacher/student/StudentAvatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { PersonalCourseItem } from "@/features/personal/services/course";
import { useCourseEnrollForm } from "@/hooks/data/student-enrollments/useCourseEnrollForm";

const EMPTY_LABELS = {
  "no-students": "Cette classe n'a pas encore d'étudiants.",
  "all-enrolled": "Tous les étudiants de la classe sont déjà dans ce cours.",
} as const;

interface Props {
  classId: string;
  course: PersonalCourseItem;
  onClose: () => void;
}

// Monté uniquement quand un cours est sélectionné (key={course.id}) :
// sélection et recherche se réinitialisent à chaque ouverture.
export function CourseEnrollModal({ classId, course, onClose }: Props) {
  const f = useCourseEnrollForm({ classId, course, onClose });

  return (
    <Dialog open onOpenChange={(open) => !open && !f.isEnrolling && onClose()}>
      <DialogContent className="top-0 left-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 sm:max-w-none">
        <DialogHeader className="border-b px-6 py-4 text-left">
          <DialogTitle>Ajouter des étudiants</DialogTitle>
          <DialogDescription>{course.name}</DialogDescription>
        </DialogHeader>

        {f.emptyReason ? (
          <p className="flex flex-1 items-center justify-center px-6 text-sm text-muted-foreground">
            {EMPTY_LABELS[f.emptyReason]}
          </p>
        ) : (
          <>
            <div className="border-b px-6 py-3">
              <div className="mx-auto max-w-3xl space-y-3">
                <Input
                  placeholder="Rechercher (nom, email)…"
                  value={f.query}
                  onChange={(e) => f.setQuery(e.target.value)}
                />
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={f.allSelected}
                      onCheckedChange={f.toggleAll}
                      disabled={f.filteredEnrollments.length === 0}
                    />
                    Tout sélectionner
                  </label>
                  <span className="text-muted-foreground">{f.selectedCount} sélectionné(s)</span>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <ul className="mx-auto grid max-w-3xl gap-1 sm:grid-cols-2">
                {f.filteredEnrollments.map(({ student }) => (
                  <li key={student.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted">
                      <Checkbox
                        checked={f.isSelected(student.id)}
                        onCheckedChange={() => f.toggle(student.id)}
                      />
                      <StudentAvatar user={student.user} className="size-9" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{getStudentName(student.user)}</p>
                        <p className="truncate text-xs text-muted-foreground">{student.user.email}</p>
                      </div>
                    </label>
                  </li>
                ))}
                {f.filteredEnrollments.length === 0 && (
                  <li className="col-span-full py-4 text-center text-sm text-muted-foreground">
                    Aucun résultat
                  </li>
                )}
              </ul>
            </div>
          </>
        )}

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={f.isEnrolling}>
            Annuler
          </Button>
          <Button onClick={f.submit} disabled={f.isEnrolling || f.selectedCount === 0}>
            {f.isEnrolling ? "Ajout…" : `Ajouter (${f.selectedCount})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}