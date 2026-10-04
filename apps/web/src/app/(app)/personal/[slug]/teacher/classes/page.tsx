import type { Metadata } from "next";
import Link from "next/link";
import { Archive, ArrowLeft, ChevronRight, Plus, Users } from "lucide-react";
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
          <div className="rounded-xl border border-foreground/10">
            <div className="p-1 overflow-hidden rounded-2xl">
              {classes.map((klass, index) => (
                <article
                  key={klass.id}
                  className="flex flex-col gap-3 px-3 py-4 sm:px-4"
                >
                  {index > 0 && <div className="border-t border-foreground/6 sm:-mt-3 sm:mb-0" />}
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="w-4 shrink-0 text-right font-mono text-[11px] tabular-nums text-foreground/25">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 space-y-0.5">
                        <Link
                          href={`${classesBaseHref}/${encodeURIComponent(klass.id)}`}
                          className="group/class inline-flex max-w-full items-center gap-1 text-sm font-semibold text-foreground/80 hover:text-foreground"
                        >
                          <span className="truncate">{klass.name}</span>
                          <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-foreground/30 transition-transform group-hover/class:translate-x-0.5" />
                        </Link>
                        <p className="text-xs text-foreground/40">
                          {klass.level} · {klass.academicYear.name}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-foreground/30">
                      {klass._count.courses} cours · {klass._count.studentEnrollments} étudiant{klass._count.studentEnrollments === 1 ? "" : "s"}
                    </span>
                  </div>

                  <details className="group">
                    <summary className="inline-flex cursor-pointer list-none items-center gap-4 text-xs text-foreground/35 transition-colors hover:text-foreground/70">
                      <span className="font-medium">Renommer</span>
                      <span className="inline-flex items-center gap-1.5 hover:text-destructive">
                        <Archive aria-hidden="true" className="size-3.5" />
                        Archiver
                      </span>
                    </summary>
                    <div className="mt-3 space-y-3">
                      <form action={updateClassFormAction} className="flex gap-2">
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
                      <form action={removeClassFormAction} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/20 bg-destructive/5 p-3">
                        <input type="hidden" name="classId" value={klass.id} />
                        <p className="text-xs text-foreground/55">La classe sera retirée de votre liste.</p>
                        <button type="submit" className="h-8 rounded-md bg-destructive px-3 text-xs font-medium text-destructive-foreground hover:bg-destructive/90">
                          Confirmer l&apos;archivage
                        </button>
                      </form>
                    </div>
                  </details>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
