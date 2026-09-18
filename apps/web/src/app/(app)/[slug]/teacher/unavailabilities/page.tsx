import { notFound } from "next/navigation";
import { getCurrentTeacherId } from "@/services/teacher/actions";
import { getTeacherUnavailabilitiesAction } from "@/services/teacher-unavailability/actions/teacher-unavailability.queries";
import { TeacherUnavailabilitiesScreen } from "@/components/teacher/unavailabilities/TeacherUnavailabilitiesScreen";

export default async function TeacherUnavailabilitiesPage() {
  const teacherId = await getCurrentTeacherId();

  if (!teacherId) {
    notFound();
  }

  const { data: initialUnavailabilities = [], error } = await getTeacherUnavailabilitiesAction(teacherId);

  return (
    <div className="flex h-full flex-col">
      <TeacherUnavailabilitiesScreen 
        teacherId={teacherId} 
        initialData={initialUnavailabilities} 
      />
    </div>
  );
}
