import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getCurrentTeacherId } from "@/services/teacher/actions";
import { getTeacherUnavailabilitiesAction } from "@/services/teacher-unavailability/actions/teacher-unavailability.queries";
import { TeacherUnavailabilitiesScreen } from "@/components/teacher/unavailabilities/TeacherUnavailabilitiesScreen";

export default async function PersonalTeacherUnavailabilitiesPage() {
  await connection();

  const teacherId = await getCurrentTeacherId();
  if (!teacherId) notFound();

  const result = await getTeacherUnavailabilitiesAction(teacherId);
  const initialData = "data" in result ? result.data ?? [] : [];

  return (
    <div className="flex h-full flex-col">
      <TeacherUnavailabilitiesScreen teacherId={teacherId} initialData={initialData} />
    </div>
  );
}