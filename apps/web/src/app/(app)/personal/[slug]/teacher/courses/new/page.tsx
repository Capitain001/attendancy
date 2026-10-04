import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { personal } from "@/modules/personal/paths";
import { getClassesAction, createPersonalClassAction } from "@/services/class";
import { NewPersonalCourseForm } from "@/components/teacher/personal/courses/NewPersonalCourseForm";

export const metadata: Metadata = {
  title: "Nouveau cours | Attendancy",
  robots: { index: false, follow: false },
};

export default async function PersonalTeacherCourseNewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const route = await params;

  let classesResult = await getClassesAction();
  if ("error" in classesResult) {
    // Aucune classe : l'espace n'est pas encore initialisé — on bootstrape
    // la classe personnelle côté serveur et on relance, sans exposer
    // l'aspect administratif à l'utilisateur.
    await createPersonalClassAction();
    classesResult = await getClassesAction();
  }

  const classes = ("data" in classesResult ? classesResult.data : undefined) ?? [];

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="space-y-2">
          <Link
            href={personal.courses(route.slug)}
            className="inline-flex items-center gap-1 text-xs text-foreground/40 transition-colors hover:text-foreground/70"
          >
            <ArrowLeft aria-hidden="true" className="size-3" />
            Mes cours
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Nouveau cours</h1>
        </header>

        <NewPersonalCourseForm
          slug={route.slug}
          classes={classes.map((klass) => ({ id: klass.id, name: klass.name }))}
        />
      </div>
    </main>
  );
}
