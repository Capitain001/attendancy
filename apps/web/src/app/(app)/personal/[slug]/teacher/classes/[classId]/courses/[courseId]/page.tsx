import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, Calendar, Clock, Users } from "lucide-react";

import { personal } from "@/modules/personal/paths";
import { getClassAction } from "@/services/class";
import { getCourseDetailAction } from "@/services/course";

export const metadata: Metadata = {
  title: "Détail du cours | Attendancy",
  robots: { index: false, follow: false },
};

interface ClassCourseDetailPageProps {
  params: Promise<{ slug: string; classId: string; courseId: string }>;
}

export default async function ClassCourseDetailPage({ params }: ClassCourseDetailPageProps) {
  await connection();
  const { slug, classId, courseId } = await params;

  const [classResult, courseResult] = await Promise.all([
    getClassAction({ classId }),
    getCourseDetailAction(courseId),
  ]);

  const classData = "data" in classResult ? classResult.data : null;
  const course = "data" in courseResult ? courseResult.data : null;

  if (!classData || !course || course.classId !== classId) {
    notFound();
  }

  const coursesHref = `${personal.classes(slug)}/${classId}/courses`;

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="space-y-2">
          <Link
            href={coursesHref}
            className="inline-flex items-center gap-1 text-xs text-foreground/40 transition-colors hover:text-foreground/70"
          >
            <ArrowLeft aria-hidden="true" className="size-3" />
            Cours de {classData.name}
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold tracking-tight">{course.name}</h1>
            {course.durationTotal !== null && course.durationTotal !== undefined && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/[0.06] px-3 py-1 text-xs font-mono font-medium text-foreground/70">
                <Clock aria-hidden="true" className="size-3.5" />
                {course.durationDone ?? 0}h / {course.durationTotal}h
              </span>
            )}
          </div>
          <p className="text-sm text-foreground/45">
            Classe : <span className="font-medium text-foreground/70">{classData.name}</span>
            {course.term?.name && ` · Semestre : ${course.term.name}`}
            {course.credits !== null && course.credits !== undefined && ` · ${course.credits} crédits`}
          </p>
        </header>

        {course.description && (
          <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4 text-sm text-foreground/80">
            {course.description}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
              <Users aria-hidden="true" className="size-4 text-primary" />
              <span>Intervenants</span>
            </div>
            {course.teachers.length === 0 ? (
              <p className="text-xs text-foreground/40">Aucun enseignant assigné.</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {course.teachers.map((item) => (
                  <li key={item.id} className="flex items-center justify-between">
                    <span className="font-medium text-foreground/80">
                      {item.teacher?.user
                        ? `${item.teacher.user.firstName} ${item.teacher.user.lastName}`
                        : "Enseignant non assigné"}
                    </span>
                    <span className="text-foreground/40">
                      {item.isMain ? "Principal" : "Secondaire"}
                      {item.hours !== null && ` · ${item.hours}h`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
              <Calendar aria-hidden="true" className="size-4 text-primary" />
              <span>Séances planifiées</span>
            </div>
            {course.schedules.length === 0 ? (
              <p className="text-xs text-foreground/40">Aucune séance planifiée.</p>
            ) : (
              <p className="text-xs text-foreground/70">
                {course.schedules.length} séance{course.schedules.length > 1 ? "s" : ""} au planning.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
