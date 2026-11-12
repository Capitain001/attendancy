// src/components/users/list/TClassStudentsScreen.tsx
"use client";

import { useMemo, useState } from "react";
import { Users } from "lucide-react";

import { ResponsiveDrawer } from "@/components/ui/custom/ResponsiveDrawer";
import { StudentAvatar } from "@/components/personal/teacher/student/StudentAvatar";
import { getStudentName } from "@/components/personal/teacher/utils";

import { StudentDetail } from '../students/StudentDetail';
import {
  type StudentEnrollment,
} from  '../students/StudentDetail';
import { StudentFilter } from "../students/StudentFilter";

interface TClassStudentsScreenProps {
  enrollments: StudentEnrollment[];
}

export function TClassStudentsScreen({ enrollments }: TClassStudentsScreenProps) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return enrollments;
    return enrollments.filter(({ student }) => {
      const u = student.user;
      const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase();
      return fullName.includes(q) || u.email.toLowerCase().includes(q);
    });
  }, [enrollments, query]);

  const selected = enrollments.find((e) => e.id === selectedId) ?? null;

  if (enrollments.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground">
        <Users className="size-8" />
        <p className="text-sm">Aucun étudiant inscrit</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-2xl bg-background text-foreground">
      <div className="sticky top-0 z-10 border-b border-border/50 bg-background/90 px-3 py-2 backdrop-blur-md">
        <StudentFilter query={query} setQuery={setQuery} total={enrollments.length} />
      </div>

      {filtered.length === 0 ? (
        <p className="px-4 py-12 text-center text-sm text-muted-foreground">
          Aucun résultat pour «&nbsp;{query}&nbsp;»
        </p>
      ) : (
        <ul className="divide-y divide-border/40">
          {filtered.map((enrollment) => {
            const { id, student } = enrollment;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(id);
                    setOpen(true);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors active:bg-muted/60"
                >
                  <StudentAvatar user={student.user} className="size-10 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-tight">
                      {getStudentName(student.user)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {student.user.email}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <ResponsiveDrawer
        open={open}
        onOpenChange={setOpen}
        title={selected ? getStudentName(selected.student.user) : "Étudiant"}
        description="Détail de l'étudiant"
      >
        {selected && (
          <StudentDetail
            enrollment={selected}
            onClose={() => setOpen(false)}
          />
        )}
      </ResponsiveDrawer>
    </div>
  );
}