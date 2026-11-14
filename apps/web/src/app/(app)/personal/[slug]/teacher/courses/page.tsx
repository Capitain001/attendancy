import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

import { personal } from "@/modules/personal/paths";
import { getPersonalCoursesAction } from "@/features/personal/services/course";

export const metadata: Metadata = {
  title: "Mes cours | Attendancy",
  robots: { index: false, follow: false },
};

interface TeacherCoursesPageProps {
  params: Promise<{ slug: string }>;
}

export default async function TeacherCoursesPage({ params }: TeacherCoursesPageProps) {
  await connection();
  const { slug } = await params;
  const result = await getPersonalCoursesAction();
  const courses = "data" in result ? result.data : null;
  const error = "error" in result ? result.error : null;

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Mes cours</h1>
          <p className="text-sm text-foreground/50">
            {courses
              ? `${courses.length} cours`
              : "Les cours de votre espace personnel"}
          </p>
        </header>

        {error ? (
          <p role="alert" className="border-t border-foreground/10 py-4 text-sm text-destructive">
            Impossible de charger les cours : {error}
          </p>
        ) : courses?.length ? (
          <ul className="divide-y divide-foreground/10 border-y border-foreground/10">
            {courses.map((course) => (
              <li key={course.id}>
                <Link
                  href={`${personal.classes(slug)}/${course.classId}/courses/${course.id}`}
                  className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                >
                  <span className="font-medium">{course.name}</span>
                  <span className="flex shrink-0 gap-4 text-xs tabular-nums text-foreground/50">
                    <span>
                      {course.durationDone ?? 0} h / {course.durationTotal ?? 0} h
                    </span>
                    <span>
                      {course.group?._count.studentGroups ?? 0} inscrit
                      {(course.group?._count.studentGroups ?? 0) === 1 ? "" : "s"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-y border-foreground/10 py-6 text-sm text-foreground/50">
            Aucun cours pour le moment.
          </p>
        )}
      </div>
    </main>
  );
}
