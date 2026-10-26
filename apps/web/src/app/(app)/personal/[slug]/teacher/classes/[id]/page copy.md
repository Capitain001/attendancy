import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { addMonths, endOfMonth, startOfMonth, subMonths } from "date-fns";
import { ArrowLeft, BookOpen, GraduationCap, Users } from "lucide-react";

import { ClassInvitationsPage } from "@/components/invitation/ClassInvitationsPage";
import { ClassPlanning } from "@/components/planning";
import { personal } from "@/modules/personal/paths";
import { getClassAction } from "@/services/class";
import { getGroupsByClassAction } from "@/services/group";
import { getClassSchedulesAction } from "@/services/schedule";
import { getPlanningResourcesAction } from "@/services/planning";

export const metadata: Metadata = {
  title: "Classe | Attendancy",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function PersonalTeacherClassPage({ params }: PageProps) {
  await connection();
  const { slug, id } = await params;
  const now = new Date();
  const rangeStart = startOfMonth(subMonths(now, 1));
  const rangeEnd = endOfMonth(addMonths(now, 1));

  const [classResult, groupsResult, schedulesResult, resourcesResult] = await Promise.all([
    getClassAction({ classId: id }),
    getGroupsByClassAction(id),
    getClassSchedulesAction(id, rangeStart, rangeEnd),
    getPlanningResourcesAction(id),
  ]);

  const classData = "data" in classResult ? classResult.data : null;
  if (!classData) notFound();

  const groups = "data" in groupsResult ? groupsResult.data ?? [] : [];
  const studentCount = classData._count.studentEnrollments;

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="space-y-6">
        <header className="space-y-3">
          {/* Header avec ArrowLeft à gauche et nom de classe à droite */}
          <div className="flex items-center justify-between gap-4">
            <Link
              href={personal.classes(slug)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              <span>Retour</span>
            </Link>

            <h1 className="text-xl font-bold tracking-tight">{classData.name}</h1>
          </div>

          {/* Badges / Infos de la classe */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Users aria-hidden="true" className="size-3.5" />
              {studentCount} étudiant{studentCount > 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen aria-hidden="true" className="size-3.5" />
              {classData._count.courses} cours
            </span>
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap aria-hidden="true" className="size-3.5" />
              {classData.level}
            </span>
          </div>
        </header>

        {"error" in groupsResult && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Impossible de charger les groupes de cette classe.
          </p>
        )}

        <ClassInvitationsPage
          classId={classData.id}
          className={classData.name}
          groups={groups.map(({ id, name }) => ({ id, name }))}
          title={false}
        />

        <section className="space-y-3 border-t border-border pt-5">
          <h2 className="text-lg font-semibold">Planning de la classe</h2>
          {"error" in schedulesResult ? (
            <p role="alert" className="text-sm text-destructive">{schedulesResult.error}</p>
          ) : "error" in resourcesResult || !resourcesResult.data ? (
            <p role="alert" className="text-sm text-destructive">
              {"error" in resourcesResult ? resourcesResult.error : "Ressources de planning introuvables."}
            </p>
          ) : (
            <>
              {(resourcesResult.data.courses.length === 0 || resourcesResult.data.rooms.length === 0) && (
                <p className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
                  Il faut au moins un cours et une salle pour créer des séances.
                </p>
              )}
              <ClassPlanning
                slug={slug}
                classId={classData.id}
                classHref={`${personal.classes(slug)}/${encodeURIComponent(classData.id)}`}
                resources={resourcesResult.data}
                schedules={schedulesResult.data}
              />
            </>
          )}
        </section>
      </div>
    </main>
  );
}