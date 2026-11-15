
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, Calendar, GraduationCap, Users } from "lucide-react";

import { DeletePCourseModal } from "@/components/personal/teacher/courses/DeletePCourseModal";
import { personal } from "@/modules/personal/paths";
import { getCourseDetailAction, removeCourseAction } from "@/services/course";
import { withParams } from "@/utils/server/form/action";
import { getUserInitials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Détail du cours | Attendancy",
  robots: { index: false, follow: false },
};

// ═══ STYLES ═════════════════════════════════════════════════════════════

// Bande de chiffres clés : une seule ligne compacte, fond teinté.
// text-end : libellés et valeurs alignés à la fin de leur colonne (hérité par dt/dd)
// Mobile (2 colonnes) : colonne de gauche collée à gauche, colonne de droite collée à droite
// (les enfants pairs sont en text-end).
// sm+ (1 ligne) : flex justify-between, premier élément à gauche, dernier à droite,
// et l'alignement du texte revient à la normale.
const statsBar =
  "grid grid-cols-2 gap-x-6 gap-y-3 rounded-xs bg-foreground/[0.04] px-4 py-3 sm:flex sm:justify-between [&>div:nth-child(even)]:text-end sm:[&>div:nth-child(even)]:text-start";

const statLabel = "text-[11px] font-medium uppercase tracking-wider text-foreground/60";
const statValue = "text-sm font-semibold tabular-nums";

// Panneau : en-tête teinté + corps sur fond de page.
const panel = "overflow-hidden rounded-xs border border-foreground/15";
const panelHeader = "flex items-center gap-2 bg-foreground/[0.04] px-4 py-3";
const panelTitle = "text-xs font-semibold uppercase tracking-wider text-foreground/75";

// Nombre max de séances listées : le reste est résumé en une ligne.
const MAX_SCHEDULES = 5;

// Date et heure en français. Formatage serveur : aucun JS client.
const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
});
const timeFormat = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

interface ClassCourseDetailPageProps {
  params: Promise<{ slug: string; classId: string; courseId: string }>;
}

