import type { Metadata } from "next";
import type { ClassType } from "@/generated/prisma/client";
import { personal } from "@/modules/personal/paths";
import { getFeedback } from "@/utils/server/form/action";
import { resolveClassesData } from "./helper";
import { resolveSlugPaths } from "@/lib/paths";
import { PersonalClassCard } from "@/components/personal/teacher/class/PersonalClassCard";
import {
  CreateClassModal,
  CreateClassTrigger,
  createClassModalId,
} from "@/components/personal/teacher/class/CreateClassModal";
import { FeedbackToast } from "@/components/tools/toast/FeedbackToast";
import { PersonalClassPlaceholder } from "@/components/personal/teacher/class/PersonalClassPlaceholder";
import { PersonalInvitationCard } from "@/components/personal/teacher/class/invitation/PersonalInvitationCard";

export const metadata: Metadata = {
  title: "Mes classes | Attendancy",
  robots: { index: false, follow: false },
};

// Ordre d'affichage des sections. `satisfies` garantit que chaque entrée
// est un ClassType valide : une faute de frappe ici ne compile pas.
const CLASS_SECTIONS = [
  { type: "COHORT", title: "Cohortes", addLabel: "Ajouter une cohorte" },
  { type: "THEMATIC", title: "Thématiques", addLabel: "Ajouter une classe thématique" },
] as const satisfies readonly { type: ClassType; title: string; addLabel: string }[];

const grid = "grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3";

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
  const feedback = getFeedback("class", query);

  const activeCount = quota?.activeCount ?? 0;

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
    
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Mes classes</h1>
          <p className="text-sm text-foreground/45">
            {activeCount} classe{activeCount === 1 ? "" : "s"} active{activeCount === 1 ? "" : "s"}
            {quota?.maxClasses == null ? "" : ` sur ${quota.maxClasses}`}
          </p>
        </header>



        {loadError && (
          <p
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            Impossible de charger vos classes ou votre quota. Actualisez la page pour réessayer.
          </p>
        )}

        <FeedbackToast error={feedback.error} status={feedback.status} />

        {canAddClass ? (
          <CreateClassTrigger />
        ) : !loadError ? (
          <p className="rounded-md border border-foreground/10 px-4 py-3 text-sm text-foreground/50">
            Vous avez atteint la limite de classes actives de votre espace.
          </p>
        ) : null}

        {CLASS_SECTIONS.map(({ type, title, addLabel }) => {
          const group = (classes ?? []).filter((class_) => class_.type === type);

          return (
            <section key={type} className="space-y-3">
              <h2 className="flex items-baseline gap-2 text-sm font-bold text-foreground/70">
                {title}
                <span className="font-mono text-xs font-normal tabular-nums text-foreground/30">
                  {group.length}
                </span>
              </h2>
              <div className={grid}>
                <PersonalClassPlaceholder
                  label={addLabel}
                  disabled={!canAddClass}
                  popoverTarget={createClassModalId(type)}
                />
                {group.map((class_) => (
                  <PersonalClassCard
                    key={class_.id}
                    class_={class_}
                    href={`${hrefs.classes}/${encodeURIComponent(class_.id)}`}
                  />
                ))}
              </div>
            </section>
          );
        })}
        <PersonalInvitationCard href={`${hrefs.classes}/invitation`} />

        {canAddClass && (
          <>
            <CreateClassModal />
            {CLASS_SECTIONS.map(({ type }) => (
              <CreateClassModal key={type} type={type} />
            ))}
          </>
        )}
      </div>
    </main>
  );
}