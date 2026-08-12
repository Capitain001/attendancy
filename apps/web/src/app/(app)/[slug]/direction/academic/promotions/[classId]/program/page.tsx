import { getUEsAction } from "@/services/ue";
import { getClassProgramAction } from "@/services/program";
import { getOrgDetailsAction } from "@/services/organization";
import { DirectionProgramPage } from "@/components/programs/program/DirectionProgramPage";
import { EmptyResource } from "@/components/ux/EmptyResource";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; classId: string }>;
}) {
  const { slug, classId } = await params;

  const [
    { data: orgUes, error: ueError },
    { data: classprogram, error: classprogramError },
    { data: org, error: orgError },
  ] = await Promise.all([
    getUEsAction(),
    getClassProgramAction(classId),
    getOrgDetailsAction(),
  ]);

  if (
    ueError ||
    !orgUes ||
    classprogramError ||
    !classprogram
  ) {
    return (
      <div className="p-6">
        Erreur : {ueError || classprogramError || orgError}
      </div>
    );
  }

  const programId = classprogram.program?.id;
  const programTrackId = classprogram.programTrack?.id;

  if (!programId) {
    return (
      <EmptyResource
        title="Aucun programme"
        message="Aucun programme n'est affecté à cette promotion."
        actionLabel="Affecter un programme"
        href={`/${slug}/direction/academic/promotions/${classId}/program?program_modal=create`}
      />
    );
  }

  if (!programTrackId) {
    return (
      <div className="p-6">
        Erreur : impossible de récupérer la filière du programme.
      </div>
    );
  }

  return (
    <div>
      <DirectionProgramPage
        programId={programId}
        classId={classId}
        allUes={orgUes}
        organization={org}
        classInfo={{
          name: classprogram.name,
          level: classprogram.level,
          programTrack:
            classprogram.programTrack?.name ?? "—",
          program:
            classprogram.program?.name ?? "—",
          academicYear:
            classprogram.academicYear?.name ?? "—",
        }}
      />
    </div>
  );
}