// AddProgramTrackServer.tsx (SERVER)
import { getDepartmentsAction } from "@/services/department/actions";
import { AddProgramTrack } from "../ui/AddProgramTrack";


export default async function NewProgramTrack({
  slug,
}: {
  slug: string;
}) {
  const { data: departments } = await getDepartmentsAction();

  return <AddProgramTrack departments={departments ?? []} slug={slug} />;
}
