import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Plus, Users } from "lucide-react";
import { personal } from "@/modules/personal/paths";
import { getFeedback } from "@/utils/server/form/action";
import { resolveClassesData } from "@/services/personal/actions/classe.mutations";
import { resolveSlugPaths } from "@/lib/paths";
import { PersonalClassCard } from "@/components/teacher/personal/class/PersonalClassCard";
import { CreateClassModal } from "@/components/teacher/personal/class/CreateClassModal";
import { FeedbackToast } from "@/components/tools/toast/FeedbackToast";

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
  const [{ slug }, query] = await Promise.all([params, searchParams]);

  const { classes, quota, loadError, canAddClass } = await resolveClassesData();
  const hrefs = resolveSlugPaths(slug, personal);
  const feedback = getFeedback(query);

  const activeCount = quota?.activeCount ?? 0;

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="space-y-2">
          {/* <Link href={hrefs.home} className="inline-flex items-center gap-1 text-xs text-foreground/40 transition-colors hover:text-foreground/70">
            <ArrowLeft aria-hidden="true" className="size-3" />
            Espace professeur
          </Link> */}
          <h1 className="text-2xl font-bold tracking-tight">Mes classes</h1>
          <p className="text-sm text-foreground/45">
            {activeCount} classe{activeCount === 1 ? "" : "s"} active{activeCount === 1 ? "" : "s"}
            {quota?.maxClasses == null ? "" : ` sur ${quota.maxClasses}`}
          </p>
        </header>

        {loadError && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Impossible de charger vos classes ou votre quota. Actualisez la page pour réessayer.
          </p>
        )}
        <FeedbackToast error={feedback.error} status={feedback.status} />
        {canAddClass ? (
          <CreateClassModal />
        ) : !loadError ? (
          <p className="rounded-md border border-foreground/10 px-4 py-3 text-sm text-foreground/50">
            Vous avez atteint la limite de classes actives de votre espace.
          </p>
        ) : null}

        {!classes?.length ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-foreground/15 px-6 py-14 text-center">
            <div className="flex size-11 items-center justify-center rounded-md bg-foreground/5 text-foreground/45">
              <Users aria-hidden="true" className="size-5" />
            </div>
            <div className="grid gap-1">
              <p className="text-sm font-medium text-foreground/70">Aucune classe pour le moment</p>
              <p className="text-xs text-foreground/40">Ajoutez une classe pour commencer à organiser votre activité.</p>
            </div>
          </div>
        ) : (
          <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((class_) => (
              <PersonalClassCard
                key={class_.id}
                class_={class_}
                href={`${hrefs.classes}/${encodeURIComponent(class_.id)}`}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}