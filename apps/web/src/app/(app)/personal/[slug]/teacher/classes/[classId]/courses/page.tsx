import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, BookOpen, Clock } from "lucide-react";

import { personal } from "@/modules/personal/paths";
import { getFeedback } from "@/utils/server/form/action";
import { validateUUID } from "@/utils/server/validation";
import { getPersonalClassesAction } from "@/features/personal/services/class";
import { getPersonalCoursesAction } from "@/features/personal/services/course";
import { FeedbackToast } from "@/components/tools/toast/FeedbackToast";
import { CreatePCourseModal } from "@/components/personal/teacher/courses/CreatePCourseModal";

export const metadata: Metadata = {
  title: "Mes cours | Attendancy",
  robots: { index: false, follow: false },
};

interface ClassCoursesPageProps {
  params: Promise<{ slug: string; classId: string }>;
  searchParams: Promise<{ error?: string; status?: string }>;
}

export default async function ClassCoursesPage({ params, searchParams }: ClassCoursesPageProps) {
  await connection();
  const [{ slug, classId: rawClassId }, query] = await Promise.all([params, searchParams]);

  // Validé en amont : un id malformé donne un 404 avant toute requête.
  const classId = validateUUID(rawClassId);

  const [classResult, coursesResult] = await Promise.all([
    getPersonalClassesAction({ classId }),
    getPersonalCoursesAction({ classId }),
  ]);

  // Filtrée sur classId : une seule entrée si la classe appartient à
  // l'utilisateur, aucune sinon (id valide mais étranger à son espace).
  const classData = "data" in classResult ? classResult.data?.[0] : undefined;
  if (!classData) notFound();

  const courses = "data" in coursesResult && coursesResult.data ? coursesResult.data : [];
  const feedback = getFeedback("course", query);
  const classBaseHref = `${personal.classes(slug)}/${classId}`;
  const coursesBaseHref = `${classBaseHref}/courses`;

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Link
              href={classBaseHref}
              className="inline-flex items-center gap-1 text-xs text-foreground/40 transition-colors hover:text-foreground/70"
            >
              <ArrowLeft aria-hidden="true" className="size-3" />
              {classData.name}
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Cours de la classe</h1>
            <p className="text-sm text-foreground/45">
              {courses.length === 0
                ? "Aucun cours associé à cette classe."
                : `${courses.length} cours associé${courses.length > 1 ? "s" : ""}.`}
            </p>
          </div>
          <CreatePCourseModal classId={classId} withGroup={classData.type === "THEMATIC"} />
        </header>

        <FeedbackToast error={feedback.error} status={feedback.status} />

        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-foreground/15 px-6 py-14 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-foreground/5 text-foreground/45">
              <BookOpen aria-hidden="true" className="size-5" />
            </div>
            <div className="grid gap-1">
              <p className="text-sm font-medium text-foreground/70">Aucun cours pour cette classe</p>
              <p className="text-xs text-foreground/40">
                Créez un cours pour cette classe pour commencer à planifier les séances.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-foreground/10">
            <div className="p-1 overflow-hidden rounded-2xl">
              {courses.map((course, index) => (
                <Link
                  key={course.id}
                  href={`${coursesBaseHref}/${course.id}`}
                  className="group/row flex h-14 items-center gap-3 px-3 text-sm transition-colors bg-foreground/2 sm:h-10 sm:rounded-lg sm:bg-transparent sm:hover:bg-foreground/5"
                >
                  <span className="w-4 shrink-0 text-right font-mono text-[11px] tabular-nums text-foreground/25">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="h-px w-3 shrink-0 bg-foreground/10" />
                  <span className="truncate text-foreground/70 group-hover/row:text-foreground">
                    {course.name}
                  </span>
                  <span className="h-px flex-1 bg-foreground/10" />
                  <span className="inline-flex shrink-0 items-center gap-1 font-mono text-xs tabular-nums text-foreground/30">
                    <Clock aria-hidden="true" className="size-3" />
                    {course.durationTotal}h
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}