export default async function ClassCourseDetailPage({ params }: ClassCourseDetailPageProps) {
  await connection();
  const { slug, classId, courseId } = await params;

  // La classe vient déjà du détail du cours (course.class) : pas d'appel dédié.
  const courseResult = await getCourseDetailAction(courseId);
  const course = "data" in courseResult ? courseResult.data : null;

  // Le cours doit appartenir à la classe de l'URL
  if (!course || course.classId !== classId) {
    notFound();
  }

  const coursesHref = `${personal.classes(slug)}/${classId}/courses`;

  // Server action inline : supprime le cours puis retourne à la liste.
  // courseId vient des params de la page (pas du formulaire).
  async function removeCourseForm() {
    "use server";
    const res = await removeCourseAction(courseId);

    // redirect lève une exception : dernière instruction, hors try/catch.
    // Le cours supprimé n'a plus de page : on retourne à la liste.
    redirect(withParams(coursesHref, res.error ? { error: "remove" } : { status: "remove" }));
  }

  const visibleSchedules = course.schedules.slice(0, MAX_SCHEDULES);
  const hiddenSchedules = course.schedules.length - visibleSchedules.length;

  const teachers = course.teachers.map((item) => {
    const user = item.teacher?.user;

    return {
      ...item,
      user,
      initials: getUserInitials(
        [user?.firstName, user?.lastName].filter(Boolean).join(" "),
      ),
    };
  });

  return (
    <main className="min-h-screen bg-background px-4 pt-4 pb-8 sm:px-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="space-y-4">


          <div className="space-y-2">
            {/* Contexte du cours sur une ligne : classe, semestre, UE rattachée */}
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground/70">
                {/* Lien vers la liste des cours de la classe : remplace l'ancien lien de retour */}
              <Link
                href={coursesHref}
                className="font-medium text-foreground underline-offset-4 transition-colors hover:underline"
              >
                {course.class.name}
              </Link>
              {course.term?.name && <span>{course.term.name}</span>}
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap aria-hidden="true" className="size-3.5" />
                {course.ueCourse.code ? `${course.ueCourse.code} · ` : ""}
                {course.ueCourse.name}
              </span>
            </p>
          </div>
        </header>

        {/* Chiffres clés : une seule bande compacte (liste de définitions) */}
        {/* Ordre : effectif et crédits d'abord, puis durée et séances */}
        <dl className={statsBar}>
          <div className="grid gap-0.5">
            <dt className={statLabel}>Étudiants</dt>
            <dd className={statValue}>{course.class._count.studentEnrollments}</dd>
          </div>
          <div className="grid gap-0.5">
            <dt className={statLabel}>Crédits</dt>
            <dd className={statValue}>{course.credits}</dd>
          </div>
          <div className="grid gap-0.5">
            <dt className={statLabel}>Durée</dt>
            <dd className={statValue}>
              {course.durationDone}h / {course.durationTotal}h
            </dd>
          </div>
          <div className="grid gap-0.5">
            <dt className={statLabel}>Séances</dt>
            <dd className={statValue}>{course.schedules.length}</dd>
          </div>
        </dl>

        {course.description && (
          <p className="border-l-2 border-primary pl-4 text-sm leading-relaxed text-foreground/80">
            {course.description}
          </p>
        )}

        <section className="grid gap-4 lg:grid-cols-2">
          <div className={panel}>
            <div className={panelHeader}>
              <Users aria-hidden="true" className="size-4 text-primary" />
              <h2 className={panelTitle}>Intervenants</h2>
            </div>
            {teachers.length === 0 ? (
              <p className="p-4 text-sm text-foreground/60">Aucun enseignant assigné.</p>
            ) : (
              // divide-y : séparateurs fins entre les lignes
              <ul className="divide-y divide-foreground/10">
                {teachers.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                    {/* Initiales : carré à peine arrondi, cohérent avec le reste */}
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xs font-semibold uppercase text-primary">
                      {item.initials}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {item.user
                        ? `${item.user.firstName} ${item.user.lastName}`
                        : "Enseignant non assigné"}
                    </span>
                    <span className="shrink-0 text-xs text-foreground/60">
                      {item.isMain ? "Principal" : "Secondaire"}
                      {item.hours !== null && ` · ${item.hours}h`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={panel}>
            <div className={panelHeader}>
              <Calendar aria-hidden="true" className="size-4 text-primary" />
              <h2 className={panelTitle}>Séances planifiées</h2>
            </div>
            {course.schedules.length === 0 ? (
              <p className="p-4 text-sm text-foreground/60">Aucune séance planifiée.</p>
            ) : (
              <ul className="divide-y divide-foreground/10">
                {visibleSchedules.map((schedule) => (
                  <li key={schedule.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium capitalize">
                        {dateFormat.format(schedule.startTime)}
                      </p>
                      <p className="text-xs text-foreground/60">
                        {timeFormat.format(schedule.startTime)} – {timeFormat.format(schedule.endTime)}
                        {` · ${schedule.room.name}`}
                      </p>
                    </div>
                    {/* Statut brut : à traduire avec un mapping si les valeurs de l'enum sont en anglais */}
                    <span className="shrink-0 rounded-sm bg-foreground/[0.06] px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-foreground/70">
                      {schedule.status}
                    </span>
                  </li>
                ))}
                {hiddenSchedules > 0 && (
                  <li className="px-4 py-3 text-xs text-foreground/60">
                    + {hiddenSchedules} autre{hiddenSchedules > 1 ? "s" : ""} séance{hiddenSchedules > 1 ? "s" : ""}
                  </li>
                )}
              </ul>
            )}
          </div>
        </section>

        {/* Suppression : en bas, séparée du contenu, action secondaire et discrète */}
        <section className="flex flex-col gap-3 rounded-xs border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-0.5">
            <h2 className="text-sm font-semibold">Supprimer ce cours</h2>
            <p className="text-xs text-foreground/70">
              Le cours et ses séances seront retirés de la classe.
            </p>
          </div>
          <DeletePCourseModal courseName={course.name} action={removeCourseForm} />
        </section>
      </div>
    </main>
  );
}
