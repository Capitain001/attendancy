import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";

import { personal } from "@/modules/personal/paths";
import { getClassAction } from "@/services/class";
import { NewPersonalCourseForm } from "@/components/personal/teacher/courses/NewPersonalCourseForm";

export const metadata: Metadata = {
  title: "Nouveau cours de la classe | Attendancy",
  robots: { index: false, follow: false },
};

interface ClassCourseNewPageProps {
  params: Promise<{ slug: string; classId: string }>;
}

export default async function ClassCourseNewPage({ params }: ClassCourseNewPageProps) {
  await connection();
  const { slug, classId } = await params;

  const classResult = await getClassAction({ classId });
  const classData = "data" in classResult ? classResult.data : null;
  if (!classData) notFound();

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
          <h1 className="text-2xl font-bold tracking-tight">Nouveau cours</h1>
          <p className="text-sm text-foreground/45">
            Création d&apos;un cours pour la classe <span className="font-semibold text-foreground/70">{classData.name}</span>.
          </p>
        </header>

        <NewPersonalCourseForm
          slug={slug}
          classes={[{ id: classData.id, name: classData.name }]}
        />
      </div>
    </main>
  );
}
