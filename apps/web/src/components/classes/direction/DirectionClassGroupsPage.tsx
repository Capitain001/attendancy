import { GroupsManager } from "./groups/GroupsManager";

interface DirectionClassGroupsPageProps {
  slug: string;
  classId: string;
  className: string;
}

export function DirectionClassGroupsPage({
  slug,
  classId,
  className,
}: DirectionClassGroupsPageProps) {
  const enrollmentHref = `/${slug}/direction/academic/classes/${classId}/enrollment`;

  return (
    <div className="scroll-smooth flex flex-col gap-y-4 pb-10">
      <header className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Classe · {className}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Groupes</h1>
      </header>

      <GroupsManager classId={classId} enrollmentHref={enrollmentHref} />
    </div>
  );
}
