// src/app/(app)/personal/[slug]/teacher/classes/[classId]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  UserPlus,
  Users,
} from "lucide-react";

import { personal } from "@/modules/personal/paths";
import { getClassAction } from "@/services/class";

export const metadata: Metadata = {
  title: "Classe | Attendancy",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ slug: string; classId: string }>;
}

export default async function PersonalTeacherClassPage({ params }: PageProps) {
  await connection();
  const { slug, classId } = await params;
  const classResult = await getClassAction({ classId });
  const classData = "data" in classResult ? classResult.data : null;
  if (!classData) notFound();

  const studentCount = classData._count.studentEnrollments;
  const courseCount = classData._count.courses;
  const groupCount = classData.groups?.length ?? 0;

  const cards = [
    {
      title: "Étudiants & Invitations",
      description: "Inviter des étudiants par lien ou QR code, gérer les inscriptions et les participants.",
      href: `${personal.classes(slug)}/${classId}/invitation`,
      icon: UserPlus,
      badge: `${studentCount} étudiant${studentCount > 1 ? "s" : ""}`,
      actionLabel: "Gérer les invitations",
    },
    {
      title: "Cours & Matières",
      description: "Consulter les cours associés à cette classe et le suivi pédagogique.",
      href: `${personal.classes(slug)}/${classId}/courses`,
      icon: BookOpen,
      badge: `${courseCount} cours`,
      actionLabel: "Voir les cours",
    },
    {
      title: "Planning & Séances",
      description: "Accéder à l'emploi du temps, consulter les créneaux et planifier des séances.",
      href: `${personal.home(slug)}/planning?classId=${encodeURIComponent(classId)}`,
      icon: Calendar,
      badge: "Calendrier",
      actionLabel: "Ouvrir le planning",
    },
    {
      title: "Émargement & Présences",
      description: "Suivre l'assiduité des étudiants, vérifier les check-ins et les absences.",
      href: `${personal.home(slug)}/attendance`,
      icon: ClipboardCheck,
      badge: "Suivi d'assiduité",
      actionLabel: "Voir les présences",
    },
  ];

  return (
    <main className="min-h-screen bg-background px-4 py-4 sm:px-6">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* Header */}
        <header className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            {/* <Link
              href={personal.classes(slug)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              <span>Retour aux classes</span>
            </Link> */}

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
              {courseCount} cours
            </span>
            {groupCount > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Users aria-hidden="true" className="size-3.5" />
                {groupCount} groupe{groupCount > 1 ? "s" : ""}
              </span>
            )}
            {classData.level && (
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap aria-hidden="true" className="size-3.5" />
                {classData.level}
              </span>
            )}
          </div>
        </header>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                className="group relative flex flex-col justify-between rounded-sm border border-foreground/15 bg-foreground/[0.02] p-5 transition-all duration-150 hover:border-foreground/30 hover:bg-foreground/[0.05]"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex size-10 items-center justify-center rounded-lg border border-foreground/10 bg-foreground/[0.04] text-foreground transition-colors group-hover:border-foreground/25 group-hover:bg-foreground/[0.08]">
                      <Icon aria-hidden="true" className="size-5" />
                    </div>
                    <span className="rounded-full bg-foreground/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-foreground/70">
                      {card.badge}
                    </span>
                  </div>

                  <h2 className="mt-4 font-semibold tracking-tight text-foreground/90 transition-colors group-hover:text-foreground">
                    {card.title}
                  </h2>
                  {/* <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {card.description}
                  </p> */}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-foreground/10 pt-3 text-xs font-medium text-foreground/60 transition-colors group-hover:text-foreground">
                  <span>{card.actionLabel}</span>
                  
                  <ChevronRight
                    aria-hidden="true"
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
