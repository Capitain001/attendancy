import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, Plus } from "lucide-react";
import { personal } from "@/modules/personal/paths";
import { getTeacherCoursesAction } from "@/services/course-teacher";
import { getCurrentTeacherId } from "@/services/teacher";
import { createPersonalClassAction } from "@/services/class";

export const metadata: Metadata = {
  title: "Mes cours | Attendancy",
  robots: { index: false, follow: false },
};

export default async function PersonalTeacherCoursesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const route = await params;

  let coursesResult = await getTeacherCoursesActionSafe();
  if ("error" in coursesResult) {
    // Aucune classe : l'espace n'est pas encore initialisé — on bootstrape
    // la classe personnelle côté serveur et on relance, sans exposer
    // l'aspect administratif à l'utilisateur.
    await createPersonalClassAction();
    coursesResult = await getTeacherCoursesActionSafe();
  }

  const courses = "data" in coursesResult ? coursesResult.data ?? [] : [];

  const classes = new Map<string, { name: string; courses: typeof courses }>();
  for (const course of courses) {
    const entry = classes.get(course.class.id);
    if (entry) entry.courses.push(course);
    else classes.set(course.class.id, { name: course.class.name, courses: [course] });
  }

  const coursesHref = personal.courses(route.slug);
  const homeHref = personal.home(route.slug);

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Link href={homeHref} className="inline-flex items-center gap-1 text-xs text-foreground/40 transition-colors hover:text-foreground/70">
              <ArrowLeft aria-hidden="true" className="size-3" />
              Espace professeur
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Mes cours</h1>
            <p className="text-sm text-foreground/45">
              {courses.length === 0
                ? "Aucun cours pour le moment."
                : `${courses.length} cours.`}
            </p>
          </div>
          <Link
            href={`${coursesHref}/new`}
            className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus aria-hidden="true" className="size-4" />
            Nouveau cours
          </Link>
        </header>

        {classes.size === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-foreground/15 px-6 py-14 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-foreground/5 text-foreground/45">
              <BookOpen aria-hidden="true" className="size-5" />
            </div>
            <div className="grid gap-1">
              <p className="text-sm font-medium text-foreground/70">Aucun cours pour le moment</p>
              <p className="text-xs text-foreground/40">Créez votre premier cours pour commencer à planifier vos séances.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(classes.entries()).map(([classId, entry]) => (
              <section key={classId} className="space-y-2">
                <h2 className="text-sm font-bold text-foreground/70">{entry.name}</h2>
                <div className="rounded-xl border border-foreground/10">
                  <div className="p-1 overflow-hidden rounded-2xl">
                    {entry.courses.map((course, index) => (
                      <Link
                        key={course.id}
                        href={`${coursesHref}/${course.id}`}
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
                        {course.hours !== null && (
                          <span className="inline-flex shrink-0 items-center gap-1 font-mono text-xs tabular-nums text-foreground/30">
                            <Clock aria-hidden="true" className="size-3" />
                            {course.hours}h
                          </span>
                        )}
                        <span
                          className={`size-1.5 shrink-0 rounded-full ${course.isMain ? "bg-foreground/60" : "bg-transparent"}`}
                          aria-label={course.isMain ? "Cours principal" : undefined}
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

async function getTeacherCoursesActionSafe() {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) return { error: "Espace professeur non initialisé" } as const;
  return getTeacherCoursesAction(teacherId);
}
