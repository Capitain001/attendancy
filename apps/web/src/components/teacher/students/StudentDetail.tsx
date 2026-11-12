// src/components/users/list/StudentDetailContent.tsx
import { Mail, Phone, X } from "lucide-react";

import type { getStudentsEnrollmentsAction } from "@/services/student-enrollment";
import { StudentAvatar } from "@/components/personal/teacher/student/StudentAvatar";
import { getStudentName } from "@/components/personal/teacher/utils";

export type EnrollmentDTO = NonNullable<
    Extract<
        Awaited<ReturnType<typeof getStudentsEnrollmentsAction>>,
        { data: unknown }
    >["data"]
>[number];

export type StudentEnrollment = Pick<
    EnrollmentDTO,
    "id" | "createdAt" | "student" | "studentGroups"
>;

export function StudentDetail({
    enrollment,
    onClose,
}: {
    enrollment: StudentEnrollment;
    onClose: () => void;
}) {
    const { student, studentGroups, createdAt } = enrollment;
    const { user } = student;
    const name = getStudentName(user);

    return (
        <div className="flex h-full flex-col overflow-y-auto">
            <div className="flex justify-end px-3 pt-3 lg:hidden">
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fermer"
                    className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                    <X className="size-5" />
                </button>
            </div>

            <div className="flex flex-col items-center gap-2 px-6 pb-6 pt-4 text-center">
                <StudentAvatar user={user} className="size-20" />
                <h2 className="text-lg font-semibold leading-tight">{name}</h2>
                <p className="text-xs text-muted-foreground">
                    Inscrit depuis le{" "}
                    {createdAt.toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    })}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-2 px-4">
                {user.phone ? (
                    <a
                        href={`tel:${user.phone}`}
                        className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground"
                    >
                        <Phone className="size-4" />
                        Appeler
                    </a>
                ) : (
                    <span className="flex h-11 items-center justify-center gap-2 rounded-xl bg-muted text-sm text-muted-foreground">
                        <Phone className="size-4" />
                        Indisponible
                    </span>
                )}
                <a
                    href={`mailto:${user.email}`}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium"
                >
                    <Mail className="size-4" />
                    Mail
                </a>
            </div>

            <dl className="mt-6 divide-y divide-border/40 px-4 text-sm">
                <div className="flex justify-between gap-4 py-3">
                    <dt className="text-muted-foreground">Email</dt>
                    <dd className="truncate font-medium">{user.email}</dd>
                </div>
                <div className="flex justify-between gap-4 py-3">
                    <dt className="text-muted-foreground">Téléphone</dt>
                    <dd className="font-medium">
                        {user.phone || "Non renseigné"}
                    </dd>
                </div>
                <div className="flex justify-between gap-4 py-3">
                    <dt className="text-muted-foreground">Groupes</dt>
                    <dd className="flex flex-wrap justify-end gap-1">
                        {studentGroups.length === 0 ? (
                            <span className="text-muted-foreground">Aucun</span>
                        ) : (
                            studentGroups.map(({ id, group }) => (
                                <span
                                    key={id}
                                    className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium"
                                >
                                    {group.name}
                                </span>
                            ))
                        )}
                    </dd>
                </div>
            </dl>
        </div>
    );
}