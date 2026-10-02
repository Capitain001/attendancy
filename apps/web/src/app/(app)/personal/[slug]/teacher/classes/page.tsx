import type { Metadata } from "next";
import Link from "next/link";
import { Archive, ArrowLeft, BookOpen, ChevronRight, Plus, Users } from "lucide-react";
import { personal } from "@/modules/personal/paths";
import { getFeedbackMessage } from "@/utils/server/form/action";
import { getClassesAction } from "@/services/class";
import { createClassFormAction, updateClassFormAction, removeClassFormAction } from "@/services/class/form";
import { checkClassQuotaLimitAction } from "@/services/organization";

export const metadata: Metadata = {
  title: "Mes classes | Attendancy",
  robots: { index: false, follow: false },
};

export default async function PersonalTeacherClassesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  const [route, query] = await Promise.all([params, searchParams]);

  const [classesResult, quotaResult] = await Promise.all([getClassesAction(), checkClassQuotaLimitAction()]);
  const loadError = "error" in classesResult || "error" in quotaResult;
  const classes = ("data" in classesResult ? classesResult.data : undefined) ?? [];
  const { activeCount, maxClasses, limitReached } = ("data" in quotaResult ? quotaResult.data : undefined) ?? {
    activeCount: 0,
    maxClasses: null,
    limitReached: false,
  };

  // canAddClass est purement visuel (masque/affiche le formulaire) — le
  // blocage réel se fait côté DB lors du create (contrainte de quota +
  // tryConstraint/isLimitError déjà en place dans le flux de création).
  const canAddClass = !loadError && !limitReached;

  const homeHref = personal.home(route.slug);
  const classesBaseHref = personal.classes(route.slug);
  const errorMessage = getFeedbackMessage("error", query.error);
  const statusMessage = getFeedbackMessage("status", query.status);

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Link href={homeHref} className="inline-flex items-center gap-1 text-xs text-foreground/40 transition-colors hover:text-foreground/70">
              <ArrowLeft aria-hidden="true" className="size-3" />
              Espace professeur
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Mes classes</h1>
            <p className="text-sm text-foreground/45">
              {activeCount} classe{activeCount === 1 ? "" : "s"} active{activeCount === 1 ? "" : "s"}
              {maxClasses === null ? "" : ` sur ${maxClasses}`}
            </p>
          </div>
        </header>

        {loadError && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Impossible de charger vos classes ou votre quota. Actualisez la page pour réessayer.
          </p>
        )}
        {errorMessage && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </p>
        )}
        {statusMessage && <p role="status" className="text-sm text-foreground/60">{statusMessage}</p>}

        {canAddClass ? (
          <form action={createClassFormAction} className="flex flex-col gap-3 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4 sm:flex-row sm:items-end">
            <label className="grid flex-1 gap-1.5 text-xs font-medium text-foreground/60" htmlFor="new-class-name">
              Nom de la classe
              <input
                id="new-class-name"
                name="name"
                required
                maxLength={100}
                placeholder="Ex. Terminale S1"
                className="h-10 w-full rounded-md border border-foreground/10 bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/30 focus:border-primary/50"
              />
            </label>
            <button
              type="submit"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus aria-hidden="true" className="size-4" />
              Ajouter une classe
            </button>
          </form>
        ) : !loadError ? (
          <p className="rounded-md border border-foreground/10 px-4 py-3 text-sm text-foreground/50">
            Vous avez atteint la limite de classes actives de votre espace.
          </p>
        ) : null}

        {classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-foreground/15 px-6 py-14 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-foreground/5 text-foreground/45">
              <Users aria-hidden="true" className="size-5" />
            </div>
            <div className="grid gap-1">
              <p className="text-sm font-medium text-foreground/70">Aucune classe pour le moment</p>
              <p className="text-xs text-foreground/40">Ajoutez une classe pour commencer à organiser votre activité.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {classes.map((klass) => (
              <article key={klass.id} className="flex flex-col gap-4 rounded-md bg-foreground/5 p-4 transition-colors hover:bg-foreground/[0.07]">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <Link
                      href={`${classesBaseHref}/${encodeURIComponent(klass.id)}`}
                      className="group/class inline-flex max-w-full items-center gap-1 text-sm font-semibold text-foreground/80 hover:text-foreground"
                    >
                      <h2 className="truncate">{klass.name}</h2>
                      <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-foreground/30 transition-transform group-hover/class:translate-x-0.5" />
                    </Link>
                    <p className="text-xs text-foreground/40">
                      {klass.level} · {klass.academicYear.name}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-background/70 px-2.5 py-1 text-[11px] text-foreground/45">
                    {klass.programTrack.name}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-foreground/45">
                  <span className="inline-flex items-center gap-1.5">
                    <Users aria-hidden="true" className="size-3.5" />
                    {klass._count.studentEnrollments} étudiant{klass._count.studentEnrollments === 1 ? "" : "s"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen aria-hidden="true" className="size-3.5" />
                    {klass._count.courses} cours
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 border-t border-foreground/10 pt-3 text-xs">
                  <details className="group">
                    <summary className="cursor-pointer list-none font-medium text-foreground/50 transition-colors hover:text-foreground/80">
                      Renommer
                    </summary>
                    <form action={updateClassFormAction} className="mt-3 flex gap-2">
                      <input type="hidden" name="classId" value={klass.id} />
                      <input
                        name="data.name"
                        defaultValue={klass.name}
                        required
                        maxLength={100}
                        aria-label={`Nouveau nom pour ${klass.name}`}
                        className="h-9 min-w-0 flex-1 rounded-md border border-foreground/10 bg-background px-2.5 text-sm outline-none focus:border-primary/50"
                      />
                      <button type="submit" className="h-9 rounded-md bg-secondary px-3 font-medium text-secondary-foreground hover:bg-secondary/80">
                        Enregistrer
                      </button>
                    </form>
                  </details>

                  <details className="group">
                    <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-foreground/35 transition-colors hover:text-destructive">
                      <Archive aria-hidden="true" className="size-3.5" />
                      Archiver
                    </summary>
                    <form action={removeClassFormAction} className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/20 bg-destructive/5 p-3">
                      <input type="hidden" name="classId" value={klass.id} />
                      <p className="text-xs text-foreground/55">La classe sera retirée de votre liste.</p>
                      <button type="submit" className="h-8 rounded-md bg-destructive px-3 text-xs font-medium text-destructive-foreground hover:bg-destructive/90">
                        Confirmer l'archivage
                      </button>
                    </form>
                  </details>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}